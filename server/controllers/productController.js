const Product = require('../models/Product');
const { isDevStore } = require('../config/database');
const devStore = require('../devStore');
const { fail, blank, nonNeg, positive } = require('../utils/validate');

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
      const { name, price, salePrice, stock, description } = req.body;

      if (blank(name))        return fail(res, 'Product name is required');
      if (blank(description)) return fail(res, 'Product description is required');
      if (!positive(price))   return fail(res, 'Price must be a positive number');
      if (stock !== undefined && stock !== '' && !nonNeg(stock)) {
         return fail(res, 'Stock cannot be negative');
      }
      if (salePrice !== undefined && salePrice !== '') {
         if (!nonNeg(salePrice))             return fail(res, 'Sale price cannot be negative');
         if (Number(salePrice) >= Number(price)) return fail(res, 'Sale price must be less than the regular price');
      }

      // DULARA: Auto-populate unique barcode and SKU when adding a new product
      if (!req.body.barcode || String(req.body.barcode).trim() === '') {
         let uniqueBarcode;
         let isUnique = false;
         while (!isUnique) {
            const randomNum = Math.floor(10000000 + Math.random() * 90000000);
            uniqueBarcode = `LUZ-${randomNum}`;
            const existing = await Product.findOne({ barcode: uniqueBarcode });
            if (!existing) isUnique = true;
         }
         req.body.barcode = uniqueBarcode;
      } else {
         req.body.barcode = String(req.body.barcode).trim().toUpperCase();
      }

      if (!req.body.sku || String(req.body.sku).trim() === '') {
         req.body.sku = `SKU-${Date.now().toString().slice(-6)}`;
      } else {
         req.body.sku = String(req.body.sku).trim().toUpperCase();
      }

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

      const { price, salePrice, stock, name, description } = req.body;

      if (name !== undefined && blank(name))               return fail(res, 'Product name cannot be empty');
      if (description !== undefined && blank(description)) return fail(res, 'Description cannot be empty');
      if (price !== undefined && !positive(price))         return fail(res, 'Price must be a positive number');
      if (stock !== undefined && stock !== '' && !nonNeg(stock)) {
         return fail(res, 'Stock cannot be negative');
      }
      if (salePrice !== undefined && salePrice !== '') {
         const effectivePrice = price !== undefined ? Number(price) : product.price;
         if (!nonNeg(salePrice))                        return fail(res, 'Sale price cannot be negative');
         if (Number(salePrice) >= effectivePrice)       return fail(res, 'Sale price must be less than the regular price');
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

      // SRIHARAN: Automatic Verified Buyer Verification against paid orders
      let isVerifiedBuyer = false;
      try {
         const Order = require('../models/Order');
         const orderQuery = {
            isPaid: true,
            status: { $ne: 'cancelled' },
            'orderItems.product': product._id
         };
         if (req.user) {
            orderQuery.$or = [{ user: req.user._id }, { email: email.toLowerCase() }, { 'shippingAddress.email': email.toLowerCase() }];
         } else if (email) {
            orderQuery.$or = [{ email: email.toLowerCase() }, { 'shippingAddress.email': email.toLowerCase() }, { guestEmail: email.toLowerCase() }];
         }
         const verifiedOrder = await Order.findOne(orderQuery);
         if (verifiedOrder || (req.user && req.user.role === 'admin')) {
            isVerifiedBuyer = true;
         }
      } catch (orderCheckErr) {
         console.warn('Verified buyer check skipped:', orderCheckErr.message);
      }

      const review = {
         name,
         email,
         rating: Number(rating),
         comment,
         images: images || [],
         user: req.user ? req.user._id : null,
         isVerified: isVerifiedBuyer,
         isApproved: true,
         isFeatured: false,
         createdAt: new Date()
      };

      product.reviews.push(review);

      // Recalculate Average Rating
      product.numReviews = product.reviews.length;
      product.rating =
         product.reviews.reduce((acc, item) => item.rating + acc, 0) /
         product.reviews.length;

      await product.save();
      clearCache();

      res.status(201).json({ success: true, message: 'Review added', data: review });
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
      product.numReviews = product.reviews.length;
      if (product.numReviews > 0) {
         product.rating =
            product.reviews.reduce((acc, item) => item.rating + acc, 0) /
            product.reviews.length;
      } else {
         product.rating = 0;
      }

      await product.save();
      clearCache();

      res.status(200).json({ success: true, message: 'Review deleted', data: product.reviews });
   } catch (err) {
      res.status(400).json({ success: false, message: err.message });
   }
};

