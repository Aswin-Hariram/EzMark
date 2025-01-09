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
## Images

![Simulator Screenshot - iPhone 16 Plus - 2025-01-09 at 10 00 28](https://github.com/user-attachments/assets/5a3aa25f-6d5a-4d11-b1ae-bdfd66351e1d)
![Simulator Screenshot - iPhone 16 Plus - 2025-01-09 at 10 00 37](https://github.com/user-attachments/assets/392e44fa-2dbd-4871-ba5e-a4a053271e90)

### Student
![Simulator Screenshot - iPhone 16 Plus - 2025-01-09 at 10 00 48](https://github.com/user-attachments/assets/0e2a4a11-378a-4826-8d1a-188b8965fb05) ![Simul![Simulator Screenshot - iPhone 16 Plus - 2025-01-09 at 10 01 16](https://github.com/user-attachments/assets/98e4571e-56d2-48a8-8ba3-e5bd6881f88c)
![Simulator Screenshot - iPhone 16 Plus - 2025-01-09 at 10 01 16](https://github.com/user-attachments/assets/c123b00d-707f-4426-88b7-e0a4e5cac8a3)
![Simulator Screenshot - iPhone 16 Plus - 2025-01-09 at 10 03 49](https://github.com/user-attachments/assets/68ba0bee-2968-42ef-addc-8a06cafa2f70)
![Simulator Screenshot - iPhone 16 Plus - 2025-01-09 at 10 04 41](https://github.com/user-attachments/assets/3914e289-47ba-45c7-bc68-488f4b9390e1)

### Teacher

![Simulator Screenshot - iPhone 16 Plus - 2025-01-09 at 10 05 18](https://github.com/user-attachments/assets/90efb435-b723-4243-9403-694afaee87f2)
![Simulator Screenshot - iPhone 16 Plus - 2025-01-09 at 10 05 23](https://github.com/user-attachments/assets/8932b751-6971-46c3-997c-8cae6f49490b)
![Simulator Screenshot - iPhone 16 Plus - 2025-01-09 at 10 06 09](https://github.com/user-attachments/assets/e445cffe-a8d6-4355-a6d4-b483bf703412)
![Simulator Screenshot - iPhone 16 Plus - 2025-01-09 at 10 06 20](https://github.com/user-attachments/assets/4912624d-74b4-4d66-8dec-1a0a2a26c6e9)
![Simulator Screenshot - iPhone 16 Plus - 2025-01-09 at 10 06 29](https://github.com/user-attachments/assets/70bfbb09-86ad-4193-afa5-a40cc97ef7a0)


### Admin

![Simulator Screenshot - iPhone 16 Plus - 2025-01-09 at 10 02 22](https://github.com/user-attachments/assets/0a037ac2-17ca-419a-b6b9-239092186ae5)
![Simulator Screenshot - iPhone 16 Plus - 2025-01-09 at 10 02 52](https://github.com/user-attachments/assets/63ba0391-ebd3-463a-8cab-070029a663d2)
![Simulator Screenshot - iPhone 16 Plus - 2025-01-09 at 10 02 27](https://github.com/user-attachments/assets/fb01d0a2-31c8-4f6b-ae6a-aef8ce96fd10)

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

