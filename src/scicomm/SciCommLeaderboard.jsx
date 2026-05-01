import { useLiveCollection } from '../db';
import { useAuth } from '../context/AuthContext';
import { Trophy, Medal, Award, Star, UserCircle } from 'lucide-react';

export default function SciCommLeaderboard() {
  const { user } = useAuth();
  const scientists = useLiveCollection('scientists') || [];
  const postsData = useLiveCollection('scicomm_posts') || [];
  const tasksData = useLiveCollection('tasks') || [];

  const activeMembers = scientists.filter(s => s.accountStatus !== 'pending');

  const getScore = (s) => {
    if (s.role === 'master') return Infinity;
    const posts = postsData.filter(p => String(p.authorId) === String(s.id)).length;
    const likes = postsData.reduce((sum, p) => sum + ((p.likes || []).includes(String(s.id)) ? 0 : (String(p.authorId) === String(s.id) ? (p.likes || []).length : 0)), 0);
    const tasks = tasksData.filter(t => String(t.assignedTo) === String(s.id) && t.status === 'Completed').length;
    const tags = (s.scicommTags || []).length;
    return (posts * 10) + (likes * 5) + (tasks * 25) + (tags * 15);
  };

  const leaderboard = activeMembers
    .map(s => ({ ...s, score: getScore(s) }))
    .sort((a, b) => b.score - a.score);

  const getRankBadge = (index) => {
    if (index === 0) return { emoji: '🥇', color: '#fbbf24', bg: 'linear-gradient(135deg, #fef3c7, #fde68a)' };
    if (index === 1) return { emoji: '🥈', color: '#9ca3af', bg: 'linear-gradient(135deg, #f3f4f6, #d1d5db)' };
    if (index === 2) return { emoji: '🥉', color: '#d97706', bg: 'linear-gradient(135deg, #fef3c7, #fde68a)' };
    return { emoji: `#${index + 1}`, color: 'rgba(0,0,0,0.6)', bg: 'white' };
  };

  return (
    <div className="scicomm-feed-layout">
      <div className="scicomm-sidebar-left hide-on-mobile">
        <div className="scicomm-card scicomm-card-padding">
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Trophy size={18} color="#fbbf24" /> Scoring</h3>
          <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.6)', lineHeight: '2' }}>
            <div>📝 Post = <strong>10 pts</strong></div>
            <div>👍 Like received = <strong>5 pts</strong></div>
            <div>✅ Task completed = <strong>25 pts</strong></div>
            <div>🏅 Tag earned = <strong>15 pts</strong></div>
          </div>
        </div>
      </div>

      <div className="scicomm-feed-main">
        {/* Top 3 Podium */}
        <div className="scicomm-card scicomm-card-padding">
          <h2 style={{ margin: '0 0 24px', fontSize: '22px', textAlign: 'center' }}>🏆 SciComm Leaderboard</h2>
          
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
            {leaderboard.slice(0, 3).map((s, i) => {
              const order = [1, 0, 2]; // 2nd, 1st, 3rd position for display
              const idx = order[i];
              const person = leaderboard[idx];
              if (!person) return null;
              const badge = getRankBadge(idx);
              const isFirst = idx === 0;
              
              return (
                <div key={person.id} style={{ textAlign: 'center', order: i, width: isFirst ? '140px' : '120px' }}>
                  <div style={{ fontSize: isFirst ? '36px' : '28px', marginBottom: '8px' }}>{badge.emoji}</div>
                  {person.avatar ? (
                    <img src={person.avatar} alt="" style={{ width: isFirst ? '80px' : '64px', height: isFirst ? '80px' : '64px', borderRadius: '50%', objectFit: 'cover', border: `3px solid ${badge.color}` }} />
                  ) : (
                    <div style={{ width: isFirst ? '80px' : '64px', height: isFirst ? '80px' : '64px', borderRadius: '50%', background: '#eef3f8', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: `3px solid ${badge.color}` }}><UserCircle size={isFirst ? 36 : 28} color="#666" /></div>
                  )}
                  <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '8px' }}>{person.name}</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#10b981' }}>{person.score === Infinity ? '∞' : person.score}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(0,0,0,0.4)' }}>points</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Full Ranking */}
        <div className="scicomm-card scicomm-card-padding">
          <h3 style={{ margin: '0 0 16px', fontSize: '18px' }}>Full Rankings</h3>
          {leaderboard.map((s, i) => {
            const badge = getRankBadge(i);
            const isMe = String(s.id) === String(user.id);
            return (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 8px', borderRadius: '8px', marginBottom: '4px', background: isMe ? '#ecfdf5' : 'transparent', border: isMe ? '1px solid #a7f3d0' : '1px solid transparent' }}>
                <div style={{ width: '36px', textAlign: 'center', fontWeight: 700, fontSize: '16px', color: badge.color }}>{badge.emoji}</div>
                {s.avatar ? (
                  <img src={s.avatar} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#eef3f8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><UserCircle size={22} color="#666" /></div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{s.name} {isMe && <span style={{color:'#10b981',fontSize:'12px'}}>(You)</span>}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.6)' }}>{s.department || 'Member'}</div>
                  {(s.scicommTags || []).length > 0 && (
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                      {(s.scicommTags || []).slice(0, 3).map((t, j) => (
                        <span key={j} style={{ background: '#ecfdf5', color: '#065f46', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', border: '1px solid #a7f3d0' }}>{t}</span>
                      ))}
                      {(s.scicommTags || []).length > 3 && <span style={{ fontSize: '11px', color: 'rgba(0,0,0,0.4)' }}>+{(s.scicommTags || []).length - 3} more</span>}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '18px', color: '#10b981' }}>{s.score === Infinity ? '∞' : s.score}</div>
                  <div style={{ fontSize: '11px', color: 'rgba(0,0,0,0.4)' }}>points</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="scicomm-sidebar-right hide-on-mobile">
        <div className="scicomm-card scicomm-card-padding">
          <h3 style={{ margin: '0 0 12px', fontSize: '16px' }}>🏅 All Tag Categories</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '400px', overflowY: 'auto', fontSize: '12px' }}>
            {SCICOMM_TAGS.map((t, i) => (
              <div key={i} style={{ padding: '4px 0', borderBottom: '1px solid #f3f2ef' }}>{t}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const SCICOMM_TAGS = [
  "🌟 Top Communicator", "✍️ Content Creator", "🎙️ Public Speaker", "📢 Outreach Pioneer",
  "🧬 Science Advocate", "📸 Visual Storyteller", "🎥 Video Producer", "🏅 Team Leader",
  "💡 Innovator", "📚 Knowledge Sharer", "🤝 Collaborator", "🔬 Research Enthusiast",
  "🌍 Global Thinker", "🎓 Mentor", "📝 Science Writer", "🧪 Lab Hero",
  "🌱 Sustainability Champion", "🩺 Health Communicator", "🚀 Rising Star", "🧠 Critical Thinker",
  "🎨 Creative Genius", "📊 Data Storyteller", "🗣️ Debate Champion", "🌐 Digital Native",
  "🏆 Award Winner", "⚡ Quick Learner", "🤖 Tech Savvy", "📖 Bookworm",
  "🎤 Podcast Host", "📣 Social Media Star", "🧑‍🏫 Educator", "🗞️ Press & Media",
  "🛡️ Fact Checker", "📡 Science Broadcaster", "🎬 Film Maker", "🖊️ Blog Author",
  "🏗️ Event Organizer", "🌿 Eco Warrior", "🎭 Science Performer", "🤓 Trivia Master",
  "🧑‍🔬 Citizen Scientist", "📍 Community Leader", "🪄 Engagement Wizard", "🔊 Voice of Reason",
  "🗺️ Explorer", "🎯 Goal Achiever", "📐 Precision Expert", "🕊️ Peace Builder",
  "🏋️ Hard Worker", "💎 Diamond Member"
];
