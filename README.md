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
