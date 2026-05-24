const { S3Client } = require('@aws-sdk/client-s3');

const hasS3Config = 
  process.env.AWS_ACCESS_KEY_ID && 
  process.env.AWS_SECRET_ACCESS_KEY && 
  process.env.AWS_REGION && 
  process.env.AWS_S3_BUCKET;

let s3Client = null;

if (hasS3Config) {
  s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
} else {
  console.warn('AWS S3 configuration missing. File storage service will fallback to local storage.');
}

module.exports = {
  s3Client,
  bucketName: process.env.AWS_S3_BUCKET,
  isConfigured: !!hasS3Config,
};
