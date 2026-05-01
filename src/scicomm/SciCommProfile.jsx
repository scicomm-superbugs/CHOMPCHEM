import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, useLiveCollection } from '../db';
import { Camera, Edit2 } from 'lucide-react';

export default function SciCommProfile() {
  const { user } = useAuth();
  const scientists = useLiveCollection('scientists');
  const currentUserData = scientists?.find(s => String(s.id) === String(user.id));
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    bio: currentUserData?.bio || '',
    department: currentUserData?.department || ''
  });

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
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
    <div className="scicomm-main" style={{ maxWidth: '800px' }}>
      <div className="scicomm-card" style={{ position: 'relative' }}>
        <div style={{ height: '200px', backgroundColor: '#a0b4b7' }}></div>
        <div style={{ padding: '24px', paddingTop: '0' }}>
          <div style={{ position: 'relative', width: '150px', height: '150px', marginTop: '-75px', marginBottom: '16px' }}>
            <img 
              src={currentUserData?.avatar || 'https://via.placeholder.com/150'} 
              alt="Profile" 
              style={{ width: '150px', height: '150px', borderRadius: '50%', border: '4px solid white', objectFit: 'cover' }} 
            />
            <label style={{ position: 'absolute', bottom: '10px', right: '10px', backgroundColor: '#fff', borderRadius: '50%', padding: '6px', cursor: 'pointer', boxShadow: '0 0 0 1px rgba(0,0,0,0.1)' }}>
              <Camera size={18} color="#666" />
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
            </label>
          </div>

          {isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '400px' }}>
              <input type="text" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} placeholder="Headline / Role" className="scicomm-search-box" style={{ width: '100%' }} />
              <textarea value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} placeholder="Bio" rows={3} style={{ padding: '8px', border: '1px solid #e0dfdc', borderRadius: '4px' }} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="scicomm-btn-primary" onClick={handleSave}>Save</button>
                <button className="scicomm-btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h1 style={{ margin: '0 0 4px', fontSize: '24px' }}>{user.name}</h1>
                  <p style={{ margin: '0 0 16px', fontSize: '16px', color: 'rgba(0,0,0,0.9)' }}>{currentUserData?.department || 'Science Communicator'}</p>
                  <p className="scicomm-text-muted">{currentUserData?.bio || 'Passionate about sharing science with the world.'}</p>
                </div>
                <button onClick={() => setIsEditing(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}>
                  <Edit2 size={20} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="scicomm-card scicomm-card-padding">
        <h2 style={{ fontSize: '20px', margin: '0 0 16px' }}>Achievements & Tags</h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ backgroundColor: '#eef3f8', color: '#0a66c2', padding: '4px 12px', borderRadius: '16px', fontSize: '14px', fontWeight: 600 }}>🌟 Top Communicator</span>
          <span style={{ backgroundColor: '#eef3f8', color: '#0a66c2', padding: '4px 12px', borderRadius: '16px', fontSize: '14px', fontWeight: 600 }}>✍️ Content Creator</span>
        </div>
      </div>
    </div>
  );
}
