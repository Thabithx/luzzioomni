const express = require('express');
const {
   getCategories,
   getCategory,
   createCategory,
   updateCategory,
   deleteCategory,
   reorderCategories
} = require('../controllers/categoryController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/reorder', protect, admin, reorderCategories);

router.route('/')
   .get(getCategories)
   .post(protect, admin, createCategory);

router.route('/:id')
   .get(getCategory)
   .put(protect, admin, updateCategory)
   .delete(protect, admin, deleteCategory);

module.exports = router;