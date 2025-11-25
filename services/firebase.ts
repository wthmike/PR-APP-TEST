import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB_iLszALYkNYii1y9i9m309dMeod97Vr8",
  authDomain: "pr-acad-test.firebaseapp.com",
  projectId: "pr-acad-test",
  storageBucket: "pr-acad-test.firebasestorage.app",
  messagingSenderId: "1090953335490",
  appId: "1:1090953335490:web:ff63a07419b803ca44215b"
};

// Initialize only once to avoid duplicate app errors
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export const db = firebase.firestore();
export const auth = firebase.auth();

// Auto sign-in for everyone (Public read / Admin write via rules)
auth.signInAnonymously().catch(console.error);

export const MatchesService = {
  update: async (id: string, data: any) => {
    try {
      await db.collection('matches').doc(id).update({ ...data, lastUpdated: Date.now() });
    } catch (e) {
      console.error("Update failed", e);
    }
  },
  create: async (data: any) => {
    return await db.collection('matches').add(data);
  },
  delete: async (id: string) => {
    return await db.collection('matches').doc(id).delete();
  }
};