// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Import Firestore
import { getStorage } from "firebase/storage"; // Import Firebase Storage

const firebaseConfig = {
  apiKey: "AIzaSyBT12XMp8KHKqIOGkYaGUfHdRcUJKESQmw",
  authDomain: "poki-e0696.firebaseapp.com",
  projectId: "poki-e0696",
  storageBucket: "poki-e0696.appspot.com",
  messagingSenderId: "268420923194",
  appId: "1:268420923194:android:f09b384b3c22ba3756da03",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and set up providers
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore and export it
export const db = getFirestore(app);
export const storage = getStorage(app);