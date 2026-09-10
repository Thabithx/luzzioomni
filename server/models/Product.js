const mongoose = require('mongoose');
const slugify = require('slugify');

const productSchema = new mongoose.Schema({
   name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
      maxlength: [100, 'Name can not be more than 100 characters']
   },
   slug: String,
   // DULARA: Centralized inventory identification
   sku: {
      type: String,
      trim: true,
      unique: true,
      sparse: true
   },
   barcode: {
      type: String,
      trim: true,
      sparse: true
   },
   description: {
      type: String,
      required: [true, 'Please add a description'],
      maxlength: [1000, 'Description can not be more than 1000 characters']
   },
   price: {
      type: Number,
      required: [true, 'Please add a price']
   },
   salePrice: {
      type: Number,
      default: 0
   },
   categories: [{
      type: mongoose.Schema.ObjectId,
      ref: 'Category'
   }],
   // Deprecated: Kept for backward compatibility with existing products
   category: {
      type: mongoose.Schema.ObjectId,
      ref: 'Category'
   },
   stock: {
      type: Number,
      default: 0
   },
   images: {
      type: [String],
      default: []
   },
   colors: {
      type: [String],
      default: []
   },
   sizes: {
      type: [String],
      default: []
   },
   variants: [
      {
         size: { type: String, required: true },
         stock: { type: Number, default: 0 }
      }
   ],
   sizeChart: {
      type: String
   },
   material: {
      type: String,
      trim: true
   },
   reviews: [
      {
         user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: false // Allow guest reviews possibly or require auth
         },
         name: { type: String, required: true },
         email: { type: String, required: true },
         rating: { type: Number, required: true },
         comment: { type: String, required: true },
         images: { type: [String], default: [] },
         isVerified: { type: Boolean, default: false },
         createdAt: { type: Date, default: Date.now }
      }
   ],
   rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
   },
   numReviews: {
      type: Number,
      default: 0
   },
   createdAt: {
      type: Date,
      default: Date.now
   }
});

// Optimization: Indexing for blazingly fast lookups
productSchema.index({ slug: 1 });
productSchema.index({ categories: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });

// Create product slug from the name
productSchema.pre('save', function (next) {
   this.slug = slugify(this.name, { lower: true });
   if (this.variants && this.variants.length > 0) {
      this.stock = this.variants.reduce((total, variant) => total + (variant.stock || 0), 0);
   }
   next();
});

module.exports = mongoose.model('Product', productSchema);
