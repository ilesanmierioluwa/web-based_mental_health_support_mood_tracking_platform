const mongoose = require('mongoose');

const resourceItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: [
        'anxiety',
        'low_mood',
        'stress',
        'sleep',
        'grounding',
        'crisis_support',
      ],
      required: true,
    },
    body: { type: String, required: true },
    external_link: { type: String, default: '' },
    tags_for_matching: { type: [String], default: [] },
    is_active: { type: Boolean, default: true },
    created_at: { type: Date, default: Date.now },
  },
  { collection: 'resource_items' }
);

module.exports = mongoose.model('ResourceItem', resourceItemSchema);
