
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';


const firebaseConfig = {
  apiKey: "AIzaSyD1ofjYOW4AZTJq40dFM5S91XvaPB67aUE",
  authDomain: "ezmark-e56cc.firebaseapp.com",
  projectId: "ezmark-e56cc",
  storageBucket: "ezmark-e56cc.firebasestorage.app",
  messagingSenderId: "729693697644",
  appId: "1:729693697644:web:ab4cc2e80f84ef628f8a49",
  measurementId: "G-RSZEW2JVFY"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const firestore = getFirestore(app);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)

})
