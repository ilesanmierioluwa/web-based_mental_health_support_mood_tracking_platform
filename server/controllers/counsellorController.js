const Escalation = require('../models/Escalation');
const JournalEntry = require('../models/JournalEntry');
const CounsellorNote = require('../models/CounsellorNote');
const User = require('../models/User');
const encryptionService = require('../services/encryptionService');
const { logAudit } = require('../services/auditService');

// @route  GET /api/counsellor/escalations
// Queue of escalated entries sorted by tier (desc) then date. Shows only the
// minimal metadata -- NOT the user's journal content or history.
const listEscalations = async (req, res) => {
  try {
    const escalations = await Escalation.find()
      .sort({ tier: -1, created_at: 1 })
      .lean();

    const userIds = [...new Set(escalations.map((e) => e.user_id))];
    const users = await User.find({ _id: { $in: userIds } }).select('name email').lean();
    const userMap = new Map(users.map((u) => [String(u._id), u]));

    res.json({
      success: true,
      escalations: escalations.map((e) => ({
        _id: e._id,
        tier: e.tier,
        status: e.status,
        matched_category: e.matched_category,
        created_at: e.created_at,
        resolved_at: e.resolved_at,
        assigned_counsellor_id: e.assigned_counsellor_id,
        user: userMap.get(String(e.user_id)) || null,
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route  GET /api/counsellor/escalations/:id
// View a single escalated entry's content -- decrypted ONLY for this
// authorized counsellor view and written to the audit trail. No other journal
// entries from that user are exposed (NFR-P2 enforced in code).
const getEscalation = async (req, res) => {
  try {
    const escalation = await Escalation.findById(req.params.id);
    if (!escalation) return res.status(404).json({ success: false, error: 'Escalation not found' });

    const entry = await JournalEntry.findById(escalation.journal_entry_id);
    if (!entry) return res.status(404).json({ success: false, error: 'Journal entry not found' });

    const user = await User.findById(escalation.user_id).select('name email');

    await logAudit({
      userId: req.user._id,
      action: 'escalation.viewed',
      targetTable: 'escalations',
      targetId: escalation._id,
      ipAddress: req.ip,
      metadata: { escalatedUserId: String(escalation.user_id) },
    });

    res.json({
      success: true,
      escalation: {
        _id: escalation._id,
        tier: escalation.tier,
        status: escalation.status,
        matched_category: escalation.matched_category,
        created_at: escalation.created_at,
        resolved_at: escalation.resolved_at,
        assigned_counsellor_id: escalation.assigned_counsellor_id,
        user: user ? { _id: user._id, name: user.name, email: user.email } : null,
        entry: {
          content: encryptionService.decrypt(entry.content_encrypted),
          risk_tier: entry.risk_tier,
          created_at: entry.created_at,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route  POST /api/counsellor/escalations/:id/status
// Mark reviewed / contacted user / resolved, with an optional encrypted note.
const updateStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    if (!['pending', 'reviewed', 'contacted', 'resolved'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }
    const escalation = await Escalation.findById(req.params.id);
    if (!escalation) return res.status(404).json({ success: false, error: 'Escalation not found' });

    escalation.status = status;
    escalation.assigned_counsellor_id = req.user._id;
    escalation.resolved_at = status === 'resolved' ? new Date() : escalation.resolved_at;
    await escalation.save();

    if (note && note.trim()) {
      await CounsellorNote.create({
        escalation_id: escalation._id,
        counsellor_id: req.user._id,
        note_encrypted: encryptionService.encrypt(note),
      });
    }

    await logAudit({
      userId: req.user._id,
      action: `escalation.${status}`,
      targetTable: 'escalations',
      targetId: escalation._id,
      ipAddress: req.ip,
      metadata: { tier: escalation.tier, noteProvided: Boolean(note && note.trim()) },
    });

    res.json({ success: true, escalation });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route  GET /api/counsellor/escalations/:id/notes
const getNotes = async (req, res) => {
  try {
    const notes = await CounsellorNote.find({ escalation_id: req.params.id })
      .sort({ created_at: 1 })
      .lean();
    const counsellorIds = [...new Set(notes.map((n) => n.counsellor_id))];
    const counsellors = await User.find({ _id: { $in: counsellorIds } }).select('name').lean();
    const map = new Map(counsellors.map((c) => [String(c._id), c.name]));

    res.json({
      success: true,
      notes: notes.map((n) => ({
        _id: n._id,
        counsellor_name: map.get(String(n.counsellor_id)) || 'Support team',
        note: encryptionService.decrypt(n.note_encrypted),
        created_at: n.created_at,
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { listEscalations, getEscalation, updateStatus, getNotes };
