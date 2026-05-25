const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
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
        ContentType: 'model/gltf-binary',
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

/**
 * Generates a short-lived pre-signed URL so the browser can GET a private S3 object.
 * Falls back gracefully if S3 is not configured (returns the raw path unchanged).
 * @param {string} s3Url  Full S3 HTTPS URL stored in the database
 * @param {number} expiresIn  Seconds until the signed URL expires (default 3600 = 1 h)
 * @returns {Promise<string>} Pre-signed URL (or original URL if not an S3 object)
 */
/** @param {string} s3Url */
const extractS3Key = (s3Url) => {
  const urlObj = new URL(s3Url);
  const host = urlObj.hostname;

  // Path-style: https://s3.<region>.amazonaws.com/<bucket>/<key>
  if (host.startsWith('s3.') || host === 's3.amazonaws.com') {
    const parts = urlObj.pathname.replace(/^\//, '').split('/');
    if (parts[0] === s3Config.bucketName) {
      return parts.slice(1).join('/');
    }
  }

  // Virtual-hosted: https://<bucket>.s3.<region>.amazonaws.com/<key>
  return urlObj.pathname.replace(/^\//, '');
};

const generateSignedUrl = async (s3Url, expiresIn = 3600) => {
  if (!s3Config.isConfigured || !s3Url || !s3Url.startsWith('https://')) {
    return s3Url;
  }

  try {
    // Extract the S3 key from the full URL
    // URL format: https://<bucket>.s3.<region>.amazonaws.com/<key>
    const key = extractS3Key(s3Url);

    const command = new GetObjectCommand({
      Bucket: s3Config.bucketName,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3Config.s3Client, command, { expiresIn });
    return signedUrl;
  } catch (err) {
    console.error('Failed to generate pre-signed URL:', err.message);
    return s3Url; // fallback to original URL
  }
};

/**
 * Streams a model asset (S3 or local) to an Express response.
 * @param {string} modelUrl URL stored in the database
 * @param {import('express').Response} res Express response
 */
const streamModelAsset = async (modelUrl, res) => {
  return new Promise((resolve, reject) => {
    res.setHeader('Content-Type', 'model/gltf-binary');
    res.setHeader('Cache-Control', 'private, max-age=3600');

    const finish = (stream) => {
      stream.on('error', (err) => {
        if (!res.headersSent) {
          res.status(404).json({ message: 'Model file not found in storage.' });
        }
        reject(err);
      });
      stream.on('end', resolve);
      stream.pipe(res);
    };

    (async () => {
      if (modelUrl.startsWith('https://') && s3Config.isConfigured) {
        const key = extractS3Key(modelUrl);
        const command = new GetObjectCommand({
          Bucket: s3Config.bucketName,
          Key: key,
        });
        const s3Response = await s3Config.s3Client.send(command);
        if (!s3Response.Body) {
          throw new Error('Empty response from S3');
        }
        return finish(s3Response.Body);
      }

      const localPath = path.join(__dirname, '../../public', modelUrl);
      if (!fs.existsSync(localPath)) {
        if (!res.headersSent) {
          res.status(404).json({ message: 'Model file not found on server.' });
        }
        return reject(new Error('Model file not found on server'));
      }
      return finish(fs.createReadStream(localPath));
    })().catch((err) => {
      console.error('streamModelAsset error:', err.message);
      if (!res.headersSent) {
        res.status(404).json({ message: 'Model file not found in storage.' });
      }
      reject(err);
    });
  });
};

module.exports = {
  uploadFile,
  generateSignedUrl,
  streamModelAsset,
};
