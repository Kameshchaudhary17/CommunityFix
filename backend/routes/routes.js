const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes')
const reportRoutes = require('./reportRoutes')
const suggestionRoutes = require('./suggestionRoutes')

router.use('/auth', authRoutes)
router.use('/report', reportRoutes)
router.use('/suggestion', suggestionRoutes)

module.exports = router;