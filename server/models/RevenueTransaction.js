const mongoose = require('mongoose');

const revenueTransactionSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: 0
    },

    source: {
      type: String,
      required: true,
      trim: true
    },

    channel: {
      type: String,
      enum: ['online', 'in-store'],
      required: true
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
  'RevenueTransaction',
  revenueTransactionSchema
);