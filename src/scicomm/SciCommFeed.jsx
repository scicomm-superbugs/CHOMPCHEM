import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLiveCollection, db } from '../db';
import { Image, Video, FileText, ThumbsUp, MessageSquare, Share2, Send, MoreHorizontal, UserCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SciCommFeed() {
  const { user } = useAuth();
  const scientists = useLiveCollection('scientists') || [];
  const currentUserData = scientists.find(s => String(s.id) === String(user.id));
  const postsRaw = useLiveCollection('scicomm_posts') || [];

  const [newPost, setNewPost] = useState('');
  const [commentText, setCommentText] = useState({});
  const [showComments, setShowComments] = useState({});

  const posts = [...postsRaw].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getAuthorData = (authorId) => scientists.find(s => String(s.id) === String(authorId));

  const handlePostSubmit = async (e) => {
    e?.preventDefault();
    if (!newPost.trim()) return;
    try {
      await db.scicomm_posts.add({
        content: newPost,
        authorId: user.id,
        authorName: user.name,
        createdAt: new Date().toISOString(),
        likes: [],
        comments: []
      });
      setNewPost('');
    } catch (err) {
      console.error("Failed to post", err);
    }
  };

  const handleLike = async (post) => {
    const likes = post.likes || [];
    const alreadyLiked = likes.includes(user.id);
    const newLikes = alreadyLiked ? likes.filter(id => id !== user.id) : [...likes, user.id];
    try {
      await db.scicomm_posts.update(post.id, { likes: newLikes });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (post) => {
    const text = commentText[post.id];
    if (!text?.trim()) return;
    const comments = post.comments || [];
    comments.push({ authorId: user.id, authorName: user.name, text, createdAt: new Date().toISOString() });
    try {
      await db.scicomm_posts.update(post.id, { comments });
      setCommentText(prev => ({...prev, [post.id]: ''}));
    } catch (err) {
      console.error(err);
    }
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d`;
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="scicomm-feed-layout">
      {/* Left Sidebar */}
      <div className="scicomm-sidebar-left hide-on-mobile">
        <div className="scicomm-card" style={{ textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ height: '60px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}></div>
          {currentUserData?.avatar ? (
            <img src={currentUserData.avatar} alt="Profile" style={{ width: '72px', height: '72px', borderRadius: '50%', border: '3px solid white', marginTop: '-36px', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', border: '3px solid white', marginTop: '-36px', background: '#eef3f8', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><UserCircle size={36} color="#666" /></div>
          )}
          <div style={{ padding: '12px 16px' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '16px' }}>{user.name}</h3>
            <p style={{ color: 'rgba(0,0,0,0.6)', fontSize: '12px', margin: '0 0 12px' }}>{currentUserData?.department || 'Science Communicator'}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e0dfdc', paddingTop: '12px', fontSize: '12px' }}>
              <span style={{ color: 'rgba(0,0,0,0.6)' }}>Profile viewers</span>
              <strong style={{ color: '#10b981' }}>{currentUserData?.profileViews || 0}</strong>
            </div>
          </div>
        </div>

        <div className="scicomm-card scicomm-card-padding" style={{ marginTop: '8px' }}>
          <Link to="/leaderboard" style={{ display: 'flex', justifyContent: 'space-between', textDecoration: 'none', color: 'rgba(0,0,0,0.6)', fontSize: '12px', fontWeight: 600 }}>
            <span>🏆 Leaderboard</span>
            <span style={{ color: '#10b981' }}>View</span>
          </Link>
        </div>
      </div>

      {/* Main Feed */}
      <div className="scicomm-feed-main">
        {/* Post Composer */}
        <div className="scicomm-card scicomm-card-padding">
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
            {currentUserData?.avatar ? (
              <img src={currentUserData.avatar} alt="" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#eef3f8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><UserCircle size={28} color="#666" /></div>
            )}
            <input 
              type="text" 
              placeholder="Start a post — share your science communication thoughts..." 
              value={newPost}
              onChange={e => setNewPost(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handlePostSubmit(e)}
              style={{ flex: 1, border: '1px solid #e0dfdc', borderRadius: '24px', padding: '0 16px', fontSize: '14px', outline: 'none', minHeight: '40px' }} 
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            <button className="scicomm-feed-action"><Image size={18} color="#70b5f9" /> <span>Photo</span></button>
            <button className="scicomm-feed-action"><Video size={18} color="#7fc15e" /> <span>Video</span></button>
            <button className="scicomm-feed-action"><FileText size={18} color="#e7a33e" /> <span>Article</span></button>
            {newPost.trim() && <button className="scicomm-btn-primary" onClick={handlePostSubmit} style={{padding:'6px 20px'}}><Send size={14} /> Post</button>}
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="scicomm-card scicomm-card-padding" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <div style={{fontSize:'48px',marginBottom:'12px'}}>📢</div>
            <h3 style={{margin:'0 0 8px'}}>No posts yet</h3>
            <p style={{fontSize:'14px'}}>Be the first to spark a discussion!</p>
          </div>
        ) : (
          posts.map(post => {
            const author = getAuthorData(post.authorId);
            const isLiked = (post.likes || []).includes(user.id);
            const likeCount = (post.likes || []).length;
            const commentCount = (post.comments || []).length;
            const isCommentsOpen = showComments[post.id];

            return (
              <div key={post.id} className="scicomm-card" style={{marginBottom:'8px'}}>
                <div className="scicomm-card-padding">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    {author?.avatar ? (
                      <img src={author.avatar} alt="" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#eef3f8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><UserCircle size={28} color="#666" /></div>
                    )}
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>{post.authorName}</h4>
                      <div style={{ color: 'rgba(0,0,0,0.6)', fontSize: '12px' }}>{author?.department || 'Science Communicator'}</div>
                      <div style={{ color: 'rgba(0,0,0,0.6)', fontSize: '12px' }}>{timeAgo(post.createdAt)} • 🌐</div>
                    </div>
                    <MoreHorizontal size={20} color="#666" style={{cursor:'pointer'}} />
                  </div>
                  <p style={{ margin: '0 0 12px', fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{post.content}</p>
                </div>

                {/* Like & comment counts */}
                {(likeCount > 0 || commentCount > 0) && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 16px 8px', fontSize: '12px', color: 'rgba(0,0,0,0.6)' }}>
                    <span>{likeCount > 0 ? `👍 ${likeCount}` : ''}</span>
                    <span style={{cursor:'pointer'}} onClick={() => setShowComments(p => ({...p, [post.id]: !p[post.id]}))}>{commentCount > 0 ? `${commentCount} comment${commentCount>1?'s':''}` : ''}</span>
                  </div>
                )}
                
                <div style={{ display: 'flex', borderTop: '1px solid #e0dfdc' }}>
                  <button className={`scicomm-post-btn ${isLiked ? 'liked' : ''}`} onClick={() => handleLike(post)}>
                    <ThumbsUp size={18} /> Like
                  </button>
                  <button className="scicomm-post-btn" onClick={() => setShowComments(p => ({...p, [post.id]: !p[post.id]}))}>
                    <MessageSquare size={18} /> Comment
                  </button>
                  <button className="scicomm-post-btn">
                    <Share2 size={18} /> Share
                  </button>
                </div>

                {/* Comments */}
                {isCommentsOpen && (
                  <div style={{ padding: '8px 16px 16px', borderTop: '1px solid #e0dfdc' }}>
                    {(post.comments || []).map((c, i) => (
                      <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#eef3f8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><UserCircle size={18} color="#666" /></div>
                        <div style={{ background: '#f3f2ef', borderRadius: '0 8px 8px 8px', padding: '8px 12px', flex: 1 }}>
                          <strong style={{ fontSize: '13px' }}>{c.authorName}</strong>
                          <p style={{ margin: '4px 0 0', fontSize: '13px' }}>{c.text}</p>
                        </div>
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <input
                        type="text"
                        placeholder="Add a comment..."
                        value={commentText[post.id] || ''}
                        onChange={e => setCommentText(prev => ({...prev, [post.id]: e.target.value}))}
                        onKeyDown={e => e.key === 'Enter' && handleAddComment(post)}
                        style={{ flex: 1, border: '1px solid #e0dfdc', borderRadius: '24px', padding: '6px 14px', fontSize: '13px', outline: 'none' }}
                      />
                      <button className="scicomm-btn-primary" style={{padding:'6px 14px',fontSize:'12px'}} onClick={() => handleAddComment(post)}>Post</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Right Sidebar */}
      <div className="scicomm-sidebar-right hide-on-mobile">
        <div className="scicomm-card scicomm-card-padding">
          <h3 style={{ margin: '0 0 12px', fontSize: '16px' }}>📌 Quick Links</h3>
          <Link to="/tasks" style={{ display: 'block', color: '#10b981', fontSize: '13px', marginBottom: '8px', textDecoration: 'none', fontWeight: 600 }}>📋 My Assigned Tasks</Link>
          <Link to="/leaderboard" style={{ display: 'block', color: '#10b981', fontSize: '13px', marginBottom: '8px', textDecoration: 'none', fontWeight: 600 }}>🏆 Leaderboard & Tags</Link>
          <Link to="/notifications" style={{ display: 'block', color: '#10b981', fontSize: '13px', textDecoration: 'none', fontWeight: 600 }}>🔔 Notifications</Link>
        </div>
        <div className="scicomm-card scicomm-card-padding" style={{ marginTop: '8px' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '16px' }}>Team Members</h3>
          {scientists.filter(s => s.accountStatus !== 'pending').slice(0, 5).map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              {s.avatar ? <img src={s.avatar} alt="" style={{width:32,height:32,borderRadius:'50%',objectFit:'cover'}} /> : <div style={{width:32,height:32,borderRadius:'50%',background:'#eef3f8',display:'flex',alignItems:'center',justifyContent:'center'}}><UserCircle size={18} color="#666"/></div>}
              <div>
                <div style={{ fontWeight: 600, fontSize: '13px' }}>{s.name}</div>
                <div style={{ color: 'rgba(0,0,0,0.6)', fontSize: '11px' }}>{s.department || 'Member'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
