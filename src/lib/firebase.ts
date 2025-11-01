
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyD5A3eoJms-tQIttDDHZKIsUTp2elSL3BY",
  authDomain: "voxalo-x.firebaseapp.com",
  projectId: "voxalo-x",
  storageBucket: "voxalo-x.firebasestorage.app",
  messagingSenderId: "218806636116",
  appId: "1:218806636116:web:2ec151f5500021b38067c1",
  databaseURL: "https://voxalo-x-default-rtdb.firebaseio.com"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
    // Multiple tabs open, persistence can only be enabled in one tab at a time.
    console.warn('Firestore persistence failed: multiple tabs open.');
  } else if (err.code == 'unimplemented') {
    // The current browser does not support all of the features required to enable persistence
    console.warn('Firestore persistence not available in this browser.');
  }
});


// Check if we are in a browser environment before initializing messaging
const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

export { app, auth, db, messaging };
