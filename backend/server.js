const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'API Rosalina Collection berjalan' });
});

const PORT = process.env.PORT || 50000;
app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});