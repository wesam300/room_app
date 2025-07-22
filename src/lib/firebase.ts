
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "fruity-fortune-nyqi4",
  appId: "1:325355711702:web:b9ddef0173cdc57481ad77",
  storageBucket: "fruity-fortune-nyqi4.firebasestorage.app",
  apiKey: "AIzaSyA36TENnmAczVwDHUxGfHRkhyqvaPZKMUk",
  authDomain: "fruity-fortune-nyqi4.firebaseapp.com",
  messagingSenderId: "325355711702"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };
