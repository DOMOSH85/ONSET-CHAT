const User = require('../models/User');
const validator = require('validator');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 60 });

// Registration and login are required before accessing user profile endpoints.
// This is enforced by authMiddleware on all user routes.

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.status(200).json({ user: { id: user._id, username: user.username, email: user.email, avatar: user.avatar, online: user.online } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { username, avatar } = req.body;
    if (username && (username.length < 3 || username.length > 30)) {
      return res.status(400).json({ message: 'Username must be 3-30 characters.' });
    }
    const update = {};
    if (username) update.username = username;
    if (avatar) update.avatar = avatar;
    const user = await User.findByIdAndUpdate(req.user.id, update, { new: true });
    res.status(200).json({ user: { id: user._id, username: user.username, email: user.email, avatar: user.avatar, online: user.online } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.setOnlineStatus = async (req, res) => {
  try {
    const { online } = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, { online }, { new: true });
    res.status(200).json({ user: { id: user._id, online: user.online } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }
    const avatarUrl = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(req.user.id, { avatar: avatarUrl }, { new: true });
    res.status(200).json({ user: { id: user._id, username: user.username, email: user.email, avatar: user.avatar, online: user.online } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Search users by username or email (partial, case-insensitive)
exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.status(400).json({ message: 'Query too short.' });
    const cacheKey = `search:${req.user.id}:${q}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.status(200).json({ users: cached });
    const regex = new RegExp(q, 'i');
    const me = await User.findById(req.user.id);
    // Exclude users who have blocked me or whom I have blocked
    const users = await User.find({
      $or: [
        { username: regex },
        { email: regex },
      ],
      _id: { $ne: req.user.id, $nin: me.blocked },
      blocked: { $ne: req.user.id },
    }).select('id username avatar online');
    cache.set(cacheKey, users);
    res.status(200).json({ users });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Block a user
exports.blockUser = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId || userId === req.user.id) return res.status(400).json({ message: 'Invalid user ID.' });
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (!user.blocked.includes(userId)) user.blocked.push(userId);
    await user.save();
    res.status(200).json({ blocked: user.blocked });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Unblock a user
exports.unblockUser = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId || userId === req.user.id) return res.status(400).json({ message: 'Invalid user ID.' });
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    user.blocked = user.blocked.filter(id => id.toString() !== userId);
    await user.save();
    res.status(200).json({ blocked: user.blocked });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// List all users (admin only)
exports.listUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({ users });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update user (admin only)
exports.adminUpdateUser = async (req, res) => {
  try {
    const { userId, ...update } = req.body;
    const user = await User.findByIdAndUpdate(userId, update, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete user (admin only)
exports.adminDeleteUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findByIdAndDelete(userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Add webhook (admin only)
exports.addWebhook = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ message: 'Webhook URL required.' });
    const user = await User.findById(req.user.id);
    if (!user.isAdmin) return res.status(403).json({ message: 'Admin only.' });
    if (!user.webhooks.includes(url)) user.webhooks.push(url);
    await user.save();
    res.status(200).json({ webhooks: user.webhooks });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Remove webhook (admin only)
exports.removeWebhook = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ message: 'Webhook URL required.' });
    const user = await User.findById(req.user.id);
    if (!user.isAdmin) return res.status(403).json({ message: 'Admin only.' });
    user.webhooks = user.webhooks.filter(u => u !== url);
    await user.save();
    res.status(200).json({ webhooks: user.webhooks });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Middleware to update lastSeen on each authenticated request
exports.updateLastSeen = async (req, res, next) => {
  if (req.user) {
    await User.findByIdAndUpdate(req.user.id, { lastSeen: new Date() });
  }
  next();
};

// Update bio/status
exports.updateProfileInfo = async (req, res) => {
  try {
    const { bio, status } = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, { bio, status }, { new: true });
    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Send friend request
exports.sendFriendRequest = async (req, res) => {
  try {
    const { userId } = req.body;
    if (userId === req.user.id) return res.status(400).json({ message: 'Cannot friend yourself.' });
    const target = await User.findById(userId);
    if (!target) return res.status(404).json({ message: 'User not found.' });
    if (!target.friendRequests.includes(req.user.id) && !target.friends.includes(req.user.id)) {
      target.friendRequests.push(req.user.id);
      await target.save();
    }
    res.status(200).json({ friendRequests: target.friendRequests });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Accept friend request
exports.acceptFriendRequest = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(req.user.id);
    if (!user.friendRequests.includes(userId)) return res.status(400).json({ message: 'No such friend request.' });
    user.friendRequests = user.friendRequests.filter(id => id.toString() !== userId);
    user.friends.push(userId);
    const other = await User.findById(userId);
    other.friends.push(req.user.id);
    await user.save();
    await other.save();
    res.status(200).json({ friends: user.friends });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Decline friend request
exports.declineFriendRequest = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(req.user.id);
    user.friendRequests = user.friendRequests.filter(id => id.toString() !== userId);
    await user.save();
    res.status(200).json({ friendRequests: user.friendRequests });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Report user
exports.reportUser = async (req, res) => {
  try {
    const { userId, reason } = req.body;
    if (!userId || !reason) return res.status(400).json({ message: 'User ID and reason required.' });
    // For demo: just log the report. In production, store in DB or notify admin.
    console.log(`User ${req.user.id} reported user ${userId}: ${reason}`);
    res.status(200).json({ message: 'Report submitted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}; 