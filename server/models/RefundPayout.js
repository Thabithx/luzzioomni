const mongoose = require('mongoose');

const refundPayoutSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['REFUND', 'PAYOUT'],
      required: true
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    reason: {
      type: String,
      enum: ['RETURN', 'EXCHANGE', 'CANCELLATION', 'OTHER'],
      required: true
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null
    },

    returnRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ReturnRequest',
      default: null
    },

    paymentMethod: {
      type: String,
      trim: true,
      default: 'OTHER'
    },

    recipient: {
      type: String,
      trim: true,
      default: ''
    },

    status: {
      type: String,
      enum: ['PENDING', 'PROCESSED', 'CANCELLED'],
      default: 'PENDING'
    },

    reference: {
      type: String,
      trim: true,
      default: ''
    },

    description: {
      type: String,
      trim: true,
      default: ''
    },

    date: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  'RefundPayout',
  refundPayoutSchema
);