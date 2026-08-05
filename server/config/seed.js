require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./db');
const RiskKeyword = require('../models/RiskKeyword');
const RiskKeywordHistory = require('../models/RiskKeywordHistory');
const ResourceItem = require('../models/ResourceItem');
const User = require('../models/User');

// ---------------------------------------------------------------------------
// PLACEHOLDER/STARTER keyword list for ACADEMIC DEMONSTRATION ONLY.
// A real deployment must have this list reviewed and maintained by qualified
// mental health professionals and sourced from the institution's counselling
// unit or an established clinical risk-screening reference.
//
// Tier 1 = general distress language (everyday vocabulary)
// Tier 2 = hopelessness / heavy language
// Tier 3 = explicit self-harm/suicide language. We intentionally do NOT
//          hand-build this list; only a safe demo placeholder phrase is
//          seeded so the escalation flow can be demonstrated without the
//          codebase containing a real harm-enabling phrase list.
// ---------------------------------------------------------------------------
const STARTER_KEYWORDS = [
  // Tier 1 - general distress
  { phrase: 'hopeless', tier: 1, category: 'general_distress_language' },
  { phrase: 'overwhelmed', tier: 1, category: 'general_distress_language' },
  { phrase: 'worthless', tier: 1, category: 'general_distress_language' },
  { phrase: "can't cope", tier: 1, category: 'general_distress_language' },
  { phrase: 'exhausted all the time', tier: 1, category: 'general_distress_language' },
  { phrase: 'no point anymore', tier: 1, category: 'general_distress_language' },
  { phrase: 'stressed out', tier: 1, category: 'general_distress_language' },
  { phrase: 'burned out', tier: 1, category: 'general_distress_language' },
  // Tier 2 - hopelessness / heavy language
  { phrase: 'no way out', tier: 2, category: 'hopelessness_language' },
  { phrase: "can't go on", tier: 2, category: 'hopelessness_language' },
  { phrase: 'nothing matters', tier: 2, category: 'hopelessness_language' },
  { phrase: 'feel trapped', tier: 2, category: 'hopelessness_language' },
  // Tier 3 - safe demo placeholder ONLY (see note above)
  { phrase: 'DEMO_TIER3_TEST_PHRASE', tier: 3, category: 'self_harm_suicide_language' },
];

