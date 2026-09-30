const mongoose = require('mongoose');

const accountRecordSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['PAYABLE', 'RECEIVABLE'],
      required: true
    },

    partyName: {
      type: String,
      required: true,
      trim: true
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    description: {
      type: String,
      trim: true,
      default: ''
    },

    dueDate: {
      type: Date,
      required: true
    },

    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'OVERDUE', 'CANCELLED'],
      default: 'PENDING'
    },

    reference: {
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

module.exports = mongoose.model('AccountRecord', accountRecordSchema);