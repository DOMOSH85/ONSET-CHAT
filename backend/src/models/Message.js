const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: false,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  attachment: {
    type: String,
    default: '',
  },
  read: {
    type: Boolean,
    default: false,
  },
  edited: {
    type: Boolean,
    default: false,
  },
  deleted: {
    type: Boolean,
    default: false,
  },
  reactions: {
    type: Map,
    of: [mongoose.Schema.Types.ObjectId], // emoji: [userId]
    default: {},
  },
  parentMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null,
  },
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema); 