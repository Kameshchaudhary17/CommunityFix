const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes')
const reportRoutes = require('./reportRoutes')
const suggestionRoutes = require('./suggestionRoutes')
const commentRoutes = require('./commentRoutes')
const upvoteRoutes = require('./upvoteRoutes')
const dashboadRoutes = require('./dashboardRoutes')
const notificationRoutes = require("./notificationRoutes")

router.use('/auth', authRoutes)
router.use('/report', reportRoutes)
router.use('/suggestion', suggestionRoutes)
router.use('/comment', commentRoutes)
router.use('/upvote', upvoteRoutes)
router.use('/dashboard', dashboadRoutes)
router.use('/notification', notificationRoutes)

module.exports = router;