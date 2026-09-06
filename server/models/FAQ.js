const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
   question: {
      type: String,
      required: [true, 'Question is required'],
      trim: true,
      maxlength: [300, 'Question cannot exceed 300 characters']
   },
   answer: {
      type: String,
      required: [true, 'Answer is required'],
      trim: true,
      maxlength: [2000, 'Answer cannot exceed 2000 characters']
   },
   category: {
      type: String,
      enum: ['Shipping', 'Returns', 'Payment', 'Products', 'Account', 'General'],
      default: 'General'
   },
   order: {
      type: Number,
      default: 0
   },
   isPublished: {
      type: Boolean,
      default: true
   },
   createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
   },
   createdAt: {
      type: Date,
      default: Date.now
   },
   updatedAt: {
      type: Date,
      default: Date.now
   }
});

// Update the updatedAt timestamp before saving
faqSchema.pre('save', function () {
   this.updatedAt = Date.now();
});

module.exports = mongoose.model('FAQ', faqSchema);
