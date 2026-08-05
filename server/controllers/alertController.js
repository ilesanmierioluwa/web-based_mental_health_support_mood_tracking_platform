const InAppAlert = require('../models/InAppAlert');

// @route  GET /api/alerts  (own alerts)
const getMyAlerts = async (req, res) => {
  try {
    const alerts = await InAppAlert.find({ user_id: req.user._id })
      .sort({ created_at: -1 })
      .lean();
    res.json({ success: true, alerts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route  POST /api/alerts/:id/read
const markRead = async (req, res) => {
  try {
    const alert = await InAppAlert.findById(req.params.id);
    if (!alert) return res.status(404).json({ success: false, error: 'Alert not found' });
    if (alert.user_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    alert.read = true;
    await alert.save();
    res.json({ success: true, alert });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { getMyAlerts, markRead };
