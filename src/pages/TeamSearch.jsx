import { useState, useEffect } from 'react';
import { db, useLiveCollection } from '../db';
import { Search, User, Shield, Crown, Eye, Mail, Building, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function TeamSearch() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  const scientists = useLiveCollection('scientists');
  const usageLogsData = useLiveCollection('usage_logs');
  const tasksData = useLiveCollection('tasks');

  if (!scientists || !usageLogsData || !tasksData) {
    return <div className="page-content container">Loading team...</div>;
  }

  const activeScientists = scientists.filter(s => s.accountStatus !== 'pending');

  const filtered = searchQuery.trim()
    ? activeScientists.filter(s => 
        s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.department?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : activeScientists;

  const getRank = (points, customTitle) => {
    const ranks = [
      { name: 'Lab Legend', color: '#805AD5', emoji: '🏆', req: 500 },
      { name: 'Mad Scientist', color: '#DD6B20', emoji: '🧑‍🔬', req: 300 },
      { name: 'Chemical Warrior', color: '#3182CE', emoji: '⚔️', req: 150 },
      { name: 'Beaker Breaker', color: '#38A169', emoji: '🧪', req: 50 },
      { name: 'Lab Rat', color: '#718096', emoji: '🐀', req: 10 },
      { name: 'Baby Chemist', color: '#A0AEC0', emoji: '🍼', req: 0 }
    ];
    let highestRank = ranks.find(r => points >= r.req);
    if (customTitle) {
      const customRank = ranks.find(r => r.name === customTitle && points >= r.req);
      if (customRank) return customRank;
    }
    return highestRank || ranks[ranks.length - 1];
  };

  const getUserPoints = (userId) => {
    const usagePoints = usageLogsData.filter(log => String(log.scientistId) === String(userId)).length * 10;
    const taskPoints = tasksData.filter(t => String(t.assignedTo) === String(userId) && t.status === 'Completed').length * 50;
    return usagePoints + taskPoints;
  };

  const handleViewProfile = async (scientist) => {
    setSelectedUser(scientist);

    // Increment profile views if viewing someone else's profile
    if (String(scientist.id) !== String(user.id)) {
      try {
        const currentViews = scientist.profileViews || 0;
        await db.scientists.update(scientist.id, { profileViews: currentViews + 1 });
      } catch (err) {
        console.error("Failed to track view:", err);
      }
    }
  };

  const getRoleIcon = (role) => {
    if (role === 'master') return '👑';
    if (role === 'admin') return '🛡️';
    return '🔬';
  };

  const getRoleLabel = (role) => {
    if (role === 'master') return 'Lab Master';
    if (role === 'admin') return 'Administrator';
    return 'Scientist';
  };

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>👥 Team Members</h1>

      {/* Search Bar */}
      <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input 
          type="text"
          className="form-control"
          placeholder="🔍 Search by name, username, email, or department \ lab..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ paddingLeft: '2.75rem', height: '44px' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        {/* Team List */}
        <div style={{ flex: '1', minWidth: '300px' }}>
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>📋 {filtered.length} Members Found</strong>
            </div>
            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {filtered.map(s => {
                const pts = s.role === 'master' ? '∞' : getUserPoints(s.id);
                const rank = s.role === 'master' ? { name: 'Lab Master', color: '#D69E2E', emoji: '👑' } : getRank(pts, s.selectedRankTitle);
                const isSelected = selectedUser && String(selectedUser.id) === String(s.id);

                return (
                  <div 
                    key={s.id}
                    onClick={() => handleViewProfile(s)}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.75rem', 
                      padding: '0.75rem 1.25rem',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f5f5f5',
                      backgroundColor: isSelected ? '#EBF8FF' : 'transparent',
                      borderLeft: isSelected ? '3px solid var(--primary)' : '3px solid transparent',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--secondary)'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    {s.avatar ? (
                      <img src={s.avatar} alt={s.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-color)', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                        <User size={20} />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {getRoleIcon(s.role)} {s.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: rank.color, fontWeight: 500 }}>
                        {rank.emoji} {rank.name}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.75rem', flexShrink: 0 }}>
                      <Eye size={12} /> {s.profileViews || 0}
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  🔍 No team members found matching your search.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Detail Panel */}
        <div style={{ flex: '0 0 350px', maxWidth: '100%' }}>
          {selectedUser ? (
            <div className="card" style={{ textAlign: 'center', position: 'sticky', top: '90px' }}>
              {/* Profile header */}
              <div style={{ marginBottom: '1.5rem' }}>
                {selectedUser.avatar ? (
                  <img src={selectedUser.avatar} alt={selectedUser.name} style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--primary)', margin: '0 auto 1rem' }} />
                ) : (
                  <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', border: '4px solid var(--primary)', margin: '0 auto 1rem' }}>
                    <User size={40} />
                  </div>
                )}
                <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.25rem' }}>{selectedUser.name}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                  {getRoleIcon(selectedUser.role)} {getRoleLabel(selectedUser.role)}
                </p>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ backgroundColor: 'var(--secondary)', borderRadius: '8px', padding: '0.75rem' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                    {selectedUser.role === 'master' ? '∞' : getUserPoints(selectedUser.id)}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>⭐ Points</div>
                </div>
                <div style={{ backgroundColor: 'var(--secondary)', borderRadius: '8px', padding: '0.75rem' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                    {selectedUser.profileViews || 0}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>👁️ Views</div>
                </div>
              </div>

              {/* Details */}
              <div style={{ textAlign: 'left', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                {selectedUser.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem', fontSize: '0.85rem' }}>
                    <Mail size={14} style={{ color: 'var(--text-muted)' }} />
                    <span>{selectedUser.email}</span>
                  </div>
                )}
                {selectedUser.department && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem', fontSize: '0.85rem' }}>
                    <Building size={14} style={{ color: 'var(--text-muted)' }} />
                    <span>{selectedUser.department}</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem', fontSize: '0.85rem' }}>
                  <Award size={14} style={{ color: 'var(--text-muted)' }} />
                  <span>
                    {(() => {
                      const pts = selectedUser.role === 'master' ? Infinity : getUserPoints(selectedUser.id);
                      const rank = selectedUser.role === 'master' ? { name: 'Lab Master', color: '#D69E2E', emoji: '👑' } : getRank(pts, selectedUser.selectedRankTitle);
                      return <span style={{ color: rank.color, fontWeight: 600 }}>{rank.emoji} {rank.name}</span>;
                    })()}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>🆔</span>
                  <span>{selectedUser.employeeId || '-'}</span>
                </div>
                {selectedUser.bio && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Bio</div>
                    <div style={{ fontSize: '0.85rem', fontStyle: 'italic', backgroundColor: 'var(--bg-color)', padding: '0.75rem', borderRadius: '8px' }}>
                      "{selectedUser.bio}"
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 1.5rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👤</div>
              <p>Select a team member to view their profile</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
