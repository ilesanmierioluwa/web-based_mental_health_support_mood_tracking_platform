const mongoose = require('mongoose');

const riskKeywordHistorySchema = new mongoose.Schema(
  {
    risk_keyword_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RiskKeyword',
      required: true,
    },
    phrase_or_pattern: { type: String, required: true },
    tier: { type: Number, required: true },
    category: { type: String, default: 'general_distress_language' },
    action: {
      type: String,
      enum: ['added', 'updated', 'removed'],
      required: true,
    },
    changed_by_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    created_at: { type: Date, default: Date.now },
  },
  { collection: 'risk_keywords_history' }
);

module.exports = mongoose.model('RiskKeywordHistory', riskKeywordHistorySchema);
