const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const authMiddleware = require('../middlewares/authMiddleware');
const { adminOnly } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /groups:
 *   post:
 *     summary: Create a new group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               members:
 *                 type: array
 *                 items:
 *                   type: string
 *               avatar:
 *                 type: string
 *     responses:
 *       201:
 *         description: Group created
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
// Create group
router.post('/', authMiddleware, groupController.createGroup);

/**
 * @swagger
 * /groups:
 *   get:
 *     summary: Get all groups for user
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of groups
 *       401:
 *         description: Unauthorized
 */
// Get all groups for user
router.get('/', authMiddleware, groupController.getGroups);

/**
 * @swagger
 * /groups/{id}:
 *   get:
 *     summary: Get a single group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Group details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Group not found
 */
// Get single group
router.get('/:id', authMiddleware, groupController.getGroup);

/**
 * @swagger
 * /groups/{id}/add:
 *   post:
 *     summary: Add a member to a group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
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
 *         description: Member added
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Group not found
 */
// Add member
router.post('/:id/add', authMiddleware, groupController.addMember);

/**
 * @swagger
 * /groups/{id}/remove:
 *   post:
 *     summary: Remove a member from a group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
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
 *         description: Member removed
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Group not found
 */
// Remove member
router.post('/:id/remove', authMiddleware, groupController.removeMember);

/**
 * @swagger
 * /groups/{id}:
 *   patch:
 *     summary: Update group (name/avatar)
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               avatar:
 *                 type: string
 *     responses:
 *       200:
 *         description: Group updated
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Group not found
 */
// Update group (name/avatar)
router.patch('/:id', authMiddleware, groupController.updateGroup);

/**
 * @swagger
 * /groups/{id}:
 *   delete:
 *     summary: Delete a group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     responses:
 *       204:
 *         description: Group deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Group not found
 */
// Delete group
router.delete('/:id', authMiddleware, groupController.deleteGroup);

/**
 * @swagger
 * /groups/{id}/promote:
 *   post:
 *     summary: Promote a member to admin
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
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
 *         description: Member promoted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Group not found
 */
// Promote member to admin
router.post('/:id/promote', authMiddleware, groupController.promoteMember);

/**
 * @swagger
 * /groups/{id}/demote:
 *   post:
 *     summary: Demote an admin to member
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
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
 *         description: Member demoted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Group not found
 */
// Demote admin to member
router.post('/:id/demote', authMiddleware, groupController.demoteMember);

/**
 * @swagger
 * /groups/admin/all:
 *   get:
 *     summary: List all groups
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of groups
 *       401:
 *         description: Unauthorized
 */
// Admin: list all groups
router.get('/admin/all', authMiddleware, adminOnly, groupController.adminListGroups);

/**
 * @swagger
 * /groups/admin/update:
 *   patch:
 *     summary: Update a group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               name:
 *                 type: string
 *               avatar:
 *                 type: string
 *     responses:
 *       200:
 *         description: Group updated
 *       401:
 *         description: Unauthorized
 */
// Admin: update group
router.patch('/admin/update', authMiddleware, adminOnly, groupController.adminUpdateGroup);

/**
 * @swagger
 * /groups/admin/delete:
 *   delete:
 *     summary: Delete a group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *     responses:
 *       204:
 *         description: Group deleted
 *       401:
 *         description: Unauthorized
 */
// Admin: delete group
router.delete('/admin/delete', authMiddleware, adminOnly, groupController.adminDeleteGroup);

/**
 * @swagger
 * /groups/{id}/join-request:
 *   post:
 *     summary: Request to join a group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Join request sent
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Group not found
 */
// Request to join a group
router.post('/:id/join-request', authMiddleware, groupController.requestJoin);

/**
 * @swagger
 * /groups/{id}/approve-join:
 *   post:
 *     summary: Approve join request (admin only)
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
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
 *         description: Join request approved
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Group not found
 */
// Approve join request (admin only)
router.post('/:id/approve-join', authMiddleware, groupController.approveJoin);

/**
 * @swagger
 * /groups/{id}/invite:
 *   post:
 *     summary: Invite user to group (admin only)
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
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
 *         description: User invited
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Group not found
 */
// Invite user to group (admin only)
router.post('/:id/invite', authMiddleware, groupController.inviteUser);

/**
 * @swagger
 * /groups/{id}/accept-invite:
 *   post:
 *     summary: Accept group invite
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     responses:
 *       200:
 *         description: Group invite accepted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Group not found
 */
// Accept group invite
router.post('/:id/accept-invite', authMiddleware, groupController.acceptInvite);

/**
 * @swagger
 * /groups/{id}/description:
 *   patch:
 *     summary: Update group description (admin only)
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Group description updated
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Group not found
 */
// Update group description (admin only)
router.patch('/:id/description', authMiddleware, groupController.updateDescription);

/**
 * @swagger
 * /groups/{id}/mute:
 *   patch:
 *     summary: Mute/unmute group
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mute:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Group mute status updated
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Group not found
 */
// Mute/unmute group
router.patch('/:id/mute', authMiddleware, groupController.updateMute);

/**
 * @swagger
 * /groups/{id}/announcement:
 *   post:
 *     summary: Post announcement (admin only)
 *     tags: [Groups]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Group ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               announcement:
 *                 type: string
 *     responses:
 *       200:
 *         description: Announcement posted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Group not found
 */
// Post announcement (admin only)
router.post('/:id/announcement', authMiddleware, groupController.postAnnouncement);

module.exports = router; 