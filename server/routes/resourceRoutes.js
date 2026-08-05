const express = require('express');
const {
  listResources,
  getRecommendations,
  adminList,
  adminCreate,
  adminUpdate,
  adminDelete,
} = require('../controllers/resourceController');
const { protect, roleCheck } = require('../middlewares/auth');

const router = express.Router();

router.get('/', listResources);
router.get('/recommendations', protect, getRecommendations);

router.use('/admin', protect, roleCheck('admin'));
router.get('/admin', adminList);
router.post('/admin', adminCreate);
router.put('/admin/:id', adminUpdate);
router.delete('/admin/:id', adminDelete);

module.exports = router;
