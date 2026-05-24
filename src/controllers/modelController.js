const Model3D = require('../models/Model3D');
const InteractionState = require('../models/InteractionState');
const { uploadFile } = require('../services/s3Service');
const path = require('path');

// @desc    Upload new 3D model (.glb)
// @route   POST /api/models/upload
// @access  Private
exports.uploadModel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded. Please select a .glb file.' });
    }

    const { modelName } = req.body;
    // Fallback to filename without extension if name isn't supplied
    const finalName = modelName || path.basename(req.file.originalname, path.extname(req.file.originalname));

    // Upload using service
    const modelUrl = await uploadFile(req.file, 'models');

    // Create DB entry
    const newModel = await Model3D.create({
      userId: req.user.id,
      modelName: finalName,
      modelUrl,
      thumbnail: '', // Frontend can generate or show a beautiful animated placeholder
    });

    res.status(201).json(newModel);
  } catch (err) {
    console.error('Model upload controller error:', err.message);
    res.status(500).json({ message: err.message || 'Error occurred during file upload.' });
  }
};

// @desc    Get all models for authenticated user
// @route   GET /api/models
// @access  Private
exports.getModels = async (req, res) => {
  try {
    const models = await Model3D.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(models);
  } catch (err) {
    console.error('Fetch models error:', err.message);
    res.status(500).json({ message: 'Server error fetching models.' });
  }
};

// @desc    Get specific model details
// @route   GET /api/models/:id
// @access  Private
exports.getModelById = async (req, res) => {
  try {
    const model = await Model3D.findOne({ _id: req.params.id, userId: req.user.id });
    if (!model) {
      return res.status(404).json({ message: 'Model not found or access denied.' });
    }
    res.json(model);
  } catch (err) {
    console.error('Fetch model detail error:', err.message);
    res.status(500).json({ message: 'Server error retrieving model details.' });
  }
};

// @desc    Save or update interaction state for a model
// @route   POST /api/models/:id/state
// @access  Private
exports.saveState = async (req, res) => {
  try {
    const { cameraPosition, targetPosition, zoomLevel } = req.body;
    const modelId = req.params.id;
    const userId = req.user.id;

    // Verify model ownership
    const modelExists = await Model3D.findOne({ _id: modelId, userId });
    if (!modelExists) {
      return res.status(404).json({ message: 'Model not found or unauthorized.' });
    }

    // Upsert interaction state
    const state = await InteractionState.findOneAndUpdate(
      { userId, modelId },
      {
        cameraPosition,
        targetPosition,
        zoomLevel,
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.json(state);
  } catch (err) {
    console.error('Save camera state error:', err.message);
    res.status(500).json({ message: 'Server error saving interaction state.' });
  }
};

// @desc    Retrieve interaction state for a model
// @route   GET /api/models/:id/state
// @access  Private
exports.getState = async (req, res) => {
  try {
    const modelId = req.params.id;
    const userId = req.user.id;

    // Verify model ownership
    const modelExists = await Model3D.findOne({ _id: modelId, userId });
    if (!modelExists) {
      return res.status(404).json({ message: 'Model not found or unauthorized.' });
    }

    // Find state
    let state = await InteractionState.findOne({ userId, modelId });
    if (!state) {
      // Return a default state representation if none exists yet
      state = {
        userId,
        modelId,
        cameraPosition: [0, 0, 5],
        targetPosition: [0, 0, 0],
        zoomLevel: 1,
      };
    }

    res.json(state);
  } catch (err) {
    console.error('Retrieve camera state error:', err.message);
    res.status(500).json({ message: 'Server error retrieving interaction state.' });
  }
};
