const User = require('../models/User');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const crypto = require('crypto');
const { sendResetEmail } = require('../utils/emailUtil');

const signToken = (user) => {
  return jwt.sign(
    { id: user._id, username: user.username, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
};

// Registration and login are required before accessing chat endpoints.
// This is enforced by authMiddleware on all chat, message, and group routes.

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: 'Invalid email.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(409).json({ message: 'Username or email already in use.' });
    }
    const user = await User.create({ username, email, password });
    const token = signToken(user);
    res.status(201).json({
      user: { id: user._id, username: user.username, email: user.email, avatar: user.avatar },
      token,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.correctPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    const token = signToken(user);
    res.status(200).json({
      user: { id: user._id, username: user.username, email: user.email, avatar: user.avatar },
      token,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.status(200).json({
      user: { id: user._id, username: user.username, email: user.email, avatar: user.avatar },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Request password reset
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 1000 * 60 * 30; // 30 minutes
    user.setPasswordResetToken(token, expires);
    await user.save();
    // Send email with reset link
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    await sendResetEmail(user.email, resetUrl);
    res.status(200).json({ message: 'Password reset email sent.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: 'Token and new password are required.' });
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token.' });
    user.password = password;
    user.clearPasswordResetToken();
    await user.save();
    res.status(200).json({ message: 'Password has been reset.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}; 