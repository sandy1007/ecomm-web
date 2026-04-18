require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { initializeBugsnag, getBugsnagMiddleware } = require('./config/bugsnag');
const bugsnagManager = require('./utils/bugsnag');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// Initialize Bugsnag before any routes are loaded
initializeBugsnag();

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

const ALLOWED_ORIGINS = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(o => o.trim());

app.use(helmet());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Bugsnag request handler — must be first middleware
const bugsnagMiddleware = getBugsnagMiddleware();
app.use(bugsnagMiddleware.requestHandler);

// Track every request with timing + status via Bugsnag breadcrumbs
app.use((req, res, next) => {
  req.startTime = Date.now();
  res.on('finish', () => {
    bugsnagManager.trackAPIRequest(req.method, req.path, req.query, res.statusCode, Date.now() - req.startTime);
  });
  next();
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'OK', timestamp: new Date() }));

app.use(notFound);

// Bugsnag error handler — must be after routes, before final errorHandler
app.use(bugsnagMiddleware.errorHandler);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\n🚀 Server running at http://localhost:${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});
