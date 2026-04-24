import { useState } from 'react';
import { useLocation, useNavigate, Link, Outlet } from 'react-router-dom';
import { Beaker, Users, Activity, Home, LogOut, Shield, Settings, User, Monitor, ClipboardList, MessageSquare, Crown, Menu, X, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLiveCollection } from '../db';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  
  const scientists = useLiveCollection('scientists');
  const currentUserData = scientists?.find(s => String(s.id) === String(user?.id));

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavClick = () => {
    setMobileNavOpen(false);
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
          
          <button className="hamburger-btn" onClick={() => setMobileNavOpen(!mobileNavOpen)}>
            {mobileNavOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {mobileNavOpen && <div className="mobile-nav-overlay open" onClick={() => setMobileNavOpen(false)} />}
          
          <nav className={`nav-links ${mobileNavOpen ? 'mobile-open' : ''}`}>
            <Link to="/" className={`nav-link ${isActive('/')}`} onClick={handleNavClick}>
              <Home size={20} />
              <span>Dashboard</span>
            </Link>
            
            {(user.role === 'admin' || user.role === 'master') && (
              <>
                <Link to="/devices" className={`nav-link ${isActive('/devices')}`} onClick={handleNavClick}>
                  <Monitor size={20} />
                  <span>Devices</span>
                </Link>
                <Link to="/chemicals" className={`nav-link ${isActive('/chemicals')}`} onClick={handleNavClick}>
                  <Beaker size={20} />
                  <span>Chemicals</span>
                </Link>
                <Link to="/scientists" className={`nav-link ${isActive('/scientists')}`} onClick={handleNavClick}>
                  <Users size={20} />
                  <span>Scientists</span>
                </Link>
              </>
            )}
            
            <Link to="/tracking" className={`nav-link ${isActive('/tracking')}`} onClick={handleNavClick}>
              <Activity size={20} />
              <span>Usage</span>
            </Link>

            <Link to="/tasks" className={`nav-link ${isActive('/tasks')}`} onClick={handleNavClick}>
              <ClipboardList size={20} />
              <span>Tasks</span>
            </Link>

            <Link to="/chat" className={`nav-link ${isActive('/chat')}`} onClick={handleNavClick}>
              <MessageSquare size={20} />
              <span>Chat</span>
            </Link>

            <Link to="/team" className={`nav-link ${isActive('/team')}`} onClick={handleNavClick}>
              <Search size={20} />
              <span>Team</span>
            </Link>
            
            <div className="nav-divider" style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)', margin: '0 0.25rem' }}></div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem' }}>
              <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'inherit' }} onClick={handleNavClick}>
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
            
            <button onClick={() => { handleLogout(); handleNavClick(); }} className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.875rem' }}>
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
