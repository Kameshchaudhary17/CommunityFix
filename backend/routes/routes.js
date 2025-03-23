const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes')
const reportRoutes = require('./reportRoutes')
const suggestionRoutes = require('./suggestionRoutes')
const commentRoutes = require('./commentRoutes')
const upvoteRoutes = require('./upvoteRoutes')

router.use('/auth', authRoutes)
router.use('/report', reportRoutes)
router.use('/suggestion', suggestionRoutes)
router.use('/comment', commentRoutes)
router.use('/upvote', upvoteRoutes)

module.exports = router;