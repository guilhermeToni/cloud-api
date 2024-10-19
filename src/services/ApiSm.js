const APISystemManager = require('@docbrasil/api-systemmanager');
const dotenv = require('dotenv');

dotenv.config();

const api = new APISystemManager({ uri: process.env.API_SM_URL });

module.exports = api;