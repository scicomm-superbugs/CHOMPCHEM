import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Beaker, Users, Activity, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const stats = useLiveQuery(async () => {
    const chemicals = await db.chemicals.count();
    
    // Filter by user if not admin
    let usageLogsQuery = db.usage_logs;
    if (!isAdmin) {
      usageLogsQuery = db.usage_logs.where('scientistId').equals(user.id);
    }

    const activeLogs = await usageLogsQuery.filter(log => log.status === 'In Use').toArray();
    const activeUsage = activeLogs.length;
    
    const now = new Date().toISOString();
    const overdueLogs = activeLogs.filter(log => log.dueDate < now);
    const overdue = overdueLogs.length;

    let recentLogsQuery = db.usage_logs.orderBy('borrowDate').reverse();
    const allRecentLogs = await recentLogsQuery.toArray();
    
    // Filter for scientist manually since we ordered by borrowDate
    const recentLogs = isAdmin 
      ? allRecentLogs.slice(0, 5)
      : allRecentLogs.filter(log => log.scientistId === user.id).slice(0, 5);

    // Map chemical details for recent logs
    const recentWithDetails = await Promise.all(
      recentLogs.map(async (log) => {
        const chem = await db.chemicals.get(log.chemicalFormula);
        const scientist = await db.scientists.get(log.scientistId);
        return {
          ...log,
          chemicalName: chem?.name || log.chemicalFormula,
          scientistName: scientist?.name || 'Unknown'
        };
      })
    );

    return { chemicals, activeUsage, overdue, recentLogs: recentWithDetails };
  }, [user]);

  if (!stats) return <div className="page-content container">Loading dashboard...</div>;

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
