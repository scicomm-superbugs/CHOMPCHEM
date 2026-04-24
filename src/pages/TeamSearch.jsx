import { useState, useEffect } from 'react';
import { db, useLiveCollection } from '../db';
import { Search, User, Shield, Crown, Eye, Mail, Building, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ranks, getRankByPoints } from '../utils/ranks';

export default function TeamSearch() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showAllTagsModal, setShowAllTagsModal] = useState(false);

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

  const getUserPoints = (userId) => {
    const usagePoints = usageLogsData.filter(log => String(log.scientistId) === String(userId)).length * 10;
    const taskPoints = tasksData.filter(t => String(t.assignedTo) === String(userId) && t.status === 'Completed').length * 50;
    return usagePoints + taskPoints;
  };

  const handleViewProfile = async (scientist) => {
    setSelectedUser(scientist);
    setShowAllTagsModal(false);

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
                const rank = s.role === 'master' ? { name: 'Lab Master', color: '#D69E2E', emoji: '👑' } : getRankByPoints(pts, s.selectedRankTitle);
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
                      const rank = selectedUser.role === 'master' ? { name: 'Lab Master', color: '#D69E2E', emoji: '👑' } : getRankByPoints(pts, selectedUser.selectedRankTitle);
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
                
                {selectedUser.pinnedTags && selectedUser.pinnedTags.length > 0 && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>📌 Pinned Tags</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {selectedUser.pinnedTags.map(tagName => {
                        const r = ranks.find(x => x.name === tagName);
                        if (!r) return null;
                        return (
                          <span key={tagName} style={{ backgroundColor: `${r.color}20`, color: r.color, padding: '0.25rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, border: `1px solid ${r.color}40`, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            {r.emoji} {r.name}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                  <button className="btn btn-secondary" onClick={() => setShowAllTagsModal(true)} style={{ width: '100%', fontSize: '0.8rem' }}>
                    🏅 View All Unlocked Tags
                  </button>
                </div>
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

      {/* All Tags Modal */}
      {showAllTagsModal && selectedUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => setShowAllTagsModal(false)}>
          <div className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', padding: 0 }} onClick={e => e.stopPropagation()}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ margin: 0 }}>🏅 {selectedUser.name}'s Unlocked Tags</h3>
              <button onClick={() => setShowAllTagsModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>&times;</button>
            </div>
            <div style={{ padding: '1.25rem', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
              {ranks.map(rank => {
                const pts = selectedUser.role === 'master' ? Infinity : getUserPoints(selectedUser.id);
                const isUnlocked = selectedUser.role === 'master' || pts >= rank.req;
                if (!isUnlocked) return null;
                
                return (
                  <div key={rank.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '1rem 0.5rem', backgroundColor: 'var(--secondary)', borderRadius: '12px', border: `1px solid ${rank.color}40` }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{rank.emoji}</div>
                    <strong style={{ fontSize: '0.85rem', color: rank.color, lineHeight: '1.2' }}>{rank.name}</strong>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
