import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, Briefcase, Bell, MessageSquare, UserCircle, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLiveCollection } from '../db';
import '../scicomm.css';

export default function SciCommLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const scientists = useLiveCollection('scientists');
  const currentUserData = scientists?.find(s => String(s.id) === String(user.id));
  const avatar = currentUserData?.avatar;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="scicomm-app">
      {/* LinkedIn-style Header */}
      <header className="scicomm-header">
        <div className="scicomm-header-content">
          <div className="scicomm-header-left">
            <Link to="/">
              <img src="./aiu_scicomm_logo.png" alt="AIU SciComm" className="scicomm-logo" onError={e => e.target.style.display='none'} />
            </Link>
            <div className="scicomm-search-box">
              <Search size={16} />
              <input type="text" placeholder="Search" />
            </div>
          </div>

          <nav className="scicomm-nav">
            <Link to="/" className={`scicomm-nav-item ${isActive('/') ? 'active' : ''}`}>
              <Home size={24} className="nav-icon" />
              <span className="nav-text">Home</span>
            </Link>
            <Link to="/network" className={`scicomm-nav-item ${isActive('/network') ? 'active' : ''}`}>
              <Users size={24} className="nav-icon" />
              <span className="nav-text">My Network</span>
            </Link>
            <Link to="/tasks" className={`scicomm-nav-item ${isActive('/tasks') ? 'active' : ''}`}>
              <Briefcase size={24} className="nav-icon" />
              <span className="nav-text">Assigned Tasks</span>
            </Link>
            <Link to="/notifications" className={`scicomm-nav-item ${isActive('/notifications') ? 'active' : ''}`}>
              <Bell size={24} className="nav-icon" />
              <span className="nav-text">Notifications</span>
            </Link>
            
            <div className="scicomm-nav-item profile-dropdown-container">
              {avatar ? (
                <img src={avatar} alt="Me" className="nav-avatar" />
              ) : (
                <UserCircle size={24} className="nav-icon" />
              )}
              <span className="nav-text">Me ▼</span>
              <div className="scicomm-dropdown">
                <Link to="/profile" className="dropdown-item">View Profile</Link>
                {(user.role === 'admin' || user.role === 'master') && (
                  <Link to="/admin" className="dropdown-item">Admin Dashboard</Link>
                )}
                <div className="dropdown-divider"></div>
                <button onClick={handleLogout} className="dropdown-item">Sign Out</button>
              </div>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="scicomm-main">
        <Outlet />
      </main>

      {/* Mobile Bottom Bar */}
      <nav className="scicomm-mobile-bar">
        <Link to="/" className={`scicomm-mobile-item ${isActive('/') ? 'active' : ''}`}>
          <Home size={24} />
          <span>Home</span>
        </Link>
        <Link to="/network" className={`scicomm-mobile-item ${isActive('/network') ? 'active' : ''}`}>
          <Users size={24} />
          <span>Network</span>
        </Link>
        <Link to="/tasks" className={`scicomm-mobile-item ${isActive('/tasks') ? 'active' : ''}`}>
          <Briefcase size={24} />
          <span>Tasks</span>
        </Link>
        <Link to="/notifications" className={`scicomm-mobile-item ${isActive('/notifications') ? 'active' : ''}`}>
          <Bell size={24} />
          <span>Alerts</span>
        </Link>
        <Link to="/profile" className={`scicomm-mobile-item ${isActive('/profile') ? 'active' : ''}`}>
          {avatar ? (
             <img src={avatar} alt="Me" className="nav-avatar" style={{width: 24, height: 24, marginBottom: 2}} />
          ) : (
             <UserCircle size={24} />
          )}
          <span>Me</span>
        </Link>
      </nav>
    </div>
  );
}
