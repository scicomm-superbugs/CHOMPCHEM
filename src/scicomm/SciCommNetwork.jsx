import { useLiveCollection } from '../db';
import { useAuth } from '../context/AuthContext';
import { UserPlus, UserCheck } from 'lucide-react';

export default function SciCommNetwork() {
  const { user } = useAuth();
  const scientists = useLiveCollection('scientists') || [];
  
  const others = scientists.filter(s => String(s.id) !== String(user.id));

  return (
    <div className="scicomm-feed-layout">
      <div className="scicomm-sidebar-left hide-on-mobile">
        <div className="scicomm-card scicomm-card-padding">
          <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>Manage my network</h3>
          <div className="scicomm-text-muted" style={{ marginBottom: '8px' }}>Connections</div>
          <div className="scicomm-text-muted">Following & followers</div>
        </div>
      </div>
      
      <div className="scicomm-feed-main">
        <div className="scicomm-card scicomm-card-padding">
          <h2 style={{ margin: '0 0 16px', fontSize: '18px' }}>Recommended for you</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
            {others.map(s => (
              <div key={s.id} className="scicomm-card" style={{ textAlign: 'center', padding: '16px', border: '1px solid #e0dfdc' }}>
                <img src={s.avatar || 'https://via.placeholder.com/80'} alt={s.name} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 12px' }} />
                <h4 style={{ margin: '0 0 4px', fontSize: '14px' }}>{s.name}</h4>
                <p className="scicomm-text-muted" style={{ margin: '0 0 16px', fontSize: '12px', height: '36px', overflow: 'hidden' }}>{s.department || 'Science Communicator'}</p>
                <button className="scicomm-btn-secondary" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
                  <UserPlus size={16} /> Connect
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
