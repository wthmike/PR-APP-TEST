import * as firebaseApp from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, collection, doc, updateDoc, addDoc, deleteDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB_iLszALYkNYii1y9i9m309dMeod97Vr8",
  authDomain: "pr-acad-test.firebaseapp.com",
  projectId: "pr-acad-test",
  storageBucket: "pr-acad-test.firebasestorage.app",
  messagingSenderId: "1090953335490",
  appId: "1:1090953335490:web:ff63a07419b803ca44215b"
};

const app = firebaseApp.initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Auto sign-in for everyone (Public read / Admin write via rules)
signInAnonymously(auth).catch(console.error);

export const MatchesService = {
  update: async (id: string, data: any) => {
    try {
      await updateDoc(doc(db, 'matches', id), { ...data, lastUpdated: Date.now() });
    } catch (e) {
      console.error("Update failed", e);
    }
  },
  create: async (data: any) => {
    return await addDoc(collection(db, 'matches'), data);
  },
  delete: async (id: string) => {
    return await deleteDoc(doc(db, 'matches', id));
  }
};