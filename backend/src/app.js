const express = require('express');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const routes = require('./routes');
const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();

// Security HTTP headers
app.use(helmet());

// Enable CORS
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || '*',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Data sanitization
app.use(mongoSanitize());
app.use(xss());

// API routes
app.use('/api', routes);

// Swagger setup
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'ONSET-CHAT API',
    version: '1.0.0',
    description: 'API documentation for ONSET-CHAT',
  },
  servers: [
    { url: '/api' },
  ],
};
const options = {
  swaggerDefinition,
  apis: [
    path.join(__dirname, './routes/*.js'),
    path.join(__dirname, './controllers/*.js'),
  ],
};
const swaggerSpec = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Serve static files from /uploads
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error', error: err.message });
});

module.exports = app; 