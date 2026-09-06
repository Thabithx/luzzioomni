// THABITH SRIHARAN: Supplier Routes

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
   getSuppliers,
   createSupplier,
   updateSupplier,
   deleteSupplier
} = require('../controllers/supplierController');

router.get('/', protect, authorize('admin', 'warehouse'), getSuppliers);
router.post('/', protect, authorize('admin', 'warehouse'), createSupplier);
router.put('/:id', protect, authorize('admin', 'warehouse'), updateSupplier);
router.delete('/:id', protect, authorize('admin', 'warehouse'), deleteSupplier);

module.exports = router;
