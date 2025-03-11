const express = require('express');
const router = express.Router();


const {multer, storage } =  require('../middleware/fileMiddleware.js');

const authMiddleware = require('../middleware/authMiddleware')
const reportController = require('../controllers/reportController')


const upload = multer({storage : storage})


router.post('/createReport',upload.single('photo'), authMiddleware.authenticateUser, reportController.createReport)
router.get('/getReport', authMiddleware.authenticateUser, reportController.getAllReports)
router.get('/getReportById/:reportId', authMiddleware.authenticateUser, reportController.getReportById)


module.exports = router;