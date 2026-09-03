import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
import configData from "../../firebase-applet-config.json";

export const app = initializeApp(configData);
export const db = getFirestore(app, configData.firestoreDatabaseId);
export const rtdb = getDatabase(app);
export const auth = getAuth(app);
