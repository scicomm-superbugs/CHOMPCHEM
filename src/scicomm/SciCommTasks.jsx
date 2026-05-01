import { useState } from 'react';
import { useLiveCollection, db } from '../db';
import { useAuth } from '../context/AuthContext';
import { Briefcase, CheckCircle, Clock, AlertCircle, Calendar, List, ChevronLeft, ChevronRight } from 'lucide-react';

export default function SciCommTasks() {
  const { user } = useAuth();
  const isAdmin = user.role === 'admin' || user.role === 'master';
  const tasksData = useLiveCollection('tasks') || [];
  const scientists = useLiveCollection('scientists') || [];
  const meetingsData = useLiveCollection('scicomm_meetings') || [];
  const warningsData = useLiveCollection('scicomm_warnings') || [];

  const [view, setView] = useState('list'); // list | calendar
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());

  const myTasks = isAdmin ? tasksData : tasksData.filter(t => String(t.assignedTo) === String(user.id));
  const pendingTasks = myTasks.filter(t => t.status !== 'Completed');
  const completedTasks = myTasks.filter(t => t.status === 'Completed');
  const now = new Date();

  const handleComplete = async (id) => { await db.tasks.update(id, { status: 'Completed', completedAt: new Date().toISOString() }); };
  const handleDelete = async (id) => { if (window.confirm("Delete?")) await db.tasks.delete(id); };
  const getAssignee = (id) => scientists.find(s => String(s.id) === String(id))?.name || 'Unknown';

  const getPriorityStyle = (p) => {
    if (p === 'Urgent') return { bg: '#fee2e2', color: '#991b1b', icon: '🔴' };
    if (p === 'High') return { bg: '#ffedd5', color: '#9a3412', icon: '🟠' };
    if (p === 'Medium') return { bg: '#fef3c7', color: '#92400e', icon: '🟡' };
    return { bg: '#ecfdf5', color: '#065f46', icon: '🟢' };
  };

  // Calendar helpers
  const getDaysInMonth = (m, y) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (m, y) => new Date(y, m, 1).getDay();
  const daysInMonth = getDaysInMonth(calMonth, calYear);
  const firstDay = getFirstDayOfMonth(calMonth, calYear);

  const getEventsForDate = (day) => {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const tasks = myTasks.filter(t => t.dueDate === dateStr);
    const meetings = meetingsData.filter(m => m.date === dateStr && ((m.members || []).includes(user.id) || m.allMembers));
    const warnings = warningsData.filter(w => String(w.userId) === String(user.id) && w.issuedAt?.startsWith(dateStr));
    return { tasks, meetings, warnings };
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="scicomm-feed-layout">
      <div className="scicomm-sidebar-left hide-on-mobile">
        <div className="scicomm-card scicomm-card-padding">
          <h3 style={{ margin: '0 0 12px', fontSize: '16px' }}><Briefcase size={16} color="#10b981" /> {isAdmin ? 'All Tasks' : 'My Tasks'}</h3>
          <div style={{ fontSize: '13px', color: 'rgba(0,0,0,0.6)', lineHeight: '2' }}>
            <div>Active: <strong style={{ color: '#f59e0b' }}>{pendingTasks.length}</strong></div>
            <div>Completed: <strong style={{ color: '#10b981' }}>{completedTasks.length}</strong></div>
          </div>
        </div>
      </div>

      <div className="scicomm-feed-main">
        {/* View Switcher */}
        <div className="scicomm-card" style={{ display: 'flex', overflow: 'hidden', marginBottom: '8px' }}>
          <button onClick={() => setView('list')} style={{ flex: 1, padding: '12px', border: 'none', background: view === 'list' ? '#10b981' : 'transparent', color: view === 'list' ? 'white' : 'rgba(0,0,0,0.6)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '14px' }}><List size={16} /> List View</button>
          <button onClick={() => setView('calendar')} style={{ flex: 1, padding: '12px', border: 'none', background: view === 'calendar' ? '#10b981' : 'transparent', color: view === 'calendar' ? 'white' : 'rgba(0,0,0,0.6)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '14px' }}><Calendar size={16} /> Calendar</button>
        </div>

        {view === 'list' ? (
          <div className="scicomm-card scicomm-card-padding">
            <h2 style={{ margin: '0 0 16px', fontSize: '20px' }}>📋 Tasks</h2>
            {pendingTasks.length === 0 && completedTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
                <p>{isAdmin ? 'No tasks. Assign some from Admin Dashboard.' : 'No tasks. Great job!'}</p>
              </div>
            ) : (
              <>
                {pendingTasks.length > 0 && (
                  <>
                    <h3 style={{ fontSize: '15px', margin: '0 0 10px', color: '#f59e0b' }}><Clock size={16} /> Active ({pendingTasks.length})</h3>
                    {pendingTasks.map(t => {
                      const ps = getPriorityStyle(t.priority);
                      const overdue = t.dueDate && new Date(t.dueDate) < now;
                      return (
                        <div key={t.id} style={{ display: 'flex', gap: '12px', padding: '14px', marginBottom: '6px', borderRadius: '8px', border: overdue ? '1px solid #fca5a5' : '1px solid #e0dfdc', background: overdue ? '#fff5f5' : 'white' }}>
                          <div style={{ width: '40px', height: '40px', background: ps.bg, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>{ps.icon}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                              <h4 style={{ margin: 0, fontSize: '15px' }}>{t.title}</h4>
                              <span style={{ background: ps.bg, color: ps.color, padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600 }}>{t.priority || 'Medium'}</span>
                            </div>
                            {isAdmin && <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>→ {getAssignee(t.assignedTo)}</div>}
                            {t.description && <p style={{ margin: '4px 0', fontSize: '13px', color: 'rgba(0,0,0,0.6)' }}>{t.description}</p>}
                            <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.5)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                              <span>📅 {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'TBD'}</span>
                              {overdue && <span style={{ color: '#ef4444', fontWeight: 600 }}>⚠ Overdue</span>}
                            </div>
                            <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                              {(String(t.assignedTo) === String(user.id) || isAdmin) && <button className="scicomm-btn-primary" style={{ padding: '4px 14px', fontSize: '12px' }} onClick={() => handleComplete(t.id)}><CheckCircle size={12} /> Complete</button>}
                              {isAdmin && <button style={{ padding: '4px 14px', fontSize: '12px', border: '1px solid #e0dfdc', borderRadius: '24px', background: 'transparent', cursor: 'pointer', color: '#ef4444' }} onClick={() => handleDelete(t.id)}>Delete</button>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
                {completedTasks.length > 0 && (
                  <>
                    <h3 style={{ fontSize: '15px', margin: '20px 0 10px', color: '#10b981' }}><CheckCircle size={16} /> Completed ({completedTasks.length})</h3>
                    {completedTasks.slice(0, 8).map(t => (
                      <div key={t.id} style={{ display: 'flex', gap: '10px', padding: '8px', borderRadius: '6px', background: '#f9fafb', marginBottom: '4px', opacity: 0.7, alignItems: 'center' }}>
                        <span>✅</span>
                        <span style={{ fontSize: '13px', textDecoration: 'line-through' }}>{t.title}</span>
                        {isAdmin && <span style={{ fontSize: '11px', color: 'rgba(0,0,0,0.4)' }}>→ {getAssignee(t.assignedTo)}</span>}
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        ) : (
          /* Calendar View */
          <div className="scicomm-card scicomm-card-padding">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }} style={{ background: 'none', border: '1px solid #e0dfdc', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronLeft size={16} /></button>
              <h2 style={{ margin: 0, fontSize: '18px' }}>{monthNames[calMonth]} {calYear}</h2>
              <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }} style={{ background: 'none', border: '1px solid #e0dfdc', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronRight size={16} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 600, color: 'rgba(0,0,0,0.5)', padding: '8px 0' }}>{d}</div>
              ))}
              {Array.from({ length: firstDay }).map((_, i) => <div key={'e' + i}></div>)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const ev = getEventsForDate(day);
                const hasEvents = ev.tasks.length + ev.meetings.length + ev.warnings.length > 0;
                const isToday = day === now.getDate() && calMonth === now.getMonth() && calYear === now.getFullYear();
                return (
                  <div key={day} style={{ minHeight: '60px', border: '1px solid #eef3f8', borderRadius: '4px', padding: '4px', background: isToday ? '#ecfdf5' : 'white', position: 'relative' }}>
                    <div style={{ fontSize: '12px', fontWeight: isToday ? 700 : 400, color: isToday ? '#10b981' : 'rgba(0,0,0,0.7)', marginBottom: '2px' }}>{day}</div>
                    {ev.tasks.slice(0, 2).map((t, j) => (
                      <div key={j} style={{ fontSize: '9px', background: t.status === 'Completed' ? '#dcfce7' : '#fef3c7', padding: '1px 3px', borderRadius: '3px', marginBottom: '1px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>📋 {t.title}</div>
                    ))}
                    {ev.meetings.slice(0, 1).map((m, j) => (
                      <div key={j} style={{ fontSize: '9px', background: '#dbeafe', padding: '1px 3px', borderRadius: '3px', marginBottom: '1px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>📅 {m.title}</div>
                    ))}
                    {ev.warnings.length > 0 && <div style={{ fontSize: '9px', background: '#fee2e2', padding: '1px 3px', borderRadius: '3px' }}>⚠️ Warning</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
