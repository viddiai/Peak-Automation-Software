import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBdDRek0f3bThZMA7aqn_N-52QDSI6vLwE",
  authDomain: "peak-automation-e9b5a.firebaseapp.com",
  projectId: "peak-automation-e9b5a",
  storageBucket: "peak-automation-e9b5a.firebasestorage.app",
  messagingSenderId: "482966117408",
  appId: "1:482966117408:web:a1272fd02b55e467213045",
  measurementId: "G-GRVMWXKD0R",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
