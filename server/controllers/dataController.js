const MoodEntry = require('../models/MoodEntry');
const JournalEntry = require('../models/JournalEntry');
const User = require('../models/User');
const Escalation = require('../models/Escalation');
const InAppAlert = require('../models/InAppAlert');
const SupportRequest = require('../models/SupportRequest');
const encryptionService = require('../services/encryptionService');
const { logAudit } = require('../services/auditService');

// @route  GET /api/data/export
// Export the user's OWN mood + journal data as JSON. Nothing else.
const exportData = async (req, res) => {
  try {
    const moods = await MoodEntry.find({ user_id: req.user._id }).lean();
    const journals = await JournalEntry.find({ user_id: req.user._id }).lean();

    const payload = {
      exported_at: new Date().toISOString(),
      user: {
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        mfa_enabled: req.user.mfa_enabled,
        created_at: req.user.created_at,
      },
      mood_entries: moods.map((m) => ({
        mood_scale: m.mood_scale,
        tags: m.tags,
        note: encryptionService.decrypt(m.note_encrypted),
        logged_at: m.logged_at,
      })),
      journal_entries: journals.map((j) => ({
        content: encryptionService.decrypt(j.content_encrypted),
        risk_tier: j.risk_tier,
        created_at: j.created_at,
      })),
    };

    await logAudit({
      userId: req.user._id,
      action: 'data.exported',
      targetTable: 'users',
      targetId: req.user._id,
      ipAddress: req.ip,
      metadata: { entries: payload.mood_entries.length + payload.journal_entries.length },
    });

    res.json({ success: true, data: payload });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route  DELETE /api/data/account
// Genuine deletion of the user's mood/journal/alerts content and the account.
// The ONLY retained data is the minimal audit trail, and -- as a deliberate,
// narrow documented exception -- an active/unresolved escalation record so
// the support team can still complete an in-flight review. No journal content
// is retained.
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    const unresolvedCount = await Escalation.countDocuments({
      user_id: userId,
      status: { $in: ['pending', 'reviewed', 'contacted'] },
    });

    await MoodEntry.deleteMany({ user_id: userId });
    await JournalEntry.deleteMany({ user_id: userId });
    await InAppAlert.deleteMany({ user_id: userId });
    await SupportRequest.deleteMany({ user_id: userId });

    // Retain audit trail + unresolved escalation metadata (no content).
    await logAudit({
      userId,
      action: 'data.account_deleted',
      targetTable: 'users',
      targetId: userId,
      ipAddress: req.ip,
      metadata: { unresolvedEscalationsAtDeletion: unresolvedCount },
    });

    if (unresolvedCount === 0) {
      await Escalation.deleteMany({ user_id: userId });
    }

    await User.deleteOne({ _id: userId });

    res.json({
      success: true,
      message:
        unresolvedCount > 0
          ? 'Your account and all journal/mood data have been deleted. A minimal record of an ongoing support review was retained for the support team, in line with the Privacy Policy.'
          : 'Your account and all of your data have been deleted.',
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { exportData, deleteAccount };
