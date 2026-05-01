import { useLiveCollection, db } from '../db';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { Trash2, UserX, UserCheck, Shield, ShieldOff, Plus, AlertTriangle, Send, Calendar, CheckCircle, Clock, Search, Award } from 'lucide-react';

export default function SciCommAdmin() {
  const { user } = useAuth();
  const scientists = useLiveCollection('scientists') || [];
  const posts = useLiveCollection('scicomm_posts') || [];
  const tasksData = useLiveCollection('tasks') || [];
  const warningsData = useLiveCollection('scicomm_warnings') || [];
  const isMaster = user.role === 'master';

  const [activeTab, setActiveTab] = useState('pending');
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assignedTo: '', dueDate: '', priority: 'Medium' });
  const [warningForm, setWarningForm] = useState({ userId: '', message: '' });
  const [tagForm, setTagForm] = useState({ userId: '', tag: '' });
  const [msg, setMsg] = useState('');

  const pendingAccounts = scientists.filter(s => s.accountStatus === 'pending');
  const activeAccounts = scientists.filter(s => s.accountStatus !== 'pending');

  const handleApprove = async (id) => {
    await db.scientists.update(id, { accountStatus: 'active' });
    setMsg('Account approved!');
    setTimeout(() => setMsg(''), 3000);
  };

  const handleReject = async (id) => {
    if (window.confirm("Reject and delete this account?")) {
      await db.scientists.delete(id);
    }
  };

  const handlePromote = async (id) => {
    await db.scientists.update(id, { role: 'admin' });
    setMsg('User promoted to Admin!');
    setTimeout(() => setMsg(''), 3000);
  };

  const handleDemote = async (id) => {
    await db.scientists.update(id, { role: 'scientist' });
  };

  const handleRemoveUser = async (id) => {
    if (window.confirm("Permanently remove this user?")) {
      await db.scientists.delete(id);
    }
  };

  const handleRemovePost = async (id) => {
    if (window.confirm("Delete this post?")) {
      await db.scicomm_posts.delete(id);
    }
  };

  const handleAssignTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title || !taskForm.assignedTo || !taskForm.dueDate) return;
    try {
      await db.tasks.add({
        ...taskForm,
        status: 'Pending',
        assignedBy: user.id,
        assignedByName: user.name,
        createdAt: new Date().toISOString()
      });
      setTaskForm({ title: '', description: '', assignedTo: '', dueDate: '', priority: 'Medium' });
      setMsg('Task assigned successfully!');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendWarning = async (e) => {
    e.preventDefault();
    if (!warningForm.userId || !warningForm.message) return;
    const targetUser = scientists.find(s => String(s.id) === String(warningForm.userId));
    try {
      await db.scicomm_warnings.add({
        userId: warningForm.userId,
        userName: targetUser?.name || 'Unknown',
        message: warningForm.message,
        issuedBy: user.name,
        issuedAt: new Date().toISOString(),
        seen: false
      });
      setWarningForm({ userId: '', message: '' });
      setMsg('Warning issued!');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAwardTag = async (e) => {
    e.preventDefault();
    if (!tagForm.userId || !tagForm.tag) return;
    const target = scientists.find(s => String(s.id) === String(tagForm.userId));
    const existingTags = target?.scicommTags || [];
    await db.scientists.update(tagForm.userId, { scicommTags: [...existingTags, tagForm.tag] });
    setTagForm({ userId: '', tag: '' });
    setMsg('Tag awarded!');
    setTimeout(() => setMsg(''), 3000);
  };

  const tabs = [
    { id: 'pending', label: `Pending (${pendingAccounts.length})`, icon: <Clock size={16} /> },
    { id: 'users', label: 'Users', icon: <Shield size={16} /> },
    { id: 'tasks', label: 'Assign Task', icon: <Calendar size={16} /> },
    { id: 'warnings', label: 'Warnings', icon: <AlertTriangle size={16} /> },
    { id: 'tags', label: 'Award Tag', icon: <Award size={16} /> },
    { id: 'posts', label: `Posts (${posts.length})`, icon: <Trash2 size={16} /> },
  ];

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {msg && (
        <div style={{ background: '#dcfce7', color: '#166534', padding: '12px 16px', borderRadius: '8px', marginBottom: '12px', fontSize: '14px', fontWeight: 600 }}>
          ✅ {msg}
        </div>
      )}

      <div className="scicomm-card scicomm-card-padding">
        <h2 style={{ margin: '0 0 8px', fontSize: '22px' }}>🛡️ Admin Dashboard</h2>
        <p style={{ margin: 0, color: 'rgba(0,0,0,0.6)', fontSize: '14px' }}>Manage team members, tasks, warnings, and content.</p>
      </div>

      {/* Tab Buttons */}
      <div className="scicomm-card" style={{ display: 'flex', flexWrap: 'wrap', gap: '0', overflow: 'hidden' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            flex: 1, minWidth: '100px', padding: '12px 8px', border: 'none', background: activeTab === t.id ? '#10b981' : 'transparent',
            color: activeTab === t.id ? 'white' : 'rgba(0,0,0,0.6)', fontWeight: 600, cursor: 'pointer', fontSize: '13px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s'
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Pending Accounts */}
      {activeTab === 'pending' && (
        <div className="scicomm-card scicomm-card-padding">
          <h3 style={{ margin: '0 0 16px', fontSize: '18px' }}>🕐 Pending Account Approvals</h3>
          {pendingAccounts.length === 0 ? (
            <p style={{ color: '#666', textAlign: 'center', padding: '24px' }}>No pending accounts.</p>
          ) : (
            pendingAccounts.map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #eef3f8' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '15px' }}>{s.name}</div>
                  <div style={{ fontSize: '13px', color: 'rgba(0,0,0,0.6)' }}>@{s.username} • {s.email || 'No email'} • {s.department || 'No dept'}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="scicomm-btn-primary" style={{ padding: '6px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => handleApprove(s.id)}>
                    <UserCheck size={16} /> Approve
                  </button>
                  <button style={{ padding: '6px 16px', fontSize: '13px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => handleReject(s.id)}>
                    <UserX size={16} /> Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Users */}
      {activeTab === 'users' && (
        <div className="scicomm-card scicomm-card-padding">
          <h3 style={{ margin: '0 0 16px', fontSize: '18px' }}>👥 All Members ({activeAccounts.length})</h3>
          {activeAccounts.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #eef3f8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {s.avatar ? <img src={s.avatar} style={{width:36,height:36,borderRadius:'50%',objectFit:'cover'}} /> : <div style={{width:36,height:36,borderRadius:'50%',background:'#eef3f8'}}></div>}
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{s.name}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.6)' }}>{s.email || s.username}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: s.role === 'master' ? '#fef08a' : s.role === 'admin' ? '#bbf7d0' : '#eef3f8', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>{s.role}</span>
                {s.role !== 'master' && (
                  <>
                    {s.role === 'scientist' ? (
                      <button onClick={() => handlePromote(s.id)} className="scicomm-btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }}>Promote</button>
                    ) : isMaster && (
                      <button onClick={() => handleDemote(s.id)} style={{ padding: '4px 10px', fontSize: '12px', border: '1px solid #e0dfdc', borderRadius: '24px', background: 'transparent', cursor: 'pointer' }}>Demote</button>
                    )}
                    <button onClick={() => handleRemoveUser(s.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><UserX size={18} /></button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assign Task */}
      {activeTab === 'tasks' && (
        <div className="scicomm-card scicomm-card-padding">
          <h3 style={{ margin: '0 0 16px', fontSize: '18px' }}>📋 Assign a Task</h3>
          <form onSubmit={handleAssignTask} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input type="text" placeholder="Task Title" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} required style={{ padding: '10px 14px', border: '1px solid #e0dfdc', borderRadius: '8px', fontSize: '14px' }} />
            <textarea placeholder="Description..." value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} rows={3} style={{ padding: '10px 14px', border: '1px solid #e0dfdc', borderRadius: '8px', fontSize: '14px', resize: 'vertical' }} />
            <select value={taskForm.assignedTo} onChange={e => setTaskForm({...taskForm, assignedTo: e.target.value})} required style={{ padding: '10px 14px', border: '1px solid #e0dfdc', borderRadius: '8px', fontSize: '14px' }}>
              <option value="">Select member...</option>
              {activeAccounts.filter(s=>s.role!=='master').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input type="date" value={taskForm.dueDate} onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})} required style={{ flex: 1, padding: '10px 14px', border: '1px solid #e0dfdc', borderRadius: '8px', fontSize: '14px' }} />
              <select value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})} style={{ flex: 1, padding: '10px 14px', border: '1px solid #e0dfdc', borderRadius: '8px', fontSize: '14px' }}>
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
                <option value="Urgent">🔴 Urgent</option>
              </select>
            </div>
            <button type="submit" className="scicomm-btn-primary" style={{ padding: '10px', fontSize: '15px' }}>Assign Task</button>
          </form>

          <h4 style={{ margin: '24px 0 12px', fontSize: '16px' }}>Recent Tasks ({tasksData.length})</h4>
          {tasksData.slice(0,10).map(t => {
            const assignee = scientists.find(s => String(s.id) === String(t.assignedTo));
            return (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eef3f8', fontSize: '14px' }}>
                <div>
                  <strong>{t.title}</strong>
                  <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.6)' }}>→ {assignee?.name || 'Unknown'} • Due: {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '-'}</div>
                </div>
                <span style={{ background: t.status === 'Completed' ? '#bbf7d0' : t.priority === 'Urgent' ? '#fee2e2' : '#eef3f8', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, alignSelf: 'center' }}>{t.status}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Warnings */}
      {activeTab === 'warnings' && (
        <div className="scicomm-card scicomm-card-padding">
          <h3 style={{ margin: '0 0 16px', fontSize: '18px' }}>⚠️ Issue a Warning</h3>
          <form onSubmit={handleSendWarning} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            <select value={warningForm.userId} onChange={e => setWarningForm({...warningForm, userId: e.target.value})} required style={{ padding: '10px 14px', border: '1px solid #e0dfdc', borderRadius: '8px', fontSize: '14px' }}>
              <option value="">Select member...</option>
              {activeAccounts.filter(s => s.role !== 'master').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <textarea placeholder="Warning message..." value={warningForm.message} onChange={e => setWarningForm({...warningForm, message: e.target.value})} required rows={2} style={{ padding: '10px 14px', border: '1px solid #e0dfdc', borderRadius: '8px', fontSize: '14px', resize: 'vertical' }} />
            <button type="submit" style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '24px', padding: '10px', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}>⚠️ Send Warning</button>
          </form>

          <h4 style={{ margin: '0 0 12px', fontSize: '16px' }}>Warning History</h4>
          {warningsData.length === 0 ? <p style={{ color: '#666' }}>No warnings issued yet.</p> : (
            warningsData.map(w => (
              <div key={w.id} style={{ padding: '10px 0', borderBottom: '1px solid #eef3f8', fontSize: '14px' }}>
                <div><strong>{w.userName}</strong> — {w.message}</div>
                <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.6)' }}>By {w.issuedBy} • {new Date(w.issuedAt).toLocaleDateString()}</div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Award Tag */}
      {activeTab === 'tags' && (
        <div className="scicomm-card scicomm-card-padding">
          <h3 style={{ margin: '0 0 16px', fontSize: '18px' }}>🏅 Award Achievement Tag</h3>
          <form onSubmit={handleAwardTag} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <select value={tagForm.userId} onChange={e => setTagForm({...tagForm, userId: e.target.value})} required style={{ padding: '10px 14px', border: '1px solid #e0dfdc', borderRadius: '8px', fontSize: '14px' }}>
              <option value="">Select member...</option>
              {activeAccounts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={tagForm.tag} onChange={e => setTagForm({...tagForm, tag: e.target.value})} required style={{ padding: '10px 14px', border: '1px solid #e0dfdc', borderRadius: '8px', fontSize: '14px' }}>
              <option value="">Select tag...</option>
              {SCICOMM_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button type="submit" className="scicomm-btn-primary" style={{ padding: '10px', fontSize: '15px' }}>🎖️ Award Tag</button>
          </form>
        </div>
      )}

      {/* Posts Moderation */}
      {activeTab === 'posts' && (
        <div className="scicomm-card scicomm-card-padding">
          <h3 style={{ margin: '0 0 16px', fontSize: '18px' }}>📝 Content Moderation</h3>
          {posts.length === 0 ? <p style={{ color: '#666' }}>No posts to moderate.</p> : (
            posts.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #eef3f8' }}>
                <div>
                  <strong style={{ fontSize: '14px' }}>{p.authorName}</strong>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'rgba(0,0,0,0.6)' }}>{p.content.substring(0, 80)}{p.content.length > 80 ? '...' : ''}</p>
                </div>
                <button onClick={() => handleRemovePost(p.id)} style={{ background: '#fee2e2', border: 'none', color: '#991b1b', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                  <Trash2 size={14} /> Remove
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

const SCICOMM_TAGS = [
  "🌟 Top Communicator", "✍️ Content Creator", "🎙️ Public Speaker", "📢 Outreach Pioneer",
  "🧬 Science Advocate", "📸 Visual Storyteller", "🎥 Video Producer", "🏅 Team Leader",
  "💡 Innovator", "📚 Knowledge Sharer", "🤝 Collaborator", "🔬 Research Enthusiast",
  "🌍 Global Thinker", "🎓 Mentor", "📝 Science Writer", "🧪 Lab Hero",
  "🌱 Sustainability Champion", "🩺 Health Communicator", "🚀 Rising Star", "🧠 Critical Thinker",
  "🎨 Creative Genius", "📊 Data Storyteller", "🗣️ Debate Champion", "🌐 Digital Native",
  "🏆 Award Winner", "⚡ Quick Learner", "🤖 Tech Savvy", "📖 Bookworm",
  "🎤 Podcast Host", "📣 Social Media Star", "🧑‍🏫 Educator", "🗞️ Press & Media",
  "🛡️ Fact Checker", "📡 Science Broadcaster", "🎬 Film Maker", "🖊️ Blog Author",
  "🏗️ Event Organizer", "🌿 Eco Warrior", "🎭 Science Performer", "🤓 Trivia Master",
  "🧑‍🔬 Citizen Scientist", "📍 Community Leader", "🪄 Engagement Wizard", "🔊 Voice of Reason",
  "🗺️ Explorer", "🎯 Goal Achiever", "📐 Precision Expert", "🕊️ Peace Builder",
  "🏋️ Hard Worker", "💎 Diamond Member"
];
