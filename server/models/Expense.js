const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: 0
    },

    category: {
      type: String,
      enum: [
        'rent',
        'salary',
        'utilities',
        'supplier-payment',
        'marketing',
        'maintenance',
        'other'
      ],
      required: true
    },

    description: {
      type: String,
      trim: true,
      default: ''
    },

    payee: {
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

module.exports = mongoose.model('Expense', expenseSchema);