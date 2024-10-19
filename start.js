const express = require('express');
const dotenv = require('dotenv');
const APISystemManager = require('@docbrasil/api-systemmanager');

dotenv.config();

const app = express();
const api = new APISystemManager({ uri: process.env.API_SM_URL });
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function formatResponse(params = {}) {
  const {
    data = {},
    message = 'Success',
    error = false,
  } = params;

  return {
    error,
    message,
    data,
  };
}

async function signin(params) {
  const { user = {} } = await api.login.userPass(params);
  return user;
}

function formatDocTypeFieldsData(docTypeFieldsData) {
  return Object.keys(docTypeFieldsData).reduce((acc, key) => {
    const currentField = docTypeFieldsData[key];
    let newKey = key.replace('extra', '');
    newKey = `${newKey.charAt(0).toUpperCase()}${newKey.slice(1)}`;

    return {
      ...acc,
      [newKey]: currentField,
    };
  }, {});
}

async function getAwsSignedURLs(docs, orgId, token) {
  const params = {
    methodType: 'get',
    docs,
    orgId,
  };

  return api.user.document.signedUrls(params, token);
}

app.get('/api/v1', (req, res) => {
  res.json({ message: 'Success' });
});

app.post('/api/v1/signin', async (req, res) => {
  try {
    const queryParams = req?.body || {};
    const { username, password } = queryParams;
    if (!username && !password) {
      return res.json({
        error: true,
        message: 'username and password is required',
        data: {},
      });
    }
    const params = { username, password };
    const user = await signin(params);
    const { _id: id, sessionId: token, orgId } = user;

    const retData = formatResponse({ data: { id, token, orgId } });
    res.json(retData);
  } catch (err) {
    const message = err?.message || '';
    const retData = formatResponse({ error: true, message });
    res.json(retData);
  }
});

app.get('/api/v1/documents', async (req, res) => {
  try {
    const queryParams = req?.query || {};
    const {
      docAreaId,
      docId,
      perPage = 200,
      page = 1,
      orgId,
    } = queryParams;

    const { authorization = '' } = req.headers || {};
    const [prefix, token] = authorization.split(' ');

    if (!docAreaId || !docId) {
      const message = 'docAreaId and docId are required to get documents.';
      const response = formatResponse({ error: true, message });
      res.json(response);
      return;
    }

    if (!orgId) {
      const message = 'orgId is required to get documents';
      const response = formatResponse({ error: true, message });
      res.json(response);
      return;
    }

    if (prefix !== 'Bearer' || ['', 'undefined'].includes(token)) {
      const message = 'token is required to get documents';
      const response = formatResponse({ error: true, message });
      res.json(response);
      return;
    }

    const params = {
      orgId,
      query: {
        p: perPage,
        i: page,
        s: 'Mais recentes',
        as: '',
        m: 'w',
        ai: docAreaId,
        di: docId,
      },
    };
    const docs = await api.user.document.searchDocuments(params, token);
    const docsLength = docs?.took || 0;

    if (docsLength === 0) {
      const message = 'Documents not found';
      const retData = formatResponse({ error: false, message });
      res.json(retData);
      return;
    }

    let filesToGetSignedUrl = [];
    const filteredDocs = docs.items.map(item => {
      const {
        _id,
        created,
        document,
        docTypeFieldsData,
        tags = [],
        name,
      } = item;

      const fieldsData = formatDocTypeFieldsData(docTypeFieldsData);

      const newDoc = {
        id: _id,
        document,
        created,
        tags,
        fieldsData,
      };

      if (document && name) {
        filesToGetSignedUrl = [
          ...filesToGetSignedUrl,
          { document, name },
        ];
      }

      return newDoc;
    });

    const signedDocs = await getAwsSignedURLs(filesToGetSignedUrl, orgId, token);
    const { docs: signedUrlDocs = [] } = signedDocs;
    for (const docSignedUrl of signedUrlDocs) {
      const index = filteredDocs.findIndex(item => item.document === docSignedUrl.document);
      if (index !== -1) {
        filteredDocs[index] = {
          ...filteredDocs[index],
          documentUrl: docSignedUrl.signedUrl,
        };
      }
    }

    const message = 'Get documents successfully';
    const retData = formatResponse({ error: false, message, data: filteredDocs });
    res.json(retData);
  } catch (err) {
    const message = err?.message || '';
    const retData = formatResponse({ error: true, message });
    res.json(retData);
  }
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});