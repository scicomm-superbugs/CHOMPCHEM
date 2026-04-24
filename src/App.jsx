import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import RegisterChemical from './pages/RegisterChemical';
import Scientists from './pages/Scientists';
import UsageTracking from './pages/UsageTracking';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Devices from './pages/Devices';
import Equipment from './pages/Equipment';
import Tasks from './pages/Tasks';
import Chat from './pages/Chat';
import TeamSearch from './pages/TeamSearch';
import Portal from './pages/Portal';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  useEffect(() => {
    const workspaceId = localStorage.getItem('workspaceId');
    if (workspaceId === 'alamein') {
      document.title = 'Alamein International University';
    } else if (workspaceId === 'compchem') {
      document.title = 'COMPCHEM Laboratory';
    } else {
      document.title = 'Science Communication & Research Hub';
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/portal" element={<Portal />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="tracking" element={<UsageTracking />} />
            <Route path="profile" element={<Profile />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="chat" element={<Chat />} />
            <Route path="team" element={<TeamSearch />} />
            
            {/* Admin/Master only routes */}
            <Route element={<ProtectedRoute requireAdmin={true} />}>
              <Route path="chemicals" element={<RegisterChemical />} />
              <Route path="devices" element={<Devices />} />
              <Route path="equipment" element={<Equipment />} />
              <Route path="scientists" element={<Scientists />} />
            </Route>
          </Route>
        </Route>
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
