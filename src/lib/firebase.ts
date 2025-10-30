import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyD5A3eoJms-tQIttDDHZKIsUTp2elSL3BY",
  authDomain: "voxalo-x.firebaseapp.com",
  projectId: "voxalo-x",
  storageBucket: "voxalo-x.firebasestorage.app",
  messagingSenderId: "218806636116",
  appId: "1:218806636116:web:2ec151f5500021b38067c1"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);


// Check if we are in a browser environment before initializing messaging
const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

export { app, auth, db, messaging };
