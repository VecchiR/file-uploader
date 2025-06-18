const multer = require('multer')
const path = require('path');

// Use memory storage instead of disk storage since we'll upload to Cloudinary
const upload = multer({ storage: multer.memoryStorage() })

module.exports = {
  upload
}