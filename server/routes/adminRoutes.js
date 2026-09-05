const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');

// Middleware to restrict access to admins only
const admin = (req, res, next) => {
   if (req.user && req.user.role === 'admin') {
      next();
   } else {
      res.status(401).json({ success: false, message: 'Not authorized as an admin' });
   }
};

router.get('/stats', protect, admin, getDashboardStats);

module.exports = router;
