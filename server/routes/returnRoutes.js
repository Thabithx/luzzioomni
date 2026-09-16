// BIHANDU: Return & Exchange Routes

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
   createReturnRequest,
   getReturnRequests,
   processReturnStatus
} = require('../controllers/returnController');

router.post('/', protect, createReturnRequest);
router.get('/', protect, authorize('admin', 'warehouse', 'sales'), getReturnRequests);
router.put('/:id/status', protect, authorize('admin', 'warehouse'), processReturnStatus);

module.exports = router;
