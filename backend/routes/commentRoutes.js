const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const commentController = require('../controllers/commentController');

router.post('/:id/comments', authMiddleware.authenticateUser, commentController.addComment);

router.get('/:id/comments', authMiddleware.authenticateUser, commentController.getComments);

router.delete('/:id/comments/:commentId', authMiddleware.authenticateUser, commentController.deleteComment);

module.exports= router;