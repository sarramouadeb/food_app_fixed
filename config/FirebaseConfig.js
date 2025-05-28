import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAVXNMA9siGSge_yXO1nT1hsghgLT-wJLw",
  authDomain: "foodapp-1fc8e.firebaseapp.com",
  projectId: "foodapp-1fc8e",
  storageBucket: "foodapp-1fc8e.appspot.com",
  messagingSenderId: "15109127624",
  appId: "1:15109127624:web:adf3fcea70b897f41194fd",
  measurementId: "G-E2H1Z1EXCR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with error handling
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (error) {
  if (error.code === 'auth/already-initialized') {
    auth = getAuth(app);
  } else {
    throw error;
  }
}

// Initialize Firestore
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db ,storage };