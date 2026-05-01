import { useLiveCollection } from '../db';
import { useAuth } from '../context/AuthContext';
import { Bell, AlertTriangle, Briefcase } from 'lucide-react';
import { useEffect } from 'react';

export default function SciCommNotifications() {
  const { user } = useAuth();
  const tasksData = useLiveCollection('tasks') || [];
  
  const myTasks = tasksData.filter(t => String(t.assignedTo) === String(user.id) && t.status !== 'Completed');

  // Push notifications
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="scicomm-feed-layout">
      <div className="scicomm-sidebar-left hide-on-mobile">
        <div className="scicomm-card scicomm-card-padding">
          <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>Notifications</h3>
          <div className="scicomm-text-muted" style={{ marginBottom: '8px' }}>Tasks ({myTasks.length})</div>
          <div className="scicomm-text-muted">Warnings (0)</div>
        </div>
      </div>
      
      <div className="scicomm-feed-main">
        <div className="scicomm-card scicomm-card-padding">
          {myTasks.length > 0 ? (
            myTasks.map(task => (
              <div key={task.id} style={{ display: 'flex', gap: '16px', borderBottom: '1px solid #e0dfdc', paddingBottom: '16px', marginBottom: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#eef3f8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                  <Briefcase size={20} />
                </div>
                <div>
                  <p style={{ margin: '0 0 4px', fontSize: '14px' }}>
                    <strong>Admin</strong> assigned you a new task: <strong>{task.title}</strong>
                  </p>
                  <div className="scicomm-text-muted" style={{ fontSize: '12px' }}>Due: {new Date(task.dueDate).toLocaleDateString()}</div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', color: '#666', padding: '24px' }}>
              <img src="https://static.licdn.com/aero-v1/sc/h/6d9k6mbsur6e1e62846d0ofg2" alt="No notifications" style={{ width: '150px', marginBottom: '16px' }} />
              <p>You're all caught up!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
