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
  
// Data Access Object (DAO) to minimize component refactoring
export const db = {
  chemicals: {
    add: async (chemical) => {
      await setDoc(doc(firestore, 'chemicals', chemical.formula), chemical);
    },
    delete: async (formula) => {
      await deleteDoc(doc(firestore, 'chemicals', formula));
    },
    get: async (formula) => {
      const d = await getDoc(doc(firestore, 'chemicals', formula));
      return d.exists() ? d.data() : null;
    },
    count: async () => {
      const snap = await getDocs(collection(firestore, 'chemicals'));
      return snap.size;
    }
  },
  scientists: {
    add: async (scientist) => {
      const ref = await addDoc(collection(firestore, 'scientists'), scientist);
      return ref.id;
    },
    update: async (id, data) => {
      await updateDoc(doc(firestore, 'scientists', String(id)), data);
    },
    delete: async (id) => {
      await deleteDoc(doc(firestore, 'scientists', String(id)));
    },
    get: async (id) => {
      const d = await getDoc(doc(firestore, 'scientists', String(id)));
      return d.exists() ? { id: d.id, ...d.data() } : null;
    },
    where: (field) => {
      return {
        equals: (value) => {
          return {
            first: async () => {
              const q = query(collection(firestore, 'scientists'), where(field, '==', value));
              const snap = await getDocs(q);
              if (snap.empty) return null;
              return { id: snap.docs[0].id, ...snap.docs[0].data() };
            }
          }
        }
      }
    },
    count: async () => {
      const snap = await getDocs(collection(firestore, 'scientists'));
      return snap.size;
    }
  },
  usage_logs: {
    add: async (log) => {
      await addDoc(collection(firestore, 'usage_logs'), log);
    },
    update: async (id, data) => {
      await updateDoc(doc(firestore, 'usage_logs', String(id)), data);
    }
  }
};
