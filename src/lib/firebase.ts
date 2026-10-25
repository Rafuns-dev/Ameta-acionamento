import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: 'ameta-sistema-teste',
  appId: '1:400347798343:web:50caefe1b5d6119dd50a62',
  apiKey: 'AIzaSyC5a0ijspUcwhaLypvkLY3xu7Vm9i0soWA',
  authDomain: 'ameta-sistema-teste.firebaseapp.com',
  firestoreDatabaseId: '(default)',
  storageBucket: 'ameta-sistema-teste.firebasestorage.app',
  messagingSenderId: '400347798343',
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
