import { useLiveCollection } from '../db';
import { Beaker, Users, Activity, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const chemicalsData = useLiveCollection('chemicals');
  const usageLogsData = useLiveCollection('usage_logs');
  const scientistsData = useLiveCollection('scientists');

  if (!chemicalsData || !usageLogsData || !scientistsData) {
    return <div className="page-content container">Loading dashboard...</div>;
  }

  let filteredLogs = usageLogsData;
  if (!isAdmin) {
    filteredLogs = usageLogsData.filter(log => String(log.scientistId) === String(user.id));
  }

  const activeLogs = filteredLogs.filter(log => log.status === 'In Use');
  const activeUsage = activeLogs.length;
  
  const now = new Date().toISOString();
  const overdueLogs = activeLogs.filter(log => log.dueDate < now);
  const overdue = overdueLogs.length;

  const sortedLogs = [...filteredLogs].sort((a,b) => new Date(b.borrowDate).getTime() - new Date(a.borrowDate).getTime()).reverse();
  const recentLogsRaw = sortedLogs.slice(0, 5);

  const recentWithDetails = recentLogsRaw.map(log => {
    const chem = chemicalsData.find(c => c.formula === log.chemicalFormula);
    const scientist = scientistsData.find(s => String(s.id) === String(log.scientistId));
    return {
      ...log,
      chemicalName: chem?.name || log.chemicalFormula,
      scientistName: scientist?.name || 'Unknown'
    };
  });

  const stats = {
    chemicals: chemicalsData.length,
    activeUsage,
    overdue,
    recentLogs: recentWithDetails
  };

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>{isAdmin ? 'Laboratory Dashboard' : 'My Dashboard'}</h1>
      
      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-icon"><Beaker size={24} /></div>
          <div className="stat-content">
            <p>Total Registered Chemicals</p>
            <h3>{stats.chemicals}</h3>
          </div>
        </div>
        
        <div className="stat-card active">
          <div className="stat-icon" style={{ color: 'var(--success)' }}><Activity size={24} /></div>
          <div className="stat-content">
            <p>{isAdmin ? 'Active Usage Records' : 'My Active Chemicals'}</p>
            <h3>{stats.activeUsage}</h3>
          </div>
        </div>
        
        <div className="stat-card overdue">
          <div className="stat-icon" style={{ color: 'var(--accent)' }}><AlertTriangle size={24} /></div>
          <div className="stat-content">
            <p>{isAdmin ? 'Overdue Chemicals' : 'My Overdue Chemicals'}</p>
            <h3 style={{ color: 'var(--accent)' }}>{stats.overdue}</h3>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title"><Activity size={20} /> {isAdmin ? 'Recently Used Chemicals' : 'My Recent Activity'}</h2>
          <Link to="/tracking" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>View All</Link>
        </div>
        
        {stats.recentLogs.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Chemical</th>
                  {isAdmin && <th>Scientist</th>}
                  <th>Borrow Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentLogs.map(log => (
                  <tr key={log.id}>
                    <td>
                      <span style={{ fontWeight: 600 }}>{log.chemicalFormula}</span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.chemicalName}</div>
                    </td>
                    {isAdmin && <td>{log.scientistName}</td>}
                    <td>{new Date(log.borrowDate).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${log.status === 'In Use' ? 'badge-in-use' : 'badge-available'}`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>No usage records found. {isAdmin ? 'Start tracking chemical usage' : 'You have no assigned chemicals'}.</p>
        )}
      </div>
    </div>
  );
}
