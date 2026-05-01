import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLiveCollection, db } from '../db';
import { Image, Video, FileText, Send, ThumbsUp, MessageSquare, Share2 } from 'lucide-react';

export default function SciCommFeed() {
  const { user } = useAuth();
  const scientists = useLiveCollection('scientists');
  const currentUserData = scientists?.find(s => String(s.id) === String(user.id));
  const postsRaw = useLiveCollection('scicomm_posts') || [];

  const [newPost, setNewPost] = useState('');

  // Sort posts by date
  const posts = [...postsRaw].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handlePostSubmit = async (e) => {
    e.preventDefault();
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

  return (
    <div className="scicomm-feed-layout">
      {/* Left Sidebar */}
      <div className="scicomm-sidebar-left hide-on-mobile">
        <div className="scicomm-card" style={{ textAlign: 'center', position: 'relative' }}>
          <div style={{ height: '60px', backgroundColor: '#a0b4b7' }}></div>
          <img 
            src={currentUserData?.avatar || 'https://via.placeholder.com/64'} 
            alt="Profile" 
            style={{ width: '72px', height: '72px', borderRadius: '50%', border: '2px solid white', marginTop: '-36px', objectFit: 'cover' }} 
          />
          <div style={{ padding: '16px' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: '16px' }}>{user.name}</h3>
            <p className="scicomm-text-muted" style={{ margin: '0 0 16px' }}>{currentUserData?.bio || 'Science Communicator'}</p>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e0dfdc', paddingTop: '12px', fontSize: '12px' }}>
              <span className="scicomm-text-muted">Profile viewers</span>
              <strong style={{ color: '#0a66c2' }}>{currentUserData?.profileViews || 0}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Main Feed */}
      <div className="scicomm-feed-main">
        <div className="scicomm-card scicomm-card-padding">
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
            <img src={currentUserData?.avatar || 'https://via.placeholder.com/48'} alt="User" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
            <input 
              type="text" 
              placeholder="Start a post" 
              value={newPost}
              onChange={e => setNewPost(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handlePostSubmit(e)}
              style={{ flex: 1, border: '1px solid #e0dfdc', borderRadius: '24px', padding: '0 16px', fontSize: '14px', outline: 'none' }} 
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', paddingTop: '8px' }}>
            <button className="dropdown-item" style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px', color: '#70b5f9', fontWeight: 600 }}>
              <Image size={20} /> Photo
            </button>
            <button className="dropdown-item" style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px', color: '#7fc15e', fontWeight: 600 }}>
              <Video size={20} /> Video
            </button>
            <button className="dropdown-item" style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px', color: '#e7a33e', fontWeight: 600 }}>
              <FileText size={20} /> Write article
            </button>
          </div>
        </div>

        <hr style={{ border: 'none', borderBottom: '1px solid #e0dfdc', margin: '16px 0' }} />

        {/* Posts */}
        {posts.length === 0 ? (
          <div className="scicomm-card scicomm-card-padding" style={{ textAlign: 'center', color: '#666' }}>
            No posts yet. Be the first to start a discussion!
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id} className="scicomm-card scicomm-card-padding">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#eef3f8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  👤
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '14px' }}>{post.authorName}</h4>
                  <div className="scicomm-text-muted" style={{ fontSize: '12px' }}>{new Date(post.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
              <p style={{ margin: '0 0 16px', fontSize: '14px', lineHeight: '1.5' }}>{post.content}</p>
              
              <div style={{ display: 'flex', borderTop: '1px solid #e0dfdc', paddingTop: '8px' }}>
                <button className="dropdown-item" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', color: '#666', fontWeight: 600 }}>
                  <ThumbsUp size={18} /> Like
                </button>
                <button className="dropdown-item" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', color: '#666', fontWeight: 600 }}>
                  <MessageSquare size={18} /> Comment
                </button>
                <button className="dropdown-item" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', color: '#666', fontWeight: 600 }}>
                  <Share2 size={18} /> Share
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Right Sidebar */}
      <div className="scicomm-sidebar-right hide-on-mobile">
        <div className="scicomm-card scicomm-card-padding">
          <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>Add to your feed</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#eef3f8' }}></div>
            <div>
              <h4 style={{ margin: 0, fontSize: '14px' }}>AIU Hub</h4>
              <div className="scicomm-text-muted">University</div>
              <button className="scicomm-btn-secondary" style={{ marginTop: '4px', padding: '4px 12px', fontSize: '12px' }}>+ Follow</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
