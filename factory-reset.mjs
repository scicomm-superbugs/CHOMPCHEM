/**
 * FACTORY RESET SCRIPT
 * Deletes ALL data from Firestore except master accounts.
 * Covers both compchem (default) and alamein workspaces.
 */

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

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

// Collections to FULLY wipe (no exceptions)
const FULL_WIPE_COLLECTIONS = [
  // compchem (default workspace)
  "chemicals", "usage_logs", "devices", "equipment", "tasks", "messages",
  // alamein workspace
  "alamein_chemicals", "alamein_usage_logs", "alamein_devices", "alamein_equipment", "alamein_tasks", "alamein_messages",
];

// Collections where we keep master accounts
const SCIENTISTS_COLLECTIONS = ["scientists", "alamein_scientists"];

async function wipeCollection(collectionName) {
  const snap = await getDocs(collection(db, collectionName));
  if (snap.empty) {
    console.log(`  ⏭️  ${collectionName}: already empty`);
    return 0;
  }
  let count = 0;
  for (const d of snap.docs) {
    await deleteDoc(doc(db, collectionName, d.id));
    count++;
  }
  console.log(`  🗑️  ${collectionName}: deleted ${count} documents`);
  return count;
}

async function wipeScientistsKeepMaster(collectionName) {
  const snap = await getDocs(collection(db, collectionName));
  if (snap.empty) {
    console.log(`  ⏭️  ${collectionName}: already empty`);
    return 0;
  }
  let deleted = 0;
  let kept = 0;
  for (const d of snap.docs) {
    const data = d.data();
    if (data.role === "master") {
      kept++;
      console.log(`  👑 KEPT master: "${data.name}" (${data.username})`);
      continue;
    }
    await deleteDoc(doc(db, collectionName, d.id));
    deleted++;
  }
  console.log(`  🗑️  ${collectionName}: deleted ${deleted}, kept ${kept} master(s)`);
  return deleted;
}

async function main() {
  console.log("\n╔══════════════════════════════════════╗");
  console.log("║       🏭 FACTORY RESET STARTED       ║");
  console.log("╚══════════════════════════════════════╝\n");

  let totalDeleted = 0;

  console.log("── Full Wipe Collections ──");
  for (const col of FULL_WIPE_COLLECTIONS) {
    totalDeleted += await wipeCollection(col);
  }

  console.log("\n── Scientists (keeping masters) ──");
  for (const col of SCIENTISTS_COLLECTIONS) {
    totalDeleted += await wipeScientistsKeepMaster(col);
  }

  console.log("\n╔══════════════════════════════════════╗");
  console.log(`║  ✅ DONE — ${totalDeleted} documents deleted     ║`);
  console.log("╚══════════════════════════════════════╝\n");

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Factory reset failed:", err);
  process.exit(1);
});
