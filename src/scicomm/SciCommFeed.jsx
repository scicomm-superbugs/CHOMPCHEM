import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLiveCollection, db } from '../db';
import { Image, Video, FileText, Send, MessageSquare, Share2, MoreHorizontal, UserCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { REACTIONS, AVATARS, timeAgo, isSpamPost, getRank, calculateScore, getUnlockedTags } from './scicommConstants';

export default function SciCommFeed() {
  const { user } = useAuth();
  const scientists = useLiveCollection('scientists') || [];
  const currentUserData = scientists.find(s => String(s.id) === String(user.id));
  const postsRaw = useLiveCollection('scicomm_posts') || [];
  const bannersRaw = useLiveCollection('scicomm_banners') || [];
  const connectionsRaw = useLiveCollection('scicomm_connections') || [];
  const tasksData = useLiveCollection('tasks') || [];
  const meetingsData = useLiveCollection('scicomm_meetings') || [];

  const [newPost, setNewPost] = useState('');
  const [commentText, setCommentText] = useState({});
  const [showComments, setShowComments] = useState({});
  const [activeReactionPicker, setActiveReactionPicker] = useState(null);
  const [bannerIdx, setBannerIdx] = useState(0);
  const [postError, setPostError] = useState('');

  const banners = [...bannersRaw].sort((a,b) => (a.order||0) - (b.order||0));
  const posts = [...postsRaw].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getAuthor = (id) => scientists.find(s => String(s.id) === String(id));
  const getAvatar = (member) => {
    if (member?.avatar) return { type: 'img', src: member.avatar };
    const av = AVATARS.find(a => a.id === member?.avatarId);
    if (av) return { type: 'emoji', emoji: av.svg, bg: av.bg };
    return { type: 'fallback' };
  };

  const renderAvatar = (member, size = 48) => {
    const av = getAvatar(member);
    if (av.type === 'img') return <img src={av.src} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
    if (av.type === 'emoji') return <div style={{ width: size, height: size, borderRadius: '50%', background: av.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.5, flexShrink: 0 }}>{av.emoji}</div>;
    return <div style={{ width: size, height: size, borderRadius: '50%', background: '#eef3f8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><UserCircle size={size * 0.6} color="#666" /></div>;
  };

  // Banner auto-slide
  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => setBannerIdx(i => (i + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [banners.length]);

  // Post submission with spam check
  const handlePostSubmit = async (e) => {
    e?.preventDefault();
    if (!newPost.trim()) return;
    setPostError('');
    const myRecentPosts = posts.filter(p => String(p.authorId) === String(user.id)).slice(0, 5);
    if (isSpamPost(newPost, myRecentPosts)) {
      setPostError('⚠️ Your post was flagged. Please write something unique and meaningful (min 10 chars).');
      return;
    }
    try {
      await db.scicomm_posts.add({
        content: newPost,
        authorId: user.id,
        authorName: user.name,
        createdAt: new Date().toISOString(),
        reactions: {},
        comments: [],
        pinned: false
      });
      setNewPost('');
    } catch (err) {
      console.error("Failed to post", err);
    }
  };

  // Multi-reaction toggle
  const handleReaction = async (post, reactionKey) => {
    const reactions = { ...(post.reactions || {}) };
    if (!reactions[reactionKey]) reactions[reactionKey] = [];
    const idx = reactions[reactionKey].indexOf(user.id);
    // Remove from all other reactions first
    for (const k in reactions) {
      reactions[k] = reactions[k].filter(id => id !== user.id);
      if (reactions[k].length === 0) delete reactions[k];
    }
    // Toggle current
    if (idx === -1) {
      if (!reactions[reactionKey]) reactions[reactionKey] = [];
      reactions[reactionKey].push(user.id);
    }
    try {
      await db.scicomm_posts.update(post.id, { reactions });
      setActiveReactionPicker(null);
    } catch (err) { console.error(err); }
  };

  const handleAddComment = async (post) => {
    const text = commentText[post.id];
    if (!text?.trim()) return;
    const comments = [...(post.comments || [])];
    comments.push({ authorId: user.id, authorName: user.name, text, createdAt: new Date().toISOString() });
    try {
      await db.scicomm_posts.update(post.id, { comments });
      setCommentText(prev => ({ ...prev, [post.id]: '' }));
    } catch (err) { console.error(err); }
  };

  const getTotalReactions = (post) => {
    const r = post.reactions || {};
    return Object.values(r).reduce((s, arr) => s + arr.length, 0);
  };

  const getMyReaction = (post) => {
    const r = post.reactions || {};
    for (const [key, arr] of Object.entries(r)) {
      if (arr.includes(user.id)) return key;
    }
    return null;
  };

  const getReactionSummary = (post) => {
    const r = post.reactions || {};
    const summary = [];
    for (const [key, arr] of Object.entries(r)) {
      if (arr.length > 0) {
        const rc = REACTIONS.find(rx => rx.key === key);
        if (rc) summary.push({ ...rc, count: arr.length });
      }
    }
    return summary.sort((a,b) => b.count - a.count);
  };

  // Score for sidebar
  const myLikesReceived = postsRaw.filter(p => String(p.authorId) === String(user.id)).reduce((s, p) => s + Object.values(p.reactions || {}).reduce((ss, arr) => ss + arr.length, 0), 0);
  const myCompletedTasks = tasksData.filter(t => String(t.assignedTo) === String(user.id) && t.status === 'Completed').length;
  const myConnections = connectionsRaw.filter(c => c.status === 'accepted' && (String(c.fromId) === String(user.id) || String(c.toId) === String(user.id))).length;
  const myAttended = meetingsData.filter(m => (m.attendees || []).includes(user.id)).length;
  const myScore = calculateScore({ completedTasks: myCompletedTasks, likesReceived: myLikesReceived, connectionCount: myConnections, meetingsAttended: myAttended, tagsCount: getUnlockedTags(0).length });
  const myRank = getRank(myScore);

  return (
    <div className="scicomm-feed-layout">
      {/* Left Sidebar */}
      <div className="scicomm-sidebar-left hide-on-mobile">
        <div className="scicomm-card" style={{ textAlign: 'center', overflow: 'hidden' }}>
          <div style={{ height: '56px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}></div>
          <div style={{marginTop:'-28px'}}>{renderAvatar(currentUserData, 56)}</div>
          <div style={{ padding: '8px 12px 12px' }}>
            <h3 style={{ margin: '4px 0 2px', fontSize: '15px' }}>{user.name}</h3>
            <p style={{ color: 'rgba(0,0,0,0.6)', fontSize: '12px', margin: '0 0 8px' }}>{currentUserData?.department || 'Science Communicator'}</p>
            <div style={{ background: myRank.color + '20', color: myRank.color, padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, display: 'inline-block' }}>{myRank.icon} {myRank.rank}</div>
            <div style={{ borderTop: '1px solid #e0dfdc', marginTop: '10px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'rgba(0,0,0,0.6)' }}>Score</span>
              <strong style={{ color: '#10b981' }}>{myScore}</strong>
            </div>
          </div>
        </div>
        <div className="scicomm-card scicomm-card-padding" style={{ marginTop: '8px', fontSize: '13px' }}>
          <Link to="/leaderboard" style={{ display: 'flex', justifyContent: 'space-between', textDecoration: 'none', color: 'rgba(0,0,0,0.6)', fontWeight: 600, marginBottom: '6px' }}>🏆 Leaderboard <span style={{ color: '#10b981' }}>→</span></Link>
          <Link to="/tasks" style={{ display: 'flex', justifyContent: 'space-between', textDecoration: 'none', color: 'rgba(0,0,0,0.6)', fontWeight: 600, marginBottom: '6px' }}>📋 My Tasks <span style={{ color: '#10b981' }}>→</span></Link>
          <Link to="/chat" style={{ display: 'flex', justifyContent: 'space-between', textDecoration: 'none', color: 'rgba(0,0,0,0.6)', fontWeight: 600 }}>💬 Messages <span style={{ color: '#10b981' }}>→</span></Link>
        </div>
      </div>

      {/* Main Feed */}
      <div className="scicomm-feed-main">
        {/* Banner Slider */}
        {banners.length > 0 && (
          <div className="scicomm-card" style={{ position: 'relative', overflow: 'hidden', marginBottom: '12px' }}>
            <div style={{ display: 'flex', transition: 'transform 0.5s ease', transform: `translateX(-${bannerIdx * 100}%)` }}>
              {banners.map((b, i) => (
                <div key={b.id} style={{ minWidth: '100%', position: 'relative' }}>
                  <img src={b.imageUrl} alt={b.title || 'Banner'} style={{ width: '100%', height: '180px', objectFit: 'cover' }} onError={e => e.target.style.display='none'} />
                  {b.title && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', color: 'white', padding: '16px', fontSize: '14px', fontWeight: 600 }}>{b.title}</div>}
                </div>
              ))}
            </div>
            {banners.length > 1 && (
              <>
                <button onClick={() => setBannerIdx(i => (i - 1 + banners.length) % banners.length)} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronLeft size={18} /></button>
                <button onClick={() => setBannerIdx(i => (i + 1) % banners.length)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronRight size={18} /></button>
                <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px' }}>
                  {banners.map((_, i) => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i === bannerIdx ? 'white' : 'rgba(255,255,255,0.5)', cursor: 'pointer' }} onClick={() => setBannerIdx(i)} />)}
                </div>
              </>
            )}
          </div>
        )}

        {/* Post Composer */}
        <div className="scicomm-card scicomm-card-padding">
          <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
            {renderAvatar(currentUserData, 44)}
            <input type="text" placeholder="Share your science communication thoughts..." value={newPost} onChange={e => setNewPost(e.target.value)} onKeyDown={e => e.key === 'Enter' && handlePostSubmit(e)}
              style={{ flex: 1, border: '1px solid #e0dfdc', borderRadius: '24px', padding: '0 16px', fontSize: '14px', outline: 'none', minHeight: '40px' }} />
          </div>
          {postError && <div style={{ color: '#ef4444', fontSize: '12px', marginBottom: '8px', padding: '6px 10px', background: '#fee2e2', borderRadius: '8px' }}>{postError}</div>}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex' }}>
              <button className="scicomm-feed-action"><Image size={18} color="#70b5f9" /> <span>Photo</span></button>
              <button className="scicomm-feed-action"><Video size={18} color="#7fc15e" /> <span>Video</span></button>
              <button className="scicomm-feed-action"><FileText size={18} color="#e7a33e" /> <span>Article</span></button>
            </div>
            {newPost.trim() && <button className="scicomm-btn-primary" onClick={handlePostSubmit} style={{ padding: '6px 20px' }}><Send size={14} /> Post</button>}
          </div>
        </div>

        {/* Posts */}
        {posts.length === 0 ? (
          <div className="scicomm-card scicomm-card-padding" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📢</div>
            <h3 style={{ margin: '0 0 8px' }}>No posts yet</h3>
            <p style={{ fontSize: '14px' }}>Be the first to spark a discussion!</p>
          </div>
        ) : posts.map(post => {
          const author = getAuthor(post.authorId);
          const myReaction = getMyReaction(post);
          const totalReactions = getTotalReactions(post);
          const reactionSummary = getReactionSummary(post);
          const commentCount = (post.comments || []).length;
          const isCommentsOpen = showComments[post.id];
          const currentReactionDef = myReaction ? REACTIONS.find(r => r.key === myReaction) : null;

          return (
            <div key={post.id} className="scicomm-card" style={{ marginBottom: '8px' }}>
              <div className="scicomm-card-padding">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  {renderAvatar(author, 48)}
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>{post.authorName}</h4>
                    <div style={{ color: 'rgba(0,0,0,0.6)', fontSize: '12px' }}>{author?.department || 'Member'}</div>
                    <div style={{ color: 'rgba(0,0,0,0.5)', fontSize: '11px' }}>{timeAgo(post.createdAt)} • 🌐</div>
                  </div>
                </div>
                <p style={{ margin: '0 0 8px', fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{post.content}</p>
              </div>

              {/* Reaction summary + comment count */}
              {(totalReactions > 0 || commentCount > 0) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 16px 8px', fontSize: '12px', color: 'rgba(0,0,0,0.6)' }}>
                  <span>{reactionSummary.map(r => r.emoji).join('')} {totalReactions > 0 && totalReactions}</span>
                  <span style={{ cursor: 'pointer' }} onClick={() => setShowComments(p => ({ ...p, [post.id]: !p[post.id] }))}>{commentCount > 0 ? `${commentCount} comment${commentCount > 1 ? 's' : ''}` : ''}</span>
                </div>
              )}

              {/* Action bar with reaction picker */}
              <div style={{ display: 'flex', borderTop: '1px solid #e0dfdc', position: 'relative' }}>
                <div style={{ flex: 1, position: 'relative' }}
                  onMouseEnter={() => setActiveReactionPicker(post.id)}
                  onMouseLeave={() => setActiveReactionPicker(null)}>
                  <button className={`scicomm-post-btn ${myReaction ? 'liked' : ''}`} style={{ color: currentReactionDef?.color || 'rgba(0,0,0,0.6)', width: '100%' }} onClick={() => handleReaction(post, myReaction || 'like')}>
                    {currentReactionDef ? currentReactionDef.emoji : '👍'} {currentReactionDef?.label || 'Like'}
                  </button>
                  {/* Reaction Picker */}
                  {activeReactionPicker === post.id && (
                    <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', background: 'white', borderRadius: '24px', boxShadow: '0 4px 16px rgba(0,0,0,0.2)', padding: '6px 8px', display: 'flex', gap: '2px', zIndex: 50 }}>
                      {REACTIONS.map(r => (
                        <button key={r.key} onClick={() => handleReaction(post, r.key)} title={r.label}
                          style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', padding: '4px 6px', borderRadius: '50%', transition: 'transform 0.15s' }}
                          onMouseEnter={e => e.target.style.transform = 'scale(1.3)'} onMouseLeave={e => e.target.style.transform = 'scale(1)'}>
                          {r.emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button className="scicomm-post-btn" style={{ flex: 1 }} onClick={() => setShowComments(p => ({ ...p, [post.id]: !p[post.id] }))}>
                  <MessageSquare size={18} /> Comment
                </button>
                <button className="scicomm-post-btn" style={{ flex: 1 }}>
                  <Share2 size={18} /> Share
                </button>
              </div>

              {/* Comments section */}
              {isCommentsOpen && (
                <div style={{ padding: '8px 16px 16px', borderTop: '1px solid #e0dfdc' }}>
                  {(post.comments || []).map((c, i) => {
                    const cAuthor = getAuthor(c.authorId);
                    return (
                      <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                        {renderAvatar(cAuthor, 32)}
                        <div style={{ background: '#f3f2ef', borderRadius: '0 8px 8px 8px', padding: '8px 12px', flex: 1 }}>
                          <strong style={{ fontSize: '13px' }}>{c.authorName}</strong>
                          <span style={{ fontSize: '11px', color: 'rgba(0,0,0,0.4)', marginLeft: '8px' }}>{timeAgo(c.createdAt)}</span>
                          <p style={{ margin: '4px 0 0', fontSize: '13px' }}>{c.text}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <input type="text" placeholder="Add a comment..." value={commentText[post.id] || ''} onChange={e => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))} onKeyDown={e => e.key === 'Enter' && handleAddComment(post)}
                      style={{ flex: 1, border: '1px solid #e0dfdc', borderRadius: '24px', padding: '6px 14px', fontSize: '13px', outline: 'none' }} />
                    <button className="scicomm-btn-primary" style={{ padding: '6px 14px', fontSize: '12px' }} onClick={() => handleAddComment(post)}>Post</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Right Sidebar */}
      <div className="scicomm-sidebar-right hide-on-mobile">
        <div className="scicomm-card scicomm-card-padding">
          <h3 style={{ margin: '0 0 10px', fontSize: '15px' }}>📌 Quick Links</h3>
          <Link to="/tasks" style={{ display: 'block', color: '#10b981', fontSize: '13px', marginBottom: '6px', textDecoration: 'none', fontWeight: 600 }}>📋 My Tasks</Link>
          <Link to="/leaderboard" style={{ display: 'block', color: '#10b981', fontSize: '13px', marginBottom: '6px', textDecoration: 'none', fontWeight: 600 }}>🏆 Leaderboard</Link>
          <Link to="/meetings" style={{ display: 'block', color: '#10b981', fontSize: '13px', marginBottom: '6px', textDecoration: 'none', fontWeight: 600 }}>📅 Meetings</Link>
          <Link to="/chat" style={{ display: 'block', color: '#10b981', fontSize: '13px', textDecoration: 'none', fontWeight: 600 }}>💬 Chat</Link>
        </div>
        <div className="scicomm-card scicomm-card-padding" style={{ marginTop: '8px' }}>
          <h3 style={{ margin: '0 0 10px', fontSize: '15px' }}>Team</h3>
          {scientists.filter(s => s.accountStatus !== 'pending').slice(0, 5).map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              {renderAvatar(s, 32)}
              <div>
                <div style={{ fontWeight: 600, fontSize: '13px' }}>{s.name}</div>
                <div style={{ color: 'rgba(0,0,0,0.5)', fontSize: '11px' }}>{s.department || 'Member'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
