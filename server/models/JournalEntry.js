const mongoose = require('mongoose');

const journalEntrySchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content_encrypted: {
      iv: { type: String, required: true },
      tag: { type: String, required: true },
      data: { type: String, required: true },
    },
    risk_tier: {
      type: Number,
      enum: [0, 1, 2, 3],
      default: 0,
    },
    matched_keywords_category: { type: String, default: null },
    created_at: { type: Date, default: Date.now, index: true },
  },
  { collection: 'journal_entries' }
);

module.exports = mongoose.model('JournalEntry', journalEntrySchema);
