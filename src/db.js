import Dexie from 'dexie';

export const db = new Dexie('CompChemDB');

db.version(1).stores({
  chemicals: 'formula, name, mw, smiles',
  scientists: '++id, name, department, employeeId',
  usage_logs: '++id, chemicalFormula, scientistId, borrowDate, dueDate, returnDate, status'
});

db.version(2).stores({
  // Adding unique username and role to scientists
  scientists: '++id, &username, name, department, employeeId, role'
}).upgrade(tx => {
  return tx.scientists.toCollection().modify(scientist => {
    // Migrate existing scientists
    if (!scientist.username) {
      scientist.username = scientist.name.toLowerCase().replace(/[^a-z0-9]/g, '') || `user_${scientist.id}`;
    }
    if (!scientist.role) {
      scientist.role = 'scientist';
    }
    // Password will be updated by sampleData seeder if they don't have one
  });
});
