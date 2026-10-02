const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const morgan = require('morgan');

const env = require('./config/env');
const logger = require('./utils/logger');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middlewares/error.middleware');
const { generalLimiter } = require('./middlewares/rateLimit.middleware');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: env.clientOrigin,
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  morgan(env.isProduction ? 'combined' : 'dev', {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);
app.use(generalLimiter);

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
