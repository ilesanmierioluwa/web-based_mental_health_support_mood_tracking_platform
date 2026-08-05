const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const User = require('../models/User');
const { logAudit } = require('../services/auditService');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// @route  POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, privacy_acknowledged } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Name, email and password are required' });
    }
    if (!privacy_acknowledged) {
      return res.status(400).json({
        success: false,
        error: 'You must acknowledge the Privacy Policy before creating an account',
      });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ success: false, error: 'An account with this email already exists' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password_hash,
      privacy_acknowledged: true,
    });

    await logAudit({
      userId: user._id,
      action: 'auth.register',
      targetTable: 'users',
      targetId: user._id,
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mfa_enabled: user.mfa_enabled,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route  POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password, mfa_token } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    if (user.mfa_enabled) {
      if (!mfa_token) {
        return res.status(200).json({ success: true, requiresMFA: true, message: 'MFA token required' });
      }
      const verified = speakeasy.totp.verify({
        secret: user.mfa_secret,
        encoding: 'base32',
        token: mfa_token,
        window: 1,
      });
      if (!verified) {
        return res.status(401).json({ success: false, error: 'Invalid MFA token' });
      }
    }

    await logAudit({
      userId: user._id,
      action: 'auth.login',
      targetTable: 'users',
      targetId: user._id,
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mfa_enabled: user.mfa_enabled,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route  GET /api/auth/me
const getMe = async (req, res) => {
  res.json({
    success: true,
    user: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      mfa_enabled: req.user.mfa_enabled,
    },
  });
};

// @route  GET /api/auth/mfa/setup  (returns a secret + QR to scan)
const setupMFA = async (req, res) => {
  try {
    const secret = speakeasy.generateSecret({ name: `MoodPlatform:${req.user.email}` });
    const otpauth_url = secret.otpauth_url;
    const dataUrl = await qrcode.toDataURL(otpauth_url);
    req.user.mfa_temp_secret = secret.base32;
    await req.user.save();
    res.json({ success: true, secret: secret.base32, qr_code: dataUrl });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route  POST /api/auth/mfa/enable  (confirm a token, then enable MFA)
const enableMFA = async (req, res) => {
  try {
    const { mfa_token } = req.body;
    if (!mfa_token) {
      return res.status(400).json({ success: false, error: 'MFA token is required' });
    }
    const verified = speakeasy.totp.verify({
      secret: req.user.mfa_temp_secret,
      encoding: 'base32',
      token: mfa_token,
      window: 1,
    });
    if (!verified) {
      return res.status(401).json({ success: false, error: 'Invalid MFA token' });
    }
    req.user.mfa_secret = req.user.mfa_temp_secret;
    req.user.mfa_temp_secret = undefined;
    req.user.mfa_enabled = true;
    await req.user.save();

    await logAudit({
      userId: req.user._id,
      action: 'auth.mfa.enabled',
      targetTable: 'users',
      targetId: req.user._id,
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'MFA enabled' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @route  POST /api/auth/mfa/disable
const disableMFA = async (req, res) => {
  try {
    const { mfa_token } = req.body;
    if (!mfa_token) {
      return res.status(400).json({ success: false, error: 'MFA token is required' });
    }
    const verified = speakeasy.totp.verify({
      secret: req.user.mfa_secret,
      encoding: 'base32',
      token: mfa_token,
      window: 1,
    });
    if (!verified) {
      return res.status(401).json({ success: false, error: 'Invalid MFA token' });
    }
    req.user.mfa_secret = null;
    req.user.mfa_enabled = false;
    await req.user.save();

    await logAudit({
      userId: req.user._id,
      action: 'auth.mfa.disabled',
      targetTable: 'users',
      targetId: req.user._id,
      ipAddress: req.ip,
    });

    res.json({ success: true, message: 'MFA disabled' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { register, login, getMe, setupMFA, enableMFA, disableMFA };
