import { useState } from 'react';
import { db, useLiveCollection } from '../db';
import { ClipboardList, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Tasks() {
  const { user } = useAuth();
  const isAdminOrMaster = user?.role === 'admin' || user?.role === 'master';

  const [task, setTask] = useState({
    title: '',
    description: '',
    assignedTo: '',
    deadline: '',
    status: 'Pending'
  });
  
  const scientists = useLiveCollection('scientists');
  const tasks = useLiveCollection('tasks');

  if (!scientists || !tasks) return <div className="page-content container">Loading tasks...</div>;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdminOrMaster) return;
    try {
      await db.tasks.add({
        ...task,
        assignedBy: user.id,
        createdAt: new Date().toISOString()
      });
      setTask({ title: '', description: '', assignedTo: '', deadline: '', status: 'Pending' });
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await db.tasks.update(id, { status: newStatus });
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTasks = tasks.filter(t => isAdminOrMaster || String(t.assignedTo) === String(user.id))
                             .sort((a,b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Lab Tasks</h1>

      <div className="two-col-grid">
        {isAdminOrMaster && (
          <div className="card" style={{ alignSelf: 'start' }}>
            <div className="card-header">
              <h2 className="card-title"><ClipboardList size={20} /> Assign Task</h2>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Task Title</label>
                <input type="text" className="form-control" required value={task.title} onChange={e => setTask({...task, title: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-control" rows="3" required value={task.description} onChange={e => setTask({...task, description: e.target.value})}></textarea>
              </div>
              <div className="form-group">
                <label className="form-label">Assign To</label>
                <select className="form-control" required value={task.assignedTo} onChange={e => setTask({...task, assignedTo: e.target.value})}>
                  <option value="">Select Scientist...</option>
                  {scientists.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Deadline</label>
                <input type="date" className="form-control" required value={task.deadline} onChange={e => setTask({...task, deadline: e.target.value})} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Assign Task</button>
            </form>
          </div>
        )}

        <div className="card" style={{ gridColumn: isAdminOrMaster ? 'auto' : '1 / -1' }}>
          <div className="card-header">
            <h2 className="card-title">My Tasks</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredTasks.length > 0 ? filteredTasks.map(t => {
              const assignedUser = scientists.find(s => String(s.id) === String(t.assignedTo));
              const isOverdue = new Date(t.deadline) < new Date() && t.status !== 'Completed';
              return (
                <div key={t.id} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', backgroundColor: isOverdue ? 'rgba(254, 215, 215, 0.2)' : 'transparent' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{t.title}</h3>
                    <span className={`badge ${t.status === 'Completed' ? 'badge-available' : t.status === 'In Progress' ? 'badge-in-use' : 'badge-warning'}`}>{t.status}</span>
                  </div>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>{t.description}</p>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                    <span><Clock size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />Due: <strong style={{ color: isOverdue ? 'var(--accent)' : 'inherit' }}>{new Date(t.deadline).toLocaleDateString()}</strong></span>
                    {isAdminOrMaster && <span>Assigned to: <strong>{assignedUser?.name || 'Unknown'}</strong></span>}
                  </div>
                  
                  {String(t.assignedTo) === String(user.id) && t.status !== 'Completed' && (
                    <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                      {t.status === 'Pending' && <button className="btn btn-primary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }} onClick={() => handleUpdateStatus(t.id, 'In Progress')}>Start Task</button>}
                      <button className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', backgroundColor: '#C6F6D5', color: '#22543D', border: '1px solid #9AE6B4' }} onClick={() => handleUpdateStatus(t.id, 'Completed')}><CheckCircle size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />Mark Completed</button>
                    </div>
                  )}
                </div>
              )
            }) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No tasks assigned.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
