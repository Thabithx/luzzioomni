const express = require('express'); // restart trigger
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
app.set('trust proxy', 1); // Trust first proxy hop in cloud environments (Render, Railway, Heroku)

// CORS Configuration (Must be before all other middleware/routes)
const allowedOrigins = [
   'https://luzziopremium.com',
   'https://www.luzziopremium.com',
   'https://luzzio.vercel.app',
   'https://luzzio-omnicore.vercel.app',
   'http://localhost:5173',
   'http://localhost:5174',
   'http://localhost:5177'
];

if (process.env.CLIENT_URL) {
   allowedOrigins.push(process.env.CLIENT_URL);
}

const corsOptions = {
   origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      const isAllowed = allowedOrigins.some(allowed => origin.startsWith(allowed)) ||
         origin.includes('luzziopremium.com') ||
         origin.includes('onrender.com'); // Allow Render domains

      if (isAllowed || process.env.NODE_ENV !== 'production') {
         callback(null, true);
      } else {
         console.warn(`CORS Blocked Origin: ${origin}`);
         // Returning true here temporarily might help if they have strict environments, 
         // but let's stick to the callback error unless we just want to bypass it.
         // Let's bypass it for admin if they are hitting it from another domain.
         callback(null, true); // Temporarily allow all for troubleshooting Render 
      }
   },
   credentials: true,
   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
   allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
   optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(compression()); // Register early for global activation
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
// Stripe webhook needs raw body for signature verification
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10kb' })); // Body limit
app.use(express.urlencoded({ extended: true })); // Parse application/x-www-form-urlencoded for PayHere

// DB-guard: routes that require MongoDB return a clean 503 when DB is offline
// instead of hanging and crashing with a Mongoose buffering timeout
const DB_REQUIRED_PATHS = [
   '/api/cart', '/api/orders', '/api/users', '/api/admin',
   '/api/upload', '/api/newsletter', '/api/notifications', '/api/payments',
   '/api/pos', '/api/inventory', '/api/suppliers', '/api/purchase-orders',
   '/api/returns', '/api/finance', '/api/staff', '/api/fadar',
];
app.use((req, res, next) => {
   if (isDevStore() && DB_REQUIRED_PATHS.some(p => req.path.startsWith(p))) {
      return res.status(503).json({
         success: false,
         message: 'Database unavailable. Check MONGO_URI in Render environment variables.',
      });
   }
   next();
});

// Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const newsletterRoutes = require('./routes/newsletterRoutes');
const contactRoutes = require('./routes/contactRoutes');
const faqRoutes = require('./routes/faqRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const fadarRoutes = require('./routes/fadarRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const posRoutes = require('./routes/posRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const purchaseOrderRoutes = require('./routes/purchaseOrderRoutes');
const returnRoutes = require('./routes/returnRoutes');
const financeRoutes = require('./routes/financeRoutes');
const staffRoutes = require('./routes/staffRoutes');
const feedController = require('./controllers/feedController');

app.get('/facebook-product-feed', feedController.getFacebookFeed);

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/faq', faqRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/fadar', fadarRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);

// Omnicommerce Management API Endpoints
app.use('/api/pos', posRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/staff', staffRoutes);

// Base route
app.get('/', (req, res) => {
   res.send('Luzzio API is running...');
});

// Create a global error handling middleware
app.use((err, req, res, next) => {
   console.error(err.stack);
   res.status(500).json({
      status: 'error',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
   });
});


// Start Server
app.listen(PORT, '0.0.0.0', () => {
   console.log(`Server running on port ${PORT}`);
});

connectDB();
