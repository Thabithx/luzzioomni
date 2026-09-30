const mongoose = require('mongoose');

const paymentReconciliationSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true
    },

    paymentGateway: {
      type: String,
      required: true,
      trim: true
    },

    transactionReference: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    recordedAmount: {
      type: Number,
      required: true,
      min: 0
    },

    receivedAmount: {
      type: Number,
      required: true,
      min: 0
    },

    status: {
      type: String,
      enum: ['MATCHED', 'MISMATCHED', 'PENDING'],
      default: 'PENDING'
    },

    reconciledAt: {
      type: Date,
      default: null
    },

    notes: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Automatically determine whether the received payment
// matches the amount recorded for the sale.
paymentReconciliationSchema.pre('save', function (next) {
  if (this.receivedAmount === this.recordedAmount) {
    this.status = 'MATCHED';

    if (!this.reconciledAt) {
      this.reconciledAt = new Date();
    }
  } else {
    this.status = 'MISMATCHED';
    this.reconciledAt = null;
  }

  next();
});

module.exports = mongoose.model(
  'PaymentReconciliation',
  paymentReconciliationSchema
);