# EzMark - React Native App
**[⬇️ Download Now - Android Version](https://www.upload-apk.com/en/5QC5YplxNAh59Ae)**


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

### **Intro Screens**
<table>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/54387d7e-9102-4c68-91f6-940f38514145" width="200"></td>
    <td><img src="https://github.com/user-attachments/assets/6b257d6c-27cf-47a9-a4a5-56e2e65c1350" width="200"></td>
  </tr>
</table>


---

### **Student Screens**
<table>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/0e2a4a11-378a-4826-8d1a-188b8965fb05" width="200"></td>
    <td><img src="https://github.com/user-attachments/assets/91975f08-61fe-4fb7-952e-6c8827f25d5a" width="200"></td>
    <td><img src="https://github.com/user-attachments/assets/68ba0bee-2968-42ef-addc-8a06cafa2f70" width="200"></td>
    <td><img src="https://github.com/user-attachments/assets/3914e289-47ba-45c7-bc68-488f4b9390e1" width="200"></td>
    <td><img src="https://github.com/user-attachments/assets/98e4571e-56d2-48a8-8ba3-e5bd6881f88c" width="200"></td>
  </tr>
</table>


---


### **Teacher Screens**
<table>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/90efb435-b723-4243-9403-694afaee87f2" width="200"></td>
    <td><img src="https://github.com/user-attachments/assets/8932b751-6971-46c3-997c-8cae6f49490b" width="200"></td>
    <td><img src="https://github.com/user-attachments/assets/e445cffe-a8d6-4355-a6d4-b483bf703412" width="200"></td>
    <td><img src="https://github.com/user-attachments/assets/4912624d-74b4-4d66-8dec-1a0a2a26c6e9" width="200"></td>
    <td><img src="https://github.com/user-attachments/assets/70bfbb09-86ad-4193-afa5-a40cc97ef7a0" width="200"></td>
  </tr>
</table>


---

### **Admin Screens**
<table>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/0a037ac2-17ca-419a-b6b9-239092186ae5" width="200"></td>
    <td><img src="https://github.com/user-attachments/assets/63ba0391-ebd3-463a-8cab-070029a663d2" width="200"></td>
    <td><img src="https://github.com/user-attachments/assets/fb01d0a2-31c8-4f6b-ae6a-aef8ce96fd10" width="200"></td>
  </tr>
</table>


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

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "your-apiKey",
  authDomain: "your-authDomain",
  projectId: "your-projectId",
  storageBucket: "your-storageBucket",
  messagingSenderId: "your-messagingSenderId",
  appId: "your-appId",
  measurementId: "your-measurementId"
};

export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const firestore = getFirestore(app);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)

})
 
```
## AWS Configuration
1. Navigate to Config/aws.js.
2. Add your AWS credentials:

```bash
import AWS from 'aws-sdk';

AWS.config.update({
    accessKeyId: 'your-access-key',
    secretAccessKey: 'your-secretAccessKey',
    region: 'your-aws-region',
});

export const s3 = new AWS.S3();
export const rekognition = new AWS.Rekognition();
```
## Run the App
Start the development server:
```bash
npm run start  
```

___
