const express = require('express');
const router = express.Router();
const {
  uploadModel,
  getModels,
  getModelById,
  saveState,
  getState,
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

module.exports = router;
