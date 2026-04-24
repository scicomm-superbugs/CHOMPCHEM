import { useNavigate } from 'react-router-dom';

export default function Portal() {
  const navigate = useNavigate();

  const handleSelectWorkspace = (workspaceId) => {
    localStorage.setItem('workspaceId', workspaceId);
    sessionStorage.removeItem('userId'); // Force fresh login when changing workspace
    window.location.href = '#/login';
    window.location.reload();
  };

  return (
    <>
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes floatReverse {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(20px) rotate(-5deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.4); }
          70% { box-shadow: 0 0 0 20px rgba(102, 126, 234, 0); }
          100% { box-shadow: 0 0 0 0 rgba(102, 126, 234, 0); }
        }
        @keyframes slideUpFade {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .portal-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #f8fafc;
          background-image: 
            radial-gradient(circle at 15% 50%, rgba(102, 126, 234, 0.1), transparent 25%),
            radial-gradient(circle at 85% 30%, rgba(118, 75, 162, 0.1), transparent 25%);
          padding: 2rem;
          position: relative;
          overflow: hidden;
          font-family: 'Inter', system-ui, sans-serif;
        }
        .floating-shape-1 {
          position: absolute; top: 10%; left: 5%; width: 300px; height: 300px; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%; filter: blur(60px); opacity: 0.15;
          animation: float 15s ease-in-out infinite; z-index: 0;
        }
        .floating-shape-2 {
          position: absolute; bottom: 10%; right: 5%; width: 400px; height: 400px; 
          background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%);
          border-radius: 50%; filter: blur(70px); opacity: 0.12;
          animation: floatReverse 18s ease-in-out infinite; z-index: 0;
        }
        .portal-header {
          text-align: center; margin-bottom: 4rem; z-index: 1;
          animation: slideUpFade 0.8s ease-out forwards;
        }
        .workspace-card {
          flex: 1; min-width: 320px; max-width: 480px;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px);
          border-radius: 30px;
          padding: 3.5rem 2.5rem;
          box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.02);
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          display: flex; flex-direction: column; align-items: center; text-align: center;
          position: relative; overflow: hidden;
          animation: slideUpFade 0.8s ease-out forwards;
          animation-delay: 0.2s;
        }
        .workspace-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 6px;
          background: var(--card-gradient); opacity: 0.8; transition: opacity 0.3s;
        }
        .workspace-card:hover {
          transform: translateY(-15px) scale(1.02);
          box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05);
        }
        .workspace-card:hover::before { opacity: 1; }
        .workspace-card:hover .action-text {
          transform: translateX(10px); color: var(--accent-color);
        }
        .workspace-card:hover .action-icon {
          animation: pulseGlow 1.5s infinite;
        }
        .logo-img {
          height: 180px; width: auto; object-fit: contain; margin-bottom: 2.5rem;
          filter: drop-shadow(0 15px 25px rgba(0,0,0,0.08));
          transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .workspace-card:hover .logo-img { transform: scale(1.08); }
        .action-text {
          margin-top: auto; display: inline-flex; align-items: center; gap: 0.75rem;
          color: #64748b; font-weight: 700; font-size: 1.1rem; transition: all 0.3s;
        }
        .action-icon {
          width: 32px; height: 32px; border-radius: 50%; background: #f1f5f9;
          display: flex; align-items: center; justify-content: center; transition: all 0.3s;
        }
      `}</style>

      <div className="portal-container">
        <div className="floating-shape-1"></div>
        <div className="floating-shape-2"></div>

        <div className="portal-header">
          <div style={{ display: 'inline-block', padding: '0.5rem 1.5rem', background: 'white', borderRadius: '30px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '1.5rem', color: '#475569', fontSize: '0.85rem', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 700 }}>
            Secure Access Gateway
          </div>
          <h1 style={{ fontSize: '4rem', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-1.5px', color: '#0f172a' }}>
            Choose Environment
          </h1>
          <p style={{ color: '#64748b', fontSize: '1.25rem', maxWidth: '650px', margin: '0 auto', lineHeight: 1.6, fontWeight: 500 }}>
            Select your designated institutional network to access specialized computational tools, inventory management, and research data.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '1200px', width: '100%', zIndex: 1 }}>
          
          {/* Workspace 1: CompChem */}
          <div 
            className="workspace-card"
            onClick={() => handleSelectWorkspace('compchem')}
            style={{ '--card-gradient': 'linear-gradient(90deg, #ed8936, #dd6b20)', '--accent-color': '#dd6b20' }}
          >
            <img src="./compchem_logo.png" alt="CompChem Logo" className="logo-img" onError={e => e.target.style.display = 'none'} />
            
            <h2 style={{ fontSize: '2.2rem', color: '#0f172a', marginBottom: '0.5rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
              CompChem Laboratory
            </h2>
            <div style={{ display: 'inline-block', padding: '0.4rem 1rem', background: 'rgba(221, 107, 32, 0.1)', color: '#dd6b20', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 700, marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Advanced Analytics Node
            </div>
            
            <p style={{ color: '#475569', fontSize: '1.1rem', lineHeight: '1.7', marginBottom: '2.5rem', fontWeight: 500 }}>
              The primary computational chemistry engine. Connect to the global directory, access immense compound libraries, and execute high-tier research tasks.
            </p>
            
            <div className="action-text">
              Enter Workspace 
              <div className="action-icon" style={{ color: '#dd6b20', background: 'rgba(221, 107, 32, 0.1)' }}>→</div>
            </div>
          </div>

          {/* Workspace 2: Alamein University */}
          <div 
            className="workspace-card"
            onClick={() => handleSelectWorkspace('alamein')}
            style={{ '--card-gradient': 'linear-gradient(90deg, #9f7aea, #805ad5)', '--accent-color': '#805ad5', animationDelay: '0.4s' }}
          >
            <img src="./alamein_logo.png" alt="Alamein University Logo" className="logo-img" onError={e => e.target.style.display = 'none'} />
            
            <h2 style={{ fontSize: '2.2rem', color: '#0f172a', marginBottom: '0.5rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
              Alamein University
            </h2>
            <div style={{ display: 'inline-block', padding: '0.4rem 1rem', background: 'rgba(128, 90, 213, 0.1)', color: '#805ad5', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 700, marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Faculty of Science Hub
            </div>
            
            <p style={{ color: '#475569', fontSize: '1.1rem', lineHeight: '1.7', marginBottom: '2.5rem', fontWeight: 500 }}>
              The dedicated academic node for Alamein International University. Access faculty equipment inventory, detailed student tracking, and localized laboratory data.
            </p>
            
            <div className="action-text">
              Enter Workspace 
              <div className="action-icon" style={{ color: '#805ad5', background: 'rgba(128, 90, 213, 0.1)' }}>→</div>
            </div>
          </div>

        </div>
        
        <div style={{ marginTop: '5rem', color: '#94a3b8', fontSize: '0.9rem', zIndex: 1, fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 10px #22c55e' }}></span>
          All Systems Operational • Secure Connection
        </div>
      </div>
    </>
  );
}
