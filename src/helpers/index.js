const api = require('../services/ApiSm.js');

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

async function signinUserAndPass(params) {
  const { user = {} } = await api.login.userPass(params);
  return user;
}

function formatDocTypeFieldsData(docTypeFieldsData) {
  return Object.keys(docTypeFieldsData).reduce((acc, key) => {
    const currentField = docTypeFieldsData[key];
    let newKey = key.replace('extra', '');
    newKey = `${newKey.charAt(0).toUpperCase()}${newKey.slice(1)}`;

    const isArray = Array.isArray(currentField);

    if (newKey.toLowerCase().endsWith('items') && isArray) return acc;

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

module.exports = {
  formatResponse,
  signinUserAndPass,
  formatDocTypeFieldsData,
  getAwsSignedURLs,
};
