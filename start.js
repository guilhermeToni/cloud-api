const express = require('express');
const cors = require('cors');

const routes = require('./src/routes/index.js');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', (req, res) => {
  res.json({ message: 'Success' });
});

app.use('/api/v1', routes);

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});