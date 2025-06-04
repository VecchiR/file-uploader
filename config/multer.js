const multer = require('multer')
const fs = require('fs');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads')
  },
  filename: function (req, file, cb) {
    const fileName = ensureUniqueFileName(file.originalname);
    cb(null, fileName);
  }
})

const upload = multer({ storage: storage })

function ensureUniqueFileName(originalName) {
  const uploadsDir = path.join(__dirname, '../uploads');
  const files = fs.readdirSync(uploadsDir);
  
  // Check if original filename exists
  let nameIsTaken = files.find(f => f === originalName);
  if (!nameIsTaken) return originalName;

  // Split filename into name and extension
  const lastDotIndex = originalName.lastIndexOf('.');
  const fileName = lastDotIndex !== -1 ? originalName.slice(0, lastDotIndex) : originalName;
  const fileExtension = lastDotIndex !== -1 ? originalName.slice(lastDotIndex) : '';
  
  
  // Find next available number
  let i = 1;
  let newName;
  do {
    newName = `${fileName}(${i})${fileExtension}`;
    nameIsTaken = files.find(f => f === newName);
    i++;
  } while (nameIsTaken);
  
  return newName;
}

module.exports = {
  upload
}