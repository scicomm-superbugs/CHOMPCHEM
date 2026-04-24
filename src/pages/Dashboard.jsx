import { db, useLiveCollection } from '../db';
import { Beaker, Activity, AlertTriangle, Check, ShieldOff, ArrowRight, Clock, FlaskConical, Layers } from 'lucide-react';
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

  const getRank = (points) => {
    if (points >= 500) return { name: 'Lab Legend', color: '#805AD5', emoji: '🏆' };
    if (points >= 300) return { name: 'Mad Scientist', color: '#DD6B20', emoji: '🧑‍🔬' };
    if (points >= 150) return { name: 'Chemical Warrior', color: '#3182CE', emoji: '⚔️' };
    if (points >= 50) return { name: 'Beaker Breaker', color: '#38A169', emoji: '🧪' };
    if (points >= 10) return { name: 'Lab Rat', color: '#718096', emoji: '🐀' };
    return { name: 'Baby Chemist', color: '#A0AEC0', emoji: '🍼' };
  };

  const leaderboardRaw = scientistsData
    .map(s => {
      if (s.role === 'master') {
        return { ...s, points: '∞', rank: { name: 'Lab Master', color: '#D69E2E', icon: '♛' }, numericPoints: Infinity };
      }
      const usagePoints = usageLogsData.filter(log => String(log.scientistId) === String(s.id)).length * 10;
      const taskPoints = tasksData.filter(t => String(t.assignedTo) === String(s.id) && t.status === 'Completed').length * 50;
      const totalPoints = usagePoints + taskPoints;
      return { ...s, points: totalPoints, rank: getRank(totalPoints), numericPoints: totalPoints };
    })
    .sort((a,b) => b.numericPoints - a.numericPoints);

  const leaderboard = leaderboardRaw.map(s => {
    if (String(s.id) === String(user.id) || s.role === 'master') return s;
    let updated = { ...s };
    if (s.privacySettings?.hideName) { updated.name = 'Anonymous'; updated.avatar = null; }
    if (s.privacySettings?.hideScore) { updated.points = '—'; }
    return updated;
  });

  const currentUserRank = leaderboardRaw.find(s => String(s.id) === String(user.id));

  const handleTogglePrivacy = async (field) => {
    if (!user?.id || !scientistsData) return;
    const currentData = scientistsData.find(s => String(s.id) === String(user.id));
    if (!currentData) return;
    const currentSettings = currentData.privacySettings || { hideName: false, hideScore: false };
    const newSettings = { ...currentSettings, [field]: !currentSettings[field] };
    try {
      await db.scientists.update(user.id, { privacySettings: newSettings });
    } catch (err) {
      console.error("Privacy update failed:", err);
    }
  };

  let filteredLogs = usageLogsData;
  if (!isAdmin) filteredLogs = usageLogsData.filter(log => String(log.scientistId) === String(user.id));

  const activeLogs = filteredLogs.filter(log => log.status === 'In Use');
  const now = new Date().toISOString();
  const overdue = activeLogs.filter(log => log.dueDate < now).length;

  const sortedLogs = [...filteredLogs].sort((a,b) => new Date(b.borrowDate).getTime() - new Date(a.borrowDate).getTime());
  const recentLogsRaw = sortedLogs.slice(0, 5);

  const recentWithDetails = recentLogsRaw.map(log => {
    const chem = chemicalsData.find(c => c.formula === log.chemicalFormula);
    const scientist = scientistsData.find(s => String(s.id) === String(log.scientistId));
    return { ...log, chemicalName: chem?.name || log.chemicalFormula, scientistName: scientist?.name || 'Unknown' };
  });

  const totalTeamScore = leaderboardRaw.filter(s => s.role !== 'master').reduce((sum, s) => sum + s.numericPoints, 0);

  const stats = { chemicals: chemicalsData.length, activeUsage: activeLogs.length, overdue, recentLogs: recentWithDetails, totalTeamScore };

  const getStatusColor = (status) => {
    const map = { 'In Use': '#3182CE', 'Returned': '#38A169', 'Pending': '#D69E2E', 'Overdue': '#E53E3E' };
    return map[status] || '#A0AEC0';
  };

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem', fontWeight: 700, letterSpacing: '-0.5px' }}>
        {isAdmin ? 'Laboratory Dashboard' : 'My Dashboard'}
      </h1>
      
      {/* Stats Row */}
      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-icon"><Layers size={22} /></div>
          <div className="stat-content">
            <p>Registered Items</p>
            <h3>{stats.chemicals + devicesData.length}</h3>
          </div>
        </div>
        <div className="stat-card active">
          <div className="stat-icon" style={{ color: 'var(--success)', backgroundColor: '#F0FFF4' }}><FlaskConical size={22} /></div>
          <div className="stat-content">
            <p>{isAdmin ? 'Active Records' : 'My Active'}</p>
            <h3>{stats.activeUsage}</h3>
          </div>
        </div>
        <div className="stat-card overdue">
          <div className="stat-icon" style={{ color: 'var(--accent)', backgroundColor: '#FFF5F5' }}><AlertTriangle size={22} /></div>
          <div className="stat-content">
            <p>Overdue</p>
            <h3 style={{ color: stats.overdue > 0 ? 'var(--accent)' : 'inherit' }}>{stats.overdue}</h3>
          </div>
        </div>
      </div>

      <div className="two-col-grid">
        {/* Leaderboard */}
        <div className="card" style={{ alignSelf: 'start', padding: 0, overflow: 'hidden' }}>
          <div style={{ background: 'linear-gradient(135deg, #1A365D, #2C5282)', padding: '1.25rem 1.5rem', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h2 style={{ color: 'white', fontSize: '1rem', fontWeight: 700, margin: 0, letterSpacing: '-0.3px' }}>
                Scientist Rankings
              </h2>
              <span style={{ fontSize: '0.65rem', backgroundColor: 'rgba(255,255,255,0.15)', padding: '0.2rem 0.55rem', borderRadius: '10px', fontWeight: 600 }}>
                Team {stats.totalTeamScore.toLocaleString()} pts
              </span>
            </div>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.7rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.7rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Your Rank</span>
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  <button onClick={() => handleTogglePrivacy('hideName')} className={`privacy-btn ${currentUserRank?.privacySettings?.hideName ? 'active' : ''}`} style={!currentUserRank?.privacySettings?.hideName ? { background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)', borderColor: 'rgba(255,255,255,0.2)' } : {}}>
                    {currentUserRank?.privacySettings?.hideName ? <><Check size={9} /> Hidden</> : <><ShieldOff size={9} /> Name</>}
                  </button>
                  <button onClick={() => handleTogglePrivacy('hideScore')} className={`privacy-btn ${currentUserRank?.privacySettings?.hideScore ? 'active' : ''}`} style={!currentUserRank?.privacySettings?.hideScore ? { background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)', borderColor: 'rgba(255,255,255,0.2)' } : {}}>
                    {currentUserRank?.privacySettings?.hideScore ? <><Check size={9} /> Hidden</> : <><ShieldOff size={9} /> Score</>}
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '1rem' }}>{currentUserRank?.rank.emoji} {currentUserRank?.rank.name}</strong>
                <span style={{ backgroundColor: currentUserRank?.rank.color, color: 'white', padding: '0.15rem 0.5rem', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 700 }}>
                  {currentUserRank?.points} pts
                </span>
              </div>
            </div>
          </div>

          <div style={{ padding: '0.25rem 0' }}>
            {leaderboard.slice(0, 6).map((s, idx) => {
              const pos = s.role === 'master' ? '👑' : (idx + (leaderboard[0]?.role === 'master' ? 0 : 1));
              const isTop3 = idx < 3 || s.role === 'master';
              const isFirst = idx === 0 && s.role !== 'master';
              return (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.55rem 1.25rem', borderBottom: '1px solid #f0f0f0', transition: 'background 0.15s', position: 'relative' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {isFirst && <div style={{ position: 'absolute', right: '10px', top: '5px', fontSize: '0.8rem' }}>🔥</div>}
                  <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: isTop3 ? s.rank.color : '#EDF2F7', color: isTop3 ? 'white' : '#718096', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.7rem', flexShrink: 0 }}>{pos}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: s.name === 'Anonymous' ? 'italic' : 'normal', color: 'var(--text-main)' }}>{s.name}</div>
                    <div style={{ fontSize: '0.65rem', color: s.rank.color, fontWeight: 600, letterSpacing: '0.2px' }}>{s.rank.emoji} {s.rank.name}</div>
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: s.role === 'master' ? s.rank.color : '#2D3748', fontFamily: 'monospace', flexShrink: 0 }}>{s.points}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title" style={{ fontWeight: 700, letterSpacing: '-0.3px' }}><Activity size={18} /> Recent Activity</h2>
            <Link to="/tracking" className="btn btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', fontWeight: 600 }}>View All <ArrowRight size={12} /></Link>
          </div>
        
        {stats.recentLogs.length > 0 ? (
          <div className="mobile-card-list">
            {stats.recentLogs.map(log => (
              <div key={log.id} className="mobile-list-item" style={{ borderLeft: `3px solid ${getStatusColor(log.status)}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)' }}>{log.chemicalFormula}</span>
                      <span className={`badge ${log.status === 'In Use' ? 'badge-in-use' : 'badge-available'}`}>{log.status}</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {log.chemicalName}{isAdmin && <span> · {log.scientistName}</span>}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: '#A0AEC0', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={10} /> {new Date(log.borrowDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
            <FlaskConical size={32} style={{ marginBottom: '0.5rem', opacity: 0.3 }} />
            <p style={{ fontSize: '0.85rem' }}>No activity records yet.</p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
