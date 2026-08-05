const MoodEntry = require('../models/MoodEntry');
const moodService = require('../services/moodService');
const encryptionService = require('../services/encryptionService');
const { logAudit } = require('../services/auditService');

const VALID_TAGS = [
  'good_sleep',
  'poor_sleep',
  'low_stress',
  'stressed',
  'exercise',
  'no_exercise',
  'social',
  'isolated',
  'anxious',
];

// @route  POST /api/moods
// Log a daily mood entry. Multiple entries per day are allowed; for
// visualization and streak purposes the MOST RECENT entry of a given day
// counts (documented design choice in the report).
const createMood = async (req, res) => {
  try {
    const { mood_scale, tags = [], note } = req.body;
    if (!mood_scale || mood_scale < 1 || mood_scale > 5) {
      return res.status(400).json({ success: false, error: 'mood_scale must be between 1 and 5' });
    }

    const normalizedTags = [...new Set(tags)].slice(0, 12);

    const entry = new MoodEntry({
      user_id: req.user._id,
      mood_scale,
      tags: normalizedTags,
      note_encrypted: encryptionService.encrypt(note || ''),
    });
    await entry.save();

    res.status(201).json({
      success: true,
      entry: {
        _id: entry._id,
        mood_scale: entry.mood_scale,
        tags: entry.tags,
        note: note || '',
        logged_at: entry.logged_at,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route  GET /api/moods
const getMyMoods = async (req, res) => {
  try {
    const entries = await MoodEntry.find({ user_id: req.user._id }).sort({ logged_at: -1 }).lean();
    res.json({
      success: true,
      entries: entries.map((e) => ({
        _id: e._id,
        mood_scale: e.mood_scale,
        tags: e.tags,
        note: encryptionService.decrypt(e.note_encrypted),
        logged_at: e.logged_at,
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route  GET /api/moods/analytics?period=day|week|month
const getAnalytics = async (req, res) => {
  try {
    const period = ['day', 'week', 'month'].includes(req.query.period) ? req.query.period : 'day';
    const data = await moodService.aggregateByPeriod(req.user._id, period);
    res.json({ success: true, period, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route  GET /api/moods/tags  (tag correlation)
const getTagCorrelation = async (req, res) => {
  try {
    const data = await moodService.tagCorrelation(req.user._id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route  GET /api/moods/streak
const getStreak = async (req, res) => {
  try {
    const entries = await MoodEntry.find({ user_id: req.user._id })
      .select('logged_at')
      .sort({ logged_at: -1 })
      .lean();

    const dayKeys = new Set(
      entries.map((e) => {
        const d = new Date(e.logged_at);
        d.setHours(0, 0, 0, 0);
        return d.toISOString().slice(0, 10);
      })
    );

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let cursor = new Date(today);
    if (!dayKeys.has(cursor.toISOString().slice(0, 10))) {
      cursor.setDate(cursor.getDate() - 1);
    }
    while (dayKeys.has(cursor.toISOString().slice(0, 10))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    res.json({
      success: true,
      streak,
      loggedToday: dayKeys.has(today.toISOString().slice(0, 10)),
      totalEntries: entries.length,
      message:
        streak > 0
          ? `You've logged your mood ${streak} day${streak > 1 ? 's' : ''} in a row. Consistent check-ins help you notice patterns over time.`
          : "No entries yet this week. That's okay — you can start whenever you feel ready.",
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  createMood,
  getMyMoods,
  getAnalytics,
  getTagCorrelation,
  getStreak,
  VALID_TAGS,
};
