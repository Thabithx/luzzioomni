const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema({
   name: {
      type: String,
      required: [true, 'Please add a category name'],
      unique: true,
      trim: true,
      maxlength: [50, 'Name can not be more than 50 characters']
   },
   slug: String,
   description: {
      type: String,
      maxlength: [500, 'Description can not be more than 500 characters']
   },
   sortOrder: {
      type: Number,
      default: 0
   },
   createdAt: {
      type: Date,
      default: Date.now
   }
});

// Create category slug from the name
categorySchema.pre('save', async function () {
   this.slug = slugify(this.name, { lower: true });
});

module.exports = mongoose.model('Category', categorySchema);