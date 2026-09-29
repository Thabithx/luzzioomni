const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
   logVisit,
   getOrderSupplierReport,
   getUserReviewFAQReport,
   getConsolidatedReport
} = require('../controllers/analyticsController');

router.post('/log-visit', logVisit);
router.get('/order-supplier-report', protect, authorize('admin', 'warehouse', 'sales'), getOrderSupplierReport);
router.get('/user-review-faq-report', protect, authorize('admin', 'sales'), getUserReviewFAQReport);
router.get('/consolidated-report', protect, authorize('admin'), getConsolidatedReport);

module.exports = router;
