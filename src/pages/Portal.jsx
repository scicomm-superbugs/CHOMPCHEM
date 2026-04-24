import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Microscope, Atom, Network, GraduationCap, BookOpen } from 'lucide-react';

// 3D Glass Card Component
const GlassCard = ({ title, subtitle, description, logoSrc, tags, accentColor, onClick, delay }) => {
  const cardRef = useRef(null);
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const [transform, setTransform] = useState('perspective(1000px) rotateX(0deg) rotateY(0deg)');

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate rotation (-10 to 10 degrees)
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;
    
    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
    setGlare({ x: (x / rect.width) * 100, y: (y / rect.height) * 100, opacity: 1 });
  };

  const handleMouseLeave = () => {
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
    setGlare({ ...glare, opacity: 0 });
  };

  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className="glass-card"
      style={{
        '--accent': accentColor,
        transform,
        animationDelay: delay
      }}
    >
      {/* Glare effect */}
      <div 
        className="card-glare" 
        style={{
          background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.4) 0%, transparent 60%)`,
          opacity: glare.opacity
        }}
      />
      
      <div className="card-accent-line" style={{ background: accentColor }}></div>
      
      <div className="logo-wrapper">
        <img src={logoSrc} alt={title} className="lab-logo" onError={e => e.target.style.display = 'none'} />
      </div>
      
      <h2 style={{ fontSize: '1.8rem', color: '#f8fafc', marginBottom: '0.5rem', fontWeight: 800 }}>
        {title}
      </h2>
      <div style={{ color: accentColor, fontWeight: 700, fontSize: '0.9rem', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
        {subtitle}
      </div>
      
      <div className="card-tags">
        {tags.map((tag, i) => (
          <span key={i} className="tag">{tag.icon} {tag.label}</span>
        ))}
      </div>
      
      <p style={{ color: '#cbd5e1', fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '2.5rem', fontWeight: 500, position: 'relative', zIndex: 2 }}>
        {description}
      </p>
      
      <button className="action-button" style={{ '--btn-accent': accentColor }}>
        Initialize Protocol →
      </button>
    </div>
  );
};

export default function Portal() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  const handleSelectWorkspace = (workspaceId) => {
    localStorage.setItem('workspaceId', workspaceId);
    sessionStorage.removeItem('userId'); 
    window.location.href = '#/login';
    window.location.reload();
  };

  // Interactive Particle Network Background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];
    
    // Setup Canvas
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Mouse Interaction
    let mouse = { x: null, y: null, radius: 150 };
    const handleMouseMove = (e) => { mouse.x = e.x; mouse.y = e.y; };
    const handleMouseLeave = () => { mouse.x = null; mouse.y = null; };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseLeave);

    // Particle Class
    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.baseX = this.x;
        this.baseY = this.y;
        this.density = (Math.random() * 30) + 1;
        // Thematic colors (mint, blue, orange, purple)
        const colors = ['rgba(16, 185, 129, 0.5)', 'rgba(56, 189, 248, 0.5)', 'rgba(249, 115, 22, 0.5)', 'rgba(168, 85, 247, 0.5)'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }
      
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
      }
      
      update() {
        // Natural slight float
        this.baseX += Math.sin(Date.now() / 1000 + this.density) * 0.2;
        this.baseY += Math.cos(Date.now() / 1000 + this.density) * 0.2;

        if (mouse.x != null && mouse.y != null) {
          let dx = mouse.x - this.x;
          let dy = mouse.y - this.y;
          let distance = Math.sqrt(dx * dx + dy * dy);
          let forceDirectionX = dx / distance;
          let forceDirectionY = dy / distance;
          let maxDistance = mouse.radius;
          let force = (maxDistance - distance) / maxDistance;
          let directionX = forceDirectionX * force * this.density;
          let directionY = forceDirectionY * force * this.density;
          
          if (distance < mouse.radius) {
            this.x -= directionX;
            this.y -= directionY;
          } else {
            if (this.x !== this.baseX) {
              let dx = this.x - this.baseX;
              this.x -= dx / 10;
            }
            if (this.y !== this.baseY) {
              let dy = this.y - this.baseY;
              this.y -= dy / 10;
            }
          }
        } else {
          // Return to base if mouse is not around
          if (this.x !== this.baseX) this.x -= (this.x - this.baseX) / 10;
          if (this.y !== this.baseY) this.y -= (this.y - this.baseY) / 10;
        }
        
        ctx.fillStyle = this.color;
        this.draw();
      }
    }

    // Initialize Particles
    const init = () => {
      particles = [];
      const numberOfParticles = (canvas.width * canvas.height) / 12000;
      for (let i = 0; i < numberOfParticles; i++) {
        particles.push(new Particle());
      }
    };

    // Animation Loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
      }
      connect();
      animationFrameId = requestAnimationFrame(animate);
    };

    // Draw connecting lines
    const connect = () => {
      let opacityValue = 1;
      for (let a = 0; a < particles.length; a++) {
        for (let b = a; b < particles.length; b++) {
          let distance = ((particles[a].x - particles[b].x) * (particles[a].x - particles[b].x))
                       + ((particles[a].y - particles[b].y) * (particles[a].y - particles[b].y));
          if (distance < (canvas.width / 7) * (canvas.height / 7)) {
            opacityValue = 1 - (distance / 20000);
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacityValue * 0.15})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
          }
        }
      }
    };

    init();
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <>
      <style>{`
        @keyframes slideUpFade {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        .portal-wrapper {
          min-height: 100vh;
          background: radial-gradient(circle at 50% 0%, #1e293b 0%, #0f172a 100%);
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          font-family: 'Inter', system-ui, sans-serif;
          overflow: hidden;
        }

        #science-network-canvas {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
          pointer-events: none;
        }
        
        .portal-header {
          text-align: center;
          z-index: 10;
          margin-bottom: 3.5rem;
          animation: slideUpFade 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
          position: relative;
        }
        
        .role-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(16, 185, 129, 0.1);
          backdrop-filter: blur(8px);
          color: #34d399;
          padding: 0.6rem 1.5rem;
          border-radius: 50px;
          font-weight: 700;
          font-size: 0.9rem;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          box-shadow: 0 10px 25px -5px rgba(5, 150, 105, 0.1);
          margin-bottom: 1.5rem;
          border: 1px solid rgba(52, 211, 153, 0.3);
        }

        .cards-container {
          display: flex;
          gap: 3rem;
          flex-wrap: wrap;
          justify-content: center;
          max-width: 1200px;
          width: 100%;
          z-index: 10;
          perspective: 2000px; /* Crucial for 3D effect child elements */
        }

        .glass-card {
          flex: 1;
          min-width: 320px;
          max-width: 480px;
          /* The Glass Effect */
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.7) 100%);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 32px;
          padding: 3rem 2.5rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.05);
          
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: relative;
          opacity: 0;
          animation: slideUpFade 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
          
          /* Smooth transform reset on leave */
          transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease;
          transform-style: preserve-3d;
        }

        .glass-card:hover {
          box-shadow: 0 35px 60px -15px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.2);
          z-index: 20;
        }

        .card-glare {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          border-radius: 32px;
          pointer-events: none;
          z-index: 10;
          transition: opacity 0.3s;
        }

        .card-accent-line {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 0px;
          transition: height 0.3s ease;
          opacity: 0.8;
          border-radius: 32px 32px 0 0;
        }

        .glass-card:hover .card-accent-line {
          height: 8px;
        }

        .logo-wrapper {
          position: relative;
          width: 240px;
          height: 240px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
          transform: translateZ(30px); /* 3D pop out */
        }

        .logo-wrapper::before {
          content: '';
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 100%; height: 100%;
          background: radial-gradient(circle, var(--accent) 0%, transparent 70%);
          opacity: 0.1;
          border-radius: 50%;
          z-index: 0;
          transition: opacity 0.4s, transform 0.4s;
        }

        .glass-card:hover .logo-wrapper::before {
          opacity: 0.2;
          transform: translate(-50%, -50%) scale(1.3);
        }

        .lab-logo {
          height: 200px;
          width: auto;
          object-fit: contain;
          z-index: 1;
          filter: drop-shadow(0 15px 20px rgba(0,0,0,0.1));
          transition: transform 0.4s;
        }

        .glass-card:hover .lab-logo {
          transform: scale(1.1);
        }

        .card-tags {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          justify-content: center;
          transform: translateZ(20px);
        }

        .tag {
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.4rem 0.8rem;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255,255,255,0.1);
          color: #e2e8f0;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          backdrop-filter: blur(5px);
        }

        .action-button {
          margin-top: auto;
          background: rgba(255, 255, 255, 0.05);
          color: var(--btn-accent);
          border: 1px solid rgba(255,255,255,0.2);
          padding: 0.8rem 2rem;
          border-radius: 50px;
          font-weight: 700;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s;
          transform: translateZ(25px);
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        }

        .glass-card:hover .action-button {
          background: var(--btn-accent);
          color: white;
          border-color: var(--btn-accent);
          box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
      `}</style>

      <div className="portal-wrapper">
        
        {/* Interactive Science Network Canvas */}
        <canvas id="science-network-canvas" ref={canvasRef}></canvas>

        <div className="portal-header">
          <div className="role-badge">
            <Users size={18} />
            Science Communication & Research Hub
          </div>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 800, color: '#f8fafc', marginBottom: '1rem', letterSpacing: '-1px' }}>
            Inspiring Minds, Advancing Science.
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: '1.2rem', maxWidth: '700px', margin: '0 auto', lineHeight: 1.6, fontWeight: 500 }}>
            Welcome to the centralized platform where cutting-edge research meets accessible education. Choose your workspace to begin exploring, teaching, and managing data.
          </p>
        </div>

        <div className="cards-container">
          
          <GlassCard 
            title="CompChem Laboratory"
            subtitle="Advanced Analytics Node"
            description="Dive into the core computational engine. A dedicated space for intensive chemical research, data analysis, and driving scientific breakthroughs."
            logoSrc="./compchem_logo.png"
            accentColor="#ea580c"
            delay="0.2s"
            onClick={() => handleSelectWorkspace('compchem')}
            tags={[
              { icon: <Microscope size={12}/>, label: 'Research' },
              { icon: <Atom size={12}/>, label: 'Computation' },
              { icon: <Network size={12}/>, label: 'Analytics' }
            ]}
          />

          <GlassCard 
            title="Alamein International University"
            subtitle="Faculty of Science Hub"
            description="The interactive hub for the Faculty of Science. Empowering educators to manage inventory, track student progress, and communicate effectively."
            logoSrc="./alamein_logo.png"
            accentColor="#4f46e5"
            delay="0.4s"
            onClick={() => handleSelectWorkspace('alamein')}
            tags={[
              { icon: <GraduationCap size={12}/>, label: 'Education' },
              { icon: <BookOpen size={12}/>, label: 'Teaching' },
              { icon: <Users size={12}/>, label: 'Faculty Hub' }
            ]}
          />

        </div>
        
      </div>
    </>
  );
}
