const express = require('express');
const { createJournal, getMyJournals } = require('../controllers/journalController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.post('/', protect, createJournal);
router.get('/', protect, getMyJournals);

module.exports = router;
