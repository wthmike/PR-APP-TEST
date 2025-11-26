import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

// REPLACE WITH YOUR ACTUAL FIREBASE CONFIGURATION
const firebaseConfig = {
  apiKey: "AIzaSyB_iLszALYkNYii1y9i9m309dMeod97Vr8",
  authDomain: "pr-acad-test.firebaseapp.com",
  projectId: "pr-acad-test",
  storageBucket: "pr-acad-test.firebasestorage.app",
  messagingSenderId: "1090953335490",
  appId: "1:1090953335490:web:ff63a07419b803ca44215b"
};

// Initialize Firebase only if it hasn't been initialized yet
if (!firebase.apps.length) {
    try {
        firebase.initializeApp(firebaseConfig);
    } catch (e) {
        console.warn("Firebase config missing or invalid. Please check services/firebase.ts");
    }
}

export const db = firebase.firestore();
export const auth = firebase.auth();

export const MatchesService = {
  update: async (id: string, data: any) => {
    await db.collection('matches').doc(id).update({ ...data, lastUpdated: Date.now() });
  },
  create: async (data: any) => {
    return await db.collection('matches').add(data);
  },
  delete: async (id: string) => {
    return await db.collection('matches').doc(id).delete();
  }
};