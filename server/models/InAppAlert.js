const mongoose = require('mongoose');

const inAppAlertSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    escalation_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Escalation',
      default: null,
    },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
  },
  { collection: 'in_app_alerts' }
);

module.exports = mongoose.model('InAppAlert', inAppAlertSchema);
