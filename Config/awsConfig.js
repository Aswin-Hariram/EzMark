import AWS from 'aws-sdk';

// Configure AWS with your access keys and region
AWS.config.update({
    accessKeyId: 'AKIA23WHTYEBO4PZYR6P',
    secretAccessKey: 'lI5m42YjErWVejFIZNOIrZ8BQKlMW2zM5/Jokukr',
    region: 'ap-south-1',
});

export const s3 = new AWS.S3();
export const rekognition = new AWS.Rekognition();