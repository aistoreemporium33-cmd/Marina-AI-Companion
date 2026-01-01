
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, signInAnonymously } from 'firebase/auth';
import { getFirestore, Firestore, doc, setDoc, onSnapshot, updateDoc, increment } from 'firebase/firestore';

const getFirebaseConfig = () => {
  if (typeof (window as any).__firebase_config !== 'undefined') {
    return JSON.parse((window as any).__firebase_config);
  }
  return {}; 
};

let db: Firestore | null = null;
let auth: Auth | null = null;
let app: FirebaseApp | null = null;

const config = getFirebaseConfig();
const hasConfig = Object.keys(config).length > 0;

if (hasConfig && getApps().length === 0) {
  try {
    app = initializeApp(config);
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (e) {
    console.error("Firebase init error:", e);
  }
} else if (hasConfig) {
  app = getApps()[0];
  db = getFirestore(app);
  auth = getAuth(app);
}

export const isFirebaseAvailable = () => !!db && !!auth;

export const signInAnon = async () => {
  if (!auth) throw new Error("Firebase Auth not initialized");
  return signInAnonymously(auth);
};

export const subscribeToProfile = (userId: string, callback: (data: any) => void) => {
  if (!db) return () => {};
  const profilePath = `artifacts/default-app-id/users/${userId}/profiles/main`;
  return onSnapshot(doc(db, profilePath), (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data());
    } else {
      const initialData = { 
        name: 'Marina', 
        trait: 'sanft', 
        isPremium: false, 
        imageGenerationCount: 0, 
        tokens: 5,
        trialStartedAt: Date.now() 
      };
      setDoc(doc(db, profilePath), initialData, { merge: true });
    }
  });
};

export const saveChatHistory = async (userId: string, messages: any[]) => {
  if (!db) return;
  const historyPath = `artifacts/default-app-id/users/${userId}/history/chat`;
  await setDoc(doc(db, historyPath), { messages }, { merge: true });
};

export const addTokens = async (userId: string, amount: number) => {
  if (!db) return;
  const profilePath = `artifacts/default-app-id/users/${userId}/profiles/main`;
  try {
    await updateDoc(doc(db, profilePath), { tokens: increment(amount) });
  } catch (e) {
    console.error("Failed to add tokens:", e);
  }
};

export const consumeToken = async (userId: string) => {
  if (!db) return;
  const profilePath = `artifacts/default-app-id/users/${userId}/profiles/main`;
  try {
    await updateDoc(doc(db, profilePath), { tokens: increment(-1) });
  } catch (e) {
    console.error("Failed to consume token:", e);
  }
};

export const updateImageCount = async (userId: string, count: number) => {
  if (!db) return;
  const profilePath = `artifacts/default-app-id/users/${userId}/profiles/main`;
  await updateDoc(doc(db, profilePath), { imageGenerationCount: count });
};

export const upgradeUser = async (userId: string) => {
  if (!db) return;
  const profilePath = `artifacts/default-app-id/users/${userId}/profiles/main`;
  await updateDoc(doc(db, profilePath), { isPremium: true });
};

export { auth, db };
