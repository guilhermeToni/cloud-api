const express = require('express');

const { getDocuments } = require('../controllers/Documents.js');
const { signin } = require('../controllers/Signin.js');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Success' });
});

router.post('/signin', signin);

router.get('/documents', getDocuments);

module.exports = router;
