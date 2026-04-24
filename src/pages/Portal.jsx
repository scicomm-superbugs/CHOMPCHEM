import { useNavigate } from 'react-router-dom';

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
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'radial-gradient(circle at 50% 0%, #2a2d43 0%, #0b0f19 70%)', 
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden',
      color: 'white'
    }}>
      
      {/* Decorative background elements */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(128, 90, 213, 0.05) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(40px)' }}></div>
      <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(221, 107, 32, 0.03) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(60px)' }}></div>

      <div style={{ textAlign: 'center', marginBottom: '4rem', zIndex: 1 }}>
        <div style={{ display: 'inline-block', padding: '0.5rem 1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '1.5rem', color: '#a5b4fc', fontSize: '0.85rem', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600 }}>
          Global Research Network
        </div>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-1px', background: 'linear-gradient(to right, #fff, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Select Your Environment
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1.2rem', maxWidth: '650px', margin: '0 auto', lineHeight: 1.6 }}>
          Choose your designated laboratory workspace to access your specialized databases, inventory, and team directories.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '1200px', width: '100%', zIndex: 1 }}>
        
        {/* Workspace 1: CompChem */}
        <div 
          onClick={() => handleSelectWorkspace('compchem')}
          style={{ 
            flex: '1', 
            minWidth: '320px', 
            maxWidth: '480px', 
            backgroundColor: 'rgba(30, 36, 54, 0.6)', 
            backdropFilter: 'blur(12px)',
            borderRadius: '24px', 
            padding: '3rem 2.5rem', 
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', 
            cursor: 'pointer', 
            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={e => { 
            e.currentTarget.style.transform = 'translateY(-12px) scale(1.02)'; 
            e.currentTarget.style.borderColor = 'rgba(221, 107, 32, 0.5)';
            e.currentTarget.style.boxShadow = '0 30px 60px -12px rgba(221, 107, 32, 0.15)';
          }}
          onMouseLeave={e => { 
            e.currentTarget.style.transform = 'translateY(0) scale(1)'; 
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; 
            e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.5)';
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, transparent, #DD6B20, transparent)' }}></div>
          
          <img src="./compchem_logo.png" alt="CompChem Logo" style={{ height: '110px', marginBottom: '2rem', objectFit: 'contain', filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.3))' }} onError={e => e.target.style.display = 'none'} />
          
          <h2 style={{ fontSize: '2rem', color: '#f8fafc', marginBottom: '0.5rem', fontWeight: 700 }}>CHOMPCHEM</h2>
          <div style={{ fontSize: '0.9rem', color: '#DD6B20', fontWeight: 600, marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Advanced Analytics Core</div>
          
          <p style={{ color: '#cbd5e1', fontSize: '1rem', lineHeight: '1.6', marginBottom: '2rem' }}>
            The primary computational chemistry engine. Connect to the global directory, access massive compound libraries, and manage high-tier research tasks.
          </p>
          
          <div style={{ marginTop: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#DD6B20', fontWeight: 600, fontSize: '1rem', transition: 'gap 0.3s' }}>
            Initialize Protocol <span style={{ fontSize: '1.2rem' }}>→</span>
          </div>
        </div>

        {/* Workspace 2: Alamein University */}
        <div 
          onClick={() => handleSelectWorkspace('alamein')}
          style={{ 
            flex: '1', 
            minWidth: '320px', 
            maxWidth: '480px', 
            backgroundColor: 'rgba(30, 36, 54, 0.6)', 
            backdropFilter: 'blur(12px)',
            borderRadius: '24px', 
            padding: '3rem 2.5rem', 
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', 
            cursor: 'pointer', 
            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={e => { 
            e.currentTarget.style.transform = 'translateY(-12px) scale(1.02)'; 
            e.currentTarget.style.borderColor = 'rgba(128, 90, 213, 0.5)';
            e.currentTarget.style.boxShadow = '0 30px 60px -12px rgba(128, 90, 213, 0.15)';
          }}
          onMouseLeave={e => { 
            e.currentTarget.style.transform = 'translateY(0) scale(1)'; 
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; 
            e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.5)';
          }}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, transparent, #805AD5, transparent)' }}></div>
          
          <img src="./alamein_logo.png" alt="Alamein University Logo" style={{ height: '110px', marginBottom: '2rem', objectFit: 'contain', filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.3))' }} onError={e => e.target.style.display = 'none'} />
          
          <h2 style={{ fontSize: '2rem', color: '#f8fafc', marginBottom: '0.5rem', fontWeight: 700 }}>Alamein University</h2>
          <div style={{ fontSize: '0.9rem', color: '#805AD5', fontWeight: 600, marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Faculty of Science Hub</div>
          
          <p style={{ color: '#cbd5e1', fontSize: '1rem', lineHeight: '1.6', marginBottom: '2rem' }}>
            The dedicated academic node for Alamein International University. Access faculty inventory, student tracking, and localized research data.
          </p>
          
          <div style={{ marginTop: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#805AD5', fontWeight: 600, fontSize: '1rem' }}>
            Initialize Protocol <span style={{ fontSize: '1.2rem' }}>→</span>
          </div>
        </div>

      </div>
      
      <div style={{ marginTop: '4rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', zIndex: 1 }}>
        Secure Data Gateway v2.0.4 • End-to-End Encrypted
      </div>
    </div>
  );
}
