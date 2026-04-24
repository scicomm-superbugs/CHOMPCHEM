import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { UserPlus, Search, User, Trash2 } from 'lucide-react';

export default function Scientists() {
  const [scientist, setScientist] = useState({
    name: '',
    department: '',
    employeeId: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const scientists = useLiveQuery(() => db.scientists.toArray()) || [];
  
  const filteredScientists = scientists.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.department && s.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await db.scientists.add(scientist);
      setSuccessMsg(`Registered ${scientist.name}`);
      setScientist({ name: '', department: '', employeeId: '' });
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error("Error adding scientist:", error);
    }
  };

  const handleDelete = async (id, name, role) => {
    if (role === 'admin') {
      alert("Cannot delete administrator accounts.");
      return;
    }
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await db.scientists.delete(id);
      } catch (err) {
        console.error('Failed to delete scientist:', err);
      }
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Scientist Directory</h1>

      <div className="two-col-grid">
        {/* Registration Form */}
        <div className="card" style={{ alignSelf: 'start' }}>
          <div className="card-header">
            <h2 className="card-title"><UserPlus size={20} /> Register Scientist</h2>
          </div>

          {successMsg && (
            <div style={{ backgroundColor: '#C6F6D5', color: '#22543D', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>
              {successMsg}
            </div>
          )}

          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input 
                type="text" 
                className="form-control" 
                required
                value={scientist.name}
                onChange={e => setScientist({...scientist, name: e.target.value})}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Department (Optional)</label>
              <input 
                type="text" 
                className="form-control" 
                value={scientist.department}
                onChange={e => setScientist({...scientist, department: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Employee ID (Optional)</label>
              <input 
                type="text" 
                className="form-control" 
                value={scientist.employeeId}
                onChange={e => setScientist({...scientist, employeeId: e.target.value})}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Add Scientist
            </button>
          </form>
        </div>

        {/* Directory List */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Directory ({filteredScientists.length})</h2>
          </div>

          <div className="search-box">
            <Search size={18} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search scientists..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>ID</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredScientists.length > 0 ? (
                  filteredScientists.map(s => (
                    <tr key={s.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ backgroundColor: 'var(--secondary)', padding: '0.5rem', borderRadius: '50%', color: 'var(--primary)' }}>
                            <User size={16} />
                          </div>
                          <strong>{s.name}</strong>
                        </div>
                      </td>
                      <td>{s.username || '-'}</td>
                      <td>
                        <span className={`badge ${s.role === 'admin' ? 'badge-in-use' : 'badge-available'}`}>
                          {s.role || 'scientist'}
                        </span>
                      </td>
                      <td>{s.department || '-'}</td>
                      <td>{s.employeeId || '-'}</td>
                      <td>
                        {s.role !== 'admin' && (
                          <button 
                            className="btn btn-danger" 
                            style={{ padding: '0.4rem 0.5rem', display: 'flex', alignItems: 'center' }} 
                            onClick={() => handleDelete(s.id, s.name, s.role)} 
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No scientists found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
