// THABITH SRIHARAN
// Purchase order management schema for procurement, vendor orders, and stock intake.

const mongoose = require('mongoose');

const purchaseOrderItemSchema = new mongoose.Schema({
   product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
   },
   size: {
      type: String,
      default: ''
   },
   quantity: {
      type: Number,
      required: true,
      min: 1
   },
   receivedQuantity: {
      type: Number,
      default: 0
   },
   purchasePrice: {
      type: Number,
      required: true,
      min: 0
   }
});

const purchaseOrderSchema = new mongoose.Schema({
   poNumber: {
      type: String,
      required: true,
      unique: true
   },
   supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true
   },
   items: [purchaseOrderItemSchema],
   totalCost: {
      type: Number,
      required: true,
      default: 0
   },
   status: {
      type: String,
      enum: ['DRAFT', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'],
      default: 'DRAFT'
   },
   expectedDate: {
      type: Date
   },
   receivedDate: {
      type: Date
   },
   createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
   },
   notes: {
      type: String,
      default: ''
   }
}, {
   timestamps: true
});

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
