import { useLiveCollection, db } from '../db';
import { useAuth } from '../context/AuthContext';
import { Briefcase, CheckCircle, Clock, AlertCircle, UserCircle } from 'lucide-react';

export default function SciCommTasks() {
  const { user } = useAuth();
  const isAdmin = user.role === 'admin' || user.role === 'master';
  const tasksData = useLiveCollection('tasks') || [];
  const scientists = useLiveCollection('scientists') || [];

  const myTasks = isAdmin ? tasksData : tasksData.filter(t => String(t.assignedTo) === String(user.id));
  const pendingTasks = myTasks.filter(t => t.status !== 'Completed');
  const completedTasks = myTasks.filter(t => t.status === 'Completed');

  const handleComplete = async (taskId) => {
    try {
      await db.tasks.update(taskId, { status: 'Completed', completedAt: new Date().toISOString() });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (taskId) => {
    if (window.confirm("Delete this task?")) {
      await db.tasks.delete(taskId);
    }
  };

  const getPriorityStyle = (priority) => {
    if (priority === 'Urgent') return { bg: '#fee2e2', color: '#991b1b', icon: '🔴' };
    if (priority === 'High') return { bg: '#ffedd5', color: '#9a3412', icon: '🟠' };
    if (priority === 'Medium') return { bg: '#fef3c7', color: '#92400e', icon: '🟡' };
    return { bg: '#ecfdf5', color: '#065f46', icon: '🟢' };
  };

  const getAssigneeName = (id) => {
    const s = scientists.find(s => String(s.id) === String(id));
    return s?.name || 'Unassigned';
  };

  return (
    <div className="scicomm-feed-layout">
      <div className="scicomm-sidebar-left hide-on-mobile">
        <div className="scicomm-card scicomm-card-padding">
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Briefcase size={18} color="#10b981" /> {isAdmin ? 'All Tasks' : 'My Tasks'}
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
            <span style={{ color: 'rgba(0,0,0,0.6)' }}>Active</span>
            <strong style={{ color: '#f59e0b' }}>{pendingTasks.length}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: 'rgba(0,0,0,0.6)' }}>Completed</span>
            <strong style={{ color: '#10b981' }}>{completedTasks.length}</strong>
          </div>
        </div>
      </div>
      
      <div className="scicomm-feed-main">
        <div className="scicomm-card scicomm-card-padding">
          <h2 style={{ margin: '0 0 20px', fontSize: '20px' }}>📋 {isAdmin ? 'All Assigned Tasks' : 'My Assigned Tasks'}</h2>
          
          {pendingTasks.length === 0 && completedTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <div style={{fontSize:'48px',marginBottom:'12px'}}>✅</div>
              <h3 style={{margin:'0 0 8px'}}>No tasks yet</h3>
              <p style={{fontSize:'14px'}}>{isAdmin ? 'Use the Admin Dashboard to assign tasks.' : 'You have no assigned tasks. Great job!'}</p>
            </div>
          ) : (
            <>
              {pendingTasks.length > 0 && (
                <>
                  <h3 style={{ fontSize: '16px', margin: '0 0 12px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={18} /> Active ({pendingTasks.length})</h3>
                  {pendingTasks.map(task => {
                    const ps = getPriorityStyle(task.priority);
                    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
                    return (
                      <div key={task.id} style={{ display: 'flex', gap: '16px', padding: '16px', marginBottom: '8px', borderRadius: '8px', border: isOverdue ? '1px solid #fca5a5' : '1px solid #e0dfdc', background: isOverdue ? '#fff5f5' : 'white' }}>
                        <div style={{ width: '48px', height: '48px', background: ps.bg, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                          {ps.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                            <h3 style={{ margin: '0 0 4px', fontSize: '16px', color: '#111' }}>{task.title}</h3>
                            <span style={{ background: ps.bg, color: ps.color, padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>{task.priority || 'Medium'}</span>
                          </div>
                          {isAdmin && <div style={{ fontSize: '13px', color: '#10b981', fontWeight: 600, marginBottom: '4px' }}>→ {getAssigneeName(task.assignedTo)}</div>}
                          <p style={{ margin: '0 0 8px', fontSize: '14px', lineHeight: '1.4', color: 'rgba(0,0,0,0.7)' }}>{task.description}</p>
                          <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'rgba(0,0,0,0.5)', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span>📅 Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'TBD'}</span>
                            {isOverdue && <span style={{ color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={14} /> Overdue!</span>}
                          </div>
                          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                            {(String(task.assignedTo) === String(user.id) || isAdmin) && (
                              <button className="scicomm-btn-primary" style={{ padding: '6px 16px', fontSize: '13px' }} onClick={() => handleComplete(task.id)}>
                                <CheckCircle size={14} /> Complete
                              </button>
                            )}
                            {isAdmin && (
                              <button style={{ padding: '6px 16px', fontSize: '13px', border: '1px solid #e0dfdc', borderRadius: '24px', background: 'transparent', cursor: 'pointer', color: '#ef4444' }} onClick={() => handleDelete(task.id)}>
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {completedTasks.length > 0 && (
                <>
                  <h3 style={{ fontSize: '16px', margin: '24px 0 12px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle size={18} /> Completed ({completedTasks.length})</h3>
                  {completedTasks.slice(0, 10).map(task => (
                    <div key={task.id} style={{ display: 'flex', gap: '12px', padding: '12px', marginBottom: '4px', borderRadius: '8px', background: '#f9fafb', opacity: 0.7 }}>
                      <div style={{ width: '36px', height: '36px', background: '#ecfdf5', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✅</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px', textDecoration: 'line-through' }}>{task.title}</div>
                        {isAdmin && <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.5)' }}>→ {getAssigneeName(task.assignedTo)}</div>}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
