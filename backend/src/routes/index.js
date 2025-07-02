const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const messageRoutes = require('./messageRoutes');
const groupRoutes = require('./groupRoutes');
const userRoutes = require('./userRoutes');

router.use('/auth', authRoutes);
router.use('/messages', messageRoutes);
router.use('/groups', groupRoutes);
router.use('/users', userRoutes);

module.exports = router; 