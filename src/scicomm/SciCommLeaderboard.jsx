import { useLiveCollection } from '../db';
import { useAuth } from '../context/AuthContext';
import { Trophy, UserCircle, TrendingUp } from 'lucide-react';
import { AVATARS, RANKS, AUTO_TAGS, calculateScore, getRank, getUnlockedTags, REACTIONS } from './scicommConstants';

export default function SciCommLeaderboard() {
  const { user } = useAuth();
  const scientists = useLiveCollection('scientists') || [];
  const postsData = useLiveCollection('scicomm_posts') || [];
  const tasksData = useLiveCollection('tasks') || [];
  const connectionsData = useLiveCollection('scicomm_connections') || [];
  const meetingsData = useLiveCollection('scicomm_meetings') || [];
  const warningsData = useLiveCollection('scicomm_warnings') || [];

  const activeMembers = scientists.filter(s => s.accountStatus !== 'pending');

  const renderAvatar = (member, size = 48) => {
    if (member?.avatar) return <img src={member.avatar} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
    const av = AVATARS.find(a => a.id === member?.avatarId);
    if (av) return <div style={{ width: size, height: size, borderRadius: '50%', background: av.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.45, flexShrink: 0 }}>{av.svg}</div>;
    return <div style={{ width: size, height: size, borderRadius: '50%', background: '#eef3f8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><UserCircle size={size * 0.55} color="#666" /></div>;
  };

  const getMemberScore = (s) => {
    // Suspended members (3+ active warnings) don't appear
    const warnings = warningsData.filter(w => String(w.userId) === String(s.id) && w.status !== 'removed');
    if (warnings.length >= 3) return -1;
    if (s.role === 'master') return Infinity;

    const likesReceived = postsData.filter(p => String(p.authorId) === String(s.id)).reduce((sum, p) => sum + Object.values(p.reactions || {}).reduce((ss, arr) => ss + arr.length, 0), 0);
    const completedTasks = tasksData.filter(t => String(t.assignedTo) === String(s.id) && t.status === 'Completed').length;
    const connectionCount = connectionsData.filter(c => c.status === 'accepted' && (String(c.fromId) === String(s.id) || String(c.toId) === String(s.id))).length;
    const meetingsAttended = meetingsData.filter(m => (m.attendees || []).includes(s.id)).length;
    const tagsCount = (s.pinnedTags || []).length;

    return calculateScore({ completedTasks, likesReceived, connectionCount, meetingsAttended, tagsCount });
  };

  const leaderboard = activeMembers
    .map(s => ({ ...s, score: getMemberScore(s) }))
    .filter(s => s.score >= 0)
    .sort((a, b) => b.score - a.score);

  const getRankBadge = (index) => {
    if (index === 0) return { emoji: '🥇', color: '#fbbf24' };
    if (index === 1) return { emoji: '🥈', color: '#9ca3af' };
    if (index === 2) return { emoji: '🥉', color: '#d97706' };
    return { emoji: `#${index + 1}`, color: 'rgba(0,0,0,0.4)' };
  };

  return (
    <div className="scicomm-feed-layout">
      <div className="scicomm-sidebar-left hide-on-mobile">
        <div className="scicomm-card scicomm-card-padding">
          <h3 style={{ margin: '0 0 12px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Trophy size={18} color="#fbbf24" /> Scoring</h3>
          <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.6)', lineHeight: '2.2' }}>
            <div>✅ Task completed = <strong>25 pts</strong></div>
            <div>❤️ Reaction received = <strong>5 pts</strong></div>
            <div>📅 Meeting attended = <strong>15 pts</strong></div>
            <div>🏅 Pinned tag = <strong>15 pts</strong></div>
            <div>🤝 Connection = <strong>2 pts</strong></div>
            <div style={{ borderTop: '1px solid #e0dfdc', marginTop: '8px', paddingTop: '8px', color: '#ef4444' }}>❌ Posts = <strong>0 pts</strong></div>
            <div style={{ color: 'rgba(0,0,0,0.4)', fontSize: '11px' }}>Posts don't generate points to prevent spam.</div>
          </div>
        </div>
        <div className="scicomm-card scicomm-card-padding" style={{ marginTop: '8px' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: '15px' }}>📊 Rank Tiers</h3>
          <div style={{ fontSize: '12px' }}>
            {RANKS.map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: r.color }}>
                <span>{r.icon} {r.rank}</span>
                <span style={{ color: 'rgba(0,0,0,0.4)' }}>{r.minScore}+</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="scicomm-feed-main">
        {/* Top 3 Podium */}
        <div className="scicomm-card scicomm-card-padding">
          <h2 style={{ margin: '0 0 24px', fontSize: '22px', textAlign: 'center' }}>🏆 SciComm Leaderboard</h2>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {[1, 0, 2].map(idx => {
              const person = leaderboard[idx];
              if (!person) return null;
              const isFirst = idx === 0;
              const badge = getRankBadge(idx);
              const rank = getRank(person.score === Infinity ? 10000 : person.score);
              return (
                <div key={person.id} style={{ textAlign: 'center', width: isFirst ? '140px' : '110px', order: idx === 0 ? 1 : idx === 1 ? 0 : 2 }}>
                  <div style={{ fontSize: isFirst ? '36px' : '24px', marginBottom: '6px' }}>{badge.emoji}</div>
                  {renderAvatar(person, isFirst ? 80 : 60)}
                  <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '6px' }}>{person.name}</div>
                  <div style={{ background: rank.color + '20', color: rank.color, padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 700, display: 'inline-block', marginTop: '2px' }}>{rank.icon} {rank.rank}</div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#10b981', marginTop: '4px' }}>{person.score === Infinity ? '∞' : person.score}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Full Rankings */}
        <div className="scicomm-card scicomm-card-padding">
          <h3 style={{ margin: '0 0 12px', fontSize: '18px' }}>Full Rankings</h3>
          {leaderboard.map((s, i) => {
            const badge = getRankBadge(i);
            const rank = getRank(s.score === Infinity ? 10000 : s.score);
            const isMe = String(s.id) === String(user.id);
            const tags = getUnlockedTags(s.score === Infinity ? 10000 : s.score);
            const pinned = s.pinnedTags || [];
            return (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 8px', borderRadius: '8px', marginBottom: '2px', background: isMe ? '#ecfdf5' : 'transparent', border: isMe ? '1px solid #a7f3d0' : '1px solid transparent' }}>
                <div style={{ width: '32px', textAlign: 'center', fontWeight: 700, fontSize: '14px', color: badge.color }}>{badge.emoji}</div>
                {renderAvatar(s, 40)}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>{s.name}</span>
                    {isMe && <span style={{ color: '#10b981', fontSize: '11px' }}>(You)</span>}
                    <span style={{ background: rank.color + '20', color: rank.color, padding: '1px 6px', borderRadius: '8px', fontSize: '10px', fontWeight: 700 }}>{rank.icon} {rank.rank}</span>
                  </div>
                  {pinned.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '2px' }}>
                      {pinned.slice(0, 3).map((t, j) => <span key={j} style={{ fontSize: '10px', color: '#065f46', background: '#ecfdf5', padding: '1px 6px', borderRadius: '8px' }}>{t}</span>)}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '18px', color: '#10b981' }}>{s.score === Infinity ? '∞' : s.score}</div>
                  <div style={{ fontSize: '10px', color: 'rgba(0,0,0,0.4)' }}>points</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="scicomm-sidebar-right hide-on-mobile">
        <div className="scicomm-card scicomm-card-padding">
          <h3 style={{ margin: '0 0 8px', fontSize: '15px' }}>🏅 Available Tags ({AUTO_TAGS.length})</h3>
          <div style={{ maxHeight: '400px', overflowY: 'auto', fontSize: '11px' }}>
            {AUTO_TAGS.map((t, i) => (
              <div key={i} style={{ padding: '3px 0', borderBottom: '1px solid #f3f2ef', display: 'flex', justifyContent: 'space-between' }}>
                <span>{t.tag}</span>
                <span style={{ color: 'rgba(0,0,0,0.3)' }}>{t.threshold}pts</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
