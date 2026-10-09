const express = require('express');
const {
   getProducts,
   getProduct,
   createProduct,
   updateProduct,
   deleteProduct,
   createProductReview,
   deleteProductReview,
   getAllReviewsAdmin,
   moderateProductReview
} = require('../controllers/productController');
const { protect, admin, optionalProtect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/reviews/all', protect, admin, getAllReviewsAdmin);

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

router.route('/:id/reviews/:reviewId/moderate')
   .put(protect, admin, moderateProductReview);

module.exports = router;
