const express = require('express');
const {
  register,
  login,
  getMe,
  setupMFA,
  enableMFA,
  disableMFA,
} = require('../controllers/authController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/mfa/setup', protect, setupMFA);
router.post('/mfa/enable', protect, enableMFA);
router.post('/mfa/disable', protect, disableMFA);

module.exports = router;
