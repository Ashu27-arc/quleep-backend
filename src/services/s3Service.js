const { PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
const s3Config = require('../config/s3');

/**
 * Uploads a file buffer either to AWS S3 or to local filesystem as a fallback.
 * @param {Object} file Multer file object
 * @param {string} folder Target folder path
 * @returns {Promise<string>} Public URL of the uploaded file
 */
const uploadFile = async (file, folder = 'models') => {
  const fileExt = path.extname(file.originalname);
  const sanitizedName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}${fileExt}`;
  const key = `${folder}/${sanitizedName}`;

  if (s3Config.isConfigured) {
    try {
      const command = new PutObjectCommand({
        Bucket: s3Config.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await s3Config.s3Client.send(command);
      const region = process.env.AWS_REGION || 'us-east-1';
      return `https://${s3Config.bucketName}.s3.${region}.amazonaws.com/${key}`;
    } catch (err) {
      console.error('S3 Upload failed, attempting local fallback:', err.message);
    }
  }

  // Local filesystem fallback
  const uploadsDir = path.join(__dirname, '../../public/uploads', folder);
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const localPath = path.join(uploadsDir, sanitizedName);
  fs.writeFileSync(localPath, file.buffer);

  // Return a relative path served statically by Express
  return `/uploads/${folder}/${sanitizedName}`;
};

module.exports = {
  uploadFile,
};
