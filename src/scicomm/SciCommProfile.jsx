import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, useLiveCollection } from '../db';
import { Camera, Edit2, Award, Pin, AlertTriangle, UserCircle, X, Shield } from 'lucide-react';
import { AVATARS, AUTO_TAGS, RANKS, calculateScore, getRank, getUnlockedTags, getNextTag, timeAgo } from './scicommConstants';

export default function SciCommProfile() {
  const { user } = useAuth();
  const scientists = useLiveCollection('scientists') || [];
  const me = scientists.find(s => String(s.id) === String(user.id));
  const postsData = useLiveCollection('scicomm_posts') || [];
  const tasksData = useLiveCollection('tasks') || [];
  const warningsData = useLiveCollection('scicomm_warnings') || [];
  const connectionsData = useLiveCollection('scicomm_connections') || [];
  const meetingsData = useLiveCollection('scicomm_meetings') || [];

  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showWarnings, setShowWarnings] = useState(false);
  const [appealText, setAppealText] = useState('');
  const [appealTarget, setAppealTarget] = useState(null);
  const [formData, setFormData] = useState({ name: me?.name || user.name, bio: me?.bio || '', department: me?.department || '', email: me?.email || '' });

  useEffect(() => { if (me) setFormData({ name: me.name || user.name, bio: me.bio || '', department: me.department || '', email: me.email || '' }); }, [me?.id]);

  // Score calculation
  const myPosts = postsData.filter(p => String(p.authorId) === String(user.id));
  const myLikesReceived = myPosts.reduce((s, p) => s + Object.values(p.reactions || {}).reduce((ss, arr) => ss + arr.length, 0), 0);
  const myCompletedTasks = tasksData.filter(t => String(t.assignedTo) === String(user.id) && t.status === 'Completed').length;
  const myConnections = connectionsData.filter(c => c.status === 'accepted' && (String(c.fromId) === String(user.id) || String(c.toId) === String(user.id))).length;
  const myAttended = meetingsData.filter(m => (m.attendees || []).includes(user.id)).length;
  const myScore = calculateScore({ completedTasks: myCompletedTasks, likesReceived: myLikesReceived, connectionCount: myConnections, meetingsAttended: myAttended, tagsCount: (me?.pinnedTags || []).length });
  const myRank = getRank(myScore);
  const unlockedTags = getUnlockedTags(myScore);
  const nextTag = getNextTag(myScore);
  const pinnedTags = me?.pinnedTags || [];
  const pinnedPosts = me?.pinnedPosts || [];

  // Warnings
  const myWarnings = warningsData.filter(w => String(w.userId) === String(user.id) && w.status !== 'removed');
  const activeWarnings = myWarnings.filter(w => w.status !== 'removed');
  const isSuspended = activeWarnings.length >= 3;

  const renderAvatar = (size = 120) => {
    if (me?.avatar) return <img src={me.avatar} alt="" style={{ width: size, height: size, borderRadius: '50%', border: '4px solid white', objectFit: 'cover' }} />;
    const av = AVATARS.find(a => a.id === me?.avatarId);
    if (av) return <div style={{ width: size, height: size, borderRadius: '50%', border: '4px solid white', background: av.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.45 }}>{av.svg}</div>;
    return <div style={{ width: size, height: size, borderRadius: '50%', border: '4px solid white', background: '#eef3f8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><UserCircle size={size * 0.5} color="#666" /></div>;
  };

  const handleAvatarSelect = async (avatarId) => {
    await db.scientists.update(user.id, { avatarId, avatar: null });
    setShowAvatarPicker(false);
  };

  const handleSave = async () => { await db.scientists.update(user.id, formData); setIsEditing(false); };

  const handlePinTag = async (tag) => {
    let newPinned = [...pinnedTags];
    if (newPinned.includes(tag)) newPinned = newPinned.filter(t => t !== tag);
    else if (newPinned.length < 5) newPinned.push(tag);
    else { alert('Max 5 pinned tags!'); return; }
    await db.scientists.update(user.id, { pinnedTags: newPinned });
  };

  const handlePinPost = async (postId) => {
    let newPinned = [...pinnedPosts];
    if (newPinned.includes(postId)) newPinned = newPinned.filter(id => id !== postId);
    else if (newPinned.length < 5) newPinned.push(postId);
    else { alert('Max 5 pinned posts!'); return; }
    await db.scientists.update(user.id, { pinnedPosts: newPinned });
  };

  const handleAppeal = async (warningId) => {
    if (!appealText.trim()) return;
    await db.scicomm_warnings.update(warningId, { appeal: appealText, appealDate: new Date().toISOString(), appealStatus: 'pending' });
    setAppealText('');
    setAppealTarget(null);
  };

  // Suspension countdown
  const suspensionEnd = isSuspended ? (() => {
    const latest = activeWarnings.sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime())[0];
    return new Date(new Date(latest.issuedAt).getTime() + 365 * 24 * 60 * 60 * 1000);
  })() : null;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Suspension Banner */}
      {isSuspended && (
        <div style={{ background: 'linear-gradient(135deg, #dc2626, #991b1b)', color: 'white', padding: '16px 20px', borderRadius: '8px', marginBottom: '8px', textAlign: 'center' }}>
          <AlertTriangle size={24} style={{ marginBottom: '8px' }} />
          <h3 style={{ margin: '0 0 4px' }}>⛔ Account Suspended</h3>
          <p style={{ margin: 0, fontSize: '14px' }}>You have 3 active warnings. Task assignments and leaderboard participation are disabled.</p>
          {suspensionEnd && <p style={{ margin: '8px 0 0', fontSize: '12px' }}>Suspension until: {suspensionEnd.toLocaleDateString()}</p>}
        </div>
      )}

      {/* Profile Card */}
      <div className="scicomm-card" style={{ overflow: 'hidden' }}>
        <div style={{ height: '180px', background: 'linear-gradient(135deg, #10b981 0%, #047857 50%, #064e3b 100%)' }}></div>
        <div style={{ padding: '0 24px 24px' }}>
          <div style={{ position: 'relative', width: '120px', marginTop: '-60px', marginBottom: '12px' }}>
            {renderAvatar(120)}
            <button onClick={() => setShowAvatarPicker(true)} style={{ position: 'absolute', bottom: '6px', right: '6px', background: '#fff', borderRadius: '50%', padding: '6px', cursor: 'pointer', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
              <Camera size={16} color="#333" />
            </button>
          </div>

          {isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '450px' }}>
              <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Full Name" style={{ padding: '10px 14px', border: '1px solid #e0dfdc', borderRadius: '8px', fontSize: '16px', fontWeight: 600 }} />
              <input type="text" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} placeholder="Role / Department" style={{ padding: '10px 14px', border: '1px solid #e0dfdc', borderRadius: '8px', fontSize: '14px' }} />
              <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="Email" style={{ padding: '10px 14px', border: '1px solid #e0dfdc', borderRadius: '8px', fontSize: '14px' }} />
              <textarea value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} placeholder="Bio" rows={3} style={{ padding: '10px 14px', border: '1px solid #e0dfdc', borderRadius: '8px', fontSize: '14px', resize: 'vertical' }} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="scicomm-btn-primary" onClick={handleSave}>Save</button>
                <button className="scicomm-btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h1 style={{ margin: '0', fontSize: '22px' }}>{me?.name || user.name}</h1>
                  <span style={{ background: myRank.color + '20', color: myRank.color, padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>{myRank.icon} {myRank.rank}</span>
                </div>
                <p style={{ margin: '4px 0 6px', fontSize: '15px' }}>{me?.department || 'Science Communicator'}</p>
                {me?.email && <p style={{ margin: '0 0 6px', fontSize: '13px', color: 'rgba(0,0,0,0.6)' }}>📧 {me.email}</p>}
                <p style={{ margin: 0, fontSize: '14px', color: 'rgba(0,0,0,0.6)' }}>{me?.bio || 'Passionate about science communication.'}</p>
                {pinnedTags.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
                    {pinnedTags.map((t, i) => <span key={i} style={{ background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', color: '#065f46', padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 600, border: '1px solid #a7f3d0' }}>{t}</span>)}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="scicomm-btn-secondary" onClick={() => setIsEditing(true)} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Edit2 size={14} /> Edit</button>
                <button onClick={() => setShowWarnings(true)} style={{ background: activeWarnings.length > 0 ? '#fee2e2' : '#f3f2ef', border: 'none', borderRadius: '24px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: activeWarnings.length > 0 ? '#991b1b' : '#666', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertTriangle size={14} /> {activeWarnings.length}/3
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px', marginTop: '8px' }}>
        {[
          { label: 'Score', value: myScore, color: '#10b981' },
          { label: 'Posts', value: myPosts.length, color: '#3b82f6' },
          { label: 'Reactions', value: myLikesReceived, color: '#ef4444' },
          { label: 'Tasks Done', value: myCompletedTasks, color: '#f59e0b' },
          { label: 'Connections', value: myConnections, color: '#8b5cf6' },
          { label: 'Tags', value: unlockedTags.length, color: '#ec4899' },
        ].map((s, i) => (
          <div key={i} className="scicomm-card scicomm-card-padding" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '11px', color: 'rgba(0,0,0,0.5)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Achievement Tags */}
      <div className="scicomm-card scicomm-card-padding" style={{ marginTop: '8px' }}>
        <h2 style={{ fontSize: '18px', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}><Award size={20} color="#10b981" /> Achievement Tags</h2>
        <p style={{ margin: '0 0 12px', fontSize: '12px', color: 'rgba(0,0,0,0.5)' }}>Click to pin (max 5). {nextTag ? `Next unlock: ${nextTag.tag} at ${nextTag.threshold} pts` : 'All unlocked!'}</p>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {unlockedTags.map((t, i) => {
            const isPinned = pinnedTags.includes(t);
            return (
              <button key={i} onClick={() => handlePinTag(t)} style={{ background: isPinned ? 'linear-gradient(135deg, #10b981, #059669)' : '#f3f2ef', color: isPinned ? 'white' : '#333', padding: '5px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 600, border: isPinned ? 'none' : '1px solid #e0dfdc', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {isPinned && <Pin size={12} />} {t}
              </button>
            );
          })}
          {AUTO_TAGS.filter(t => !unlockedTags.includes(t.tag)).slice(0, 3).map((t, i) => (
            <span key={'locked' + i} style={{ background: '#f3f2ef', color: '#ccc', padding: '5px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 600, border: '1px dashed #ddd' }}>🔒 {t.tag}</span>
          ))}
        </div>
      </div>

      {/* Pinned Posts */}
      <div className="scicomm-card scicomm-card-padding" style={{ marginTop: '8px' }}>
        <h2 style={{ fontSize: '18px', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}><Pin size={20} color="#10b981" /> Pinned Highlights (max 5)</h2>
        {myPosts.length === 0 ? <p style={{ color: '#666', fontSize: '14px' }}>No posts yet.</p> : (
          myPosts.slice(0, 10).map(p => {
            const isPinned = pinnedPosts.includes(p.id);
            return (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #eef3f8' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 4px', fontSize: '14px' }}>{p.content.substring(0, 100)}{p.content.length > 100 ? '...' : ''}</p>
                  <div style={{ fontSize: '11px', color: 'rgba(0,0,0,0.4)' }}>👍 {Object.values(p.reactions || {}).reduce((s, a) => s + a.length, 0)} • 💬 {(p.comments || []).length} • {timeAgo(p.createdAt)}</div>
                </div>
                <button onClick={() => handlePinPost(p.id)} style={{ background: isPinned ? '#10b981' : '#f3f2ef', color: isPinned ? 'white' : '#666', border: 'none', borderRadius: '16px', padding: '4px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}>
                  {isPinned ? '📌 Pinned' : 'Pin'}
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Avatar Picker Modal */}
      {showAvatarPicker && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={() => setShowAvatarPicker(false)}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', maxWidth: '500px', width: '100%', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '20px' }}>Choose Your Avatar</h2>
              <button onClick={() => setShowAvatarPicker(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '12px' }}>
              {AVATARS.map(av => (
                <button key={av.id} onClick={() => handleAvatarSelect(av.id)} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '12px 4px', border: me?.avatarId === av.id ? '2px solid #10b981' : '2px solid transparent',
                  borderRadius: '12px', background: me?.avatarId === av.id ? '#ecfdf5' : '#f3f2ef', cursor: 'pointer', transition: 'all 0.2s'
                }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: av.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>{av.svg}</div>
                  <span style={{ fontSize: '10px', color: 'rgba(0,0,0,0.6)', textAlign: 'center' }}>{av.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Warning Panel Modal */}
      {showWarnings && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={() => setShowWarnings(false)}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', maxWidth: '500px', width: '100%', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '20px' }}>⚠️ Warning Panel ({activeWarnings.length}/3)</h2>
              <button onClick={() => setShowWarnings(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {[1, 2, 3].map(n => (
                <div key={n} style={{ flex: 1, textAlign: 'center', padding: '12px', borderRadius: '8px', background: n <= activeWarnings.length ? (n === 3 ? '#fee2e2' : '#fef3c7') : '#f3f2ef', border: n <= activeWarnings.length ? (n === 3 ? '2px solid #ef4444' : '2px solid #f59e0b') : '2px solid transparent' }}>
                  <div style={{ fontSize: '24px' }}>{n <= activeWarnings.length ? '⚠️' : '✅'}</div>
                  <div style={{ fontSize: '12px', fontWeight: 600 }}>Warning {n}</div>
                </div>
              ))}
            </div>
            {activeWarnings.length === 0 ? (
              <p style={{ color: '#666', textAlign: 'center' }}>No active warnings. Keep up the great work! 🎉</p>
            ) : (
              activeWarnings.map((w, i) => (
                <div key={w.id} style={{ padding: '16px', background: '#fff5f5', borderRadius: '8px', marginBottom: '8px', border: '1px solid #fecaca' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '14px' }}>Warning {i + 1}{i === 2 ? ' (Final)' : ''}</strong>
                    <span style={{ fontSize: '12px', color: 'rgba(0,0,0,0.5)' }}>{new Date(w.issuedAt).toLocaleDateString()}</span>
                  </div>
                  <p style={{ margin: '4px 0', fontSize: '14px' }}>{w.message}</p>
                  <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.5)', marginBottom: '8px' }}>Issued by: {w.issuedBy}</div>
                  {w.appeal ? (
                    <div style={{ background: '#f3f2ef', padding: '8px 12px', borderRadius: '8px', fontSize: '13px' }}>
                      <strong>Your Appeal:</strong> {w.appeal}
                      <div style={{ marginTop: '4px', fontWeight: 600, color: w.appealStatus === 'accepted' ? '#10b981' : w.appealStatus === 'rejected' ? '#ef4444' : '#f59e0b' }}>Status: {w.appealStatus || 'Pending'}</div>
                    </div>
                  ) : (
                    appealTarget === w.id ? (
                      <div>
                        <textarea value={appealText} onChange={e => setAppealText(e.target.value)} placeholder="Write your explanation/excuse..." rows={2} style={{ width: '100%', padding: '8px', border: '1px solid #e0dfdc', borderRadius: '8px', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }} />
                        <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                          <button className="scicomm-btn-primary" style={{ fontSize: '12px', padding: '4px 12px' }} onClick={() => handleAppeal(w.id)}>Submit Appeal</button>
                          <button className="scicomm-btn-secondary" style={{ fontSize: '12px', padding: '4px 12px' }} onClick={() => setAppealTarget(null)}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button className="scicomm-btn-secondary" style={{ fontSize: '12px', padding: '4px 12px' }} onClick={() => setAppealTarget(w.id)}>Submit Excuse / Appeal</button>
                    )
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
