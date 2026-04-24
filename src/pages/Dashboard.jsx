import { useLiveCollection } from '../db';
import { Beaker, Users, Activity, AlertTriangle, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'master';

  const chemicalsData = useLiveCollection('chemicals');
  const usageLogsData = useLiveCollection('usage_logs');
  const scientistsData = useLiveCollection('scientists');
  const tasksData = useLiveCollection('tasks');
  const devicesData = useLiveCollection('devices');

  if (!chemicalsData || !usageLogsData || !scientistsData || !tasksData || !devicesData) {
    return <div className="page-content container">Loading dashboard...</div>;
  }

  // Calculate points and ranks for Leaderboard
  const getRank = (points) => {
    if (points >= 300) return { name: 'Lab Legend', color: '#805AD5' };
    if (points >= 150) return { name: 'Senior Scientist', color: '#3182CE' };
    if (points >= 50) return { name: 'Researcher', color: '#38A169' };
    return { name: 'Novice', color: '#A0AEC0' };
  };

  const leaderboardRaw = scientistsData
    .map(s => {
      if (s.role === 'master') {
        return { ...s, points: '99999999999+', rank: { name: 'Lab Master', color: '#D69E2E' }, numericPoints: Infinity };
      }
      const usagePoints = usageLogsData.filter(log => String(log.scientistId) === String(s.id)).length * 10;
      const taskPoints = tasksData.filter(t => String(t.assignedTo) === String(s.id) && t.status === 'Completed').length * 50;
      const totalPoints = usagePoints + taskPoints;
      return { ...s, points: totalPoints, rank: getRank(totalPoints), numericPoints: totalPoints };
    })
    .sort((a,b) => b.numericPoints - a.numericPoints);

  const leaderboard = leaderboardRaw.map(s => {
    if (s.hideFromLeaderboard && String(s.id) !== String(user.id) && s.role !== 'master') {
      return { ...s, name: 'Anonymous Scientist', points: '***', avatar: null };
    }
    return s;
  });

  const currentUserRank = leaderboardRaw.find(s => String(s.id) === String(user.id));

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

  const totalTeamScore = leaderboardRaw
    .filter(s => s.role !== 'master')
    .reduce((sum, s) => sum + s.numericPoints, 0);

  const stats = {
    chemicals: chemicalsData.length,
    activeUsage,
    overdue,
    recentLogs: recentWithDetails,
    totalTeamScore
  };

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>{isAdmin ? 'Laboratory Dashboard' : 'My Dashboard'}</h1>
      
      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-icon"><Beaker size={24} /></div>
          <div className="stat-content">
            <p>Total Registered Items</p>
            <h3>{stats.chemicals + devicesData.length}</h3>
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

        <div className="stat-card" style={{ borderLeft: '4px solid #805AD5' }}>
          <div className="stat-icon" style={{ color: '#805AD5' }}><Crown size={24} /></div>
          <div className="stat-content">
            <p>Total Team Points</p>
            <h3 style={{ color: '#805AD5' }}>{stats.totalTeamScore.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      <div className="two-col-grid" style={{ gridTemplateColumns: '1fr 2fr' }}>
        {/* Leaderboard Card */}
        <div className="card" style={{ alignSelf: 'start' }}>
          <div className="card-header">
            <h2 className="card-title"><Users size={20} /> Top Scientists</h2>
          </div>
          <div style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Your Rank</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
              <strong style={{ fontSize: '1.25rem' }}>{currentUserRank?.rank.name}</strong>
              <span className="badge" style={{ backgroundColor: currentUserRank?.rank.color, color: 'white' }}>{currentUserRank?.points} pts</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {leaderboard.slice(0, 5).map((s, idx) => {
              const displayIdx = s.role === 'master' ? '👑' : idx + (leaderboard[0]?.role === 'master' ? 0 : 1);
              return (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: s.role === 'master' ? '#F6E05E' : idx === 0 ? '#F6E05E' : idx === 1 ? '#E2E8F0' : idx === 2 ? '#ED8936' : 'var(--secondary)', color: s.role === 'master' || idx < 3 ? 'black' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.875rem' }}>
                  {displayIdx}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', fontStyle: s.name === 'Anonymous Scientist' ? 'italic' : 'normal' }}>{s.name}</div>
                  <div style={{ fontSize: '0.75rem', color: s.rank.color, fontWeight: 500 }}>{s.rank.name}</div>
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>{s.points}</div>
              </div>
            )})}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title"><Activity size={20} /> {isAdmin ? 'Recently Used Items' : 'My Recent Activity'}</h2>
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
          <p style={{ color: 'var(--text-muted)' }}>No usage records found. {isAdmin ? 'Start tracking item usage' : 'You have no assigned items'}.</p>
        )}
        </div>
      </div>
    </div>
  );
}
