const MoodEntry = require('../models/MoodEntry');

// ---------------------------------------------------------------------------
// Mood analytics (Module 5). Aggregates the connected user's own logged data.
// All output is presented as observed patterns in the user's own data, never
// as clinical inference.
// ---------------------------------------------------------------------------

const MOOD_LABELS = {
  1: 'Very Low',
  2: 'Low',
  3: 'Neutral',
  4: 'Good',
  5: 'Very Good',
};

function periodStart(dt, period) {
  const d = new Date(dt);
  if (period === 'day') {
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (period === 'week') {
    const day = (d.getDay() + 6) % 7; // Monday as start of week
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  // month
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Aggregate mood entries by day/week/month. Returns a list of
 * { periodKey, start, mood_scale } using the most recent entry's mood_scale
 * per period (matching our "most recent counts for streak" rule) and the
 * count of entries logged in that period.
 */
async function aggregateByPeriod(userId, period = 'day', fromDate = null, toDate = null) {
  const match = { user_id: userId };
  if (fromDate || toDate) {
    match.logged_at = {};
    if (fromDate) match.logged_at.$gte = new Date(fromDate);
    if (toDate) match.logged_at.$lte = new Date(toDate);
  }

  const entries = await MoodEntry.find(match).sort({ logged_at: 1 }).lean();

  const buckets = new Map();
  for (const e of entries) {
    const start = periodStart(e.logged_at, period);
    const key = start.toISOString();
    if (!buckets.has(key)) {
      buckets.set(key, { periodKey: key, start, entries: [] });
    }
    buckets.get(key).entries.push(e);
  }

  const result = [];
  for (const bucket of buckets.values()) {
    const sorted = bucket.entries.sort((a, b) => a.logged_at - b.logged_at);
    const last = sorted[sorted.length - 1];
    result.push({
      periodKey: bucket.periodKey,
      start: bucket.start,
      mood_scale: last.mood_scale,
      entryCount: sorted.length,
    });
  }

  return result.sort((a, b) => a.start - b.start);
}

/**
 * Average mood grouped by each tag present ("On days you logged poor sleep,
 * your average mood was X"). Returns an array of { tag, avgMood, count }.
 */
async function tagCorrelation(userId) {
  const entries = await MoodEntry.find({ user_id: userId }).lean();
  const byTag = new Map();
  for (const e of entries) {
    for (const tag of e.tags || []) {
      if (!byTag.has(tag)) byTag.set(tag, { sum: 0, count: 0 });
      byTag.get(tag).sum += e.mood_scale;
      byTag.get(tag).count += 1;
    }
  }
  const result = [];
  for (const [tag, { sum, count }] of byTag.entries()) {
    result.push({
      tag,
      avgMood: count ? Number((sum / count).toFixed(2)) : 0,
      count,
    });
  }
  return result.sort((a, b) => b.count - a.count);
}

/**
 * Simple overall averages/pattern summary used for recommendations.
 * Returns tags over the last 7 days (with frequency) and average mood.
 */
async function recentPattern(userId, days = 7) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const entries = await MoodEntry.find({
    user_id: userId,
    logged_at: { $gte: since },
  }).lean();

  const tagFreq = new Map();
  let sum = 0;
  let moodCount = 0;
  for (const e of entries) {
    if (typeof e.mood_scale === 'number') {
      sum += e.mood_scale;
      moodCount += 1;
    }
    for (const tag of e.tags || []) {
      tagFreq.set(tag, (tagFreq.get(tag) || 0) + 1);
    }
  }
  return {
    days,
    entryCount: entries.length,
    avgMood: moodCount ? Number((sum / moodCount).toFixed(2)) : null,
    tags: Array.from(tagFreq.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count),
  };
}

module.exports = { MOOD_LABELS, aggregateByPeriod, tagCorrelation, recentPattern };
