const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password_hash: { type: String, required: true },
    role: {
      type: String,
      enum: ['user', 'counsellor', 'admin'],
      default: 'user',
    },
    mfa_enabled: { type: Boolean, default: false },
    mfa_secret: { type: String, default: null },
    mfa_temp_secret: { type: String, default: null },
    privacy_acknowledged: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
  },
  { collection: 'users' }
);

module.exports = mongoose.model('User', userSchema);
