import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import configData from "../../firebase-applet-config.json";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || configData.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || configData.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || configData.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || configData.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || configData.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || configData.appId,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || `https://${configData.projectId}-default-rtdb.firebaseio.com`, 
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || configData.firestoreDatabaseId);
export const rtdb = getDatabase(app);
