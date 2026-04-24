import { useNavigate } from 'react-router-dom';
import { Microscope, Users, BookOpen, GraduationCap, Atom, Network } from 'lucide-react';

export default function Portal() {
  const navigate = useNavigate();

  const handleSelectWorkspace = (workspaceId) => {
    localStorage.setItem('workspaceId', workspaceId);
    sessionStorage.removeItem('userId'); 
    window.location.href = '#/login';
    window.location.reload();
  };

  return (
    <>
      <style>{`
        @keyframes drift {
          0% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -50px) rotate(10deg); }
          66% { transform: translate(-20px, 20px) rotate(-5deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.5; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes float-up {
          0% { opacity: 0; transform: translateY(40px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes float-icon {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        .portal-wrapper {
          min-height: 100vh;
          background: #f0fdf4; /* Very soft mint green, feels lively and organic */
          background-image: 
            radial-gradient(circle at 0% 0%, #dcfce7 0%, transparent 40%),
            radial-gradient(circle at 100% 100%, #e0e7ff 0%, transparent 40%),
            radial-gradient(circle at 50% 50%, #fefce8 0%, transparent 60%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          position: relative;
          overflow: hidden;
          font-family: 'Inter', system-ui, sans-serif;
        }
        
        /* Animated Science Background Elements */
        .science-bg-item {
          position: absolute;
          opacity: 0.08;
          color: #16a34a;
          animation: drift 20s ease-in-out infinite;
          z-index: 0;
        }
        
        .portal-header {
          text-align: center;
          z-index: 10;
          margin-bottom: 3.5rem;
          animation: float-up 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        
        .role-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: white;
          color: #059669;
          padding: 0.6rem 1.5rem;
          border-radius: 50px;
          font-weight: 700;
          font-size: 0.9rem;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          box-shadow: 0 10px 25px -5px rgba(5, 150, 105, 0.1);
          margin-bottom: 1.5rem;
          border: 2px solid #34d399;
        }

        .role-badge svg {
          animation: float-icon 3s ease-in-out infinite;
        }

        .cards-container {
          display: flex;
          gap: 3rem;
          flex-wrap: wrap;
          justify-content: center;
          max-width: 1200px;
          width: 100%;
          z-index: 10;
        }

        .lab-card {
          flex: 1;
          min-width: 320px;
          max-width: 480px;
          background: var(--card-bg, rgba(255, 255, 255, 0.9));
          border: 1px solid var(--brand-color-light);
          border-radius: 32px;
          padding: 3rem 2.5rem;
          box-shadow: 0 20px 40px -10px var(--brand-color-light), 0 0 0 4px rgba(255,255,255,0.6) inset;
          cursor: pointer;
          transition: all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: relative;
          opacity: 0;
          animation: float-up 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }

        .lab-card:hover {
          transform: translateY(-15px) scale(1.03);
          box-shadow: 0 35px 60px -15px rgba(0, 0, 0, 0.1), 0 0 0 4px white inset;
        }

        .card-accent-line {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 8px;
          background: var(--brand-color);
          transition: height 0.3s;
        }

        .lab-card:hover .card-accent-line {
          height: 12px;
        }

        .logo-wrapper {
          position: relative;
          width: 180px;
          height: 180px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .logo-wrapper::before {
          content: '';
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 100%; height: 100%;
          background: radial-gradient(circle, var(--brand-color-light) 0%, transparent 70%);
          opacity: 0.15;
          border-radius: 50%;
          z-index: 0;
          transition: opacity 0.5s, transform 0.5s;
        }

        .lab-card:hover .logo-wrapper::before {
          opacity: 0.3;
          transform: translate(-50%, -50%) scale(1.2);
        }

        .lab-logo {
          height: 140px;
          width: auto;
          object-fit: contain;
          z-index: 1;
          filter: drop-shadow(0 15px 20px rgba(0,0,0,0.06));
          transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        .lab-card:hover .lab-logo {
          transform: scale(1.1);
        }

        .card-tags {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        .tag {
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.4rem 0.8rem;
          border-radius: 12px;
          background: white;
          color: #475569;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .action-button {
          margin-top: auto;
          background: white;
          color: var(--brand-color);
          border: 2px solid var(--brand-color-light);
          padding: 0.8rem 2rem;
          border-radius: 50px;
          font-weight: 700;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s;
        }

        .lab-card:hover .action-button {
          background: var(--brand-color);
          color: white;
          border-color: var(--brand-color);
          box-shadow: 0 10px 20px var(--brand-color-light);
        }
      `}</style>

      <div className="portal-wrapper">
        
        {/* Animated Background Icons representing Science Communication & Research */}
        <Atom className="science-bg-item" size={120} style={{ top: '10%', left: '10%', animationDelay: '0s' }} />
        <Network className="science-bg-item" size={150} style={{ top: '60%', right: '5%', animationDelay: '-5s', color: '#4f46e5' }} />
        <BookOpen className="science-bg-item" size={100} style={{ top: '20%', right: '15%', animationDelay: '-10s', color: '#ea580c' }} />
        <Microscope className="science-bg-item" size={140} style={{ bottom: '10%', left: '15%', animationDelay: '-15s', color: '#0ea5e9' }} />

        <div className="portal-header">
          <div className="role-badge">
            <Users size={18} />
            Science Communication & Research Hub
          </div>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '1rem', letterSpacing: '-1px' }}>
            Inspiring Minds, Advancing Science.
          </h1>
          <p style={{ color: '#475569', fontSize: '1.2rem', maxWidth: '700px', margin: '0 auto', lineHeight: 1.6, fontWeight: 500 }}>
            Welcome to the centralized platform where cutting-edge research meets accessible education. Choose your workspace to begin exploring, teaching, and managing data.
          </p>
        </div>

        <div className="cards-container">
          
          {/* Workspace 1: CompChem */}
          <div 
            className="lab-card"
            onClick={() => handleSelectWorkspace('compchem')}
            style={{ 
              '--card-bg': 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
              '--brand-color': '#ea580c', 
              '--brand-color-light': '#fdba74', 
              animationDelay: '0.2s' 
            }}
          >
            <div className="card-accent-line"></div>
            
            <div className="logo-wrapper">
              <img src="./compchem_logo.png" alt="CompChem Logo" className="lab-logo" onError={e => e.target.style.display = 'none'} />
            </div>
            
            <h2 style={{ fontSize: '2rem', color: '#0f172a', marginBottom: '1rem', fontWeight: 800 }}>
              CompChem Laboratory
            </h2>
            
            <div className="card-tags">
              <span className="tag"><Microscope size={12}/> Research</span>
              <span className="tag"><Atom size={12}/> Computation</span>
              <span className="tag"><Network size={12}/> Analytics</span>
            </div>
            
            <p style={{ color: '#334155', fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '2.5rem', fontWeight: 500 }}>
              Dive into the core computational engine. A dedicated space for intensive chemical research, data analysis, and driving scientific breakthroughs.
            </p>
            
            <button className="action-button">
              Access Laboratory →
            </button>
          </div>

          {/* Workspace 2: Alamein University */}
          <div 
            className="lab-card"
            onClick={() => handleSelectWorkspace('alamein')}
            style={{ 
              '--card-bg': 'linear-gradient(135deg, #f5f3ff 0%, #e0e7ff 100%)',
              '--brand-color': '#4f46e5', 
              '--brand-color-light': '#a5b4fc', 
              animationDelay: '0.4s' 
            }}
          >
            <div className="card-accent-line"></div>
            
            <div className="logo-wrapper">
              <img src="./alamein_logo.png" alt="Alamein University Logo" className="lab-logo" onError={e => e.target.style.display = 'none'} />
            </div>
            
            <h2 style={{ fontSize: '2rem', color: '#0f172a', marginBottom: '1rem', fontWeight: 800 }}>
              Alamein University
            </h2>
            
            <div className="card-tags">
              <span className="tag"><GraduationCap size={12}/> Education</span>
              <span className="tag"><BookOpen size={12}/> Teaching</span>
              <span className="tag"><Users size={12}/> Faculty Hub</span>
            </div>
            
            <p style={{ color: '#334155', fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '2.5rem', fontWeight: 500 }}>
              The interactive hub for the Faculty of Science. Empowering educators to manage inventory, track student progress, and communicate effectively.
            </p>
            
            <button className="action-button">
              Enter Faculty Hub →
            </button>
          </div>

        </div>
        
      </div>
    </>
  );
}
