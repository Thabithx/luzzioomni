// Central audit log schema for security, financial, and inventory auditing.

const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
   user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
   },
   action: {
      type: String,
      required: true
   },
   entity: {
      type: String,
      required: true
   },
   entityId: {
      type: String
   },
   details: {
      type: mongoose.Schema.Types.Mixed
   },
   timestamp: {
      type: Date,
      default: Date.now
   }
}, {
   timestamps: true
});

auditLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
