const Product = require('../models/Product');
const { isDevStore } = require('../config/database');
const devStore = require('../devStore');

// Performance: In-memory cache for high-traffic read operations
const cache = {
   products: null,
   lastFetch: 0,
   ttl: 5 * 60 * 1000 // 5 minutes
};

const clearCache = () => {
   cache.products = null;
   cache.lastFetch = 0;
};

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
   try {
      if (isDevStore()) {
         const data = devStore.getProducts(req.query);
         return res.status(200).json({
            success: true,
            count: data.length,
            data,
            source: 'dev-store',
         });
      }

      // 1. Optimized Fast-Path for global fetching (Home/ProductList defaults)
      const isSimpleFetch = Object.keys(req.query).length === 0 || (req.query.limit === '1000' && Object.keys(req.query).length === 1);

      if (isSimpleFetch && cache.products && (Date.now() - cache.lastFetch < cache.ttl)) {
         return res.status(200).json({
            success: true,
            count: cache.products.length,
            data: cache.products,
            source: 'cache'
         });
      }

      let query;

      // Copy req.query
      const reqQuery = { ...req.query };

      // Fields to exclude
      const removeFields = ['select', 'sort', 'page', 'limit'];

      // Loop over removeFields and delete them from reqQuery
      removeFields.forEach(param => delete reqQuery[param]);

      // Create query string
      let queryStr = JSON.stringify(reqQuery);

      // Create operators ($gt, $gte, etc)
      queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

      // Finding resource
      query = Product.find(JSON.parse(queryStr)).populate('categories').populate('category');

      // Select Fields
      if (req.query.select) {
         const fields = req.query.select.split(',').join(' ');
         query = query.select(fields);
      }

      // Sort
      if (req.query.sort) {
         const sortBy = req.query.sort.split(',').join(' ');
         query = query.sort(sortBy);
      } else {
         query = query.sort('-createdAt');
      }

      // Pagination
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 100;
      const startIndex = (page - 1) * limit;

      query = query.skip(startIndex).limit(limit);

      // Executing query
      const products = await query;

      // Update cache if it was a simple fetch
      if (isSimpleFetch) {
         cache.products = products;
         cache.lastFetch = Date.now();
      }

      res.status(200).json({
         success: true,
         count: products.length,
         data: products,
         source: 'database'
      });
   } catch (err) {
      res.status(500).json({ success: false, message: err.message });
   }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res) => {
   try {
      if (isDevStore()) {
         const product = devStore.getProduct(req.params.id);
         if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
         }
         return res.status(200).json({ success: true, data: product });
      }

      const product = await Product.findById(req.params.id).populate('categories').populate('category');

      if (!product) {
         return res.status(404).json({ success: false, message: 'Product not found' });
      }

      res.status(200).json({
         success: true,
         data: product
      });
   } catch (err) {
      res.status(500).json({ success: false, message: err.message });
   }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res) => {
   try {
      const product = await Product.create(req.body);
      clearCache();

      res.status(201).json({
         success: true,
         data: product
      });
   } catch (err) {
      res.status(400).json({ success: false, message: err.message });
   }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res) => {
   try {
      let product = await Product.findById(req.params.id);

      if (!product) {
         return res.status(404).json({ success: false, message: 'Product not found' });
      }

      product = await Product.findByIdAndUpdate(req.params.id, req.body, {
         new: true,
         runValidators: true
      });

      clearCache();

      res.status(200).json({
         success: true,
         data: product
      });
   } catch (err) {
      res.status(400).json({ success: false, message: err.message });
   }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res) => {
   try {
      const product = await Product.findById(req.params.id);

      if (!product) {
         return res.status(404).json({ success: false, message: 'Product not found' });
      }

      await product.deleteOne();
      clearCache();

      res.status(200).json({
         success: true,
         data: {}
      });
   } catch (err) {
      res.status(500).json({ success: false, message: err.message });
   }
};

// Helper to calculate product rating based on approved reviews
const updateProductRatingSummary = (product) => {
   const approvedReviews = product.reviews.filter(r => (r.status || 'approved') === 'approved');
   product.numReviews = approvedReviews.length;
   if (approvedReviews.length > 0) {
      product.rating = approvedReviews.reduce((acc, item) => item.rating + acc, 0) / approvedReviews.length;
   } else {
      product.rating = 0;
   }
};

// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Public
exports.createProductReview = async (req, res) => {
   try {
      const { rating, comment, name, email, images } = req.body;

      const product = await Product.findById(req.params.id);

      if (!product) {
         return res.status(404).json({ success: false, message: 'Product not found' });
      }

      const isAdmin = req.user ? req.user.role === 'admin' : false;

      const review = {
         name,
         email,
         rating: Number(rating),
         comment,
         images: images || [],
         user: req.user ? req.user._id : null,
         isVerified: isAdmin,
         status: isAdmin ? 'approved' : 'pending',
         createdAt: new Date()
      };

      product.reviews.push(review);

      // Recalculate Average Rating (only approved)
      updateProductRatingSummary(product);

      await product.save();
      clearCache();

      res.status(201).json({
         success: true,
         message: isAdmin ? 'Review added and approved' : 'Review submitted for moderation',
         data: review
      });
   } catch (err) {
      res.status(400).json({ success: false, message: err.message });
   }
};

// @desc    Update review moderation status
// @route   PUT /api/products/:id/reviews/:reviewId/status
// @access  Private/Admin
exports.updateReviewStatus = async (req, res) => {
   try {
      const { status } = req.body;
      if (!['pending', 'approved', 'rejected'].includes(status)) {
         return res.status(400).json({ success: false, message: 'Invalid status value. Allowed: pending, approved, rejected' });
      }

      const product = await Product.findById(req.params.id);
      if (!product) {
         return res.status(404).json({ success: false, message: 'Product not found' });
      }

      const review = product.reviews.id(req.params.reviewId) || product.reviews.find(r => r._id.toString() === req.params.reviewId);
      if (!review) {
         return res.status(404).json({ success: false, message: 'Review not found' });
      }

      review.status = status;
      if (status === 'approved') {
         review.isVerified = true;
      }

      updateProductRatingSummary(product);

      await product.save();
      clearCache();

      res.status(200).json({
         success: true,
         message: `Review moderation status updated to ${status}`,
         data: product.reviews
      });
   } catch (err) {
      res.status(400).json({ success: false, message: err.message });
   }
};

// @desc    Delete product review
// @route   DELETE /api/products/:id/reviews/:reviewId
// @access  Private/Admin
exports.deleteProductReview = async (req, res) => {
   try {
      const product = await Product.findById(req.params.id);

      if (!product) {
         return res.status(404).json({ success: false, message: 'Product not found' });
      }

      // Check if review exists
      const reviewIndex = product.reviews.findIndex(
         r => r._id.toString() === req.params.reviewId
      );

      if (reviewIndex === -1) {
         return res.status(404).json({ success: false, message: 'Review not found' });
      }

      // Remove review
      product.reviews.splice(reviewIndex, 1);

      // Recalculate Average Rating
      updateProductRatingSummary(product);

      await product.save();
      clearCache();

      res.status(200).json({ success: true, message: 'Review deleted', data: product.reviews });
   } catch (err) {
      res.status(400).json({ success: false, message: err.message });
   }
};
