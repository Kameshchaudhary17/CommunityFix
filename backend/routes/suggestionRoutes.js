// routes/suggestionRoutes.js
const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware')
const suggestionController = require('../controllers/suggestionController')



// GET routes
router.get('/getSuggestion',authMiddleware.authenticateUser, suggestionController.getSuggestions);
router.get('/getcomment/:id', suggestionController.getSimilarSuggestions);
router.get('/getSuggestionById/:id', suggestionController.getSuggestionById);

// POST routes
router.post('/createSuggestion',authMiddleware.authenticateUser, suggestionController.createSuggestion);
router.post('/:id/comments', authMiddleware.authenticateUser, suggestionController.addComment);
router.post('/:id/upvote', authMiddleware.authenticateUser, suggestionController.upvoteSuggestion);

// PUT routes
router.put('/suggestion/:id', suggestionController.updateSuggestion);

// DELETE routes
router.delete('/suggestion/:id', suggestionController.deleteSuggestion);

module.exports = router;