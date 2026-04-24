import { useLocation, useNavigate, Link, Outlet } from 'react-router-dom';
import { Beaker, Users, Activity, Home, LogOut, Shield, Settings, User, Monitor, ClipboardList, MessageSquare, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLiveCollection } from '../db';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const scientists = useLiveCollection('scientists');
  const currentUserData = scientists?.find(s => String(s.id) === String(user?.id));

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Ensure user exists before rendering
  if (!user) return null;

  return (
    <>
      <header className="app-header">
        <div className="container header-content">
          <div className="logo-container">
            <img src="/logo.png" alt="COMPCHEM Logo" className="logo-image" onError={(e) => { e.target.style.display = 'none'; }} />
            <span className="logo-text">COMPCHEM</span>
          </div>
          
          <nav className="nav-links">
            <Link to="/" className={`nav-link ${isActive('/')}`}>
              <Home size={20} />
              <span>Dashboard</span>
            </Link>
            
            {(user.role === 'admin' || user.role === 'master') && (
              <>
                <Link to="/devices" className={`nav-link ${isActive('/devices')}`}>
                  <Monitor size={20} />
                  <span>Devices</span>
                </Link>
                <Link to="/chemicals" className={`nav-link ${isActive('/chemicals')}`}>
                  <Beaker size={20} />
                  <span>Chemicals</span>
                </Link>
                <Link to="/scientists" className={`nav-link ${isActive('/scientists')}`}>
                  <Users size={20} />
                  <span>Scientists</span>
                </Link>
              </>
            )}
            
            <Link to="/tracking" className={`nav-link ${isActive('/tracking')}`}>
              <Activity size={20} />
              <span className="hide-mobile">Usage Registration</span>
            </Link>

            <Link to="/tasks" className={`nav-link ${isActive('/tasks')}`}>
              <ClipboardList size={20} />
              <span className="hide-mobile">Tasks</span>
            </Link>

            <Link to="/chat" className={`nav-link ${isActive('/chat')}`}>
              <MessageSquare size={20} />
              <span className="hide-mobile">Chat</span>
            </Link>
            
            <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)', margin: '0 0.5rem' }}></div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem' }}>
              <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'inherit' }}>
                {currentUserData?.avatar ? (
                  <img src={currentUserData.avatar} alt="Avatar" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }} />
                ) : (
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                    <User size={14} />
                  </div>
                )}
                <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {user.name}
                  {user.role === 'admin' && <Shield size={14} style={{ color: 'var(--accent)' }} title="Admin" />}
                  {user.role === 'master' && <Crown size={14} style={{ color: '#F6E05E' }} title="Lab Master" />}
                </span>
              </Link>
            </div>
            
            <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.875rem' }}>
              <LogOut size={16} /> Logout
            </button>
          </nav>
        </div>
      </header>

      <main className="container page-content">
        <Outlet />
      </main>

      <footer className="app-footer">
        <p>COMPCHEM Laboratory Management System &copy; {new Date().getFullYear()}</p>
        <p>Made by Abdullah Amr Maged</p>
      </footer>
    </>
  );
}
