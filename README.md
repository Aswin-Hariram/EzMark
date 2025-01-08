# EzMark - React Native App

EzMark is a React Native application for managing attendance in a seamless and secure way.  
The app allows:  
- **Admins** to add and manage teachers and students.  
- **Teachers** to create attendance requests with OTPs.  
- **Students** to verify their identity using facial recognition and enter the OTP for attendance verification.

## Features

- **Admin Panel**: Admins can add and manage teachers and students.
- **Attendance Requests**: Teachers can create attendance requests with OTPs for students.
- **Biometric Verification**: Students use facial recognition to verify their identity.
- **Secure Data Storage**: Firestore is used for storing data and AWS S3 for image storage.

---

## Technology Stack

- **React Native**: Cross-platform mobile application development.
- **Firestore**: Cloud-based NoSQL database.
- **AWS Rekognition**: Facial recognition for secure attendance validation.
- **AWS S3**: Image storage service for handling facial images.

---

## Setup Guide

### Prerequisites

1. Node.js installed on your machine.
2. An **AWS account** for AWS Rekognition and S3 setup.
3. A **Firebase account** for Firestore configuration.

### Installation

Clone the repository:

```bash
git clone https://github.com/your-username/ezmark.git
cd ezmark
npm install
```
## Firestore Configuration
1. Navigate to Config/firestore.js.
2. Update the file with your Firestore credentials:

```bash
export const firestoreConfig = {  
    apiKey: "your-api-key",  
    authDomain: "your-auth-domain",  
    projectId: "your-project-id",  
    storageBucket: "your-storage-bucket",  
    messagingSenderId: "your-messaging-sender-id",  
    appId: "your-app-id",  
};  
```
## AWS Configuration
1. Navigate to Config/aws.js.
2. Add your AWS credentials:

```bash
export const awsConfig = {  
    region: "your-region",  
    accessKeyId: "your-access-key-id",  
    secretAccessKey: "your-secret-access-key",  
    rekognitionBucket: "your-s3-bucket-name",  
    rekognitionCollectionId: "your-collection-id",  
};  
```
## Run the App
Start the development server:
```bash
npm run start  
```

