import { useState } from 'react';
import { db, useLiveCollection } from '../db';
import { Activity, Check, Search, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function UsageTracking() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'master';

  const [logEntry, setLogEntry] = useState({
    itemType: 'chemical',
    itemId: '',
    scientistId: isAdmin ? '' : user.id,
    borrowDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    notes: ''
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch data
  const chemicals = useLiveCollection('chemicals');
  const devices = useLiveCollection('devices');
  const scientists = useLiveCollection('scientists');
  const usageLogsRawData = useLiveCollection('usage_logs');

  if (!chemicals || !devices || !scientists || !usageLogsRawData) {
    return <div className="page-content container">Loading...</div>;
  }

  // Map related data to logs
  const usageLogsRaw = [...usageLogsRawData].sort((a,b) => new Date(b.borrowDate).getTime() - new Date(a.borrowDate).getTime());
  
  const usageLogs = usageLogsRaw.map(log => {
    const isDevice = log.itemType === 'device';
    const chem = chemicals.find(c => c.formula === log.chemicalFormula || c.formula === log.itemId);
    const dev = devices.find(d => String(d.id) === String(log.itemId));
    
    const itemName = isDevice ? (dev ? dev.name : 'Unknown Device') : (chem ? chem.name : 'Unknown Chemical');
    const itemIdentifier = isDevice ? (dev ? dev.serialNumber : log.itemId) : (log.chemicalFormula || log.itemId);
    
    const scientist = scientists.find(s => String(s.id) === String(log.scientistId));
    
    // Determine if overdue dynamically
    const isOverdue = log.status === 'In Use' && log.dueDate && new Date(log.dueDate) < new Date();
    // Approaching due date (within 2 days)
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    const isApproaching = log.status === 'In Use' && log.dueDate && !isOverdue && new Date(log.dueDate) <= twoDaysFromNow;

    return {
      ...log,
      chemicalName: itemName,
      chemicalFormula: itemIdentifier,
      scientistName: scientist ? scientist.name : 'Unknown',
      computedStatus: isOverdue ? 'Overdue' : log.status,
      isApproaching
    };
  });

  // Filter logs for tracking table
  const trackingLogs = usageLogs.filter(log => {
    if (!isAdmin && String(log.scientistId) !== String(user.id)) return false;
    
    // Hide pending/rejected from the main tracking table for admins
    // Scientists can see their pending/rejected requests in their table
    if (isAdmin && (log.status === 'Pending' || log.status === 'Rejected')) return false;

    const matchesSearch = 
      log.chemicalFormula.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.scientistName.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (statusFilter === 'All') return true;
    if (statusFilter === 'Overdue') return log.computedStatus === 'Overdue';
    if (statusFilter === 'In Use') return log.status === 'In Use' && log.computedStatus !== 'Overdue';
    return log.status === statusFilter;
  });

  const pendingRequests = usageLogs.filter(log => log.status === 'Pending');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!logEntry.itemId || !logEntry.dueDate) return;

    const previousUsageCount = usageLogsRaw.filter(log => String(log.scientistId) === String(user.id) && (log.itemId === logEntry.itemId || log.chemicalFormula === logEntry.itemId)).length;
    if (previousUsageCount > 0 && !window.confirm(`You have already registered usage for this item ${previousUsageCount} time(s) before. Do you want to register it again?`)) {
      return;
    }

    try {
      await db.usage_logs.add({
        ...logEntry,
        // Keep chemicalFormula for backward compatibility
        chemicalFormula: logEntry.itemType === 'chemical' ? logEntry.itemId : '',
        scientistId: isAdmin ? String(logEntry.scientistId) : String(user.id),
        status: isAdmin ? 'In Use' : 'Pending',
        borrowDate: new Date(logEntry.borrowDate).toISOString(),
        dueDate: new Date(logEntry.dueDate).toISOString(),
      });
      setSuccessMsg(isAdmin ? 'Registration assigned successfully!' : 'Registration requested successfully!');
      setLogEntry({ ...logEntry, itemId: '', notes: '' });
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

  const handleApprove = async (id) => {
    if (!isAdmin) return;
    try {
      await db.usage_logs.update(id, {
        status: 'In Use',
        borrowDate: new Date().toISOString() // Start usage from approval time
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleReject = async (id) => {
    if (!isAdmin) return;
    try {
      await db.usage_logs.update(id, {
        status: 'Rejected'
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>{isAdmin ? 'Usage Registration' : 'My Usage Registrations'}</h1>

      {isAdmin && pendingRequests.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem', borderLeft: '4px solid #F6E05E' }}>
          <div className="card-header">
            <h2 className="card-title">Pending Requests ({pendingRequests.length})</h2>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Item Registered</th>
                  <th>Scientist</th>
                  <th>Requested Due Date</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map(req => (
                  <tr key={req.id}>
                    <td>
                      <strong>{req.chemicalFormula}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{req.chemicalName}</div>
                    </td>
                    <td>{req.scientistName}</td>
                    <td>{new Date(req.dueDate).toLocaleDateString()}</td>
                    <td style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{req.notes || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-primary" style={{ padding: '0.4rem 0.5rem', display: 'flex', alignItems: 'center' }} onClick={() => handleApprove(req.id)} title="Approve">
                          <Check size={14} />
                        </button>
                        <button className="btn btn-danger" style={{ padding: '0.4rem 0.5rem', display: 'flex', alignItems: 'center' }} onClick={() => handleReject(req.id)} title="Reject">
                          <X size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="two-col-grid" style={isAdmin ? { gridTemplateColumns: '1fr 2.5fr' } : { gridTemplateColumns: '1fr 2.5fr' }}>
        
        {/* Form - Shared but labels differ */}
        <div className="card" style={{ alignSelf: 'start' }}>
          <div className="card-header">
            <h2 className="card-title"><Activity size={20} /> {isAdmin ? 'Assign Registration' : 'Submit Registration'}</h2>
          </div>

          {successMsg && (
            <div style={{ backgroundColor: '#C6F6D5', color: '#22543D', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {isAdmin && (
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
            )}

            <div className="form-group" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="radio" name="itemType" checked={logEntry.itemType === 'chemical'} onChange={() => setLogEntry({...logEntry, itemType: 'chemical', itemId: ''})} /> Chemical
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="radio" name="itemType" checked={logEntry.itemType === 'device'} onChange={() => setLogEntry({...logEntry, itemType: 'device', itemId: ''})} /> Device
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">{logEntry.itemType === 'chemical' ? 'Select Chemical' : 'Select Device'}</label>
              <select 
                className="form-control" 
                required
                value={logEntry.itemId}
                onChange={e => setLogEntry({...logEntry, itemId: e.target.value})}
              >
                <option value="">Choose...</option>
                {logEntry.itemType === 'chemical' && chemicals.map(c => (
                  <option key={c.formula} value={c.formula}>{c.formula} - {c.name}</option>
                ))}
                {logEntry.itemType === 'device' && devices.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.serialNumber})</option>
                ))}
              </select>
              {logEntry.itemId && usageLogsRaw.some(log => (log.itemId === logEntry.itemId || log.chemicalFormula === logEntry.itemId) && log.status === 'In Use') && (
                <div style={{ color: 'var(--accent)', fontSize: '0.875rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <X size={14} /> This item is currently in use by someone else.
                </div>
              )}
              {logEntry.itemId && usageLogsRaw.filter(log => String(log.scientistId) === String(user.id) && (log.itemId === logEntry.itemId || log.chemicalFormula === logEntry.itemId)).length > 0 && (
                <div style={{ color: '#D97706', fontSize: '0.875rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: '#FEF3C7', padding: '0.5rem', borderRadius: '4px' }}>
                  <Activity size={14} /> You have previously registered this item {usageLogsRaw.filter(log => String(log.scientistId) === String(user.id) && (log.itemId === logEntry.itemId || log.chemicalFormula === logEntry.itemId)).length} time(s).
                </div>
              )}
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

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={logEntry.itemId && usageLogsRaw.some(log => (log.itemId === logEntry.itemId || log.chemicalFormula === logEntry.itemId) && log.status === 'In Use')}>
              {isAdmin ? 'Assign Registration' : 'Submit Registration'}
            </button>
          </form>
        </div>

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
                <option value="Pending">Pending</option>
                <option value="Overdue">Overdue</option>
                <option value="Returned">Returned</option>
                {!isAdmin && <option value="Rejected">Rejected</option>}
              </select>
            </div>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Item</th>
                  {isAdmin && <th>Scientist</th>}
                  <th>Timeline</th>
                  <th>Notes</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {trackingLogs.length > 0 ? (
                  trackingLogs.map(log => (
                    <tr key={log.id} style={{ 
                      backgroundColor: log.computedStatus === 'Overdue' ? 'rgba(254, 215, 215, 0.2)' : 
                                       log.isApproaching ? 'rgba(254, 252, 191, 0.2)' : 'transparent',
                      opacity: (log.status === 'Pending' || log.status === 'Rejected') ? 0.7 : 1
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
                      <td style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{log.notes || '-'}</td>
                      <td>
                        <span className={`badge ${
                          log.computedStatus === 'Overdue' ? 'badge-overdue' : 
                          log.status === 'Returned' ? 'badge-available' : 
                          log.status === 'Pending' ? 'badge-warning' :
                          log.status === 'Rejected' ? 'badge-overdue' :
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
                    <td colSpan={isAdmin ? 6 : 5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
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
