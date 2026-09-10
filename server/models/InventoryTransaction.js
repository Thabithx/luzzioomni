// DULARA
// Centralized inventory transaction ledger.
// Tracks all stock movement across ONLINE, POS, RESTOCK, RETURN, PO receiving, and manual adjustments.

const mongoose = require('mongoose');

const inventoryTransactionSchema = new mongoose.Schema({
   product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
   },
   variantSize: {
      type: String,
      default: ''
   },
   quantityChange: {
      type: Number,
      required: true
   },
   previousQuantity: {
      type: Number,
      required: true
   },
   newQuantity: {
      type: Number,
      required: true
   },
   transactionType: {
      type: String,
      enum: [
         'ONLINE_SALE',
         'POS_SALE',
         'RETURN',
         'EXCHANGE',
         'RESTOCK',
         'PURCHASE_ORDER_RECEIVED',
         'MANUAL_ADJUSTMENT',
         'DAMAGED',
         'LOST',
         'TRANSFER'
      ],
      required: true
   },
   source: {
      type: String,
      enum: ['ONLINE', 'POS', 'ADMIN', 'WAREHOUSE'],
      default: 'POS'
   },
   referenceId: {
      type: String,
      default: ''
   },
   performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
   },
   notes: {
      type: String,
      default: ''
   },
   timestamp: {
      type: Date,
      default: Date.now
   }
}, {
   timestamps: true
});

inventoryTransactionSchema.index({ product: 1, timestamp: -1 });
inventoryTransactionSchema.index({ transactionType: 1 });

module.exports = mongoose.model('InventoryTransaction', inventoryTransactionSchema);
