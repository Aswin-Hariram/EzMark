import AWS from 'aws-sdk';

// Configure AWS with your access keys and region
AWS.config.update({
    accessKeyId: 'your-access-key',
    secretAccessKey: 'your-secretAccessKey',
    region: 'your-aws-region',
});

export const s3 = new AWS.S3();
export const rekognition = new AWS.Rekognition();