const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    action: { type: String, required: true },
    target_table: { type: String, default: '' },
    target_id: { type: String, default: '' },
    ip_address: { type: String, default: '' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    created_at: { type: Date, default: Date.now, index: true },
  },
  { collection: 'audit_logs' }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
