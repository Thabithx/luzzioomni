const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
   ip: {
      type: String,
      required: true
   },
   userAgent: {
      type: String
   },
   path: {
      type: String,
      required: true
   },
   timestamp: {
      type: Date,
      default: Date.now
   }
}, {
   timestamps: true
});

// Optimization: Indexing for date range queries
visitSchema.index({ timestamp: 1 });

// Optional: Automatically delete logs older than 90 days to save space
visitSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model('Visit', visitSchema);
