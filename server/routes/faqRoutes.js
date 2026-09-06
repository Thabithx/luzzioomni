const express = require('express');
const router = express.Router();
const faqController = require('../controllers/faqController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public routes
router.get('/', faqController.getFAQs);

// Admin routes
router.get('/admin', protect, admin, faqController.getAllFAQs);
router.post('/', protect, admin, faqController.createFAQ);
router.put('/:id', protect, admin, faqController.updateFAQ);
router.delete('/:id', protect, admin, faqController.deleteFAQ);

module.exports = router;
