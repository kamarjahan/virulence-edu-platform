import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDRzV8KyaJv85Zo1AbhX-DO_gkAqlE_umw",
  authDomain: "virulence-edu.firebaseapp.com",
  projectId: "virulence-edu",
  storageBucket: "virulence-edu.firebasestorage.app",
  messagingSenderId: "321729050326",
  appId: "1:321729050326:web:3d4e1854dc2746c40d3b77",
  measurementId: "G-V5LCPSCF12"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);