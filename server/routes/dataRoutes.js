const express = require('express');
const { exportData, deleteAccount } = require('../controllers/dataController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.get('/export', protect, exportData);
router.delete('/account', protect, deleteAccount);

module.exports = router;
