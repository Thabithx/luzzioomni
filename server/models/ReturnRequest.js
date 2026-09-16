// BIHANDU
// Return and Exchange workflow schema linked to original orders.
// Handles status transitions and restock vs damaged inventory logic.

const mongoose = require('mongoose');

const returnItemSchema = new mongoose.Schema({
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
   reason: {
      type: String,
      required: true
   },
   condition: {
      type: String,
      enum: ['RESELLABLE', 'DAMAGED'],
      default: 'RESELLABLE'
   }
});

const returnRequestSchema = new mongoose.Schema({
   returnNumber: {
      type: String,
      required: true,
      unique: true
   },
   originalOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true
   },
   customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
   },
   items: [returnItemSchema],
   requestType: {
      type: String,
      enum: ['RETURN', 'EXCHANGE'],
      default: 'RETURN'
   },
   status: {
      type: String,
      enum: [
         'REQUESTED',
         'RECEIVED',
         'INSPECTED',
         'APPROVED',
         'REJECTED',
         'REFUNDED',
         'EXCHANGED',
         'CANCELLED'
      ],
      default: 'REQUESTED'
   },
   refundAmount: {
      type: Number,
      default: 0
   },
   replacementProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
   },
   replacementSize: {
      type: String,
      default: ''
   },
   processedBy: {
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

module.exports = mongoose.model('ReturnRequest', returnRequestSchema);
