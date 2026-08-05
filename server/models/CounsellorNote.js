const mongoose = require('mongoose');

const counsellorNoteSchema = new mongoose.Schema(
  {
    escalation_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Escalation',
      required: true,
    },
    counsellor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    note_encrypted: {
      iv: { type: String, required: true },
      tag: { type: String, required: true },
      data: { type: String, required: true },
    },
    created_at: { type: Date, default: Date.now },
  },
  { collection: 'counsellor_notes' }
);

module.exports = mongoose.model('CounsellorNote', counsellorNoteSchema);
