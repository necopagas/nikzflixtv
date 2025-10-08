import { initializeApp } from "firebase/app";
// --- KULANG NGA IMPORTS, ATO NING IDUGANG ---
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Ang imong Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBFVtXIsbtSxwyrMOvLVraflTzTwAffSVM",
  authDomain: "nikzflixtv.firebaseapp.com",
  projectId: "nikzflixtv",
  storageBucket: "nikzflixtv.appspot.com", // Gi-usab nako ni para sakto ang format
  messagingSenderId: "1040086897249",
  appId: "1:1040086897249:web:ef2c7a7bba9599f6421020",
  measurementId: "G-6Y9W7DJ3K3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// --- KINAHANGLAN NATO I-EXPORT ANG MGA SERBISYO ---
// I-initialize ang Authentication ug Firestore ug i-export sila
export const auth = getAuth(app);
export const db = getFirestore(app); // Para sa database unya

export default app;