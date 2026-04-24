import { db } from '../db';
import { chemicalDictionary } from './chemicalDictionary';
import bcrypt from 'bcryptjs';

export async function seedDatabase() {
  try {
    // Seed Chemicals
    const chemCount = await db.chemicals.count();
    if (chemCount === 0) {
      for (const formula of ['H2O', 'NaCl', 'C6H12O6']) {
        const chem = chemicalDictionary.find(c => c.formula === formula);
        if (chem) {
          await db.chemicals.add(chem);
        }
      }
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
      const salt = await bcrypt.genSalt(4);
      const hash = await bcrypt.hash('password', salt);
      
      const s1 = await db.scientists.add({ username: 'sconnor', passwordHash: hash, name: 'Dr. Sarah Connor', department: 'Analytical Chemistry', employeeId: 'EMP001', role: 'scientist' });
      const s2 = await db.scientists.add({ username: 'ebrown', passwordHash: hash, name: 'Dr. Emmett Brown', department: 'Physical Chemistry', employeeId: 'EMP002', role: 'scientist' });
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const pastDue = new Date();
      pastDue.setDate(pastDue.getDate() - 2);

      await db.usage_logs.add({
        chemicalFormula: 'H2O',
        scientistId: s1,
        borrowDate: yesterday.toISOString(),
        dueDate: tomorrow.toISOString(),
        status: 'In Use',
        notes: 'Solvent preparation'
      });

      await db.usage_logs.add({
        chemicalFormula: 'NaCl',
        scientistId: s2,
        borrowDate: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(),
        dueDate: pastDue.toISOString(),
        status: 'In Use',
        notes: 'Saline solution'
      });
    }
  } catch (err) {
    console.error('Error seeding database:', err);
  }
}
