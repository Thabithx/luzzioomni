// THABITH SRIHARAN: Purchase Order Routes

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
   getPurchaseOrders,
   createPurchaseOrder,
   receivePurchaseOrder,
   updatePOStatus
} = require('../controllers/purchaseOrderController');

router.get('/', protect, authorize('admin', 'warehouse'), getPurchaseOrders);
router.post('/', protect, authorize('admin', 'warehouse'), createPurchaseOrder);
router.post('/:id/receive', protect, authorize('admin', 'warehouse'), receivePurchaseOrder);
router.put('/:id/status', protect, authorize('admin', 'warehouse'), updatePOStatus);

module.exports = router;
