const Group = require('../models/Group');
const User = require('../models/User');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 60 });

exports.createGroup = async (req, res) => {
  try {
    const { name, members, avatar } = req.body;
    if (!name || !members || !Array.isArray(members) || members.length < 2) {
      return res.status(400).json({ message: 'Group name and at least 2 members required.' });
    }
    const allMembers = [...new Set([...members, req.user._id.toString()])];
    const roles = {};
    allMembers.forEach(id => { roles[id] = id === req.user._id.toString() ? 'admin' : 'member'; });
    const group = await Group.create({
      name,
      members: allMembers,
      admins: [req.user._id],
      avatar,
      roles,
    });
    res.status(201).json({ group });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getGroups = async (req, res) => {
  try {
    const cacheKey = `groups:${req.user.id}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.status(200).json({ groups: cached });
    const groups = await Group.find({ members: req.user._id });
    cache.set(cacheKey, groups);
    res.status(200).json({ groups });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id).populate('members', 'username avatar');
    if (!group) return res.status(404).json({ message: 'Group not found.' });
    res.status(200).json({ group });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.addMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const group = await Group.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { members: userId } },
      { new: true }
    );
    res.status(200).json({ group });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const group = await Group.findByIdAndUpdate(
      req.params.id,
      { $pull: { members: userId } },
      { new: true }
    );
    res.status(200).json({ group });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateGroup = async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const group = await Group.findByIdAndUpdate(
      req.params.id,
      { $set: { name, avatar } },
      { new: true }
    );
    res.status(200).json({ group });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    await Group.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Promote member to admin
exports.promoteMember = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found.' });
    if (group.roles.get(req.user._id.toString()) !== 'admin') return res.status(403).json({ message: 'Not authorized.' });
    const { userId } = req.body;
    if (!group.members.includes(userId)) return res.status(400).json({ message: 'User not in group.' });
    group.roles.set(userId, 'admin');
    if (!group.admins.includes(userId)) group.admins.push(userId);
    await group.save();
    res.status(200).json({ group });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Demote admin to member
exports.demoteMember = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found.' });
    if (group.roles.get(req.user._id.toString()) !== 'admin') return res.status(403).json({ message: 'Not authorized.' });
    const { userId } = req.body;
    if (!group.members.includes(userId)) return res.status(400).json({ message: 'User not in group.' });
    if (userId === req.user._id.toString()) return res.status(400).json({ message: 'Cannot demote self.' });
    group.roles.set(userId, 'member');
    group.admins = group.admins.filter(id => id.toString() !== userId);
    await group.save();
    res.status(200).json({ group });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// List all groups (admin only)
exports.adminListGroups = async (req, res) => {
  try {
    const groups = await Group.find();
    res.status(200).json({ groups });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update group (admin only)
exports.adminUpdateGroup = async (req, res) => {
  try {
    const { groupId, ...update } = req.body;
    const group = await Group.findByIdAndUpdate(groupId, update, { new: true });
    if (!group) return res.status(404).json({ message: 'Group not found.' });
    res.status(200).json({ group });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete group (admin only)
exports.adminDeleteGroup = async (req, res) => {
  try {
    const { groupId } = req.body;
    const group = await Group.findByIdAndDelete(groupId);
    if (!group) return res.status(404).json({ message: 'Group not found.' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Request to join a group
exports.requestJoin = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found.' });
    if (!group.joinRequests.includes(req.user._id)) group.joinRequests.push(req.user._id);
    await group.save();
    res.status(200).json({ joinRequests: group.joinRequests });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Approve join request (admin only)
exports.approveJoin = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found.' });
    if (group.roles.get(req.user._id.toString()) !== 'admin') return res.status(403).json({ message: 'Admin only.' });
    const { userId } = req.body;
    if (!group.joinRequests.includes(userId)) return res.status(400).json({ message: 'No such join request.' });
    group.members.push(userId);
    group.joinRequests = group.joinRequests.filter(id => id.toString() !== userId);
    await group.save();
    res.status(200).json({ members: group.members });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Invite user to group (admin only)
exports.inviteUser = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found.' });
    if (group.roles.get(req.user._id.toString()) !== 'admin') return res.status(403).json({ message: 'Admin only.' });
    const { userId } = req.body;
    if (!group.invites.includes(userId)) group.invites.push(userId);
    await group.save();
    res.status(200).json({ invites: group.invites });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Accept group invite
exports.acceptInvite = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found.' });
    if (!group.invites.includes(req.user._id)) return res.status(400).json({ message: 'No invite found.' });
    group.members.push(req.user._id);
    group.invites = group.invites.filter(id => id.toString() !== req.user._id.toString());
    await group.save();
    res.status(200).json({ members: group.members });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update group description/settings (admin only)
exports.updateDescription = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found.' });
    if (group.roles.get(req.user._id.toString()) !== 'admin') return res.status(403).json({ message: 'Admin only.' });
    const { description } = req.body;
    group.description = description;
    await group.save();
    res.status(200).json({ description: group.description });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateMute = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found.' });
    const { mute } = req.body;
    if (mute) {
      if (!group.settings.mute.includes(req.user._id)) group.settings.mute.push(req.user._id);
    } else {
      group.settings.mute = group.settings.mute.filter(id => id.toString() !== req.user._id.toString());
    }
    await group.save();
    res.status(200).json({ mute: group.settings.mute });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Post announcement (admin only)
exports.postAnnouncement = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found.' });
    if (group.roles.get(req.user._id.toString()) !== 'admin') return res.status(403).json({ message: 'Admin only.' });
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Content required.' });
    const message = await Message.create({
      sender: req.user._id,
      group: group._id,
      content,
    });
    group.announcementChannel.push(message._id);
    await group.save();
    res.status(201).json({ announcement: message });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}; 