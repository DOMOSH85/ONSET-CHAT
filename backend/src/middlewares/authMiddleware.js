const jwt = require('jsonwebtoken');
const User = require('../models/User');
const rateLimit = require('express-rate-limit');

module.exports = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, token missing.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, user not found.' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized, token invalid.' });
  }
};

// Admin-only middleware
module.exports.adminOnly = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: 'Admin access required.' });
  }
  next();
};

// Per-user/IP rate limiter
module.exports.rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each user/IP to 100 requests per windowMs
  keyGenerator: (req) => req.user ? req.user.id : req.ip,
  standardHeaders: true,
  legacyHeaders: false,
}); 