
// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
// This is a public configuration and is safe to expose.
const firebaseConfig = {
  apiKey: "AIzaSyDPtA_1Z8-aT0W2s9cLo3mqFj_a_Z2dYf0",
  authDomain: "fruity-fortune-431500.firebaseapp.com",
  databaseURL: "https://fruity-fortune-431500-default-rtdb.firebaseio.com",
  projectId: "fruity-fortune-431500",
  storageBucket: "fruity-fortune-431500.appspot.com",
  messagingSenderId: "1016730141258",
  appId: "1:1016730141258:web:779d35c829c9ab67417616",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getDatabase(app);

export { app, db };

