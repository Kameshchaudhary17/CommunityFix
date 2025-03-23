// routes/suggestionRoutes.js
const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const suggestionController = require('../controllers/suggestionController');

// GET routes
router.get('/getSuggestion', authMiddleware.authenticateUser, suggestionController.getSuggestions);
router.get('/getusersuggestion', authMiddleware.authenticateUser, suggestionController.getUserSuggestions);
router.get('/:id/similar', authMiddleware.authenticateUser, suggestionController.getSimilarSuggestions);
router.get('/getsuggestionbyid/:id', authMiddleware.authenticateUser, suggestionController.getSuggestionById);


// POST routes
router.post('/createSuggestion', authMiddleware.authenticateUser, suggestionController.createSuggestion);
router.post('/:id/upvote', authMiddleware.authenticateUser, suggestionController.upvoteSuggestion);

// PUT routes
router.put('/:id', authMiddleware.authenticateUser, suggestionController.updateSuggestion);

// DELETE routes
router.delete('/:id', authMiddleware.authenticateUser, suggestionController.deleteSuggestion);

module.exports = router;