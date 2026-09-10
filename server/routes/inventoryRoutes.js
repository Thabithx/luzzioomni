// DULARA: Centralized Inventory routes

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
   getInventory,
   adjustStock,
   getInventoryHistory
} = require('../controllers/inventoryController');

router.get('/', protect, authorize('admin', 'warehouse', 'sales'), getInventory);
router.post('/adjust', protect, authorize('admin', 'warehouse'), adjustStock);
router.get('/history', protect, authorize('admin', 'warehouse'), getInventoryHistory);

module.exports = router;