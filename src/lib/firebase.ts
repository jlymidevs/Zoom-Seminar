import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

export const ADMIN_EMAILS = [
  'jlymi.devs@gmail.com',
  'rad4862@gmail.com',
  'ianrae.agustin@gmail.com',
  'kennethkimetos@gmail.com'
];

export const isAdmin = (email: string | null) => {
  return email ? ADMIN_EMAILS.includes(email) : false;
};
