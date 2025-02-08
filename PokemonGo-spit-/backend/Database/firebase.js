const admin = require("firebase-admin");
const dotenv = require("dotenv");
const { GoogleAuthProvider } = require("firebase/auth");

dotenv.config();

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account", // This will prompt the user to select an account
});

// Load Firebase credentials from the environment variable
const serviceAccount = require("./firebase.json");

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const usersRef = db.collection("users");
const reportsRef = db.collection("reports");

module.exports = { admin, db, usersRef, reportsRef, googleProvider };
