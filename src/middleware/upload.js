const multer = require('multer');
const path = require('path');

// Memory storage to process files directly as buffer
const storage = multer.memoryStorage();

// Custom file filter for .glb files
const fileFilter = (req, file, cb) => {
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  // Accept .glb models only
  if (fileExt === '.glb') {
    cb(null, true);
  } else {
    cb(new Error('Only 3D models in .glb format are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
});

module.exports = upload;
