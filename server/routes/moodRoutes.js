const express = require('express');
const {
  createMood,
  getMyMoods,
  getAnalytics,
  getTagCorrelation,
  getStreak,
} = require('../controllers/moodController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.post('/', protect, createMood);
router.get('/', protect, getMyMoods);
router.get('/analytics', protect, getAnalytics);
router.get('/tags', protect, getTagCorrelation);
router.get('/streak', protect, getStreak);

module.exports = router;
