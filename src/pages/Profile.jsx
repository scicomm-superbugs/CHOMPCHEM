import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, useLiveCollection } from '../db';
import { User, Key, Trash2, Camera, Activity, Check } from 'lucide-react';
import bcrypt from 'bcryptjs';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('details');

  const [formData, setFormData] = useState({
    name: user.name || '',
    username: user.username || '',
    department: user.department || '',
    hideFromLeaderboard: user.hideFromLeaderboard || false
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const [msg, setMsg] = useState({ type: '', text: '' });
  
  // Fetch real-time user data to get avatar
  const scientists = useLiveCollection('scientists');
  const currentUserData = scientists?.find(s => String(s.id) === String(user.id));
  
  // History logs
  const usageLogsRaw = useLiveCollection('usage_logs');
  const chemicals = useLiveCollection('chemicals');

  const showMessage = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 4000);
  };

  const handleUpdateDetails = async (e) => {
    e.preventDefault();
    try {
      // Check username uniqueness if changed
      if (formData.username !== user.username) {
        const existing = await db.scientists.where('username').equals(formData.username).first();
        if (existing) {
          showMessage('error', 'Username is already taken.');
          return;
        }
      }
      await db.scientists.update(user.id, formData);
      showMessage('success', 'Profile updated successfully! (Relogin to see name changes globally)');
    } catch (err) {
      showMessage('error', 'Update failed: ' + err.message);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage('error', 'Passwords do not match!');
      return;
    }
    try {
      const salt = await bcrypt.genSalt(4);
      const hash = await bcrypt.hash(passwordData.newPassword, salt);
      await db.scientists.update(user.id, { passwordHash: hash });
      setPasswordData({ newPassword: '', confirmPassword: '' });
      showMessage('success', 'Password updated successfully!');
    } catch (err) {
      showMessage('error', 'Password update failed: ' + err.message);
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 200 * 1024) { // Limit to 200KB to save Firestore bandwidth
      showMessage('error', 'Image size must be less than 200KB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;
      try {
        await db.scientists.update(user.id, { avatar: base64String });
        showMessage('success', 'Profile picture updated!');
      } catch (err) {
        showMessage('error', 'Failed to upload image: ' + err.message);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteProfile = async () => {
    if (user.role === 'admin') {
      alert("Admin accounts cannot be deleted from the profile page. Please contact system administrators.");
      return;
    }

    if (window.confirm("Are you ABSOLUTELY sure you want to delete your profile? This cannot be undone.")) {
      try {
        await db.scientists.delete(user.id);
        logout();
      } catch (err) {
        showMessage('error', 'Failed to delete profile.');
      }
    }
  };

  // Compile history
  let historyLogs = [];
  if (usageLogsRaw && chemicals) {
    historyLogs = usageLogsRaw
      .filter(log => String(log.scientistId) === String(user.id))
      .sort((a, b) => new Date(b.borrowDate).getTime() - new Date(a.borrowDate).getTime())
      .map(log => {
        const chem = chemicals.find(c => c.formula === log.chemicalFormula);
        return {
          ...log,
          chemicalName: chem ? chem.name : 'Unknown'
        };
      });
  }

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Account Settings</h1>

      {msg.text && (
        <div style={{ 
          backgroundColor: msg.type === 'error' ? '#FED7D7' : '#C6F6D5', 
          color: msg.type === 'error' ? '#822727' : '#22543D', 
          padding: '1rem', 
          borderRadius: '8px', 
          marginBottom: '2rem' 
        }}>
          {msg.text}
        </div>
      )}

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        
        {/* Sidebar */}
        <div style={{ flex: '0 0 250px' }}>
          <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 1rem' }}>
              {currentUserData?.avatar ? (
                <img src={currentUserData.avatar} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--primary)' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', backgroundColor: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', border: '4px solid var(--primary)' }}>
                  <User size={48} />
                </div>
              )}
              <label style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: 'var(--accent)', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}>
                <Camera size={16} />
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
              </label>
            </div>
            <h3>{user.name}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{user.role === 'admin' ? 'Administrator' : 'Scientist'}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>ID: {currentUserData?.employeeId || '-'}</p>
          </div>

          <div className="card" style={{ padding: '0.5rem 0' }}>
            <button 
              style={{ width: '100%', padding: '1rem 1.5rem', textAlign: 'left', background: activeTab === 'details' ? 'var(--secondary)' : 'transparent', border: 'none', borderLeft: activeTab === 'details' ? '4px solid var(--primary)' : '4px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: activeTab === 'details' ? 600 : 400, color: 'var(--text)' }}
              onClick={() => setActiveTab('details')}
            ><User size={18} /> Edit Details</button>
            <button 
              style={{ width: '100%', padding: '1rem 1.5rem', textAlign: 'left', background: activeTab === 'security' ? 'var(--secondary)' : 'transparent', border: 'none', borderLeft: activeTab === 'security' ? '4px solid var(--primary)' : '4px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: activeTab === 'security' ? 600 : 400, color: 'var(--text)' }}
              onClick={() => setActiveTab('security')}
            ><Key size={18} /> Security</button>
            <button 
              style={{ width: '100%', padding: '1rem 1.5rem', textAlign: 'left', background: activeTab === 'history' ? 'var(--secondary)' : 'transparent', border: 'none', borderLeft: activeTab === 'history' ? '4px solid var(--primary)' : '4px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: activeTab === 'history' ? 600 : 400, color: 'var(--text)' }}
              onClick={() => setActiveTab('history')}
            ><Activity size={18} /> Usage History</button>
            <button 
              style={{ width: '100%', padding: '1rem 1.5rem', textAlign: 'left', background: activeTab === 'danger' ? 'var(--secondary)' : 'transparent', border: 'none', borderLeft: activeTab === 'danger' ? '4px solid var(--accent)' : '4px solid transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: activeTab === 'danger' ? 600 : 400, color: 'var(--accent)' }}
              onClick={() => setActiveTab('danger')}
            ><Trash2 size={18} /> Danger Zone</button>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ flex: '1', minWidth: '300px' }}>
          
          {activeTab === 'details' && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Profile Details</h2>
              </div>
              <form onSubmit={handleUpdateDetails}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input type="text" className="form-control" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Username</label>
                  <input type="text" className="form-control" required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input type="text" className="form-control" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', marginBottom: '1.5rem' }}>
                  <input 
                    type="checkbox" 
                    id="hideFromLeaderboard" 
                    checked={formData.hideFromLeaderboard} 
                    onChange={e => setFormData({...formData, hideFromLeaderboard: e.target.checked})} 
                  />
                  <label htmlFor="hideFromLeaderboard" style={{ cursor: 'pointer', margin: 0 }}>Hide my name and score from the Leaderboard (Appear as Anonymous)</label>
                </div>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Change Password</h2>
              </div>
              <form onSubmit={handleUpdatePassword}>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input type="password" className="form-control" required value={passwordData.newPassword} onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input type="password" className="form-control" required value={passwordData.confirmPassword} onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})} />
                </div>
                <button type="submit" className="btn btn-primary">Update Password</button>
              </form>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">My Chemical Usage History</h2>
              </div>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Chemical</th>
                      <th>Borrow Date</th>
                      <th>Return Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyLogs.length > 0 ? historyLogs.map(log => (
                      <tr key={log.id}>
                        <td>
                          <strong>{log.chemicalFormula}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.chemicalName}</div>
                        </td>
                        <td>{new Date(log.borrowDate).toLocaleDateString()}</td>
                        <td>{log.returnDate ? new Date(log.returnDate).toLocaleDateString() : '-'}</td>
                        <td>
                          <span className={`badge ${log.status === 'Returned' ? 'badge-available' : log.status === 'In Use' ? 'badge-in-use' : log.status === 'Rejected' ? 'badge-overdue' : 'badge-warning'}`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No usage history found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'danger' && (
            <div className="card" style={{ border: '1px solid #FED7D7' }}>
              <div className="card-header" style={{ borderBottom: '1px solid #FED7D7' }}>
                <h2 className="card-title" style={{ color: 'var(--accent)' }}>Danger Zone</h2>
              </div>
              <p style={{ margin: '1rem 0' }}>
                Deleting your account will permanently remove your scientist profile from the system. 
                Your historical usage logs will be retained for auditing purposes but will no longer be linked to your account.
              </p>
              <button className="btn btn-danger" onClick={handleDeleteProfile}>
                Delete My Profile
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
