// routes/suggestionRoutes.js
const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const suggestionController = require('../controllers/suggestionController');

// GET routes
router.get('/getSuggestion', authMiddleware.authenticateUser, suggestionController.getSuggestions);
router.get('/:id/similar', authMiddleware.authenticateUser, suggestionController.getSimilarSuggestions);
router.get('/:id', authMiddleware.authenticateUser, suggestionController.getSuggestionById);
router.get('/:id/comments', authMiddleware.authenticateUser, suggestionController.getComments);

// POST routes
router.post('/createSuggestion', authMiddleware.authenticateUser, suggestionController.createSuggestion);
router.post('/:id/comments', authMiddleware.authenticateUser, suggestionController.addComment);
router.post('/:id/upvote', authMiddleware.authenticateUser, suggestionController.upvoteSuggestion);

// PUT routes
router.put('/:id', authMiddleware.authenticateUser, suggestionController.updateSuggestion);

// DELETE routes
router.delete('/:id', authMiddleware.authenticateUser, suggestionController.deleteSuggestion);
router.delete('/:suggestionId/comments/:commentId', authMiddleware.authenticateUser, suggestionController.deleteComment);

module.exports = router;