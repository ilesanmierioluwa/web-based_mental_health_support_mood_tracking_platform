const SupportRequest = require('../models/SupportRequest');
const User = require('../models/User');
const notificationService = require('../services/notificationService');
const { logAudit } = require('../services/auditService');

// @route  POST /api/support/request
// A user can request to be contacted by the support contact directly
// (FR7 / FR10), independent of any automatic risk detection.
const requestContact = async (req, res) => {
  try {
    const { message } = req.body;

    const request = await SupportRequest.create({
      user_id: req.user._id,
      message: (message || '').trim(),
      status: 'pending',
    });

    await logAudit({
      userId: req.user._id,
      action: 'support.requested',
      targetTable: 'support_requests',
      targetId: request._id,
      ipAddress: req.ip,
      metadata: { hasMessage: Boolean(request.message) },
    });

    const counsellorEmail = process.env.COUNSELLOR_EMAIL || '';
    let email = { success: false, error: 'no recipient provided' };
    if (counsellorEmail) {
      email = await notificationService.sendEmail(
        counsellorEmail,
        'A student has requested to be contacted',
        `A user has asked to be contacted by the support team.\n\nRequest ID: ${request._id}\nRequested at: ${request.created_at.toISOString()}\nUser message: ${request.message || '(none)'}\n\nPlease review this request in the counsellor dashboard and reach out as soon as possible.`
      );
    }

    // NFR3 fallback: the user is always acknowledged in-app, independent of
    // email delivery. The request row itself is the counsellor-side fallback.
    await notificationService.createInAppAlert(
      req.user._id,
      null,
      'Your request for support has been received. A member of the support team will reach out to you. You are not alone.'
    );

    res.status(201).json({ success: true, request, email });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route  GET /api/counsellor/support-requests
const listRequests = async (req, res) => {
  try {
    const requests = await SupportRequest.find()
      .sort({ status: 1, created_at: -1 })
      .lean();

    const userIds = [...new Set(requests.map((r) => r.user_id))];
    const users = await User.find({ _id: { $in: userIds } }).select('name email').lean();
    const userMap = new Map(users.map((u) => [String(u._id), u]));

    res.json({
      success: true,
      requests: requests.map((r) => ({
        _id: r._id,
        message: r.message,
        status: r.status,
        created_at: r.created_at,
        resolved_at: r.resolved_at,
        assigned_counsellor_id: r.assigned_counsellor_id,
        user: userMap.get(String(r.user_id)) || null,
      })),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route  POST /api/counsellor/support-requests/:id/status
const updateRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'reviewed', 'contacted', 'resolved'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }
    const request = await SupportRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, error: 'Request not found' });

    request.status = status;
    request.assigned_counsellor_id = req.user._id;
    request.resolved_at = status === 'resolved' ? new Date() : request.resolved_at;
    await request.save();

    await logAudit({
      userId: req.user._id,
      action: `support_request.${status}`,
      targetTable: 'support_requests',
      targetId: request._id,
      ipAddress: req.ip,
    });

    res.json({ success: true, request });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { requestContact, listRequests, updateRequestStatus };
