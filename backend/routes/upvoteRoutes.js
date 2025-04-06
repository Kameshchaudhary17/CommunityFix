const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const upvoteController = require('../controllers/upvoteController');


router.post('/:id', authMiddleware.authenticateUser, upvoteController.upvoteReport);
router.get('/:id', authMiddleware.authenticateUser, upvoteController.getUpvoteCount)

module.exports = router;