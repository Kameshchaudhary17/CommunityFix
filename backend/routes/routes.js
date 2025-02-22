const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes')
const reportRoutes = require('./reportRoutes')

router.use('/auth', authRoutes)
router.use('/report', reportRoutes)

module.exports = router;