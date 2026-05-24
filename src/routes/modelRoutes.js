const express = require('express');
const router = express.Router();
const {
  uploadModel,
  getModels,
  getModelById,
  saveState,
  getState,
  getSignedModelUrl,
} = require('../controllers/modelController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// All routes here are protected
router.use(auth);

// Model upload & list
router.post('/upload', upload.single('file'), uploadModel);
router.get('/', getModels);
router.get('/:id', getModelById);

// Model camera interaction state persistence
router.post('/:id/state', saveState);
router.get('/:id/state', getState);

// Generate a short-lived pre-signed URL for private S3 asset access
router.get('/:id/signed-url', getSignedModelUrl);

module.exports = router;
