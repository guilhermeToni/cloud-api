const express = require('express');

const routes = require('./src/routes/index.js');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1', routes);

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});