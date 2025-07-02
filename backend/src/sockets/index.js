const Message = require('../models/Message');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

module.exports = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = await User.findById(decoded.id);
      if (!socket.user) return next(new Error('Authentication error'));
      await User.findByIdAndUpdate(socket.user._id, { online: true });
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    // Notify others user is online
    socket.broadcast.emit('user:online', { userId: socket.user._id });

    // Join user room
    socket.join(socket.user._id.toString());

    // Send message
    socket.on('message:send', async (data) => {
      const { recipient, group, content, attachment } = data;
      if (!content || (!recipient && !group)) return;
      const message = await Message.create({
        sender: socket.user._id,
        recipient,
        group,
        content,
        attachment,
      });
      // Emit to recipient or group
      if (recipient) {
        io.to(recipient).emit('message:receive', message);
      } else if (group) {
        io.to(group).emit('message:receive', message);
      }
    });

    // Typing indicator
    socket.on('typing', (data) => {
      const { recipient, group } = data;
      if (recipient) {
        io.to(recipient).emit('typing', { from: socket.user._id });
      } else if (group) {
        io.to(group).emit('typing', { from: socket.user._id });
      }
    });

    // Mark message as read
    socket.on('message:read', (data) => {
      const { messageId, recipient, group } = data;
      if (recipient) {
        io.to(recipient).emit('message:read', { messageId, by: socket.user._id });
      } else if (group) {
        io.to(group).emit('message:read', { messageId, by: socket.user._id });
      }
    });

    // Real-time voice/video call signaling
    socket.on('call:initiate', (data) => {
      const { recipient, signalData } = data;
      io.to(recipient).emit('call:incoming', { from: socket.user._id, signalData });
    });

    socket.on('call:signal', (data) => {
      const { recipient, signalData } = data;
      io.to(recipient).emit('call:signal', { from: socket.user._id, signalData });
    });

    socket.on('call:end', (data) => {
      const { recipient } = data;
      io.to(recipient).emit('call:end', { from: socket.user._id });
    });

    // Edit message
    socket.on('message:edit', async (data) => {
      const { messageId, content, recipient, group } = data;
      if (!messageId || !content) return;
      const message = await Message.findById(messageId);
      if (!message || !message.sender.equals(socket.user._id) || message.deleted) return;
      message.content = content;
      message.edited = true;
      await message.save();
      if (recipient) {
        io.to(recipient).emit('message:edit', message);
      } else if (group) {
        io.to(group).emit('message:edit', message);
      }
    });

    // Delete message
    socket.on('message:delete', async (data) => {
      const { messageId, recipient, group } = data;
      if (!messageId) return;
      const message = await Message.findById(messageId);
      if (!message || !message.sender.equals(socket.user._id)) return;
      message.deleted = true;
      await message.save();
      if (recipient) {
        io.to(recipient).emit('message:delete', { messageId });
      } else if (group) {
        io.to(group).emit('message:delete', { messageId });
      }
    });

    // Disconnect
    socket.on('disconnect', async () => {
      await User.findByIdAndUpdate(socket.user._id, { online: false });
      socket.broadcast.emit('user:offline', { userId: socket.user._id });
    });
  });
}; 