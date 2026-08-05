const express = require('express');
const { requestContact } = require('../controllers/supportController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.post('/request', protect, requestContact);

module.exports = router;
