const JournalEntry = require('../models/JournalEntry');
const encryptionService = require('../services/encryptionService');
const riskDetectionService = require('../services/riskDetectionService');
const escalationService = require('../services/escalationService');
const { logAudit } = require('../services/auditService');

// @route  POST /api/journals
// Create a journal entry. Content is encrypted at rest. Risk detection runs
// synchronously before returning, so risk_tier is set immediately.
const createJournal = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, error: 'Journal content is required' });
    }

    const encrypted = encryptionService.encrypt(content);

    const { tier, matchedKeywordsCategory } = await riskDetectionService.scanContent(content);

    const entry = new JournalEntry({
      user_id: req.user._id,
      content_encrypted: encrypted,
      risk_tier: tier,
      matched_keywords_category: tier > 0 ? matchedKeywordsCategory : null,
    });
    await entry.save();

    let escalationResult = null;
    if (tier >= 2) {
      escalationResult = await escalationService.handleJournalRisk({
        journalEntry: entry,
        userId: req.user._id,
        tier,
        matchedCategory: matchedKeywordsCategory,
      });
    }

    res.status(201).json({
      success: true,
      entry: {
        _id: entry._id,
        risk_tier: entry.risk_tier,
        matched_keywords_category: entry.matched_keywords_category,
        created_at: entry.created_at,
      },
      content,
      escalation: escalationResult ? { escalated: true, tier } : { escalated: false },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route  GET /api/journals  (user's own entries, decrypted for owner only)
const getMyJournals = async (req, res) => {
  try {
    const entries = await JournalEntry.find({ user_id: req.user._id })
      .sort({ created_at: -1 })
      .lean();
    res.json({
      success: true,
      entries: entries.map((e) => ({
        _id: e._id,
        content: encryptionService.decrypt(e.content_encrypted),
        risk_tier: e.risk_tier,
        created_at: e.created_at,
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { createJournal, getMyJournals };