const STARTER_RESOURCES = [
  {
    title: 'The 4-7-8 Breathing Exercise',
    category: 'grounding',
    tags_for_matching: ['stress', 'stressed', 'anxiety', 'anxious'],
    body: "A simple calming breath pattern you can use almost anywhere. Sit comfortably with your back straight. Place the tip of your tongue against the ridge of tissue just behind your upper front teeth. Breathe in quietly through your nose for 4 counts. Hold your breath for 7 counts. Exhale completely through your mouth, making a soft whoosh sound, for 8 counts. Repeat this cycle 4 times. It can take a few rounds to feel its effect, so be gentle with yourself while you practice.",
  },
  {
    title: '5-4-3-2-1 Grounding Technique',
    category: 'grounding',
    tags_for_matching: ['anxiety', 'anxious', 'stressed', 'overwhelmed'],
    body: "When you feel overwhelmed, this exercise brings your attention back to the present. Look around and notice: 5 things you can see, 4 things you can touch, 3 things you can hear, 2 things you can smell, and 1 thing you can taste. Go slowly and name them out loud or in your head. You are not trying to stop your feelings — just giving your mind somewhere gentle to rest for a moment.",
  },
  {
    title: 'Gentle Sleep Hygiene Habits',
    category: 'sleep',
    tags_for_matching: ['poor_sleep', 'sleep', 'tired'],
    body: "Aiming for a more restful night doesn't require perfection. Try keeping a fairly consistent sleep and wake time, even on weekends. Dim bright screens for about an hour before bed. Make your room cooler and darker. If you're still awake after about 20 minutes in bed, get up, do something quiet and calming, and return to bed when you feel sleepy again. Small, consistent steps count more than a perfect routine.",
  },
  {
    title: 'Managing Everyday Stress',
    category: 'stress',
    tags_for_matching: ['stress', 'stressed', 'work', 'exams'],
    body: "Stress is common, and noticing it is the first step. Try breaking big tasks into small, specific next steps and doing just one. Schedule short breaks during the day, even two minutes of slow breathing or a short walk. Talk to someone you trust about what is heavy. Remind yourself that you don't have to carry everything alone at once. If stress keeps feeling unmanageable, reaching out for support is a sign of strength.",
  },
  {
    title: 'When Low Mood Lingers',
    category: 'low_mood',
    tags_for_matching: ['low', 'low_mood', 'sad', 'down'],
    body: "Everyone has difficult days. When low mood lingers, small routines can help steady you: getting sunlight early in the day, moving your body a little, staying in touch with people who care about you, and keeping meals regular. Notice the wins that are actually wins for you — a shower, a message to a friend — and let them count. If low mood has been present most of the day, more days than not, for two weeks or longer, it may help to talk with a professional.",
  },
  {
    title: 'Coping with Anxiety',
    category: 'anxiety',
    tags_for_matching: ['anxiety', 'anxious', 'worried'],
    body: "Anxiety often shows up in the body and the thoughts at once. Try naming what you feel without judging it: 'This is anxiety, and it will pass.' Breathe slowly, longer out-breaths than in. Focus on what you can control in the next hour rather than everything that could go wrong. A trusted person can help hold the worry with you. If anxiety interferes with your daily life often, consider talking to a professional or your institution's counselling unit.",
  },
  {
    title: 'Reaching Out to a Support Contact',
    category: 'crisis_support',
    tags_for_matching: ['crisis', 'emergency', 'harm'],
    body: "If you are in immediate danger or are worried about your safety, please reach out right now to your institution's counselling unit or a trusted person you can talk to. You can also use the 'Get Help Now' button available on every page of this platform, which is always there whether or not anything was flagged. Asking for help when things feel heavy is not weakness — it is care for yourself.",
  },
  {
    title: 'When You Miss a Check-In',
    category: 'low_mood',
    tags_for_matching: ['streak', 'missed'],
    body: "It's completely okay if you miss a day — or several — of logging. This tool is here to support you, not to judge you. There is no penalty for a gap, and you never have to 'catch up'. Whenever you feel ready, you can simply log today's mood. What matters is that you keep choosing to check in with yourself, at your own pace.",
  },
];

async function seed() {
  await connectDB();

  const keywordCount = await RiskKeyword.countDocuments();
  if (keywordCount === 0) {
    for (const kw of STARTER_KEYWORDS) {
      const created = await RiskKeyword.create({
        phrase_or_pattern: kw.phrase,
        tier: kw.tier,
        category: kw.category,
        added_by_user_id: null,
      });
      await RiskKeywordHistory.create({
        risk_keyword_id: created._id,
        phrase_or_pattern: created.phrase_or_pattern,
        tier: created.tier,
        category: created.category,
        action: 'added',
        changed_by_user_id: null,
      });
    }
    console.log(`Seeded ${STARTER_KEYWORDS.length} risk keywords`);
  } else {
    console.log('Risk keywords already present, skipping');
  }

  const resourceCount = await ResourceItem.countDocuments();
  if (resourceCount === 0) {
    await ResourceItem.insertMany(STARTER_RESOURCES);
    console.log(`Seeded ${STARTER_RESOURCES.length} resources`);
  } else {
    console.log('Resources already present, skipping');
  }

  const admin = await User.findOne({ email: 'admin@moodplatform.test' });
  if (!admin) {
    await User.create({
      name: 'Platform Admin',
      email: 'admin@moodplatform.test',
      password_hash: await bcrypt.hash('AdminPass123!', 10),
      role: 'admin',
      privacy_acknowledged: true,
    });
    console.log('Seeded admin user: admin@moodplatform.test / AdminPass123!');
  } else {
    console.log('Admin user already present, skipping');
  }

  const counsellor = await User.findOne({ email: 'counsellor@moodplatform.test' });
  if (!counsellor) {
    await User.create({
      name: 'Demo Counsellor',
      email: 'counsellor@moodplatform.test',
      password_hash: await bcrypt.hash('CounsellorPass123!', 10),
      role: 'counsellor',
      privacy_acknowledged: true,
    });
    console.log('Seeded counsellor user: counsellor@moodplatform.test / CounsellorPass123!');
  } else {
    console.log('Counsellor user already present, skipping');
  }

  await mongoose.disconnect();
  console.log('Seeding complete.');
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