// SRIHARAN: Review & Engagement Moderation System
// @desc    Get all reviews across all products for Admin Moderation
// @route   GET /api/products/reviews/all
// @access  Private/Admin
exports.getAllReviewsAdmin = async (req, res) => {
   try {
      const products = await Product.find({ 'reviews.0': { $exists: true } }).select('name images reviews');

      const allReviews = [];
      products.forEach(p => {
         p.reviews.forEach(r => {
            allReviews.push({
               productId: p._id,
               productName: p.name,
               productImage: p.images[0] || '',
               reviewId: r._id,
               name: r.name,
               email: r.email,
               rating: r.rating,
               comment: r.comment,
               isVerified: r.isVerified === true,
               isApproved: r.isApproved !== false,
               isFeatured: r.isFeatured === true,
               adminResponse: r.adminResponse || '',
               createdAt: r.createdAt
            });
         });
      });

      allReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      res.status(200).json({
         success: true,
         count: allReviews.length,
         data: allReviews
      });
   } catch (err) {
      res.status(500).json({ success: false, message: err.message });
   }
};

// @desc    Moderate review (Approve/Reject), pin to featured spotlight, or respond to review
// @route   PUT /api/products/:productId/reviews/:reviewId/moderate
// @access  Private/Admin
exports.moderateProductReview = async (req, res) => {
   try {
      const { isApproved, isFeatured, isVerified, adminResponse } = req.body;
      const product = await Product.findById(req.params.id);

      if (!product) {
         return res.status(404).json({ success: false, message: 'Product not found' });
      }

      const review = product.reviews.id(req.params.reviewId);
      if (!review) {
         return res.status(404).json({ success: false, message: 'Review not found' });
      }

      if (typeof isApproved === 'boolean') {
         review.isApproved = isApproved;
      }
      if (typeof isFeatured === 'boolean') {
         review.isFeatured = isFeatured;
      }
      if (typeof isVerified === 'boolean') {
         review.isVerified = isVerified;
      }
      if (adminResponse !== undefined) {
         review.adminResponse = adminResponse;
      }

      await product.save();
      clearCache();

      res.status(200).json({
         success: true,
         message: 'Review moderated successfully',
         data: review
      });
   } catch (err) {
      res.status(500).json({ success: false, message: err.message });
   }
};

// SRIHARAN: Featured Review Spotlight for Storefront
// @desc    Get pinned / featured customer reviews for home page showcase
// @route   GET /api/products/reviews/featured
// @access  Public
exports.getFeaturedReviews = async (req, res) => {
   try {
      const products = await Product.find({ 'reviews.0': { $exists: true } }).select('name slug images reviews');
      const featured = [];
      products.forEach(p => {
         p.reviews.forEach(r => {
            if (r.isApproved !== false && (r.isFeatured === true || (r.rating === 5 && r.isVerified))) {
               featured.push({
                  productId: p._id,
                  productSlug: p.slug,
                  productName: p.name,
                  productImage: p.images[0] || '',
                  reviewId: r._id,
                  name: r.name,
                  rating: r.rating,
                  comment: r.comment,
                  isVerified: r.isVerified === true,
                  isFeatured: r.isFeatured === true,
                  createdAt: r.createdAt
               });
            }
         });
      });

      featured.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0) || new Date(b.createdAt) - new Date(a.createdAt));

      res.status(200).json({
         success: true,
         count: featured.slice(0, 8).length,
         data: featured.slice(0, 8)
      });
   } catch (err) {
      console.error('getFeaturedReviews error:', err);
      res.status(500).json({ success: false, message: err.message });
   }
};
