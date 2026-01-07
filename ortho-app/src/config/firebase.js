import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCr54TIvEySWPS6RXeK-Nibm4Buuq3E7Do",
    authDomain: "ortho-app-a5788.firebaseapp.com",
    projectId: "ortho-app-a5788",
    storageBucket: "ortho-app-a5788.firebasestorage.app",
    messagingSenderId: "92276052434",
    appId: "1:92276052434:web:5c12b5f94b735aa02d780b",
    measurementId: "G-X09EJRQHNG"
  };

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Initialiser les services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;