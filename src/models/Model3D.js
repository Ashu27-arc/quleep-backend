const mongoose = require('mongoose');

const model3DSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    modelName: {
      type: String,
      required: [true, 'Model name is required'],
      trim: true,
    },
    modelUrl: {
      type: String,
      required: [true, 'Model URL is required'],
    },
    thumbnail: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Model3D', model3DSchema);
