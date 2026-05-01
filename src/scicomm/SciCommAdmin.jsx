import { useLiveCollection, db } from '../db';
import { useAuth } from '../context/AuthContext';
import { Trash2, UserCheck, UserX } from 'lucide-react';

export default function SciCommAdmin() {
  const { user } = useAuth();
  const scientists = useLiveCollection('scientists') || [];
  const posts = useLiveCollection('scicomm_posts') || []; // If using messages or a custom table
  // For now we map over scientists and posts

  const handlePromote = async (id) => {
    await db.scientists.update(id, { role: 'admin' });
  };

  const handleRemoveUser = async (id) => {
    if (window.confirm("Remove user?")) {
      await db.scientists.delete(id);
    }
  };

  const handleRemovePost = async (id) => {
    if (window.confirm("Delete this post?")) {
      await db.scicomm_posts.delete(id);
    }
  };

  return (
    <div className="scicomm-main" style={{ maxWidth: '800px' }}>
      <div className="scicomm-card scicomm-card-padding">
        <h2 style={{ margin: '0 0 16px', fontSize: '20px' }}>Master Admin Dashboard</h2>
        <p className="scicomm-text-muted">Manage users, posts, and tasks across the SciComm platform.</p>
      </div>

      <div className="scicomm-card scicomm-card-padding">
        <h3 style={{ margin: '0 0 16px', fontSize: '18px' }}>Content Moderation</h3>
        {posts.length === 0 ? <p className="scicomm-text-muted">No posts to moderate.</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', marginBottom: '24px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e0dfdc', textAlign: 'left' }}>
                <th style={{ padding: '8px 0' }}>Author</th>
                <th style={{ padding: '8px 0' }}>Snippet</th>
                <th style={{ padding: '8px 0' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #eef3f8' }}>
                  <td style={{ padding: '12px 0', fontWeight: 600 }}>{p.authorName}</td>
                  <td style={{ padding: '12px 0' }}>{p.content.substring(0, 40)}...</td>
                  <td style={{ padding: '12px 0' }}>
                    <button onClick={() => handleRemovePost(p.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="scicomm-card scicomm-card-padding">
        <h3 style={{ margin: '0 0 16px', fontSize: '18px' }}>User Management</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e0dfdc', textAlign: 'left' }}>
              <th style={{ padding: '8px 0' }}>User</th>
              <th style={{ padding: '8px 0' }}>Role</th>
              <th style={{ padding: '8px 0' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {scientists.map(s => (
              <tr key={s.id} style={{ borderBottom: '1px solid #eef3f8' }}>
                <td style={{ padding: '12px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img src={s.avatar || 'https://via.placeholder.com/32'} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                    <div>
                      <div style={{ fontWeight: 600 }}>{s.name}</div>
                      <div className="scicomm-text-muted">{s.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px 0' }}>
                  <span style={{ backgroundColor: s.role === 'master' ? '#fef08a' : s.role === 'admin' ? '#bbf7d0' : '#eef3f8', padding: '4px 8px', borderRadius: '12px', fontSize: '12px' }}>
                    {s.role}
                  </span>
                </td>
                <td style={{ padding: '12px 0' }}>
                  {s.role !== 'master' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {s.role !== 'admin' && (
                        <button onClick={() => handlePromote(s.id)} className="scicomm-btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>Promote</button>
                      )}
                      <button onClick={() => handleRemoveUser(s.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><UserX size={18} /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
