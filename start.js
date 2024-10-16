const express = require('express');

const app = express();
const port = 3000;

app.get('/', (req, res) => {
  const jsonRes = {
    hello: 'world',
  };
  res.json(jsonRes);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});