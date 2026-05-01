import { useLiveCollection, db } from '../db';
import { useAuth } from '../context/AuthContext';
import { Briefcase, CheckCircle } from 'lucide-react';
import { useState } from 'react';

export default function SciCommTasks() {
  const { user } = useAuth();
  const tasksData = useLiveCollection('tasks') || [];
  const scientists = useLiveCollection('scientists') || [];

  const myTasks = tasksData.filter(t => String(t.assignedTo) === String(user.id));
  const pendingTasks = myTasks.filter(t => t.status !== 'Completed');
  const completedTasks = myTasks.filter(t => t.status === 'Completed');

  const handleComplete = async (taskId) => {
    try {
      await db.tasks.update(taskId, { status: 'Completed', completedAt: new Date().toISOString() });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="scicomm-feed-layout">
      <div className="scicomm-sidebar-left hide-on-mobile">
        <div className="scicomm-card scicomm-card-padding">
          <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>My Tasks</h3>
          <div className="scicomm-text-muted" style={{ marginBottom: '8px' }}>Active ({pendingTasks.length})</div>
          <div className="scicomm-text-muted">Completed ({completedTasks.length})</div>
        </div>
      </div>
      
      <div className="scicomm-feed-main">
        <div className="scicomm-card scicomm-card-padding">
          <h2 style={{ margin: '0 0 16px', fontSize: '18px' }}>Assigned Tasks</h2>
          
          {pendingTasks.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#666', padding: '24px' }}>You have no pending tasks. Great job!</div>
          ) : (
            pendingTasks.map(task => (
              <div key={task.id} style={{ display: 'flex', gap: '16px', borderBottom: '1px solid #e0dfdc', paddingBottom: '16px', marginBottom: '16px' }}>
                <div style={{ width: '48px', height: '48px', backgroundColor: '#eef3f8', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                  <Briefcase size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 4px', fontSize: '16px', color: '#0a66c2' }}>{task.title}</h3>
                  <div className="scicomm-text-muted" style={{ marginBottom: '8px' }}>Assigned by Admin • Due: {new Date(task.dueDate).toLocaleDateString()}</div>
                  <p style={{ margin: '0 0 12px', fontSize: '14px', lineHeight: '1.4' }}>{task.description}</p>
                  <button className="scicomm-btn-primary" onClick={() => handleComplete(task.id)}>Mark as Complete</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
