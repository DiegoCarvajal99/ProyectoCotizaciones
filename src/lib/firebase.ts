import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY || "AIzaSyClACDPdD2wN0XyjVGW7ML5MydpSrLR5IU",
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN || "cotizaciones-d664d.firebaseapp.com",
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID || "cotizaciones-d664d",
  storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET || "cotizaciones-d664d.firebasestorage.app",
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "469336471717",
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID || "1:469336471717:web:5feda7f14cb6c6b17ef54c"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);
