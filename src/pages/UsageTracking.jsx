import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Activity, Check, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function UsageTracking() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [logEntry, setLogEntry] = useState({
    chemicalFormula: '',
    scientistId: '',
    borrowDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    notes: ''
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch data
  const chemicals = useLiveQuery(() => db.chemicals.toArray()) || [];
  const scientists = useLiveQuery(() => db.scientists.toArray()) || [];
  const usageLogsRaw = useLiveQuery(() => db.usage_logs.reverse().toArray()) || [];

  // Map related data to logs
  const usageLogs = usageLogsRaw.map(log => {
    const chem = chemicals.find(c => c.formula === log.chemicalFormula);
    const scientist = scientists.find(s => s.id === parseInt(log.scientistId));
    
    // Determine if overdue dynamically
    const isOverdue = log.status === 'In Use' && log.dueDate && new Date(log.dueDate) < new Date();
    // Approaching due date (within 2 days)
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    const isApproaching = log.status === 'In Use' && log.dueDate && !isOverdue && new Date(log.dueDate) <= twoDaysFromNow;

    return {
      ...log,
      chemicalName: chem ? chem.name : 'Unknown',
      scientistName: scientist ? scientist.name : 'Unknown',
      computedStatus: isOverdue ? 'Overdue' : log.status,
      isApproaching
    };
  });

  // Filter logs
  const filteredLogs = usageLogs.filter(log => {
    // If not admin, only show logs belonging to the user
    if (!isAdmin && log.scientistId !== user.id) {
      return false;
    }

    const matchesSearch = 
      log.chemicalFormula.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.scientistName.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (statusFilter === 'All') return true;
    if (statusFilter === 'Overdue') return log.computedStatus === 'Overdue';
    if (statusFilter === 'In Use') return log.status === 'In Use' && log.computedStatus !== 'Overdue';
    return log.status === statusFilter;
  });

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!isAdmin) return; // extra protection
    if (!logEntry.chemicalFormula || !logEntry.scientistId || !logEntry.dueDate) return;

    try {
      await db.usage_logs.add({
        ...logEntry,
        scientistId: parseInt(logEntry.scientistId),
        status: 'In Use',
        borrowDate: new Date(logEntry.borrowDate).toISOString(),
        dueDate: new Date(logEntry.dueDate).toISOString(),
      });
      setSuccessMsg('Chemical assigned successfully!');
      setLogEntry({ ...logEntry, chemicalFormula: '', notes: '' });
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
      console.error(error);
    }
  };

  const markReturned = async (id) => {
    try {
      await db.usage_logs.update(id, {
        status: 'Returned',
        returnDate: new Date().toISOString()
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>{isAdmin ? 'Usage Tracking' : 'My Chemicals'}</h1>

      <div className={isAdmin ? "two-col-grid" : ""} style={isAdmin ? { gridTemplateColumns: '1fr 2.5fr' } : {}}>
        
        {/* Assign Form - Admin Only */}
        {isAdmin && (
          <div className="card" style={{ alignSelf: 'start' }}>
            <div className="card-header">
              <h2 className="card-title"><Activity size={20} /> Assign Chemical</h2>
            </div>

            {successMsg && (
              <div style={{ backgroundColor: '#C6F6D5', color: '#22543D', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>
                {successMsg}
              </div>
            )}

            <form onSubmit={handleAssign}>
              <div className="form-group">
                <label className="form-label">Scientist</label>
                <select 
                  className="form-control" 
                  required
                  value={logEntry.scientistId}
                  onChange={e => setLogEntry({...logEntry, scientistId: e.target.value})}
                >
                  <option value="">Select Scientist...</option>
                  {scientists.map(s => (
                    <option key={s.id} value={s.id}>{s.name} {s.department ? `(${s.department})` : ''}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Chemical</label>
                <select 
                  className="form-control" 
                  required
                  value={logEntry.chemicalFormula}
                  onChange={e => setLogEntry({...logEntry, chemicalFormula: e.target.value})}
                >
                  <option value="">Select Chemical...</option>
                  {chemicals.map(c => (
                    <option key={c.formula} value={c.formula}>{c.formula} - {c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Borrow Date</label>
                <input 
                  type="date" 
                  className="form-control" 
                  required
                  value={logEntry.borrowDate}
                  onChange={e => setLogEntry({...logEntry, borrowDate: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input 
                  type="date" 
                  className="form-control" 
                  required
                  value={logEntry.dueDate}
                  onChange={e => setLogEntry({...logEntry, dueDate: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notes (Optional)</label>
                <textarea 
                  className="form-control" 
                  rows="2"
                  value={logEntry.notes}
                  onChange={e => setLogEntry({...logEntry, notes: e.target.value})}
                ></textarea>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Assign Usage
              </button>
            </form>
          </div>
        )}

        {/* Tracking List */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">{isAdmin ? 'Tracking Records' : 'My Records'}</h2>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div className="search-box" style={{ marginBottom: 0 }}>
                <Search size={16} />
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Search..." 
                  style={{ padding: '0.4rem 1rem 0.4rem 2rem', fontSize: '0.875rem' }}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <select 
                className="form-control" 
                style={{ width: 'auto', padding: '0.4rem 1rem', fontSize: '0.875rem' }}
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="In Use">In Use</option>
                <option value="Overdue">Overdue</option>
                <option value="Returned">Returned</option>
              </select>
            </div>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Chemical</th>
                  {isAdmin && <th>Scientist</th>}
                  <th>Timeline</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map(log => (
                    <tr key={log.id} style={{ 
                      backgroundColor: log.computedStatus === 'Overdue' ? 'rgba(254, 215, 215, 0.2)' : 
                                       log.isApproaching ? 'rgba(254, 252, 191, 0.2)' : 'transparent'
                    }}>
                      <td>
                        <strong>{log.chemicalFormula}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.chemicalName}</div>
                      </td>
                      {isAdmin && <td>{log.scientistName}</td>}
                      <td>
                        <div style={{ fontSize: '0.875rem' }}>Out: {new Date(log.borrowDate).toLocaleDateString()}</div>
                        <div style={{ fontSize: '0.875rem', color: log.computedStatus === 'Overdue' ? 'var(--accent)' : 'inherit', fontWeight: log.computedStatus === 'Overdue' ? 600 : 'normal' }}>
                          Due: {new Date(log.dueDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${
                          log.computedStatus === 'Overdue' ? 'badge-overdue' : 
                          log.status === 'Returned' ? 'badge-available' : 
                          log.isApproaching ? 'badge-warning' : 'badge-in-use'
                        }`}>
                          {log.computedStatus === 'Overdue' ? 'Overdue' : log.isApproaching ? 'Due Soon' : log.status}
                        </span>
                      </td>
                      <td>
                        {log.status === 'In Use' && (
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
                            onClick={() => markReturned(log.id)}
                          >
                            <Check size={14} /> Return
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={isAdmin ? 5 : 4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No tracking records found.
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
