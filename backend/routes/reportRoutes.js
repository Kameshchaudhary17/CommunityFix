const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware')
const reportController = require('../controllers/reportController')


router.post('/createReport', authMiddleware.authenticateUser, reportController.createReport)
router.get('/getReport', authMiddleware.authenticateUser, reportController.getAllReports)
router.get('/getReportById/:reportId', authMiddleware.authenticateUser, reportController.getReportById)


module.exports = router;