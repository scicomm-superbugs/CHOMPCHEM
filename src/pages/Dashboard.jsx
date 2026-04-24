import { db, useLiveCollection } from '../db';
import { Beaker, Users, Activity, AlertTriangle, Check, ShieldOff } from 'lucide-react';
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
    if (points >= 500) return { name: 'Lab Legend', color: '#805AD5', emoji: '🏆' };
    if (points >= 300) return { name: 'Expert', color: '#DD6B20', emoji: '🔥' };
    if (points >= 150) return { name: 'Senior Scientist', color: '#3182CE', emoji: '⭐' };
    if (points >= 50) return { name: 'Researcher', color: '#38A169', emoji: '🔬' };
    return { name: 'Novice', color: '#A0AEC0', emoji: '🌱' };
  };

  const leaderboardRaw = scientistsData
    .map(s => {
      if (s.role === 'master') {
        return { ...s, points: '99999999999+', rank: { name: 'Lab Master', color: '#D69E2E', emoji: '👑' }, numericPoints: Infinity };
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
    if (s.privacySettings?.hideName) {
      updated.name = 'Anonymous Scientist';
      updated.avatar = null;
    }
    if (s.privacySettings?.hideScore) {
      updated.points = '***';
    }
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
      alert(`Update Failed: ${err.message}`);
    }
  };

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

  const getMedalStyle = (idx, role) => {
    if (role === 'master') return { bg: 'linear-gradient(135deg, #F6E05E, #ECC94B)', color: '#744210', shadow: '0 2px 8px rgba(236,201,75,0.4)' };
    if (idx === 0) return { bg: 'linear-gradient(135deg, #F6E05E, #D69E2E)', color: '#744210', shadow: '0 2px 8px rgba(214,158,46,0.4)' };
    if (idx === 1) return { bg: 'linear-gradient(135deg, #E2E8F0, #CBD5E0)', color: '#4A5568', shadow: '0 2px 8px rgba(203,213,224,0.4)' };
    if (idx === 2) return { bg: 'linear-gradient(135deg, #ED8936, #DD6B20)', color: 'white', shadow: '0 2px 8px rgba(237,137,54,0.4)' };
    return { bg: 'var(--secondary)', color: 'var(--text-muted)', shadow: 'none' };
  };

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>{isAdmin ? '📊 Laboratory Dashboard' : '📊 My Dashboard'}</h1>
      
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
            <p>{isAdmin ? 'Overdue Chemicals' : 'My Overdue'}</p>
            <h3 style={{ color: 'var(--accent)' }}>{stats.overdue}</h3>
          </div>
        </div>
      </div>

      <div className="two-col-grid">
        {/* Leaderboard Card */}
        <div className="card" style={{ alignSelf: 'start', padding: 0, overflow: 'hidden' }}>
          {/* Header with gradient */}
          <div style={{ background: 'linear-gradient(135deg, #1A365D, #2A4365)', padding: '1.25rem 1.5rem', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h2 style={{ color: 'white', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                🏅 Top Scientists
              </h2>
              <div style={{ fontSize: '0.7rem', backgroundColor: 'rgba(128,90,213,0.9)', color: 'white', padding: '0.25rem 0.6rem', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                🤝 Team: {stats.totalTeamScore.toLocaleString()}
              </div>
            </div>

            {/* Your rank section */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: '8px', padding: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>🎯 Your Rank</span>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button 
                    onClick={() => handleTogglePrivacy('hideName')}
                    className={`privacy-btn ${currentUserRank?.privacySettings?.hideName ? 'active' : ''}`}
                    style={!currentUserRank?.privacySettings?.hideName ? { background: 'rgba(255,255,255,0.15)', color: 'white', borderColor: 'rgba(255,255,255,0.3)' } : {}}
                  >
                    {currentUserRank?.privacySettings?.hideName ? <Check size={10} /> : <ShieldOff size={10} />}
                    {currentUserRank?.privacySettings?.hideName ? '✅ Name Hidden' : 'Hide Name'}
                  </button>
                  <button 
                    onClick={() => handleTogglePrivacy('hideScore')}
                    className={`privacy-btn ${currentUserRank?.privacySettings?.hideScore ? 'active' : ''}`}
                    style={!currentUserRank?.privacySettings?.hideScore ? { background: 'rgba(255,255,255,0.15)', color: 'white', borderColor: 'rgba(255,255,255,0.3)' } : {}}
                  >
                    {currentUserRank?.privacySettings?.hideScore ? <Check size={10} /> : <ShieldOff size={10} />}
                    {currentUserRank?.privacySettings?.hideScore ? '✅ Score Hidden' : 'Hide Score'}
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '1.1rem' }}>{currentUserRank?.rank.emoji} {currentUserRank?.rank.name}</strong>
                <span style={{ backgroundColor: currentUserRank?.rank.color, color: 'white', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  {currentUserRank?.points} PTS
                </span>
              </div>
            </div>
          </div>

          {/* Leaderboard List */}
          <div style={{ padding: '0.75rem 0' }}>
            {leaderboard.slice(0, 6).map((s, idx) => {
              const medal = getMedalStyle(idx, s.role);
              const displayIdx = s.role === 'master' ? '👑' : (idx + (leaderboard[0]?.role === 'master' ? 0 : 1));
              const isAnon = s.name === 'Anonymous Scientist';
              
              return (
                <div key={s.id} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem', 
                  padding: '0.6rem 1.25rem',
                  transition: 'background 0.2s',
                  cursor: 'default',
                  borderBottom: '1px solid #f7f7f7'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f7fafc'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ 
                    width: '30px', height: '30px', borderRadius: '50%', 
                    background: medal.bg, 
                    color: medal.color, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    fontWeight: 'bold', fontSize: '0.8rem',
                    boxShadow: medal.shadow,
                    flexShrink: 0
                  }}>
                    {displayIdx}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', fontStyle: isAnon ? 'italic' : 'normal', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.name}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: s.rank.color, fontWeight: 500 }}>
                      {s.rank.emoji} {s.rank.name}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: s.role === 'master' ? '#D69E2E' : 'var(--text-main)', flexShrink: 0 }}>
                    {s.points}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title"><Activity size={20} /> {isAdmin ? '📋 Recent Items' : '📋 My Activity'}</h2>
            <Link to="/tracking" className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>View All</Link>
          </div>
        
        {stats.recentLogs.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {stats.recentLogs.map(log => (
              <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.75rem', backgroundColor: '#f7fafc', borderRadius: '8px', border: '1px solid #edf2f7' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: log.status === 'In Use' ? '#BEE3F8' : '#C6F6D5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1rem' }}>
                  🧪
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.chemicalFormula}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {log.chemicalName} {isAdmin && `• ${log.scientistName}`}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span className={`badge ${log.status === 'In Use' ? 'badge-in-use' : 'badge-available'}`} style={{ fontSize: '0.6rem' }}>{log.status}</span>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '2px' }}>{new Date(log.borrowDate).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>No records found.</p>
        )}
        </div>
      </div>
    </div>
  );
}
