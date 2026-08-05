const User = require('../models/User');
const RiskKeyword = require('../models/RiskKeyword');
const RiskKeywordHistory = require('../models/RiskKeywordHistory');
const AuditLog = require('../models/AuditLog');
const bcrypt = require('bcryptjs');
const { logAudit } = require('../services/auditService');

// ---- User / counsellor account management ----------------------------------

// @route  GET /api/admin/users?role=user|counsellor|admin
const listUsers = async (req, res) => {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    const users = await User.find(filter).select('name email role mfa_enabled created_at').lean();
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route  POST /api/admin/users  (create counsellor/admin accounts)
const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, error: 'name, email, password and role are required' });
    }
    if (!['counsellor', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Only counsellor or admin roles can be created here' });
    }
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ success: false, error: 'Email already in use' });

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password_hash: await bcrypt.hash(password, 10),
      role,
      privacy_acknowledged: true,
    });

    await logAudit({
      userId: req.user._id,
      action: 'admin.user.created',
      targetTable: 'users',
      targetId: user._id,
      ipAddress: req.ip,
      metadata: { role },
    });

    res.status(201).json({ success: true, user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route  PUT /api/admin/users/:id  (change role / deactivate not used; role only)
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    if (req.body.role) {
      if (!['user', 'counsellor', 'admin'].includes(req.body.role)) {
        return res.status(400).json({ success: false, error: 'Invalid role' });
      }
      user.role = req.body.role;
    }
    await user.save();

    await logAudit({
      userId: req.user._id,
      action: 'admin.user.updated',
      targetTable: 'users',
      targetId: user._id,
      ipAddress: req.ip,
      metadata: { role: user.role },
    });

    res.json({ success: true, user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ---- Risk keyword management (with version history) ------------------------

// @route  GET /api/admin/keywords
const listKeywords = async (req, res) => {
  try {
    const keywords = await RiskKeyword.find().sort({ tier: 1, created_at: -1 }).lean();
    res.json({ success: true, keywords });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route  POST /api/admin/keywords
const createKeyword = async (req, res) => {
  try {
    const { phrase_or_pattern, tier, category } = req.body;
    if (!phrase_or_pattern || ![1, 2, 3].includes(Number(tier))) {
      return res.status(400).json({ success: false, error: 'phrase_or_pattern and tier (1, 2 or 3) are required' });
    }
    const existing = await RiskKeyword.findOne({ phrase_or_pattern: phrase_or_pattern.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, error: 'This phrase already exists in the keyword list' });
    }

    const kw = await RiskKeyword.create({
      phrase_or_pattern: phrase_or_pattern.toLowerCase(),
      tier: Number(tier),
      category: category || 'general_distress_language',
      added_by_user_id: req.user._id,
    });

    await RiskKeywordHistory.create({
      risk_keyword_id: kw._id,
      phrase_or_pattern: kw.phrase_or_pattern,
      tier: kw.tier,
      category: kw.category,
      action: 'added',
      changed_by_user_id: req.user._id,
    });

    await logAudit({
      userId: req.user._id,
      action: 'keyword.added',
      targetTable: 'risk_keywords',
      targetId: kw._id,
      ipAddress: req.ip,
      metadata: { phrase: kw.phrase_or_pattern, tier: kw.tier },
    });

    res.status(201).json({ success: true, keyword: kw });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route  PUT /api/admin/keywords/:id
const updateKeyword = async (req, res) => {
  try {
    const kw = await RiskKeyword.findById(req.params.id);
    if (!kw) return res.status(404).json({ success: false, error: 'Keyword not found' });

    const prev = { phrase_or_pattern: kw.phrase_or_pattern, tier: kw.tier, category: kw.category };

    if (req.body.phrase_or_pattern) kw.phrase_or_pattern = req.body.phrase_or_pattern.toLowerCase();
    if (req.body.tier !== undefined) kw.tier = Number(req.body.tier);
    if (req.body.category) kw.category = req.body.category;
    if (req.body.is_active !== undefined) kw.is_active = Boolean(req.body.is_active);
    await kw.save();

    await RiskKeywordHistory.create({
      risk_keyword_id: kw._id,
      phrase_or_pattern: kw.phrase_or_pattern,
      tier: kw.tier,
      category: kw.category,
      action: 'updated',
      changed_by_user_id: req.user._id,
    });

    await logAudit({
      userId: req.user._id,
      action: 'keyword.updated',
      targetTable: 'risk_keywords',
      targetId: kw._id,
      ipAddress: req.ip,
      metadata: { from: prev, to: { phrase_or_pattern: kw.phrase_or_pattern, tier: kw.tier } },
    });

    res.json({ success: true, keyword: kw });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route  DELETE /api/admin/keywords/:id  (soft delete -- keeps audit trail)
const deleteKeyword = async (req, res) => {
  try {
    const kw = await RiskKeyword.findById(req.params.id);
    if (!kw) return res.status(404).json({ success: false, error: 'Keyword not found' });

    kw.is_active = false;
    await kw.save();

    await RiskKeywordHistory.create({
      risk_keyword_id: kw._id,
      phrase_or_pattern: kw.phrase_or_pattern,
      tier: kw.tier,
      category: kw.category,
      action: 'removed',
      changed_by_user_id: req.user._id,
    });

    await logAudit({
      userId: req.user._id,
      action: 'keyword.removed',
      targetTable: 'risk_keywords',
      targetId: kw._id,
      ipAddress: req.ip,
      metadata: { phrase: kw.phrase_or_pattern, tier: kw.tier },
    });

    res.json({ success: true, message: 'Keyword deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route  GET /api/admin/keywords/history
const keywordHistory = async (req, res) => {
  try {
    const history = await RiskKeywordHistory.find().sort({ created_at: -1 }).limit(200).lean();
    const userIds = [...new Set(history.map((h) => h.changed_by_user_id).filter(Boolean))];
    const users = await User.find({ _id: { $in: userIds } }).select('name email').lean();
    const map = new Map(users.map((u) => [String(u._id), u.name]));

    res.json({
      success: true,
      history: history.map((h) => ({
        _id: h._id,
        phrase_or_pattern: h.phrase_or_pattern,
        tier: h.tier,
        category: h.category,
        action: h.action,
        changed_by: map.get(String(h.changed_by_user_id)) || 'System',
        created_at: h.created_at,
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ---- Audit logs ------------------------------------------------------------

// @route  GET /api/admin/audit-logs
const listAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ created_at: -1 }).limit(200).lean();
    const userIds = [...new Set(logs.map((l) => l.user_id).filter(Boolean))];
    const users = await User.find({ _id: { $in: userIds } }).select('name email').lean();
    const map = new Map(users.map((u) => [String(u._id), u.name]));

    res.json({
      success: true,
      logs: logs.map((l) => ({
        _id: l._id,
        user: map.get(String(l.user_id)) || null,
        action: l.action,
        target_table: l.target_table,
        target_id: l.target_id,
        ip_address: l.ip_address,
        metadata: l.metadata,
        created_at: l.created_at,
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  listUsers,
  createUser,
  updateUser,
  listKeywords,
  createKeyword,
  updateKeyword,
  deleteKeyword,
  keywordHistory,
  listAuditLogs,
};
