const mongoose = require('mongoose');

const interactionStateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    modelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Model3D',
      required: true,
    },
    cameraPosition: {
      type: [Number], // [x, y, z]
      default: [0, 0, 5],
    },
    targetPosition: {
      type: [Number], // [x, y, z]
      default: [0, 0, 0],
    },
    zoomLevel: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to guarantee that each user has exactly one camera state per model
interactionStateSchema.index({ userId: 1, modelId: 1 }, { unique: true });

module.exports = mongoose.model('InteractionState', interactionStateSchema);
