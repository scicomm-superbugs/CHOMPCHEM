import { db } from '../db';
import { chemicalDictionary } from './chemicalDictionary';
import bcrypt from 'bcryptjs';

export async function seedDatabase() {
  try {
    // Seed Chemicals
    const chemCount = await db.chemicals.count();
    if (chemCount === 0) {
      await db.chemicals.bulkAdd(chemicalDictionary.slice(0, 3)); // Add Water, NaCl, Glucose
    }

    // Check existing scientists
    const sciCount = await db.scientists.count();
    
    // Add Admin if not exists
    const adminExists = await db.scientists.where('username').equals('admin').first();
    if (!adminExists) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync('admin123', salt);
      await db.scientists.add({
        username: 'admin',
        passwordHash: hash,
        name: 'System Administrator',
        department: 'Administration',
        employeeId: 'ADMIN-001',
        role: 'admin'
      });
    }

    if (sciCount === 0) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync('password', salt);
      await db.scientists.bulkAdd([
        { username: 'sconnor', passwordHash: hash, name: 'Dr. Sarah Connor', department: 'Analytical Chemistry', employeeId: 'EMP001', role: 'scientist' },
        { username: 'ebrown', passwordHash: hash, name: 'Dr. Emmett Brown', department: 'Physical Chemistry', employeeId: 'EMP002', role: 'scientist' }
      ]);
    } else {
      // Ensure existing scientists have passwords
      const scientists = await db.scientists.toArray();
      const salt = bcrypt.genSaltSync(10);
      const defaultHash = bcrypt.hashSync('password', salt);
      for (const s of scientists) {
        if (!s.passwordHash && s.role !== 'admin') {
          await db.scientists.update(s.id, { passwordHash: defaultHash, username: s.username || s.name.toLowerCase().replace(/[^a-z0-9]/g, '') });
        }
      }
    }

    // Seed Usage Logs
    const logCount = await db.usage_logs.count();
    if (logCount === 0) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const pastDue = new Date();
      pastDue.setDate(pastDue.getDate() - 2);

      const scientists = await db.scientists.where('role').equals('scientist').toArray();

      if (scientists.length >= 2) {
        await db.usage_logs.bulkAdd([
          {
            chemicalFormula: 'H2O',
            scientistId: scientists[0].id,
            borrowDate: yesterday.toISOString(),
            dueDate: tomorrow.toISOString(),
            status: 'In Use',
            notes: 'Solvent preparation'
          },
          {
            chemicalFormula: 'NaCl',
            scientistId: scientists[1].id,
            borrowDate: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(),
            dueDate: pastDue.toISOString(),
            status: 'In Use',
            notes: 'Saline solution'
          }
        ]);
      }
    }
  } catch (err) {
    console.error('Error seeding database:', err);
  }
}
