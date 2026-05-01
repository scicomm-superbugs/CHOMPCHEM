import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, Briefcase, Bell, UserCircle, Search, Trophy, Shield, MessageCircle, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLiveCollection } from '../db';
import { useEffect, useRef } from 'react';
import { AVATARS } from './scicommConstants';
import '../scicomm.css';

export default function SciCommLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const scientists = useLiveCollection('scientists');
  const me = scientists?.find(s => String(s.id) === String(user.id));

  const tasksData = useLiveCollection('tasks') || [];
  const warningsData = useLiveCollection('scicomm_warnings') || [];
  const pendingAccounts = (scientists || []).filter(s => s.accountStatus === 'pending');
  const chatMessages = useLiveCollection('scicomm_chat_messages') || [];

  const myPendingTasks = tasksData.filter(t => String(t.assignedTo) === String(user.id) && t.status !== 'Completed');
  const myWarnings = warningsData.filter(w => String(w.userId) === String(user.id) && !w.seen);
  const isAdmin = user.role === 'admin' || user.role === 'master';

  const notifCount = myPendingTasks.length + myWarnings.length + (isAdmin ? pendingAccounts.length : 0);

  // Push notifications
  const prevTaskCount = useRef(myPendingTasks.length);
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
  }, []);
  useEffect(() => {
    if (myPendingTasks.length > prevTaskCount.current && Notification.permission === 'granted') {
      new Notification('📋 New Task Assigned!', { body: myPendingTasks[0]?.title, icon: './aiu_scicomm_logo.png' });
    }
    prevTaskCount.current = myPendingTasks.length;
  }, [myPendingTasks.length]);

  const prevWarningCount = useRef(myWarnings.length);
  useEffect(() => {
    if (myWarnings.length > prevWarningCount.current && Notification.permission === 'granted') {
      new Notification('⚠️ Warning Received', { body: myWarnings[0]?.message, icon: './aiu_scicomm_logo.png' });
    }
    prevWarningCount.current = myWarnings.length;
  }, [myWarnings.length]);

  const handleLogout = () => { logout(); navigate('/login'); };
  const isActive = (path) => location.pathname === path;

  const renderAvatar = (size = 24) => {
    if (me?.avatar) return <img src={me.avatar} alt="Me" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />;
    const av = AVATARS.find(a => a.id === me?.avatarId);
    if (av) return <div style={{ width: size, height: size, borderRadius: '50%', background: av.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.5 }}>{av.svg}</div>;
    return <UserCircle size={size} />;
  };

  return (
    <div className="scicomm-app">
      <header className="scicomm-header">
        <div className="scicomm-header-content">
          <div className="scicomm-header-left">
            <Link to="/"><img src="./aiu_scicomm_logo.png" alt="AIU SciComm" className="scicomm-logo" onError={e => e.target.style.display='none'} /></Link>
            <div className="scicomm-search-box"><Search size={16} /><input type="text" placeholder="Search" /></div>
          </div>
          <nav className="scicomm-nav">
            <Link to="/" className={`scicomm-nav-item ${isActive('/') ? 'active' : ''}`}><Home size={20} /><span className="nav-text">Home</span></Link>
            <Link to="/network" className={`scicomm-nav-item ${isActive('/network') ? 'active' : ''}`}><Users size={20} /><span className="nav-text">Network</span></Link>
            <Link to="/tasks" className={`scicomm-nav-item ${isActive('/tasks') ? 'active' : ''}`}><Briefcase size={20} /><span className="nav-text">Tasks</span></Link>
            <Link to="/meetings" className={`scicomm-nav-item ${isActive('/meetings') ? 'active' : ''}`}><Calendar size={20} /><span className="nav-text">Meetings</span></Link>
            <Link to="/chat" className={`scicomm-nav-item ${isActive('/chat') ? 'active' : ''}`}><MessageCircle size={20} /><span className="nav-text">Chat</span></Link>
            <Link to="/leaderboard" className={`scicomm-nav-item ${isActive('/leaderboard') ? 'active' : ''}`}><Trophy size={20} /><span className="nav-text">Ranks</span></Link>
            <Link to="/notifications" className={`scicomm-nav-item ${isActive('/notifications') ? 'active' : ''}`} style={{position:'relative'}}><Bell size={20} />{notifCount > 0 && <span className="scicomm-notif-badge">{notifCount}</span>}<span className="nav-text">Alerts</span></Link>
            
            <div className="scicomm-nav-item profile-dropdown-container">
              {renderAvatar(24)}
              <span className="nav-text">Me ▼</span>
              <div className="scicomm-dropdown">
                <div style={{padding:'12px 16px', borderBottom:'1px solid #e0dfdc'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    {renderAvatar(44)}
                    <div>
                      <div style={{fontWeight:600,fontSize:'14px'}}>{user.name}</div>
                      <div style={{fontSize:'12px',color:'rgba(0,0,0,0.6)'}}>{me?.department || 'Member'}</div>
                    </div>
                  </div>
                  <Link to="/profile" className="scicomm-btn-secondary" style={{marginTop:'8px',display:'block',textAlign:'center',textDecoration:'none',padding:'4px 12px',fontSize:'13px'}}>View Profile</Link>
                </div>
                {isAdmin && <Link to="/admin" className="dropdown-item" style={{display:'flex',alignItems:'center',gap:'8px'}}><Shield size={16} /> Admin Dashboard {pendingAccounts.length > 0 && <span className="scicomm-notif-badge" style={{position:'static'}}>{pendingAccounts.length}</span>}</Link>}
                <div className="dropdown-divider"></div>
                <button onClick={handleLogout} className="dropdown-item">Sign Out</button>
              </div>
            </div>
          </nav>
        </div>
      </header>

      <div className="scicomm-page-content"><Outlet /></div>

      <nav className="scicomm-mobile-bar">
        <Link to="/" className={`scicomm-mobile-item ${isActive('/') ? 'active' : ''}`}><Home size={20} /><span>Home</span></Link>
        <Link to="/network" className={`scicomm-mobile-item ${isActive('/network') ? 'active' : ''}`}><Users size={20} /><span>Network</span></Link>
        <Link to="/chat" className={`scicomm-mobile-item ${isActive('/chat') ? 'active' : ''}`}><MessageCircle size={20} /><span>Chat</span></Link>
        <Link to="/notifications" className={`scicomm-mobile-item ${isActive('/notifications') ? 'active' : ''}`} style={{position:'relative'}}><Bell size={20} />{notifCount > 0 && <span className="scicomm-notif-badge">{notifCount}</span>}<span>Alerts</span></Link>
        <Link to="/profile" className={`scicomm-mobile-item ${isActive('/profile') ? 'active' : ''}`}>{renderAvatar(20)}<span>Me</span></Link>
      </nav>
    </div>
  );
}
