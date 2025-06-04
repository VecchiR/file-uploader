const multer = require('multer')
const fs = require('fs');
const path = require('path');

function ensureUniqueName(basePath, name) {
  // Get all items in the directory
  const items = fs.readdirSync(basePath, { withFileTypes: true });
  
  // Filter for files only
  const existingNames = items
    .filter(item => item.isFile())
    .map(item => item.name);

  // Check if name is already taken
  if (!existingNames.includes(name)) return name;

  // Split name into base and extension
  const lastDotIndex = name.lastIndexOf('.');
  const baseName = lastDotIndex !== -1 ? name.slice(0, lastDotIndex) : name;
  const extension = lastDotIndex !== -1 ? name.slice(lastDotIndex) : '';

  // Find next available number
  let i = 1;
  let newName;
  do {
    newName = `${baseName}(${i})${extension}`;
    i++;
  } while (existingNames.includes(newName));

  return newName;
}

function createDirectory(baseDir, desiredPath) {
  // Split the path into segments and create full path
  const segments = desiredPath.split(path.sep).filter(Boolean);
  let currentPath = baseDir;

  // Create each directory level if it doesn't exist
  for (const segment of segments) {
    currentPath = path.join(currentPath, segment);
    if (!fs.existsSync(currentPath)) {
      fs.mkdirSync(currentPath);
    }
  }

  return { 
    fullPath: currentPath,
    relativePath: desiredPath 
  };
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Get the base uploads directory
    const baseUploadsDir = path.join(__dirname, '../uploads');
    
    // Ensure base uploads directory exists
    if (!fs.existsSync(baseUploadsDir)) {
      fs.mkdirSync(baseUploadsDir);
    }

    // Create nested directories if path is provided
    const result = req.body.path 
      ? createDirectory(baseUploadsDir, req.body.path)
      : { fullPath: baseUploadsDir, relativePath: '' };
    
    // Store the relative path for use in filename function
    req.uploadRelativePath = result.relativePath;
    
    cb(null, result.fullPath);
  },
  filename: function (req, file, cb) {
    // Get the target directory using the stored relative path
    const uploadDir = path.join(__dirname, '../uploads', req.uploadRelativePath);
    const uniqueFileName = ensureUniqueName(uploadDir, file.originalname);
    cb(null, uniqueFileName);
  }
})

const upload = multer({ storage: storage })

module.exports = {
  upload
}