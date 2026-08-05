const express = require('express');
const {
  listEscalations,
  getEscalation,
  updateStatus,
  getNotes,
} = require('../controllers/counsellorController');
const {
  listRequests,
  updateRequestStatus,
} = require('../controllers/supportController');
const { protect, roleCheck } = require('../middlewares/auth');

const router = express.Router();

router.use(protect, roleCheck('counsellor', 'admin'));

router.get('/escalations', listEscalations);
router.get('/escalations/:id', getEscalation);
router.post('/escalations/:id/status', updateStatus);
router.get('/escalations/:id/notes', getNotes);

router.get('/support-requests', listRequests);
router.post('/support-requests/:id/status', updateRequestStatus);

module.exports = router;
