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

    const pagination = {
      nextPage: null,
      previousPage: Number(page) - 1 === 0 ? null : Number(page) - 1,
      currentPage: Number(page),
    };
  
    const docs = await api.user.document.searchDocuments(params, token);
    const { items = [], count = 0 } = docs;

    const docsLength = items?.length || 0;

    if (docsLength === 0) {
      const message = 'No Documents found';
      const retData = formatResponse({ error: false, message, data: { ...pagination } });
      res.json(retData);
      return;
    }

    if (docsLength * Number(page) < count) {
      pagination.nextPage = Number(page) + 1;
    }

    let filesToGetSignedUrl = [];

    const formattedDocs = items.reduce((allDocuments, currentDocument) => {
      const {
        _id: id,
        created,
        document,
        docTypeFieldsData,
        name,
        tags = [],
      } = currentDocument;

      const { extraId = '' } = docTypeFieldsData;

      if (!allDocuments[extraId]) {
        allDocuments = {
          ...allDocuments,
          [extraId]: [],
        };
      }

      const fieldsData = formatDocTypeFieldsData(docTypeFieldsData);
      let newDocument = {
        id,
        created,
        tags,
        name,
        fieldsData,
      };

      if (document && name) {
        newDocument = {
          ...newDocument,
          document,
          name,
        };

        filesToGetSignedUrl = [
          ...filesToGetSignedUrl,
          { document, name, id: extraId },
        ];
      }

      allDocuments[extraId].push(newDocument);

      return allDocuments;
    }, {});

    const signedDocs = await getAwsSignedURLs(filesToGetSignedUrl, orgId, token);
    const { docs: signedUrlDocs = [] } = signedDocs;
    for (let index = 0; index < filesToGetSignedUrl.length; index += 1) {
      const { id = '', document } = filesToGetSignedUrl[index];
      const targetSignedUrl = signedUrlDocs.find(doc => doc.document === document);
      if (!targetSignedUrl) return;

      const documentIndex = formattedDocs[id].findIndex(item => item.document === targetSignedUrl.document);
      if (documentIndex !== -1) {
        formattedDocs[id][documentIndex] = {
          ...formattedDocs[id][documentIndex],
          documentUrl: targetSignedUrl.signedUrl,
        };
      }
    }

    const message = 'Get documents successfully';
    const retData = formatResponse({ error: false, message, data: { docs: formattedDocs, ...pagination } });
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
