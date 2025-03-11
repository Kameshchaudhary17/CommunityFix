const express = require('express');
const router = express.Router();
const {multer, storage } =  require('../middleware/fileMiddleware.js');


const authController = require('../controllers/authController')


const upload = multer({storage : storage})

router.post('/signup',upload.single('photo'), authController.signupUser)
router.post('/login', authController.loginUser)

module.exports = router;