const mongoose = require('mongoose');

const moodEntrySchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    mood_scale: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    note_encrypted: {
      iv: { type: String, default: '' },
      tag: { type: String, default: '' },
      data: { type: String, default: '' },
    },
    logged_at: { type: Date, default: Date.now, index: true },
  },
  { collection: 'mood_entries' }
);

module.exports = mongoose.model('MoodEntry', moodEntrySchema);
