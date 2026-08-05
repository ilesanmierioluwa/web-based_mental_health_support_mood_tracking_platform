const express = require('express');
const { getMyAlerts, markRead } = require('../controllers/alertController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.get('/', protect, getMyAlerts);
router.post('/:id/read', protect, markRead);

module.exports = router;
