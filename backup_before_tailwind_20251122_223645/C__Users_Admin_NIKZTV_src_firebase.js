// src/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBFVtXIsbtSxwyrMOvLVraflTzTwAffSVM",
  authDomain: "nikzflixtv.firebaseapp.com",
  projectId: "nikzflixtv",
  storageBucket: "nikzflixtv.appspot.com",
  messagingSenderId: "1040086897249",
  appId: "1:1040086897249:web:ef2c7a7bba9599f6421020",
  measurementId: "G-6Y9W7DJ3K3",
  databaseURL: "https://nikzflixtv-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);

export default app;