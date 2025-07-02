const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const { adminOnly, rateLimiter } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /messages:
 *   post:
 *     summary: Send a message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               recipient:
 *                 type: string
 *               group:
 *                 type: string
 *               content:
 *                 type: string
 *               attachment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message sent
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
// Send message
router.post('/', authMiddleware, rateLimiter, messageController.sendMessage);

/**
 * @swagger
 * /messages:
 *   get:
 *     summary: Get messages (direct or group)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: User ID for direct chat
 *       - in: query
 *         name: groupId
 *         schema:
 *           type: string
 *         description: Group ID for group chat
 *     responses:
 *       200:
 *         description: List of messages
 *       401:
 *         description: Unauthorized
 */
// Get messages (direct or group)
router.get('/', authMiddleware, messageController.getMessages);

/**
 * @swagger
 * /messages/read:
 *   patch:
 *     summary: Mark message as read
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               messageId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message marked as read
 *       401:
 *         description: Unauthorized
 */
// Mark message as read
router.patch('/read', authMiddleware, messageController.markAsRead);

/**
 * @swagger
 * /messages/attachments:
 *   post:
 *     summary: Upload message attachment
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               attachment:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Attachment uploaded
 *       400:
 *         description: No file uploaded
 *       401:
 *         description: Unauthorized
 */
// Upload attachment
router.post('/attachments', authMiddleware, upload.single('attachment'), messageController.uploadAttachment);

/**
 * @swagger
 * /messages/history:
 *   get:
 *     summary: Fetch chat history for a user or group
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: User ID for direct chat
 *       - in: query
 *         name: groupId
 *         schema:
 *           type: string
 *         description: Group ID for group chat
 *     responses:
 *       200:
 *         description: List of messages
 *       401:
 *         description: Unauthorized
 */
// Fetch chat history
router.get('/history', authMiddleware, messageController.getChatHistory);

/**
 * @swagger
 * /messages/edit:
 *   patch:
 *     summary: Edit a message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               messageId:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message edited
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
// Edit message
router.patch('/edit', authMiddleware, rateLimiter, messageController.editMessage);

/**
 * @swagger
 * /messages/delete:
 *   patch:
 *     summary: Delete a message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               messageId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message deleted
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
// Delete message
router.patch('/delete', authMiddleware, rateLimiter, messageController.deleteMessage);

/**
 * @swagger
 * /messages/search:
 *   get:
 *     summary: Search messages by content
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: Search query
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: User ID for direct chat
 *       - in: query
 *         name: groupId
 *         schema:
 *           type: string
 *         description: Group ID for group chat
 *     responses:
 *       200:
 *         description: List of messages
 *       400:
 *         description: Query too short
 *       401:
 *         description: Unauthorized
 */
// Search messages
router.get('/search', authMiddleware, rateLimiter, messageController.searchMessages);

// Admin: list all messages
router.get('/admin/all', authMiddleware, adminOnly, messageController.adminListMessages);

// Admin: delete message
router.delete('/admin/delete', authMiddleware, adminOnly, messageController.adminDeleteMessage);

// Admin: export chat history
router.get('/admin/export', authMiddleware, adminOnly, messageController.exportChatHistory);

// Star a message
router.post('/star', authMiddleware, messageController.starMessage);

// Unstar a message
router.post('/unstar', authMiddleware, messageController.unstarMessage);

// Pin a message (group-wide, admin only)
router.post('/pin', authMiddleware, messageController.pinMessage);

// Unpin a message (group-wide, admin only)
router.post('/unpin', authMiddleware, messageController.unpinMessage);

// Add a reaction to a message
router.post('/react', authMiddleware, messageController.addReaction);

// Remove a reaction from a message
router.post('/unreact', authMiddleware, messageController.removeReaction);

// Forward a message
router.post('/forward', authMiddleware, messageController.forwardMessage);

module.exports = router; 