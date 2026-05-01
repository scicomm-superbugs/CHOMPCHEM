import { useLiveCollection, db } from '../db';
import { useAuth } from '../context/AuthContext';
import { Bell, AlertTriangle, Briefcase, UserCheck, CheckCircle } from 'lucide-react';
import { useEffect } from 'react';

export default function SciCommNotifications() {
  const { user } = useAuth();
  const isAdmin = user.role === 'admin' || user.role === 'master';
  const tasksData = useLiveCollection('tasks') || [];
  const warningsData = useLiveCollection('scicomm_warnings') || [];
  const scientists = useLiveCollection('scientists') || [];

  const myTasks = tasksData.filter(t => String(t.assignedTo) === String(user.id) && t.status !== 'Completed');
  const myWarnings = warningsData.filter(w => String(w.userId) === String(user.id));
  const pendingAccounts = isAdmin ? scientists.filter(s => s.accountStatus === 'pending') : [];

  // Mark warnings as seen
  useEffect(() => {
    myWarnings.filter(w => !w.seen).forEach(async (w) => {
      try {
        await db.scicomm_warnings.update(w.id, { seen: true });
      } catch (e) { console.error(e); }
    });
  }, [myWarnings.length]);

  // Request push notifications
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const allNotifications = [
    ...myTasks.map(t => ({ type: 'task', icon: <Briefcase size={20} color="#10b981" />, title: `New task: ${t.title}`, sub: `Due: ${t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'TBD'}`, time: t.createdAt, id: 't_' + t.id })),
    ...myWarnings.map(w => ({ type: 'warning', icon: <AlertTriangle size={20} color="#ef4444" />, title: `⚠️ Warning from ${w.issuedBy}`, sub: w.message, time: w.issuedAt, id: 'w_' + w.id })),
    ...pendingAccounts.map(s => ({ type: 'pending', icon: <UserCheck size={20} color="#f59e0b" />, title: `New account request: ${s.name}`, sub: `@${s.username} — awaiting approval`, time: '', id: 'p_' + s.id })),
  ].sort((a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime());

  return (
    <div className="scicomm-feed-layout">
      <div className="scicomm-sidebar-left hide-on-mobile">
        <div className="scicomm-card scicomm-card-padding">
          <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>Notifications</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
            <span style={{ color: 'rgba(0,0,0,0.6)' }}>Tasks</span>
            <strong style={{ color: '#10b981' }}>{myTasks.length}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
            <span style={{ color: 'rgba(0,0,0,0.6)' }}>Warnings</span>
            <strong style={{ color: '#ef4444' }}>{myWarnings.length}</strong>
          </div>
          {isAdmin && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: 'rgba(0,0,0,0.6)' }}>Pending Accounts</span>
              <strong style={{ color: '#f59e0b' }}>{pendingAccounts.length}</strong>
            </div>
          )}
        </div>
      </div>
      
      <div className="scicomm-feed-main">
        <div className="scicomm-card scicomm-card-padding">
          <h2 style={{ margin: '0 0 16px', fontSize: '18px' }}>🔔 Notifications</h2>

          {allNotifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
              <h3 style={{ margin: '0 0 8px' }}>You're all caught up!</h3>
              <p style={{ fontSize: '14px' }}>No new notifications at this time.</p>
            </div>
          ) : (
            allNotifications.map(n => (
              <div key={n.id} style={{ display: 'flex', gap: '16px', padding: '16px 0', borderBottom: '1px solid #eef3f8', alignItems: 'flex-start' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: n.type === 'warning' ? '#fee2e2' : n.type === 'pending' ? '#fef3c7' : '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {n.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600 }}>{n.title}</p>
                  <p style={{ margin: 0, fontSize: '13px', color: 'rgba(0,0,0,0.6)' }}>{n.sub}</p>
                  {n.time && <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.4)', marginTop: '4px' }}>{new Date(n.time).toLocaleString()}</div>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
