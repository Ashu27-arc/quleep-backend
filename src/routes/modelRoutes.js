const express = require('express');
const router = express.Router();
const {
  uploadModel,
  getModels,
  getModelById,
  saveState,
  getState,
  getSignedModelUrl,
  streamModel,
} = require('../controllers/modelController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// All routes here are protected
router.use(auth);

// Model upload & list
router.post('/upload', upload.single('file'), uploadModel);
router.get('/', getModels);

// Model camera interaction state persistence (before /:id)
router.post('/:id/state', saveState);
router.get('/:id/state', getState);

// Stream GLB through API (Three.js viewer — avoids S3 CORS)
router.get('/:id/stream', streamModel);

router.get('/:id', getModelById);

// Generate a short-lived pre-signed URL for private S3 asset access
router.get('/:id/signed-url', getSignedModelUrl);

module.exports = router;
