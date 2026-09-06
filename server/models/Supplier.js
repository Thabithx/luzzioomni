// THABITH SRIHARAN
// Supplier / Vendor management schema for procurement and purchase orders.

const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
   supplierName: {
      type: String,
      required: [true, 'Supplier name is required'],
      trim: true
   },
   contactPerson: {
      type: String,
      default: '',
      trim: true
   },
   phone: {
      type: String,
      default: '',
      trim: true
   },
   email: {
      type: String,
      default: '',
      trim: true,
      lowercase: true
   },
   address: {
      type: String,
      default: '',
      trim: true
   },
   notes: {
      type: String,
      default: ''
   },
   status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
   }
}, {
   timestamps: true
});

module.exports = mongoose.model('Supplier', supplierSchema);
