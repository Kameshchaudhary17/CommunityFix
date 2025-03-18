const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'storage/'); // Store files in the 'storage' folder
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Add timestamp for uniqueness
    }
});

module.exports = { multer, storage };
