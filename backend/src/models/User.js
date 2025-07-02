const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false,
  },
  avatar: {
    type: String,
    default: '',
  },
  online: {
    type: Boolean,
    default: false,
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  blocked: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  isAdmin: {
    type: Boolean,
    default: false,
  },
  webhooks: [{
    type: String,
  }],
  starredMessages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
  }],
  lastSeen: {
    type: Date,
    default: null,
  },
  bio: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    default: '',
  },
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  friendRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.correctPassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Add method to set password reset token
userSchema.methods.setPasswordResetToken = function(token, expires) {
  this.resetPasswordToken = token;
  this.resetPasswordExpires = expires;
};

// Add method to clear password reset token
userSchema.methods.clearPasswordResetToken = function() {
  this.resetPasswordToken = undefined;
  this.resetPasswordExpires = undefined;
};

module.exports = mongoose.model('User', userSchema); 