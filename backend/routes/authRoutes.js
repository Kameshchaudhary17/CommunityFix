const express = require('express');
const router = express.Router();
const {multer, storage } =  require('../middleware/fileMiddleware.js');

const authMiddleware = require('../middleware/authMiddleware')
const authController = require('../controllers/authController')


const upload = multer({storage : storage})

router.post('/signup', authController.uploadFields, authController.signupUser)
router.post('/login', authController.loginUser)
router.post('/forget-password', authController.sendResetOTP)
router.post('/verify-otp', authController.verifyOTP)
router.post('/reset-password', authController.resetPassword)
router.get('/getcurrentuser', authMiddleware.authenticateUser, authController.getCurrentUser)
router.get('/getuserbylocation', authMiddleware.authenticateUser, authController.getUsersByLocation)
router.get('/municipalityuser', authMiddleware.authenticateUser, authController.getMunicipality)
router.get('/getmunicipalityuser', authMiddleware.authenticateUser, authController.getMunicipalityUsers)
router.put('/users/:user_id', authController.uploadFields, authController.updateUser);
router.post('/:userId/verify',authMiddleware.authenticateUser, authController.updateVerificationStatus);
router.delete('/users/:user_id', authMiddleware.authenticateUser, authController.deleteUser)

module.exports = router;