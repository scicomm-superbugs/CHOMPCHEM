import { useState } from 'react';
import { useLiveCollection, db } from '../db';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, ChevronRight, Plus, User as UserIcon } from 'lucide-react';

export default function SciCommCalendar() {
  const { user } = useAuth();
  const isAdmin = user.role === 'admin' || user.role === 'master';
  
  const tasksData = useLiveCollection('tasks') || [];
  const meetingsData = useLiveCollection('scicomm_meetings') || [];
  const warningsData = useLiveCollection('scicomm_warnings') || [];
  const scientists = useLiveCollection('scientists') || [];
  // For personal events, we can store them in a new collection or within the user document. Let's use user.personalEvents array in scientists collection for simplicity
  
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  
  const [selectedUserId, setSelectedUserId] = useState(user.id); // For admin to view others
  const targetUser = scientists.find(s => String(s.id) === String(selectedUserId));

  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({ date: '', title: '', type: 'personal' });

  const now = new Date();

  // Filter data for target user
  const userTasks = tasksData.filter(t => String(t.assignedTo) === String(selectedUserId));
  const userMeetings = meetingsData.filter(m => (m.attendees || []).includes(selectedUserId));
  const userWarnings = warningsData.filter(w => String(w.userId) === String(selectedUserId));
  const userPersonalEvents = targetUser?.personalEvents || [];

  // Calendar helpers
  const getDaysInMonth = (m, y) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (m, y) => new Date(y, m, 1).getDay();
  const daysInMonth = getDaysInMonth(calMonth, calYear);
  const firstDay = getFirstDayOfMonth(calMonth, calYear);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const getEventsForDate = (day) => {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const tasks = userTasks.filter(t => t.dueDate === dateStr);
    const meetings = userMeetings.filter(m => m.date === dateStr);
    const warnings = userWarnings.filter(w => w.issuedAt?.startsWith(dateStr));
    const personal = userPersonalEvents.filter(e => e.date === dateStr);
    return { tasks, meetings, warnings, personal };
  };

  const handleAddPersonalEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.date || !newEvent.title) return;
    const updatedEvents = [...(targetUser?.personalEvents || []), { ...newEvent, id: Date.now() }];
    await db.scientists.update(selectedUserId, { personalEvents: updatedEvents });
    setShowAddEvent(false);
    setNewEvent({ date: '', title: '', type: 'personal' });
  };

  const handleDeletePersonalEvent = async (eventId) => {
    const updatedEvents = (targetUser?.personalEvents || []).filter(e => e.id !== eventId);
    await db.scientists.update(selectedUserId, { personalEvents: updatedEvents });
  };

  return (
    <div className="scicomm-card scicomm-card-padding" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      {isAdmin && (
        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', background: '#eef3f8', padding: '10px', borderRadius: '8px' }}>
          <UserIcon size={16} />
          <strong>Viewing Calendar for:</strong>
          <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}>
            <option value={user.id}>My Calendar</option>
            {scientists.filter(s => String(s.id) !== String(user.id) && s.accountStatus === 'active').map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.department || 'Member'})</option>
            ))}
          </select>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }} style={{ background: 'none', border: '1px solid #e0dfdc', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronLeft size={16} /></button>
          <h2 style={{ margin: 0, fontSize: '20px' }}>{monthNames[calMonth]} {calYear}</h2>
          <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }} style={{ background: 'none', border: '1px solid #e0dfdc', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronRight size={16} /></button>
        </div>
        <button className="scicomm-btn-primary" onClick={() => setShowAddEvent(true)}><Plus size={16} /> Add Personal Event</button>
      </div>

      {showAddEvent && (
        <form onSubmit={handleAddPersonalEvent} style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #e0dfdc' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '15px' }}>Add Personal Event / Unavailable Time</h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input type="date" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} required style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
            <input type="text" placeholder="Event Title (e.g., Lecture, Exam)" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} required style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', flex: 1 }} />
            <button type="submit" className="scicomm-btn-primary">Save</button>
            <button type="button" className="scicomm-btn-secondary" onClick={() => setShowAddEvent(false)}>Cancel</button>
          </div>
          <p style={{ fontSize: '11px', color: '#666', margin: '6px 0 0' }}>This event will be visible to Admins to avoid scheduling conflicts.</p>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '12px', fontWeight: 600, color: 'rgba(0,0,0,0.5)', padding: '8px 0' }}>{d}</div>
        ))}
        {Array.from({ length: firstDay }).map((_, i) => <div key={'e' + i}></div>)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const ev = getEventsForDate(day);
          const isToday = day === now.getDate() && calMonth === now.getMonth() && calYear === now.getFullYear();
          return (
            <div key={day} style={{ minHeight: '80px', border: '1px solid #eef3f8', borderRadius: '4px', padding: '4px', background: isToday ? '#ecfdf5' : 'white', position: 'relative' }}>
              <div style={{ fontSize: '12px', fontWeight: isToday ? 700 : 400, color: isToday ? '#10b981' : 'rgba(0,0,0,0.7)', marginBottom: '4px' }}>{day}</div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {ev.tasks.map((t, j) => (
                  <div key={'t'+j} style={{ fontSize: '10px', background: t.status === 'Completed' || t.status === 'Approved' ? '#dcfce7' : '#fef3c7', padding: '2px 4px', borderRadius: '4px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', color: '#333' }}>
                    📋 {t.title}
                  </div>
                ))}
                {ev.meetings.map((m, j) => (
                  <div key={'m'+j} style={{ fontSize: '10px', background: '#dbeafe', padding: '2px 4px', borderRadius: '4px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', color: '#1e3a8a' }}>
                    📅 {m.title}
                  </div>
                ))}
                {ev.personal.map((p, j) => (
                  <div key={'p'+j} style={{ fontSize: '10px', background: '#f3f4f6', border: '1px dashed #9ca3af', padding: '2px 4px', borderRadius: '4px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', color: '#4b5563', display: 'flex', justifyContent: 'space-between' }}>
                    <span>📌 {p.title}</span>
                    {String(selectedUserId) === String(user.id) && (
                      <span style={{ cursor: 'pointer', color: '#ef4444' }} onClick={() => handleDeletePersonalEvent(p.id)}>×</span>
                    )}
                  </div>
                ))}
                {ev.warnings.map((w, j) => (
                  <div key={'w'+j} style={{ fontSize: '10px', background: '#fee2e2', padding: '2px 4px', borderRadius: '4px', color: '#991b1b' }}>
                    ⚠️ Warning
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
