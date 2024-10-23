const { formatResponse, formatDocTypeFieldsData, getAwsSignedURLs } = require('../helpers/index.js');
const api = require('../services/ApiSm.js');

async function getDocuments(req, res) {
  try {
    const queryParams = req?.query || {};
    const {
      docAreaId,
      docId,
      orgId,
      perPage = 200,
      page = 1,
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

    console.log(docs);

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

      let newDoc = {
        id: _id,
        created,
        tags,
        fieldsData,
      };

      if (document && name) {
        newDoc = {
          ...newDoc,
          document,
        };

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
}

module.exports = {
  getDocuments,
};
