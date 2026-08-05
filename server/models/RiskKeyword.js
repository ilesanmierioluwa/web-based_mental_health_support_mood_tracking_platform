const mongoose = require('mongoose');

const riskKeywordSchema = new mongoose.Schema(
  {
    phrase_or_pattern: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    tier: {
      type: Number,
      enum: [1, 2, 3],
      required: true,
    },
    category: {
      type: String,
      default: 'general_distress_language',
    },
    added_by_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    is_active: { type: Boolean, default: true },
    created_at: { type: Date, default: Date.now },
  },
  { collection: 'risk_keywords' }
);

module.exports = mongoose.model('RiskKeyword', riskKeywordSchema);
