const express = require('express');
const {
   getProducts,
   getProduct,
   createProduct,
   updateProduct,
   deleteProduct,
   createProductReview,
   deleteProductReview
} = require('../controllers/productController');
const { protect, admin, optionalProtect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
   .get(getProducts)
   .post(protect, admin, createProduct);

router.route('/:id')
   .get(getProduct)
   .put(protect, admin, updateProduct)
   .delete(protect, admin, deleteProduct);

router.route('/:id/reviews')
   .post(optionalProtect, createProductReview);

router.route('/:id/reviews/:reviewId')
   .delete(protect, admin, deleteProductReview);

module.exports = router;