const RiskKeyword = require('../models/RiskKeyword');

// ---------------------------------------------------------------------------
// Risk Detection Engine
//
// IMPORTANT SCOPE NOTE (academic prototype only):
// This is a BLUNT keyword-based triage aid, NOT an accurate crisis detector.
// It will produce false positives and false negatives. Any escalation must
// always route to a human decision-maker (counsellor), and crisis resources
// must remain always-visible regardless of detection.
//
// The keyword list below is a PLACEHOLDER/STARTER list for academic
// demonstration. A real deployment must have this list reviewed and
// maintained by qualified mental health professionals and sourced from the
// institution's counselling unit or an established clinical risk-screening
// reference. For Tier 3 (explicit self-harm/suicide language) we do NOT
// hand-build a phrase list; only a safe demo placeholder is seeded.
//
// Matching logic is intentionally generic: it loads whatever keyword/tier
// list exists in the RiskKeyword collection and does simple case-insensitive
// substring matching. The service returns ONLY the highest matching tier and
// the matched category -- never the literal matched phrase -- to minimize
// what gets stored in the escalation record (NFR-P2).
// ---------------------------------------------------------------------------

const CATEGORY_BY_TIER = {
  1: 'general_distress_language',
  2: 'hopelessness_language',
  3: 'self_harm_suicide_language',
};

async function loadKeywords() {
  const keywords = await RiskKeyword.find({ is_active: true }).lean();
  const byTier = { 1: [], 2: [], 3: [] };
  for (const kw of keywords) {
    if (byTier[kw.tier]) {
      byTier[kw.tier].push({
        phrase: kw.phrase_or_pattern.toLowerCase(),
        category: kw.category || CATEGORY_BY_TIER[kw.tier],
      });
    }
  }
  return byTier;
}

/**
 * Scan journal content for keyword matches.
 * Returns { tier, matchedKeywordsCategory } where tier is the highest
 * matching tier (0 if none). The literal matched phrase is NOT returned.
 */
async function scanContent(content) {
  if (!content) return { tier: 0, matchedKeywordsCategory: null };

  const byTier = await loadKeywords();
  const haystack = content.toLowerCase();

  let highestTier = 0;
  let matchedCategory = null;

  // Tier 3 checked first and short-circuits: highest concern wins.
  for (const entry of byTier[3]) {
    if (haystack.includes(entry.phrase)) {
      return { tier: 3, matchedKeywordsCategory: entry.category };
    }
  }
  for (const entry of byTier[2]) {
    if (haystack.includes(entry.phrase)) {
      highestTier = 2;
      matchedCategory = entry.category;
      break;
    }
  }
  if (highestTier === 0) {
    for (const entry of byTier[1]) {
      if (haystack.includes(entry.phrase)) {
        highestTier = 1;
        matchedCategory = entry.category;
        break;
      }
    }
  }

  return { tier: highestTier, matchedKeywordsCategory: matchedCategory };
}

module.exports = { scanContent, loadKeywords, CATEGORY_BY_TIER };
