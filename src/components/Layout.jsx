import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Beaker, Users, Activity, Home, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

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
            
            {user.role === 'admin' && (
              <>
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
              <span>Tracking</span>
            </Link>
            
            <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)', margin: '0 0.5rem' }}></div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
              <span style={{ fontWeight: 600 }}>{user.name}</span>
              {user.role === 'admin' && <Shield size={14} style={{ color: 'var(--accent)' }} title="Admin" />}
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
