const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const { adminOnly } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get current user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         description: Unauthorized
 */
// Get profile
router.get('/me', authMiddleware, userController.getProfile);

/**
 * @swagger
 * /users/me:
 *   patch:
 *     summary: Update current user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               avatar:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated user profile
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
// Update profile
router.patch('/me', authMiddleware, userController.updateProfile);

/**
 * @swagger
 * /users/me/status:
 *   patch:
 *     summary: Set current user's online status
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               online:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Updated online status
 *       401:
 *         description: Unauthorized
 */
// Set online status
router.patch('/me/status', authMiddleware, userController.setOnlineStatus);

/**
 * @swagger
 * /users/me/avatar:
 *   patch:
 *     summary: Upload or update user avatar
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Updated user avatar
 *       400:
 *         description: No file uploaded
 *       401:
 *         description: Unauthorized
 */
// Upload avatar
router.patch('/me/avatar', authMiddleware, upload.single('avatar'), userController.uploadAvatar);

/**
 * @swagger
 * /users/search:
 *   get:
 *     summary: Search users by username or email
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: Search query
 *     responses:
 *       200:
 *         description: List of users
 *       400:
 *         description: Query too short
 *       401:
 *         description: Unauthorized
 */
// Search users
router.get('/search', authMiddleware, userController.searchUsers);

/**
 * @swagger
 * /users/block:
 *   post:
 *     summary: Block a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: User blocked
 *       400:
 *         description: Invalid user ID
 *       401:
 *         description: Unauthorized
 */
// Block user
router.post('/block', authMiddleware, userController.blockUser);

/**
 * @swagger
 * /users/unblock:
 *   post:
 *     summary: Unblock a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: User unblocked
 *       400:
 *         description: Invalid user ID
 *       401:
 *         description: Unauthorized
 */
// Unblock user
router.post('/unblock', authMiddleware, userController.unblockUser);

// Admin: list all users
router.get('/admin/all', authMiddleware, adminOnly, userController.listUsers);
// Admin: update user
router.patch('/admin/update', authMiddleware, adminOnly, userController.adminUpdateUser);
// Admin: delete user
router.delete('/admin/delete', authMiddleware, adminOnly, userController.adminDeleteUser);
// Admin: add webhook
router.post('/admin/webhook/add', authMiddleware, adminOnly, userController.addWebhook);
// Admin: remove webhook
router.post('/admin/webhook/remove', authMiddleware, adminOnly, userController.removeWebhook);

// Apply updateLastSeen middleware to all authenticated routes
router.use(authMiddleware, userController.updateLastSeen);

// Update bio/status
router.patch('/profile-info', authMiddleware, userController.updateProfileInfo);

// Send friend request
router.post('/friend-request', authMiddleware, userController.sendFriendRequest);

// Accept friend request
router.post('/friend-request/accept', authMiddleware, userController.acceptFriendRequest);

// Decline friend request
router.post('/friend-request/decline', authMiddleware, userController.declineFriendRequest);

// Report user
router.post('/report', authMiddleware, userController.reportUser);

module.exports = router; 