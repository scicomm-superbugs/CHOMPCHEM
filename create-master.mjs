import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, query, where } from "firebase/firestore";
import bcrypt from 'bcryptjs';

const firebaseConfig = {
  apiKey: "AIzaSyC1GvAMikaE9AbbHHJE_Ivqe49Se4FcX-o",
  authDomain: "chompchem.firebaseapp.com",
  projectId: "chompchem",
  storageBucket: "chompchem.firebasestorage.app",
  messagingSenderId: "379599502348",
  appId: "1:379599502348:web:d1be32d868ac2a813f0229",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  const collectionName = "aiuscicomm_scientists";
  const q = query(collection(db, collectionName), where("username", "==", "master"));
  const snap = await getDocs(q);

  if (!snap.empty) {
    console.log("Master account already exists in", collectionName);
    process.exit(0);
  }

  const salt = await bcrypt.genSalt(4);
  const hash = await bcrypt.hash("master", salt);

  await addDoc(collection(db, collectionName), {
    username: "master",
    passwordHash: hash,
    name: "AIU SciComm Master",
    email: "master@aiuscicomm.edu",
    department: "System Administration",
    role: "master",
    accountStatus: "active",
    employeeId: "AIU-SCI-001",
    profileViews: 0
  });

  console.log("Successfully created Master account for", collectionName);
  process.exit(0);
}

main().catch(console.error);
