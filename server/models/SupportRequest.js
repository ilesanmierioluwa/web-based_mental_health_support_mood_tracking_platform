const mongoose = require('mongoose');

const supportRequestSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    message: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'contacted', 'resolved'],
      default: 'pending',
    },
    assigned_counsellor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    created_at: { type: Date, default: Date.now, index: true },
    resolved_at: { type: Date, default: null },
  },
  { collection: 'support_requests' }
);

module.exports = mongoose.model('SupportRequest', supportRequestSchema);
