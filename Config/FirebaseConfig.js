
import { getApps, initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getAuth, getReactNativePersistence, initializeAuth } from '@firebase/auth';
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

console.log("Developer Name:", process.env.EXPO_PUBLIC_DEVELOPER_NAME);
// Initialize Firebase
export const app = initializeApp(firebaseConfig);
const secondaryApp = getApps().find((instance) => instance.name === 'secondary-admin-auth')
  || initializeApp(firebaseConfig, 'secondary-admin-auth');
// export const analytics = getAnalytics(app);
export const firestore = getFirestore(app);
console.log("Firebase initialized successfully!");

const initializePersistentAuth = (firebaseApp) => {
  try {
    return initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage)
    });
  } catch (error) {
    return getAuth(firebaseApp);
  }
};

const auth = initializePersistentAuth(app);
const secondaryAuth = initializePersistentAuth(secondaryApp);

export { auth };
export { secondaryAuth };
