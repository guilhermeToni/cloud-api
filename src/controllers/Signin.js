const { signinUserAndPass, formatResponse } = require('../helpers/index.js');

async function signin(req, res) {
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
    const user = await signinUserAndPass(params);
    const { _id: id, sessionId: token, orgId } = user;

    const retData = formatResponse({ data: { id, token, orgId } });
    res.json(retData);
  } catch (err) {
    const message = err?.message || '';
    const retData = formatResponse({ error: true, message });
    res.json(retData);
  }
}

module.exports = {
  signin,
};
