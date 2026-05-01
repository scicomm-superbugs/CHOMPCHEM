import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLiveCollection, db, uploadFile } from '../db';
import { Heart, MessageCircle, Share2, Bookmark, Play, Plus, UserCircle, Star, Upload } from 'lucide-react';
import { AVATARS } from './scicommConstants';

export default function SciCommReels() {
  const { user } = useAuth();
  const reelsRaw = useLiveCollection('scicomm_reels') || [];
  const scientists = useLiveCollection('scientists') || [];
  const recognitions = useLiveCollection('scicomm_recognitions') || [];
  
  const [showUpload, setShowUpload] = useState(false);
  const [newReel, setNewReel] = useState({ caption: '', tags: '' });
  const [videoFile, setVideoFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeReelIndex, setActiveReelIndex] = useState(0);
  const containerRef = useRef(null);

  // Filter out any broken reels, sort by date
  const reels = [...reelsRaw].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const featuredReelId = recognitions.find(r => r.type === 'featured_reel')?.targetId;

  // Scroll snapping observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = Number(entry.target.dataset.index);
          setActiveReelIndex(index);
          // Auto-play logic could go here if we had real videos
          const video = entry.target.querySelector('video');
          if (video) video.play().catch(()=>{});
        } else {
          const video = entry.target.querySelector('video');
          if (video) video.pause();
        }
      });
    }, { threshold: 0.6 });

    const children = container.querySelectorAll('.reel-item');
    children.forEach(child => observer.observe(child));

    return () => observer.disconnect();
  }, [reels.length]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!videoFile) return;
    setIsUploading(true);
    setUploadProgress(10);
    try {
      const fileName = `reels/${Date.now()}_${videoFile.name}`;
      setUploadProgress(40);
      const videoUrl = await uploadFile(videoFile, fileName);
      setUploadProgress(90);

      await db.scicomm_reels.add({
        videoUrl,
        caption: newReel.caption,
        tags: newReel.tags,
        authorId: user.id,
        authorName: user.name,
        createdAt: new Date().toISOString(),
        likes: [],
        saves: [],
        comments: []
      });
      setShowUpload(false);
      setNewReel({ caption: '', tags: '' });
      setVideoFile(null);
    } catch (err) {
      console.error(err);
      alert('Upload failed: ' + err.message);
    }
    setIsUploading(false);
    setUploadProgress(0);
  };

  const toggleLike = async (reel) => {
    const likes = reel.likes || [];
    const newLikes = likes.includes(user.id) ? likes.filter(id => id !== user.id) : [...likes, user.id];
    await db.scicomm_reels.update(reel.id, { likes: newLikes });
  };

  const toggleSave = async (reel) => {
    const saves = reel.saves || [];
    const newSaves = saves.includes(user.id) ? saves.filter(id => id !== user.id) : [...saves, user.id];
    await db.scicomm_reels.update(reel.id, { saves: newSaves });
  };

  const getAvatar = (authorId) => {
    const member = scientists.find(s => String(s.id) === String(authorId));
    if (member?.avatar) return <img src={member.avatar} alt="" style={{width: 40, height: 40, borderRadius: '50%', objectFit: 'cover'}}/>;
    const av = AVATARS.find(a => a.id === member?.avatarId);
    if (av) return <div style={{width: 40, height: 40, borderRadius: '50%', background: av.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20}}>{av.svg}</div>;
    return <div style={{width: 40, height: 40, borderRadius: '50%', background: '#eef3f8', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><UserCircle size={24} color="#666"/></div>;
  };

  return (
    <div style={{ height: 'calc(100dvh - 52px)', background: '#111', display: 'flex', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      
      {/* Upload Button */}
      <button onClick={() => setShowUpload(true)} style={{ position: 'absolute', top: 20, right: 20, zIndex: 50, background: '#10b981', color: 'white', border: 'none', borderRadius: '24px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
        <Plus size={18} /> Upload Reel
      </button>

      {/* Upload Modal */}
      {showUpload && (
        <div style={{ position: 'absolute', top:0, left:0, right:0, bottom:0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={()=>setShowUpload(false)}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '400px' }} onClick={e=>e.stopPropagation()}>
            <h2 style={{ margin: '0 0 16px', color: '#111' }}>Upload Science Reel</h2>
            <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* File Input */}
              <div style={{ border: '2px dashed #ccc', padding: '20px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', background: '#f9fafb' }} onClick={() => document.getElementById('reel-upload').click()}>
                <Upload size={24} color="#666" style={{ marginBottom: '8px' }} />
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#333' }}>{videoFile ? videoFile.name : 'Select Video File'}</div>
                <div style={{ fontSize: '12px', color: '#999' }}>MP4, WebM (Max 50MB)</div>
                <input id="reel-upload" type="file" accept="video/mp4,video/webm,video/quicktime" onChange={e => setVideoFile(e.target.files[0])} style={{ display: 'none' }} />
              </div>

              <textarea placeholder="Caption your discovery..." value={newReel.caption} onChange={e=>setNewReel({...newReel, caption: e.target.value})} required rows={3} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd', resize: 'vertical' }} />
              <input type="text" placeholder="Tags (e.g. #biology #lab)" value={newReel.tags} onChange={e=>setNewReel({...newReel, tags: e.target.value})} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
              
              {isUploading ? (
                <div style={{ background: '#eef3f8', borderRadius: '8px', height: '8px', overflow: 'hidden', marginTop: '8px' }}>
                  <div style={{ background: '#10b981', height: '100%', width: `${uploadProgress}%`, transition: 'width 0.3s' }} />
                </div>
              ) : (
                <button type="submit" className="scicomm-btn-primary" style={{ padding: '12px', justifyContent: 'center', marginTop: '8px' }} disabled={!videoFile}>Publish Reel</button>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Reels Container */}
      <div ref={containerRef} style={{ width: '100%', maxWidth: '450px', height: '100%', overflowY: 'scroll', scrollSnapType: 'y mandatory', scrollBehavior: 'smooth', msOverflowStyle: 'none', scrollbarWidth: 'none' }} className="reels-container">
        <style>{`.reels-container::-webkit-scrollbar { display: none; }`}</style>

        {reels.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <Play size={48} color="#666" style={{ marginBottom: '16px' }} />
            <h3>No Reels Yet</h3>
            <p style={{ color: '#aaa' }}>Be the first to share a science reel!</p>
          </div>
        ) : reels.map((reel, index) => {
          const isLiked = (reel.likes || []).includes(user.id);
          const isSaved = (reel.saves || []).includes(user.id);
          const isFeatured = reel.id === featuredReelId;

          return (
            <div key={reel.id} data-index={index} className="reel-item" style={{ width: '100%', height: '100%', scrollSnapAlign: 'start', position: 'relative', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              
              {/* Video Element */}
              <video src={reel.videoUrl} loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} onClick={e => e.target.paused ? e.target.play() : e.target.pause()} />

              {/* Overlay Details */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 16px', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                
                {/* Left Side: Author & Caption */}
                <div style={{ flex: 1, paddingRight: '20px' }}>
                  {isFeatured && <div style={{ background: 'linear-gradient(90deg, #fbbf24, #f59e0b)', color: '#000', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}><Star size={12}/> REEL OF THE WEEK</div>}
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    {getAvatar(reel.authorId)}
                    <span style={{ fontWeight: 600, fontSize: '15px' }}>{reel.authorName}</span>
                  </div>
                  <p style={{ margin: '0 0 6px', fontSize: '14px', lineHeight: '1.4' }}>{reel.caption}</p>
                  {reel.tags && <div style={{ color: '#10b981', fontSize: '14px', fontWeight: 600 }}>{reel.tags}</div>}
                </div>

                {/* Right Side: Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', paddingBottom: '10px' }}>
                  <button onClick={() => toggleLike(reel)} style={{ background: 'none', border: 'none', color: isLiked ? '#ef4444' : 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
                    <Heart size={28} fill={isLiked ? '#ef4444' : 'none'} />
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>{(reel.likes || []).length}</span>
                  </button>

                  <button style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
                    <MessageCircle size={28} />
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>{(reel.comments || []).length}</span>
                  </button>

                  <button onClick={() => toggleSave(reel)} style={{ background: 'none', border: 'none', color: isSaved ? '#10b981' : 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
                    <Bookmark size={28} fill={isSaved ? '#10b981' : 'none'} />
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>{(reel.saves || []).length}</span>
                  </button>

                  <button style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
                    <Share2 size={28} />
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>Share</span>
                  </button>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
