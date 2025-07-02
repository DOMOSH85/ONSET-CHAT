const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  avatar: {
    type: String,
    default: '',
  },
  pinnedMessages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
  }],
  description: {
    type: String,
    default: '',
  },
  settings: {
    mute: {
      type: [mongoose.Schema.Types.ObjectId], // user IDs
      ref: 'User',
      default: [],
    },
  },
  joinRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  invites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  announcementChannel: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
  }],
  roles: {
    type: Map,
    of: String, // e.g., { userId: 'admin' | 'member' }
    default: {},
  },
}, { timestamps: true });

module.exports = mongoose.model('Group', groupSchema); 