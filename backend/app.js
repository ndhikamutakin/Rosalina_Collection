require('dotenv').config({ quiet: true });
const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();

// CORS_ORIGIN boleh berisi beberapa origin dipisah koma, mis. http://localhost:5173,https://rosalina.example
const origins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : true;
app.use(cors({ origin: origins, exposedHeaders: ['Content-Disposition'] }));
app.use(express.json({ limit: '1mb' }));

app.get('/', (req, res) => {
  res.json({ success: true, message: 'API Rosalina Collection berjalan' });
});

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
