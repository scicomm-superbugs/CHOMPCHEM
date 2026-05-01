import { useLiveCollection, db } from '../db';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { Trash2, UserX, UserCheck, Shield, Plus, AlertTriangle, Calendar, CheckCircle, Clock, Award, BarChart3, Image, Link2 } from 'lucide-react';
import { AVATARS, calculateScore, getUnlockedTags, REACTIONS } from './scicommConstants';

export default function SciCommAdmin() {
  const { user } = useAuth();
  const scientists = useLiveCollection('scientists') || [];
  const posts = useLiveCollection('scicomm_posts') || [];
  const tasksData = useLiveCollection('tasks') || [];
  const warningsData = useLiveCollection('scicomm_warnings') || [];
  const meetingsData = useLiveCollection('scicomm_meetings') || [];
  const connectionsData = useLiveCollection('scicomm_connections') || [];
  const bannersData = useLiveCollection('scicomm_banners') || [];
  const recognitionsData = useLiveCollection('scicomm_recognitions') || [];
  const isMaster = user.role === 'master';

  const [activeTab, setActiveTab] = useState('pending');
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assignedTo: '', dueDate: '', priority: 'Medium' });
  const [warningForm, setWarningForm] = useState({ userId: '', message: '', note: '' });
  const [bannerForm, setBannerForm] = useState({ imageUrl: '', title: '', order: 0 });
  const [msg, setMsg] = useState('');

  const pendingAccounts = scientists.filter(s => s.accountStatus === 'pending');
  const activeAccounts = scientists.filter(s => s.accountStatus !== 'pending');

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  // Handlers
  const handleApprove = async (id) => { await db.scientists.update(id, { accountStatus: 'active' }); flash('Account approved!'); };
  const handleReject = async (id) => { if (window.confirm("Reject?")) await db.scientists.delete(id); };
  const handlePromote = async (id) => { await db.scientists.update(id, { role: 'admin' }); flash('Promoted!'); };
  const handleDemote = async (id) => { await db.scientists.update(id, { role: 'scientist' }); };
  const handleRemoveUser = async (id) => { if (window.confirm("Remove?")) await db.scientists.delete(id); };
  const handleRemovePost = async (id) => { if (window.confirm("Delete post?")) await db.scicomm_posts.delete(id); };

  const handleAssignTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title || !taskForm.assignedTo || !taskForm.dueDate) return;
    await db.tasks.add({ ...taskForm, status: 'Pending', assignedBy: user.id, assignedByName: user.name, createdAt: new Date().toISOString() });
    setTaskForm({ title: '', description: '', assignedTo: '', dueDate: '', priority: 'Medium' });
    flash('Task assigned!');
  };

  const handleSendWarning = async (e) => {
    e.preventDefault();
    if (!warningForm.userId || !warningForm.message) return;
    const target = scientists.find(s => String(s.id) === String(warningForm.userId));
    const existingWarnings = warningsData.filter(w => String(w.userId) === String(warningForm.userId) && w.status !== 'removed');
    if (existingWarnings.length >= 3) { flash('User already has 3 warnings (suspended).'); return; }
    await db.scicomm_warnings.add({
      userId: warningForm.userId, userName: target?.name || '', message: warningForm.message, note: warningForm.note,
      issuedBy: user.name, issuedAt: new Date().toISOString(), status: 'active',
      warningNumber: existingWarnings.length + 1, appeal: null, appealStatus: null
    });
    setWarningForm({ userId: '', message: '', note: '' });
    flash(`Warning ${existingWarnings.length + 1}/3 issued!`);
  };

  const handleReviewAppeal = async (warningId, decision) => {
    if (decision === 'accept') {
      await db.scicomm_warnings.update(warningId, { status: 'removed', appealStatus: 'accepted' });
      flash('Warning removed!');
    } else {
      await db.scicomm_warnings.update(warningId, { appealStatus: 'rejected' });
      flash('Appeal rejected.');
    }
  };

  const handleAddBanner = async (e) => {
    e.preventDefault();
    if (!bannerForm.imageUrl) return;
    await db.scicomm_banners.add({ ...bannerForm, createdAt: new Date().toISOString() });
    setBannerForm({ imageUrl: '', title: '', order: 0 });
    flash('Banner added!');
  };

  const handleDeleteBanner = async (id) => { await db.scicomm_banners.delete(id); };

  const tabs = [
    { id: 'pending', label: `Pending (${pendingAccounts.length})`, icon: <Clock size={14} /> },
    { id: 'users', label: 'Users', icon: <Shield size={14} /> },
    { id: 'tasks', label: 'Tasks', icon: <Calendar size={14} /> },
    { id: 'warnings', label: 'Warnings', icon: <AlertTriangle size={14} /> },
    { id: 'banners', label: 'Banners', icon: <Image size={14} /> },
    { id: 'posts', label: 'Posts', icon: <Trash2 size={14} /> },
    { id: 'recognitions', label: 'Recognitions', icon: <Award size={14} /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={14} /> },
  ];

  // Analytics data
  const getAnalytics = (member) => {
    const likesReceived = posts.filter(p => String(p.authorId) === String(member.id)).reduce((s, p) => s + Object.values(p.reactions || {}).reduce((ss, arr) => ss + arr.length, 0), 0);
    const completedTasks = tasksData.filter(t => String(t.assignedTo) === String(member.id) && t.status === 'Completed').length;
    const pendingTasks = tasksData.filter(t => String(t.assignedTo) === String(member.id) && t.status !== 'Completed').length;
    const connectionCount = connectionsData.filter(c => c.status === 'accepted' && (String(c.fromId) === String(member.id) || String(c.toId) === String(member.id))).length;
    const meetingsAttended = meetingsData.filter(m => (m.attendees || []).includes(member.id)).length;
    const postCount = posts.filter(p => String(p.authorId) === String(member.id)).length;
    const warnings = warningsData.filter(w => String(w.userId) === String(member.id) && w.status !== 'removed').length;
    const score = calculateScore({ completedTasks, likesReceived, connectionCount, meetingsAttended, tagsCount: (member.pinnedTags || []).length });
    return { likesReceived, completedTasks, pendingTasks, connectionCount, meetingsAttended, postCount, warnings, score };
  };

  return (
    <div style={{ maxWidth: '950px', margin: '0 auto' }}>
      {msg && <div style={{ background: '#dcfce7', color: '#166534', padding: '12px 16px', borderRadius: '8px', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>✅ {msg}</div>}

      <div className="scicomm-card scicomm-card-padding">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: '22px' }}>🛡️ Admin Dashboard</h2>
            <p style={{ margin: 0, color: 'rgba(0,0,0,0.6)', fontSize: '13px' }}>Manage team, tasks, warnings, banners, and analytics.</p>
          </div>
          {isMaster && (
            <button onClick={async () => {
              if (window.confirm("⚠️ DANGER: Are you sure you want to FACTORY RESET the entire platform? This will delete all posts, tasks, warnings, messages, and users EXCEPT the Master account. This cannot be undone!")) {
                if (window.prompt("Type 'CONFIRM' to factory reset") === 'CONFIRM') {
                  const s = await db.scientists.toArray();
                  for (const x of s) { if (x.role !== 'master') await db.scientists.delete(x.id); }
                  await db.tasks.clear();
                  await db.scicomm_posts.clear();
                  await db.scicomm_warnings.clear();
                  await db.scicomm_meetings.clear();
                  await db.scicomm_chat_messages.clear();
                  await db.scicomm_reels.clear();
                  await db.scicomm_banners.clear();
                  await db.scicomm_connections.clear();
                  await db.scicomm_recognitions.clear();
                  flash("Factory reset complete.");
                  setTimeout(() => window.location.reload(), 1000);
                }
              }
            }} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
              ⚠️ Factory Reset
            </button>
          )}
        </div>
      </div>

      <div className="scicomm-card" style={{ display: 'flex', flexWrap: 'wrap', overflow: 'hidden' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            flex: '1 1 auto', minWidth: '80px', padding: '10px 6px', border: 'none', background: activeTab === t.id ? '#10b981' : 'transparent',
            color: activeTab === t.id ? 'white' : 'rgba(0,0,0,0.6)', fontWeight: 600, cursor: 'pointer', fontSize: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', transition: 'all 0.2s'
          }}>{t.icon} {t.label}</button>
        ))}
      </div>

      {/* PENDING */}
      {activeTab === 'pending' && (
        <div className="scicomm-card scicomm-card-padding">
          <h3 style={{ margin: '0 0 12px', fontSize: '18px' }}>🕐 Pending Approvals</h3>
          {pendingAccounts.length === 0 ? <p style={{ color: '#666', textAlign: 'center', padding: '24px' }}>No pending accounts.</p> : pendingAccounts.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #eef3f8', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{s.name}</div>
                <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.5)' }}>@{s.username} • {s.email || '-'} • {s.department || '-'}</div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="scicomm-btn-primary" style={{ padding: '6px 14px', fontSize: '12px' }} onClick={() => handleApprove(s.id)}><UserCheck size={14} /> Approve</button>
                <button style={{ padding: '6px 14px', fontSize: '12px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '24px', cursor: 'pointer' }} onClick={() => handleReject(s.id)}><UserX size={14} /> Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* USERS */}
      {activeTab === 'users' && (
        <div className="scicomm-card scicomm-card-padding">
          <h3 style={{ margin: '0 0 12px', fontSize: '18px' }}>👥 All Members ({activeAccounts.length})</h3>
          {activeAccounts.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eef3f8', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#eef3f8' }}></div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{s.name}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(0,0,0,0.5)' }}>{s.email || s.username}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ background: s.role === 'master' ? '#fef08a' : s.role === 'admin' ? '#bbf7d0' : '#eef3f8', padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600 }}>{s.role}</span>
                {s.role !== 'master' && (
                  <>
                    {s.role === 'scientist' ? <button onClick={() => handlePromote(s.id)} className="scicomm-btn-secondary" style={{ padding: '3px 8px', fontSize: '11px' }}>Promote</button> : isMaster && <button onClick={() => handleDemote(s.id)} style={{ padding: '3px 8px', fontSize: '11px', border: '1px solid #e0dfdc', borderRadius: '24px', background: 'transparent', cursor: 'pointer' }}>Demote</button>}
                    <button onClick={() => handleRemoveUser(s.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><UserX size={16} /></button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TASKS */}
      {activeTab === 'tasks' && (
        <div className="scicomm-card scicomm-card-padding">
          <h3 style={{ margin: '0 0 12px', fontSize: '18px' }}>📋 Assign Task</h3>
          <form onSubmit={handleAssignTask} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            <input type="text" placeholder="Task Title" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} required style={{ padding: '10px 14px', border: '1px solid #e0dfdc', borderRadius: '8px', fontSize: '14px' }} />
            <textarea placeholder="Description..." value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} rows={2} style={{ padding: '10px 14px', border: '1px solid #e0dfdc', borderRadius: '8px', fontSize: '14px', resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <select value={taskForm.assignedTo} onChange={e => setTaskForm({ ...taskForm, assignedTo: e.target.value })} required style={{ flex: 1, padding: '10px 14px', border: '1px solid #e0dfdc', borderRadius: '8px', fontSize: '14px' }}>
                <option value="">Select member...</option>
                {activeAccounts.filter(s => s.role !== 'master').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <input type="date" value={taskForm.dueDate} onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })} required style={{ flex: 1, padding: '10px 14px', border: '1px solid #e0dfdc', borderRadius: '8px', fontSize: '14px' }} />
              <select value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })} style={{ flex: 1, padding: '10px 14px', border: '1px solid #e0dfdc', borderRadius: '8px', fontSize: '14px' }}>
                <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Urgent">🔴 Urgent</option>
              </select>
            </div>
            <button type="submit" className="scicomm-btn-primary" style={{ padding: '10px' }}>Assign Task</button>
          </form>
        </div>
      )}

      {/* WARNINGS */}
      {activeTab === 'warnings' && (
        <div className="scicomm-card scicomm-card-padding">
          <h3 style={{ margin: '0 0 12px', fontSize: '18px' }}>⚠️ Warning System (3-Strike)</h3>
          <form onSubmit={handleSendWarning} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            <select value={warningForm.userId} onChange={e => setWarningForm({ ...warningForm, userId: e.target.value })} required style={{ padding: '10px 14px', border: '1px solid #e0dfdc', borderRadius: '8px', fontSize: '14px' }}>
              <option value="">Select member...</option>
              {activeAccounts.filter(s => s.role !== 'master').map(s => {
                const wCount = warningsData.filter(w => String(w.userId) === String(s.id) && w.status !== 'removed').length;
                return <option key={s.id} value={s.id}>{s.name} ({wCount}/3 warnings)</option>;
              })}
            </select>
            <textarea placeholder="Warning reason..." value={warningForm.message} onChange={e => setWarningForm({ ...warningForm, message: e.target.value })} required rows={2} style={{ padding: '10px 14px', border: '1px solid #e0dfdc', borderRadius: '8px', fontSize: '14px' }} />
            <textarea placeholder="Disciplinary note (optional)..." value={warningForm.note} onChange={e => setWarningForm({ ...warningForm, note: e.target.value })} rows={1} style={{ padding: '10px 14px', border: '1px solid #e0dfdc', borderRadius: '8px', fontSize: '14px' }} />
            <button type="submit" style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '24px', padding: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>⚠️ Issue Warning</button>
          </form>

          <h4 style={{ margin: '0 0 8px', fontSize: '16px' }}>Appeals to Review</h4>
          {warningsData.filter(w => w.appeal && w.appealStatus === 'pending').length === 0 ? <p style={{ color: '#666', fontSize: '13px' }}>No pending appeals.</p> : (
            warningsData.filter(w => w.appeal && w.appealStatus === 'pending').map(w => (
              <div key={w.id} style={{ padding: '12px', background: '#fffbeb', borderRadius: '8px', marginBottom: '8px', border: '1px solid #fde68a' }}>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>{w.userName} — Warning {w.warningNumber}</div>
                <p style={{ margin: '4px 0', fontSize: '13px', color: 'rgba(0,0,0,0.7)' }}>Reason: {w.message}</p>
                <p style={{ margin: '4px 0', fontSize: '13px', color: '#0a66c2' }}>Appeal: {w.appeal}</p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button className="scicomm-btn-primary" style={{ padding: '4px 12px', fontSize: '12px' }} onClick={() => handleReviewAppeal(w.id, 'accept')}>✅ Accept (Remove Warning)</button>
                  <button style={{ padding: '4px 12px', fontSize: '12px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '24px', cursor: 'pointer' }} onClick={() => handleReviewAppeal(w.id, 'reject')}>❌ Reject</button>
                </div>
              </div>
            ))
          )}

          <h4 style={{ margin: '16px 0 8px', fontSize: '16px' }}>All Warnings</h4>
          {warningsData.length === 0 ? <p style={{ color: '#666', fontSize: '13px' }}>No warnings.</p> : warningsData.sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime()).map(w => (
            <div key={w.id} style={{ padding: '8px 0', borderBottom: '1px solid #eef3f8', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span><strong>{w.userName}</strong> — {w.message.substring(0, 50)}</span>
                <span style={{ background: w.status === 'removed' ? '#dcfce7' : '#fee2e2', padding: '2px 8px', borderRadius: '8px', fontSize: '11px' }}>{w.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* BANNERS */}
      {activeTab === 'banners' && (
        <div className="scicomm-card scicomm-card-padding">
          <h3 style={{ margin: '0 0 12px', fontSize: '18px' }}>🖼️ Banner Management</h3>
          <form onSubmit={handleAddBanner} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            <input type="url" placeholder="Banner Image URL" value={bannerForm.imageUrl} onChange={e => setBannerForm({ ...bannerForm, imageUrl: e.target.value })} required style={{ padding: '10px 14px', border: '1px solid #e0dfdc', borderRadius: '8px', fontSize: '14px' }} />
            <input type="text" placeholder="Title/Caption (optional)" value={bannerForm.title} onChange={e => setBannerForm({ ...bannerForm, title: e.target.value })} style={{ padding: '10px 14px', border: '1px solid #e0dfdc', borderRadius: '8px', fontSize: '14px' }} />
            <input type="number" placeholder="Order (0 = first)" value={bannerForm.order} onChange={e => setBannerForm({ ...bannerForm, order: Number(e.target.value) })} style={{ padding: '10px 14px', border: '1px solid #e0dfdc', borderRadius: '8px', fontSize: '14px' }} />
            <button type="submit" className="scicomm-btn-primary" style={{ padding: '10px' }}>Add Banner</button>
          </form>
          {bannersData.map(b => (
            <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: '1px solid #eef3f8' }}>
              <img src={b.imageUrl} alt="" style={{ width: '80px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} onError={e => e.target.style.display = 'none'} />
              <div style={{ flex: 1, fontSize: '13px' }}>{b.title || 'No title'}</div>
              <button onClick={() => handleDeleteBanner(b.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      )}

      {/* POSTS */}
      {activeTab === 'posts' && (
        <div className="scicomm-card scicomm-card-padding">
          <h3 style={{ margin: '0 0 12px', fontSize: '18px' }}>📝 Content Moderation ({posts.length})</h3>
          {posts.length === 0 ? <p style={{ color: '#666' }}>No posts.</p> : posts.map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #eef3f8' }}>
              <div style={{ flex: 1 }}>
                <strong style={{ fontSize: '13px' }}>{p.authorName}</strong>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'rgba(0,0,0,0.6)' }}>{p.content.substring(0, 80)}{p.content.length > 80 ? '...' : ''}</p>
              </div>
              <button onClick={() => handleRemovePost(p.id)} style={{ background: '#fee2e2', border: 'none', color: '#991b1b', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', flexShrink: 0 }}><Trash2 size={12} /> Remove</button>
            </div>
          ))}
        </div>
      )}

      {/* RECOGNITIONS */}
      {activeTab === 'recognitions' && (
        <div className="scicomm-card scicomm-card-padding">
          <h3 style={{ margin: '0 0 12px', fontSize: '18px' }}>🏅 Manage Content Recognitions</h3>
          <p style={{ fontSize: '13px', color: 'rgba(0,0,0,0.6)', marginBottom: '16px' }}>Feature reels or posts to recognize creators on the platform.</p>
          
          <form onSubmit={async (e) => {
            e.preventDefault();
            const targetId = e.target.targetId.value;
            const type = e.target.recogType.value;
            if(!targetId) return;
            const existing = recognitionsData.find(r => r.type === type);
            if (existing) {
              await db.scicomm_recognitions.update(existing.id, { targetId, date: new Date().toISOString() });
            } else {
              await db.scicomm_recognitions.add({ type, targetId, date: new Date().toISOString() });
            }
            flash('Recognition updated!');
          }} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <select name="recogType" required style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e0dfdc', fontSize: '14px' }}>
              <option value="featured_reel">Reel of the Week</option>
              <option value="post_of_month">Post of the Month</option>
            </select>
            <input name="targetId" placeholder="Target ID (Reel ID or Post ID)" required style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e0dfdc', fontSize: '14px' }} />
            <button type="submit" className="scicomm-btn-primary" style={{ padding: '10px', justifyContent: 'center' }}>Set Feature</button>
          </form>
        </div>
      )}

      {/* ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="scicomm-card scicomm-card-padding">
          <h3 style={{ margin: '0 0 12px', fontSize: '18px' }}>📊 Member Analytics</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e0dfdc', textAlign: 'left' }}>
                  <th style={{ padding: '8px 4px' }}>Member</th>
                  <th style={{ padding: '8px 4px' }}>Score</th>
                  <th style={{ padding: '8px 4px' }}>Posts</th>
                  <th style={{ padding: '8px 4px' }}>Reactions</th>
                  <th style={{ padding: '8px 4px' }}>Tasks ✅</th>
                  <th style={{ padding: '8px 4px' }}>Tasks ⏳</th>
                  <th style={{ padding: '8px 4px' }}>Meetings</th>
                  <th style={{ padding: '8px 4px' }}>⚠️</th>
                </tr>
              </thead>
              <tbody>
                {activeAccounts.filter(s => s.role !== 'master').map(s => {
                  const a = getAnalytics(s);
                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid #eef3f8' }}>
                      <td style={{ padding: '8px 4px', fontWeight: 600 }}>{s.name}</td>
                      <td style={{ padding: '8px 4px', fontWeight: 700, color: '#10b981' }}>{a.score}</td>
                      <td style={{ padding: '8px 4px' }}>{a.postCount}</td>
                      <td style={{ padding: '8px 4px' }}>{a.likesReceived}</td>
                      <td style={{ padding: '8px 4px', color: '#10b981' }}>{a.completedTasks}</td>
                      <td style={{ padding: '8px 4px', color: '#f59e0b' }}>{a.pendingTasks}</td>
                      <td style={{ padding: '8px 4px' }}>{a.meetingsAttended}</td>
                      <td style={{ padding: '8px 4px', color: a.warnings >= 3 ? '#ef4444' : a.warnings > 0 ? '#f59e0b' : '#10b981', fontWeight: 600 }}>{a.warnings}/3</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
