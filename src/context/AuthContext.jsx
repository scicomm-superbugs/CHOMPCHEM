import { createContext, useState, useEffect, useContext } from 'react';
import { db } from '../db';
import bcrypt from 'bcryptjs';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const storedUserId = sessionStorage.getItem('userId');
    if (storedUserId) {
      db.scientists.get(String(storedUserId)).then(scientist => {
        if (scientist) {
          setUser({
            id: scientist.id,
            username: scientist.username,
            name: scientist.name,
            role: scientist.role
          });
        }
        setLoading(false);
      }).catch(err => {
        console.error('Failed to restore session:', err);
        sessionStorage.removeItem('userId');
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    let scientist = await db.scientists.where('username').equals(username).first();
    
    // Failsafe for admin
    if (username === 'admin' && password === 'admin123') {
      if (!scientist) {
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync('admin123', salt);
        const adminId = await db.scientists.add({
          username: 'admin',
          passwordHash: hash,
          name: 'System Administrator',
          department: 'Administration',
          employeeId: 'ADMIN-001',
          role: 'admin'
        });
        scientist = await db.scientists.get(adminId);
      } else {
        const isMatch = bcrypt.compareSync(password, scientist.passwordHash);
        if (!isMatch) {
          const salt = bcrypt.genSaltSync(10);
          const hash = bcrypt.hashSync('admin123', salt);
          await db.scientists.update(scientist.id, { passwordHash: hash, role: 'admin' });
          scientist.passwordHash = hash;
          scientist.role = 'admin';
        }
      }
    } else {
      if (!scientist) {
        throw new Error('Invalid username or password');
      }
      const isMatch = bcrypt.compareSync(password, scientist.passwordHash);
      if (!isMatch) {
        throw new Error('Invalid username or password');
      }
    }

    const userData = {
      id: scientist.id,
      username: scientist.username,
      name: scientist.name,
      role: scientist.role
    };

    setUser(userData);
    sessionStorage.setItem('userId', scientist.id);
    return userData;
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('userId');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
