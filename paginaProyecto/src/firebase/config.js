// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCs1fXSE-yZ0WWPfwKFc3HYjJ4H0RNQQYs",
  authDomain: "proyectoestructuras2-2d4ab.firebaseapp.com",
  projectId: "proyectoestructuras2-2d4ab",
  storageBucket: "proyectoestructuras2-2d4ab.firebasestorage.app",
  messagingSenderId: "736759671077",
  appId: "1:736759671077:web:449fe3e8cf3a3c7d9592cc",
  measurementId: "G-B14QRMY0LR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const analytics = getAnalytics(app);