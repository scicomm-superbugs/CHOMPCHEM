import { useNavigate } from 'react-router-dom';
import { Building2, Microscope } from 'lucide-react';

export default function Portal() {
  const navigate = useNavigate();

  const handleSelectWorkspace = (workspaceId) => {
    localStorage.setItem('workspaceId', workspaceId);
    sessionStorage.removeItem('userId'); // Force fresh login when changing workspace
    // Reload to ensure db.js context and auth state are clean for the new workspace
    window.location.href = '#/login';
    window.location.reload();
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-color)', padding: '2rem' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 style={{ fontSize: '2.5rem', color: 'var(--primary)', marginBottom: '1rem', letterSpacing: '1px' }}>
          Welcome to the Portal
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
          Please select your laboratory or organization workspace to continue. Each workspace is a completely separate and secure environment.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '1000px', width: '100%' }}>
        
        {/* Workspace 1: CompChem */}
        <div 
          onClick={() => handleSelectWorkspace('compchem')}
          style={{ 
            flex: '1', 
            minWidth: '320px', 
            maxWidth: '450px', 
            backgroundColor: 'var(--surface)', 
            borderRadius: '24px', 
            padding: '3rem 2rem', 
            boxShadow: 'var(--shadow-lg)', 
            cursor: 'pointer', 
            transition: 'all 0.3s ease',
            border: '2px solid transparent',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-10px)'; e.currentTarget.style.border = '2px solid var(--primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.border = '2px solid transparent'; }}
        >
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'rgba(33, 40, 69, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', marginBottom: '1.5rem' }}>
            <Microscope size={50} />
          </div>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--text-main)', marginBottom: '1rem' }}>CompChem Lab</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
            The original Computational Chemistry laboratory database. Manage your chemicals, tasks, and team rankings here.
          </p>
          <button className="btn btn-primary" style={{ marginTop: 'auto', paddingTop: '0.75rem', paddingBottom: '0.75rem', width: '80%', borderRadius: '12px' }}>
            Enter Workspace
          </button>
        </div>

        {/* Workspace 2: Alamein University */}
        <div 
          onClick={() => handleSelectWorkspace('alamein')}
          style={{ 
            flex: '1', 
            minWidth: '320px', 
            maxWidth: '450px', 
            backgroundColor: 'var(--surface)', 
            borderRadius: '24px', 
            padding: '3rem 2rem', 
            boxShadow: 'var(--shadow-lg)', 
            cursor: 'pointer', 
            transition: 'all 0.3s ease',
            border: '2px solid transparent',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-10px)'; e.currentTarget.style.border = '2px solid #805AD5'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.border = '2px solid transparent'; }}
        >
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'rgba(128, 90, 213, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#805AD5', marginBottom: '1.5rem' }}>
            <Building2 size={50} />
          </div>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--text-main)', marginBottom: '1rem' }}>Alamein International University</h2>
          <div style={{ fontSize: '0.9rem', color: '#805AD5', fontWeight: 600, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Faculty of Science Labs</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
            A completely separate instance for the Faculty of Science at Alamein International University.
          </p>
          <button className="btn" style={{ marginTop: 'auto', paddingTop: '0.75rem', paddingBottom: '0.75rem', width: '80%', borderRadius: '12px', backgroundColor: '#805AD5', color: 'white' }}>
            Enter Workspace
          </button>
        </div>

      </div>
    </div>
  );
}
