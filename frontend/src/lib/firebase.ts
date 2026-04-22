import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, Firestore, collection, addDoc, query, where, getDocs, orderBy, serverTimestamp, doc, setDoc, getDoc } from 'firebase/firestore';

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  firestoreDatabaseId?: string;
}

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let googleProvider: GoogleAuthProvider | undefined;

// Lazy initialization to prevent crashing if config is missing
const initFirebase = async () => {
  if (app) return { app, auth, db, googleProvider };

  try {
    // Attempt to load the config. If it doesn't exist, this will throw.
    const configModule = await import('../../../firebase-applet-config.json');
    const firebaseConfig: FirebaseConfig = configModule.default;

    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
    googleProvider = new GoogleAuthProvider();

    return { app, auth, db, googleProvider };
  } catch (error) {
    console.warn("Firebase configuration not found. Persistence will fall back to LocalStorage.");
    return { app: undefined, auth: undefined, db: undefined, googleProvider: undefined };
  }
};

export const getFirebase = initFirebase;

export const signInWithGoogle = async () => {
  const { auth, googleProvider } = await initFirebase();
  if (!auth || !googleProvider) throw new Error("Firebase not initialized");
  return signInWithPopup(auth, googleProvider);
};

export const saveAudit = async (userId: string, auditData: any) => {
  const { db } = await initFirebase();
  if (!db) {
    // Fallback: Store locally
    const history = JSON.parse(localStorage.getItem('audit_history') || '[]');
    history.push({ ...auditData, id: Date.now().toString(), userId, local: true });
    localStorage.setItem('audit_history', JSON.stringify(history));
    return;
  }

  return addDoc(collection(db, 'audits'), {
    ...auditData,
    userId,
    timestamp: serverTimestamp()
  });
};

export const getAuditHistory = async (userId: string) => {
  const { db } = await initFirebase();
  if (!db) {
    const history = JSON.parse(localStorage.getItem('audit_history') || '[]');
    return history.filter((a: any) => a.userId === userId || !a.userId);
  }

  const q = query(
    collection(db, 'audits'), 
    where('userId', '==', userId), 
    orderBy('timestamp', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
