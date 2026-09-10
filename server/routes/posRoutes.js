// POS System Routes

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
   searchProducts,
   searchCustomers,
   createCustomer,
   processSale
} = require('../controllers/posController');

router.get('/products', protect, authorize('admin', 'sales'), searchProducts);
router.get('/customers', protect, authorize('admin', 'sales'), searchCustomers);
router.post('/customers', protect, authorize('admin', 'sales'), createCustomer);
router.post('/sale', protect, authorize('admin', 'sales'), processSale);

module.exports = router;
