const Message = require('../models/Message');
const Group = require('../models/Group');
const User = require('../models/User');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const Filter = require('bad-words');
const fetch = require('node-fetch');

const filter = new Filter();

// In-memory spam tracker
const lastMessages = new Map();

exports.sendMessage = async (req, res) => {
  try {
    const { recipient, group, content, attachment, parentMessage } = req.body;
    if (!content || (!recipient && !group)) {
      return res.status(400).json({ message: 'Content and recipient or group required.' });
    }
    if (recipient) {
      const sender = await User.findById(req.user._id);
      const target = await User.findById(recipient);
      if (!target) return res.status(404).json({ message: 'Recipient not found.' });
      if (sender.blocked.includes(recipient) || target.blocked.includes(req.user._id)) {
        return res.status(403).json({ message: 'You cannot message this user.' });
      }
    }
    // Profanity filter
    if (filter.isProfane(content)) {
      return res.status(400).json({ message: 'Message contains inappropriate language.' });
    }
    // Basic spam detection: block repeated messages within 10 seconds
    const key = `${req.user._id}:${recipient || group}`;
    const now = Date.now();
    if (lastMessages.has(key)) {
      const { lastContent, lastTime } = lastMessages.get(key);
      if (lastContent === content && now - lastTime < 10000) {
        return res.status(429).json({ message: 'Please do not send repeated messages.' });
      }
    }
    lastMessages.set(key, { lastContent: content, lastTime: now });
    const message = await Message.create({
      sender: req.user._id,
      recipient,
      group,
      content,
      attachment,
      parentMessage: parentMessage || null,
    });
    // Webhook: POST to all admin webhooks
    const admins = await User.find({ isAdmin: true });
    const webhooks = admins.flatMap(a => a.webhooks || []);
    if (webhooks.length > 0) {
      const payload = {
        message,
        event: 'message:send',
        timestamp: new Date().toISOString(),
      };
      webhooks.forEach(url => {
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch(() => {});
      });
    }
    res.status(201).json({ message });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { userId, groupId, limit = 20, page = 1 } = req.query;
    let filter = {};
    if (userId) {
      const user = await User.findById(req.user._id);
      if (user.blocked.includes(userId)) return res.status(403).json({ message: 'User is blocked.' });
      filter = {
        $or: [
          { sender: req.user._id, recipient: userId },
          { sender: userId, recipient: req.user._id },
        ],
      };
    } else if (groupId) {
      filter = { group: groupId };
    }
    const blockedBy = (await User.find({ blocked: req.user._id })).map(u => u._id);
    filter.sender = { $nin: blockedBy };
    const messages = await Message.find(filter)
      .sort({ createdAt: 1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate('sender', 'username avatar')
      .populate('recipient', 'username avatar')
      .populate('group', 'name avatar')
      .populate('parentMessage');
    res.status(200).json({ messages });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { messageId } = req.body;
    const message = await Message.findByIdAndUpdate(
      messageId,
      { read: true },
      { new: true }
    );
    res.status(200).json({ message });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.uploadAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    let thumbnailUrl = null;
    const ext = path.extname(req.file.filename).toLowerCase();
    const uploadDir = path.join(__dirname, '../../uploads');
    const thumbDir = path.join(uploadDir, 'thumbnails');
    if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir);
    // Image thumbnail
    if ([".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)) {
      const thumbPath = path.join(thumbDir, `thumb_${req.file.filename}.jpg`);
      await sharp(req.file.path)
        .resize(128, 128, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toFile(thumbPath);
      thumbnailUrl = `/uploads/thumbnails/thumb_${req.file.filename}.jpg`;
    }
    // Video thumbnail
    if ([".mp4", ".mov", ".avi", ".webm", ".mkv"].includes(ext)) {
      const thumbPath = path.join(thumbDir, `thumb_${req.file.filename}.jpg`);
      await new Promise((resolve, reject) => {
        ffmpeg(req.file.path)
          .on('end', resolve)
          .on('error', reject)
          .screenshots({
            count: 1,
            folder: thumbDir,
            filename: `thumb_${req.file.filename}.jpg`,
            size: '128x128',
          });
      });
      thumbnailUrl = `/uploads/thumbnails/thumb_${req.file.filename}.jpg`;
    }
    res.status(200).json({ url: fileUrl, thumbnail: thumbnailUrl });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Fetch chat history for a user or group
exports.getChatHistory = async (req, res) => {
  try {
    const { userId, groupId, limit = 20, page = 1 } = req.query;
    let filter = {};
    if (userId) {
      const user = await User.findById(req.user._id);
      if (user.blocked.includes(userId)) return res.status(403).json({ message: 'User is blocked.' });
      filter = {
        $or: [
          { sender: req.user._id, recipient: userId },
          { sender: userId, recipient: req.user._id },
        ],
      };
    } else if (groupId) {
      filter = { group: groupId };
    }
    const blockedBy = (await User.find({ blocked: req.user._id })).map(u => u._id);
    filter.sender = { $nin: blockedBy };
    const messages = await Message.find(filter)
      .sort({ createdAt: 1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate('sender', 'username avatar')
      .populate('recipient', 'username avatar')
      .populate('group', 'name avatar')
      .populate('parentMessage');
    res.status(200).json({ messages });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Placeholder for video/audio processing (e.g., transcoding, thumbnail generation)
// const ffmpeg = require('fluent-ffmpeg');
// Example usage:
// ffmpeg('input.mp4').output('output.mp4').run();
// Add processing logic here if needed for uploaded media files.

// Edit a message
exports.editMessage = async (req, res) => {
  try {
    const { messageId, content } = req.body;
    if (!messageId || !content) return res.status(400).json({ message: 'Message ID and new content are required.' });
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Message not found.' });
    if (!message.sender.equals(req.user._id)) return res.status(403).json({ message: 'Not authorized.' });
    if (message.deleted) return res.status(400).json({ message: 'Cannot edit a deleted message.' });
    message.content = content;
    message.edited = true;
    await message.save();
    res.status(200).json({ message });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete a message (soft delete)
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.body;
    if (!messageId) return res.status(400).json({ message: 'Message ID is required.' });
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Message not found.' });
    if (!message.sender.equals(req.user._id)) return res.status(403).json({ message: 'Not authorized.' });
    message.deleted = true;
    await message.save();
    res.status(200).json({ message });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Search messages by content (partial, case-insensitive)
exports.searchMessages = async (req, res) => {
  try {
    const { q, userId, groupId, limit = 20, page = 1 } = req.query;
    if (!q || q.length < 2) return res.status(400).json({ message: 'Query too short.' });
    const regex = new RegExp(q, 'i');
    let filter = { content: regex, deleted: { $ne: true } };
    if (userId) {
      const user = await User.findById(req.user._id);
      if (user.blocked.includes(userId)) return res.status(403).json({ message: 'User is blocked.' });
      filter.$or = [
        { sender: req.user._id, recipient: userId },
        { sender: userId, recipient: req.user._id },
      ];
    } else if (groupId) {
      filter.group = groupId;
    } else {
      filter.$or = [
        { sender: req.user._id },
        { recipient: req.user._id },
        { group: { $exists: true, $ne: null } },
      ];
    }
    const blockedBy = (await User.find({ blocked: req.user._id })).map(u => u._id);
    filter.sender = { $nin: blockedBy };
    const messages = await Message.find(filter)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate('sender', 'username avatar')
      .populate('recipient', 'username avatar')
      .populate('group', 'name avatar')
      .populate('parentMessage');
    res.status(200).json({ messages });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// List all messages (admin only)
exports.adminListMessages = async (req, res) => {
  try {
    const messages = await Message.find()
      .populate('sender', 'username email')
      .populate('recipient', 'username email')
      .populate('group', 'name');
    res.status(200).json({ messages });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete message (admin only)
exports.adminDeleteMessage = async (req, res) => {
  try {
    const { messageId } = req.body;
    const message = await Message.findByIdAndDelete(messageId);
    if (!message) return res.status(404).json({ message: 'Message not found.' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Export chat history (admin only)
exports.exportChatHistory = async (req, res) => {
  try {
    const { userId, groupId } = req.query;
    let filter = {};
    if (userId) {
      filter = {
        $or: [
          { sender: userId },
          { recipient: userId },
        ],
      };
    } else if (groupId) {
      filter = { group: groupId };
    }
    const messages = await Message.find(filter)
      .sort({ createdAt: 1 })
      .populate('sender', 'username email')
      .populate('recipient', 'username email')
      .populate('group', 'name');
    res.setHeader('Content-Disposition', 'attachment; filename=chat_history.json');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(JSON.stringify(messages, null, 2));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Star a message (per user)
exports.starMessage = async (req, res) => {
  try {
    const { messageId } = req.body;
    const user = await User.findById(req.user.id);
    if (!user.starredMessages.includes(messageId)) user.starredMessages.push(messageId);
    await user.save();
    res.status(200).json({ starredMessages: user.starredMessages });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Unstar a message (per user)
exports.unstarMessage = async (req, res) => {
  try {
    const { messageId } = req.body;
    const user = await User.findById(req.user.id);
    user.starredMessages = user.starredMessages.filter(id => id.toString() !== messageId);
    await user.save();
    res.status(200).json({ starredMessages: user.starredMessages });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Pin a message (group-wide, admin only)
exports.pinMessage = async (req, res) => {
  try {
    const { groupId, messageId } = req.body;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found.' });
    if (group.roles.get(req.user._id.toString()) !== 'admin') return res.status(403).json({ message: 'Admin only.' });
    if (!group.pinnedMessages.includes(messageId)) group.pinnedMessages.push(messageId);
    await group.save();
    res.status(200).json({ pinnedMessages: group.pinnedMessages });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Unpin a message (group-wide, admin only)
exports.unpinMessage = async (req, res) => {
  try {
    const { groupId, messageId } = req.body;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found.' });
    if (group.roles.get(req.user._id.toString()) !== 'admin') return res.status(403).json({ message: 'Admin only.' });
    group.pinnedMessages = group.pinnedMessages.filter(id => id.toString() !== messageId);
    await group.save();
    res.status(200).json({ pinnedMessages: group.pinnedMessages });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Add a reaction to a message
exports.addReaction = async (req, res) => {
  try {
    const { messageId, emoji } = req.body;
    if (!emoji) return res.status(400).json({ message: 'Emoji required.' });
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Message not found.' });
    const userId = req.user._id.toString();
    const users = message.reactions.get(emoji) || [];
    if (!users.map(id => id.toString()).includes(userId)) {
      users.push(req.user._id);
      message.reactions.set(emoji, users);
      await message.save();
    }
    res.status(200).json({ reactions: message.reactions });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Remove a reaction from a message
exports.removeReaction = async (req, res) => {
  try {
    const { messageId, emoji } = req.body;
    if (!emoji) return res.status(400).json({ message: 'Emoji required.' });
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: 'Message not found.' });
    const userId = req.user._id.toString();
    let users = message.reactions.get(emoji) || [];
    users = users.filter(id => id.toString() !== userId);
    if (users.length > 0) {
      message.reactions.set(emoji, users);
    } else {
      message.reactions.delete(emoji);
    }
    await message.save();
    res.status(200).json({ reactions: message.reactions });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Forward a message to another user or group
exports.forwardMessage = async (req, res) => {
  try {
    const { messageId, recipient, group } = req.body;
    if (!messageId || (!recipient && !group)) return res.status(400).json({ message: 'Message ID and recipient or group required.' });
    const original = await Message.findById(messageId);
    if (!original) return res.status(404).json({ message: 'Original message not found.' });
    const forwarded = await Message.create({
      sender: req.user._id,
      recipient,
      group,
      content: original.content,
      attachment: original.attachment,
      parentMessage: original.parentMessage || null,
    });
    res.status(201).json({ message: forwarded });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}; 