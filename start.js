const express = require('express');
const APISystemManager = require('@docbrasil/api-systemmanager');

const api = new APISystemManager();

const app = express();
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

app.get('/api/v1', (req, res) => {
  res.json({ message: 'Success' });
});

app.get('/api/v1/signin', async (req, res) => {
  try {
    const queryParams = req?.query || {};
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

app.get('/api/v1/document', async (req, res) => {
  try {
    const queryParams = req?.query || {};
    const { docAreaId, docId, orgId, token } = queryParams;
    console.log(queryParams);

    const params = {
      orgId,
      query: {
        p: 200,
        i: 1,
        s: 'Mais recentes',
        as: '',
        m: 'w',
        ai: docAreaId,
        di: docId,
      },
    };
    const docs = await api.user.document.searchDocuments(params, token);

    res.json({ docs });
  } catch (err) {
    const message = err?.message || '';
    const retData = formatResponse({ error: true, message });
    res.json(retData);
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});