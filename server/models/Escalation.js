const mongoose = require('mongoose');

const escalationSchema = new mongoose.Schema(
  {
    journal_entry_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JournalEntry',
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tier: {
      type: Number,
      enum: [2, 3],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'contacted', 'resolved'],
      default: 'pending',
    },
    matched_category: { type: String, default: null },
    assigned_counsellor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    created_at: { type: Date, default: Date.now, index: true },
    resolved_at: { type: Date, default: null },
  },
  { collection: 'escalations' }
);

module.exports = mongoose.model('Escalation', escalationSchema);
