const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');

const db = require('./db');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

db.initDatabase();

app.use(cookieParser());
app.use(express.json());

const corsOrigin = process.env.CORS_ORIGIN;
if (corsOrigin) {
  const origins = corsOrigin.split(',').map(o => o.trim()).filter(o => o.startsWith('http://') || o.startsWith('https://'));
  if (origins.length > 0) app.use(cors({ origin: origins, credentials: true }));
} else if (process.env.NODE_ENV !== 'production') {
  app.use(cors({ origin: true, credentials: true }));
}

const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

app.use('/api', routes);

app.get('*', (req, res) => res.sendFile(path.join(publicPath, 'index.html')));

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Auth Service running at http://0.0.0.0:${PORT} [${process.env.NODE_ENV || 'development'}]`);
});
