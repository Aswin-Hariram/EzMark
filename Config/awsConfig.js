import AWS from 'aws-sdk';

// Configure AWS with your access keys and region
AWS.config.update({
  accessKeyId: process.env.EXPO_PUBLIC_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.EXPO_PUBLIC_AWS_SECRET_ACCESS_KEY,
  region: process.env.EXPO_PUBLIC_AWS_REGION,
});

export const s3 = new AWS.S3();
export const rekognition = new AWS.Rekognition();