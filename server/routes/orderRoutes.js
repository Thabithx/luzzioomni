const express = require('express');
const {
   createOrder,
   getMyOrders,
   getOrders,
   getGuestOrders,
   syncMyOrders,
   updateOrderStatus,
   updateOrderTracking,
   updateOrderAddress,
   batchUpdateOrderStatus
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', createOrder);
router.get('/guest/:email', getGuestOrders);

router.use(protect);
router.put('/sync', syncMyOrders);

router.route('/')
   .get(admin, getOrders);

router.route('/myorders').get(getMyOrders);

router.route('/:id/status').put(admin, updateOrderStatus);
router.route('/batch-status').put(admin, batchUpdateOrderStatus);
router.route('/:id/tracking').put(admin, updateOrderTracking);
router.route('/:id/address').put(admin, updateOrderAddress);

module.exports = router;
