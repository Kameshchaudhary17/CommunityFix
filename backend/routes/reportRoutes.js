const express = require('express');
const router = express.Router();


const {multer, storage } =  require('../middleware/fileMiddleware.js');

const authMiddleware = require('../middleware/authMiddleware')
const reportController = require('../controllers/reportController')


const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
  fileFilter: (req, file, cb) => {
      // Only accept image files
      if (file.mimetype.startsWith('image/')) {
          cb(null, true);
      } else {
          cb(new Error('Only image files are allowed!'), false);
      }
  }
});

// Create middleware for handling multiple file uploads
const uploadFields = upload.fields([
  { name: 'photo', maxCount: 5 }
]);


router.post('/createReport', uploadFields, authMiddleware.authenticateUser, reportController.createReport)
router.put('/:reportId/status', authMiddleware.authenticateUser, reportController.updateReportStatus)
router.get('/getReport', authMiddleware.authenticateUser, reportController.getAllReports)
router.get('/getReportById/:reportId', authMiddleware.authenticateUser, reportController.getReportById)
router.get('/getsinglereport', authMiddleware.authenticateUser, reportController.getSingleUserReports)


module.exports = router;