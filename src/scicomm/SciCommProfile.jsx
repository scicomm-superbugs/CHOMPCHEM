import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, useLiveCollection } from '../db';
import { Camera, Edit2, Award, Eye, Calendar, UserCircle } from 'lucide-react';

export default function SciCommProfile() {
  const { user } = useAuth();
  const scientists = useLiveCollection('scientists') || [];
  const currentUserData = scientists.find(s => String(s.id) === String(user.id));
  const postsData = useLiveCollection('scicomm_posts') || [];
  const tasksData = useLiveCollection('tasks') || [];
  
  const myPosts = postsData.filter(p => String(p.authorId) === String(user.id));
  const myCompletedTasks = tasksData.filter(t => String(t.assignedTo) === String(user.id) && t.status === 'Completed');
  const myTags = currentUserData?.scicommTags || [];

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: currentUserData?.name || user.name,
    bio: currentUserData?.bio || '',
    department: currentUserData?.department || '',
    email: currentUserData?.email || ''
  });

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 300 * 1024) { alert("Max 300KB image"); return; }
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        await db.scientists.update(user.id, { avatar: reader.result });
      } catch (err) {
        console.error(err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    try {
      await db.scientists.update(user.id, formData);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Profile Header Card */}
      <div className="scicomm-card" style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ height: '200px', background: 'linear-gradient(135deg, #10b981 0%, #047857 50%, #064e3b 100%)' }}></div>
        <div style={{ padding: '0 24px 24px' }}>
          <div style={{ position: 'relative', width: '150px', height: '150px', marginTop: '-75px', marginBottom: '16px' }}>
            {currentUserData?.avatar ? (
              <img src={currentUserData.avatar} alt="Profile" style={{ width: '150px', height: '150px', borderRadius: '50%', border: '4px solid white', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '150px', height: '150px', borderRadius: '50%', border: '4px solid white', background: '#eef3f8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><UserCircle size={60} color="#666" /></div>
            )}
            <label style={{ position: 'absolute', bottom: '10px', right: '10px', backgroundColor: '#fff', borderRadius: '50%', padding: '8px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
              <Camera size={18} color="#333" />
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
            </label>
          </div>

          {isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '450px' }}>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Full Name" style={{ padding: '10px 14px', border: '1px solid #e0dfdc', borderRadius: '8px', fontSize: '16px', fontWeight: 600 }} />
              <input type="text" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} placeholder="Headline / Role / Department" style={{ padding: '10px 14px', border: '1px solid #e0dfdc', borderRadius: '8px', fontSize: '14px' }} />
              <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Email" style={{ padding: '10px 14px', border: '1px solid #e0dfdc', borderRadius: '8px', fontSize: '14px' }} />
              <textarea value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} placeholder="Tell us about yourself..." rows={3} style={{ padding: '10px 14px', border: '1px solid #e0dfdc', borderRadius: '8px', fontSize: '14px', resize: 'vertical' }} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="scicomm-btn-primary" onClick={handleSave} style={{padding:'10px 24px'}}>Save Changes</button>
                <button className="scicomm-btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h1 style={{ margin: '0 0 4px', fontSize: '24px' }}>{currentUserData?.name || user.name}</h1>
                <p style={{ margin: '0 0 8px', fontSize: '16px', color: 'rgba(0,0,0,0.9)' }}>{currentUserData?.department || 'Science Communicator'}</p>
                {currentUserData?.email && <p style={{ margin: '0 0 8px', fontSize: '14px', color: 'rgba(0,0,0,0.6)' }}>📧 {currentUserData.email}</p>}
                <p style={{ margin: 0, fontSize: '14px', color: 'rgba(0,0,0,0.6)', maxWidth: '500px' }}>{currentUserData?.bio || 'Passionate about sharing science with the world.'}</p>
              </div>
              <button className="scicomm-btn-secondary" onClick={() => { setFormData({ name: currentUserData?.name || user.name, bio: currentUserData?.bio || '', department: currentUserData?.department || '', email: currentUserData?.email || '' }); setIsEditing(true); }} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Edit2 size={16} /> Edit Profile
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginTop: '8px' }}>
        <div className="scicomm-card scicomm-card-padding" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#10b981' }}>{myPosts.length}</div>
          <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.6)' }}>Posts</div>
        </div>
        <div className="scicomm-card scicomm-card-padding" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#10b981' }}>{myCompletedTasks.length}</div>
          <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.6)' }}>Tasks Done</div>
        </div>
        <div className="scicomm-card scicomm-card-padding" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#10b981' }}>{currentUserData?.profileViews || 0}</div>
          <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.6)' }}>Profile Views</div>
        </div>
        <div className="scicomm-card scicomm-card-padding" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#10b981' }}>{myTags.length}</div>
          <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.6)' }}>Tags Earned</div>
        </div>
      </div>

      {/* Achievements */}
      <div className="scicomm-card scicomm-card-padding" style={{ marginTop: '8px' }}>
        <h2 style={{ fontSize: '20px', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Award size={22} color="#10b981" /> Achievements & Tags</h2>
        {myTags.length === 0 ? (
          <p style={{ color: '#666', fontSize: '14px' }}>No tags earned yet. Keep contributing to earn recognition!</p>
        ) : (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {myTags.map((tag, i) => (
              <span key={i} style={{ background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)', color: '#065f46', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 600, border: '1px solid #a7f3d0' }}>{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="scicomm-card scicomm-card-padding" style={{ marginTop: '8px' }}>
        <h2 style={{ fontSize: '20px', margin: '0 0 16px' }}>📝 Recent Posts</h2>
        {myPosts.length === 0 ? (
          <p style={{ color: '#666', fontSize: '14px' }}>You haven't posted anything yet.</p>
        ) : (
          myPosts.slice(0, 5).map(p => (
            <div key={p.id} style={{ padding: '12px 0', borderBottom: '1px solid #eef3f8' }}>
              <p style={{ margin: '0 0 4px', fontSize: '14px' }}>{p.content.substring(0, 120)}{p.content.length > 120 ? '...' : ''}</p>
              <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.4)', display: 'flex', gap: '12px' }}>
                <span>👍 {(p.likes || []).length} likes</span>
                <span>💬 {(p.comments || []).length} comments</span>
                <span>{new Date(p.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
