// MAHATHIR
// Employee shift scheduling schema.
// Defines staff working schedules and roles.

const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
   employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
   },
   date: {
      type: Date,
      required: true
   },
   startTime: {
      type: String,
      required: true // e.g. "09:00"
   },
   endTime: {
      type: String,
      required: true // e.g. "17:00"
   },
   role: {
      type: String,
      enum: ['SALES', 'WAREHOUSE', 'ADMIN'],
      default: 'SALES'
   },
   status: {
      type: String,
      enum: ['SCHEDULED', 'COMPLETED', 'CANCELLED'],
      default: 'SCHEDULED'
   },
   notes: {
      type: String,
      default: ''
   },
   createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
   }
}, {
   timestamps: true
});

module.exports = mongoose.model('Shift', shiftSchema);
