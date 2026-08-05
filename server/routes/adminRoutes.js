const express = require('express');
const {
  listUsers,
  createUser,
  updateUser,
  listKeywords,
  createKeyword,
  updateKeyword,
  deleteKeyword,
  keywordHistory,
  listAuditLogs,
} = require('../controllers/adminController');
const { protect, roleCheck } = require('../middlewares/auth');

const router = express.Router();

router.use(protect, roleCheck('admin'));

router.get('/users', listUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);

router.get('/keywords', listKeywords);
router.post('/keywords', createKeyword);
router.put('/keywords/:id', updateKeyword);
router.delete('/keywords/:id', deleteKeyword);
router.get('/keywords/history', keywordHistory);

router.get('/audit-logs', listAuditLogs);

module.exports = router;
