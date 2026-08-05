const ResourceItem = require('../models/ResourceItem');
const moodService = require('./moodService');

// ---------------------------------------------------------------------------
// Resource recommendation engine (Module 6).
//
// Simple rule-based matching: look at the user's mood/tag pattern over the
// last 7 days and surface 2-3 active resources from matching categories.
// Maps mood/tag signals to resource categories:
//   - frequent 'stress'/'stressed' tag or low mood -> stress / low_mood
//   - frequent 'poor_sleep' tag -> sleep
//   - frequent 'anxiety'/'anxious' tag -> anxiety
//   - frequent 'social' tag -> grounding / anxiety
//   - low average mood (< 3) -> low_mood + crisis_support backup
//   - grounding resources shown as a general baseline when few signals
// ---------------------------------------------------------------------------

const CATEGORY_ALIASES = {
  stress: ['stress', 'stressed'],
  sleep: ['poor_sleep', 'sleep', 'tired'],
  anxiety: ['anxiety', 'anxious'],
  low_mood: ['low_mood', 'low', 'sad'],
  social: ['social', 'lonely', 'isolated'],
};

async function recommendForUser(userId, limit = 3) {
  const pattern = await moodService.recentPattern(userId, 7);
  const tagSet = new Set(pattern.tags.map((t) => t.tag.toLowerCase()));

  const categoryScores = {};
  for (const [category, aliases] of Object.entries(CATEGORY_ALIASES)) {
    for (const alias of aliases) {
      if (tagSet.has(alias)) {
        const freq =
          pattern.tags.find((t) => t.tag.toLowerCase() === alias)?.count || 1;
        categoryScores[category] = (categoryScores[category] || 0) + freq;
      }
    }
  }

  if (pattern.avgMood !== null && pattern.avgMood < 3) {
    categoryScores.low_mood = (categoryScores.low_mood || 0) + 2;
  }
  if (Object.keys(categoryScores).length === 0 && pattern.entryCount > 0) {
    // Few/no tag signals: default to grounding + stress as a gentle baseline.
    categoryScores.grounding = 1;
    categoryScores.stress = 1;
  }

  const rankedCategories = Object.entries(categoryScores)
    .sort((a, b) => b[1] - a[1])
    .map(([category]) => category);

  const candidates = [];
  for (const category of rankedCategories) {
    const items = await ResourceItem.find({
      category,
      is_active: true,
    }).limit(limit);
    for (const item of items) {
      if (!candidates.find((c) => c._id.toString() === item._id.toString())) {
        candidates.push(item);
      }
    }
    if (candidates.length >= limit) break;
  }

  // Fallback if nothing matched at all (e.g. no entries yet).
  if (candidates.length === 0) {
    candidates.push(
      ...(await ResourceItem.find({
        category: { $in: ['grounding', 'crisis_support'] },
        is_active: true,
      }).limit(limit))
    );
  }

  return candidates.slice(0, limit);
}

module.exports = { recommendForUser };
