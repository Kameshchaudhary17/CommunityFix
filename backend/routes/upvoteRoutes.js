const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const upvoteController = require('../controllers/upvoteController');


router.post('/:id/upvote', authMiddleware.authenticateUser, upvoteController.upvoteReport);

module.exports = router;