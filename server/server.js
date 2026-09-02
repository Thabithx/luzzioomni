const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const path = require('path');
const compression = require('compression');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
app.set('trust proxy', 1);

// CORS Configuration
const allowedOrigins = [
   'http://localhost:5173',
   'http://localhost:5174'
];

if (process.env.CLIENT_URL) {
   allowedOrigins.push(process.env.CLIENT_URL);
}

const corsOptions = {
   origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      const isAllowed = allowedOrigins.some(allowed => origin.startsWith(allowed));
      if (isAllowed || process.env.NODE_ENV !== 'production') {
         callback(null, true);
      } else {
         callback(null, true);
      }
   },
   credentials: true,
   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
   allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
   optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(compression());

const PORT = process.env.PORT || 5001;

const { connectDB, isDevStore } = require('./config/database');

// Security Middleware
app.use(helmet());
app.use(mongoSanitize());
app.use(hpp());

// Rate Limiting
const limiter = rateLimit({
   windowMs: 10 * 60 * 1000,
   max: 1000,
   message: 'Too many requests from this IP, please try again after 10 minutes',
   standardHeaders: true,
   legacyHeaders: false,
});
app.use('/api', limiter);

// Middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Base route
app.get('/', (req, res) => {
   res.send('Luzzio API is running...');
});

// Global Error Handling
app.use((err, req, res, next) => {
   console.error(err.stack);
   res.status(500).json({
      status: 'error',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
   });
});

// Start Server & Connect Database
app.listen(PORT, '0.0.0.0', () => {
   console.log(`Server running on port ${PORT}`);
});

connectDB();
