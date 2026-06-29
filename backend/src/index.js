const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');

const db = require('./db');
const routes = require('./routes');
const logger = require('./logger');

const app = express();
const PORT = process.env.PORT || 3000;

db.initDatabase();

app.use((req, res, next) => {
  logger.debug({ method: req.method, path: req.path, ip: req.ip }, 'incoming request');
  next();
});

app.use(cookieParser());
app.use(express.json());

const corsOrigin = process.env.CORS_ORIGIN;
if (corsOrigin) {
  const origins = corsOrigin.split(',').map(o => o.trim()).filter(o => o.startsWith('http://') || o.startsWith('https://'));
  if (origins.length > 0) app.use(cors({ origin: origins, credentials: true }));
}

const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

app.use('/api', routes);

app.get('*', (req, res) => res.sendFile(path.join(publicPath, 'index.html')));

app.use((err, req, res, next) => {
  logger.error({ err, method: req.method, path: req.path, ip: req.ip }, 'unhandled error');
  const isProd = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({
    message: isProd ? '服务器内部错误' : (err.message || '服务器内部错误')
  });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Auth Service running at http://0.0.0.0:${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

function shutdown() {
  logger.info('shutting down server');
  server.close(() => {
    logger.info('server closed');
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
