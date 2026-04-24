import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, setDoc, deleteDoc, getDoc, getDocs, collection, query, where, addDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { useState, useEffect } from "react";

const firebaseConfig = {
  apiKey: "AIzaSyC1GvAMikaE9AbbHHJE_Ivqe49Se4FcX-o",
  authDomain: "chompchem.firebaseapp.com",
  projectId: "chompchem",
  storageBucket: "chompchem.firebasestorage.app",
  messagingSenderId: "379599502348",
  appId: "1:379599502348:web:d1be32d868ac2a813f0229",
  measurementId: "G-NWEXYL1PQ0"
};

const app = initializeApp(firebaseConfig);
export const firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

// React Hook for Real-time listeners
export function useLiveCollection(collectionName) {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    const q = query(collection(firestore, collectionName));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [collectionName]);
  
  return data;
}

const withTimeout = (promise, ms = 5000) => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('Database request timed out. Ensure your internet is stable and your Firebase Firestore Database is created in Test Mode.'));
    }, ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
};

// Data Access Object (DAO) to minimize component refactoring
export const db = {
  chemicals: {
    add: async (chemical) => {
      await withTimeout(setDoc(doc(firestore, 'chemicals', chemical.formula), chemical));
    },
    delete: async (formula) => {
      await withTimeout(deleteDoc(doc(firestore, 'chemicals', formula)));
    },
    get: async (formula) => {
      const d = await withTimeout(getDoc(doc(firestore, 'chemicals', formula)));
      return d.exists() ? d.data() : null;
    },
    count: async () => {
      const snap = await withTimeout(getDocs(collection(firestore, 'chemicals')));
      return snap.size;
    }
  },
  scientists: {
    add: async (scientist) => {
      const ref = await withTimeout(addDoc(collection(firestore, 'scientists'), scientist));
      return ref.id;
    },
    update: async (id, data) => {
      await withTimeout(updateDoc(doc(firestore, 'scientists', String(id)), data));
    },
    delete: async (id) => {
      await withTimeout(deleteDoc(doc(firestore, 'scientists', String(id))));
    },
    get: async (id) => {
      const d = await withTimeout(getDoc(doc(firestore, 'scientists', String(id))));
      return d.exists() ? { id: d.id, ...d.data() } : null;
    },
    where: (field) => {
      return {
        equals: (value) => {
          return {
            first: async () => {
              const q = query(collection(firestore, 'scientists'), where(field, '==', value));
              const snap = await withTimeout(getDocs(q));
              if (snap.empty) return null;
              return { id: snap.docs[0].id, ...snap.docs[0].data() };
            }
          }
        }
      }
    },
    count: async () => {
      const snap = await withTimeout(getDocs(collection(firestore, 'scientists')));
      return snap.size;
    }
  },
  usage_logs: {
    add: async (log) => {
      await withTimeout(addDoc(collection(firestore, 'usage_logs'), log));
    },
    update: async (id, data) => {
      await withTimeout(updateDoc(doc(firestore, 'usage_logs', String(id)), data));
    }
  }
};
