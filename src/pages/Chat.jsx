import { useState, useRef, useEffect } from 'react';
import { db, useLiveCollection } from '../db';
import { Send, User, Users, MessageSquare, Smile, Paperclip, X, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Chat() {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [recipient, setRecipient] = useState('global');
  const [showEmojis, setShowEmojis] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const [showContacts, setShowContacts] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const rawMessages = useLiveCollection('messages');
  const scientists = useLiveCollection('scientists');

  const emojis = ['😀','😂','😍','👍','👏','🔬','🧪','✅','❌','🔥','👀','🎉','💡','🚀','💪','❤️','🙏','🤔','😎','⚡'];

  const filteredMessages = rawMessages ? [...rawMessages]
    .filter(msg => {
      if (recipient === 'global') {
        return !msg.receiverId || msg.receiverId === 'global';
      } else {
        return (String(msg.senderId) === String(user.id) && String(msg.receiverId) === String(recipient)) || 
               (String(msg.senderId) === String(recipient) && String(msg.receiverId) === String(user.id));
      }
    })
    .sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) : [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [filteredMessages]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 500 * 1024) {
      alert('File must be less than 500KB for chat uploads.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreview({
        name: file.name,
        type: file.type,
        data: reader.result,
        isImage: file.type.startsWith('image/')
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() && !filePreview) return;
    try {
      const msgData = {
        text: text || '',
        senderId: user.id,
        receiverId: recipient,
        timestamp: new Date().toISOString()
      };

      if (filePreview) {
        msgData.attachment = {
          name: filePreview.name,
          type: filePreview.type,
          data: filePreview.data,
          isImage: filePreview.isImage
        };
      }

      await db.messages.add(msgData);
      setText('');
      setFilePreview(null);
      setShowEmojis(false);
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  const getRecipientName = () => {
    if (recipient === 'global') return '🌐 Global Team Chat';
    const s = scientists?.find(s => String(s.id) === String(recipient));
    return s ? `🔒 ${s.name}` : '🔒 Private Chat';
  };

  if (!rawMessages || !scientists) return <div className="page-content container">Loading chat...</div>;

  return (
    <div style={{ height: 'calc(100vh - 180px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1>💬 Lab Communication</h1>
        <button 
          className="btn btn-secondary" 
          onClick={() => setShowContacts(!showContacts)}
          style={{ display: 'none' }}
          id="mobile-contacts-btn"
        >
          <Users size={16} /> Contacts
        </button>
        <style>{`
          @media (max-width: 768px) {
            #mobile-contacts-btn { display: inline-flex !important; }
          }
        `}</style>
      </div>
      
      <div className="card" style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: 0 }}>
        
        {/* Sidebar */}
        <div style={{ 
          width: '250px', 
          borderRight: '1px solid var(--border-color)', 
          display: 'flex', 
          flexDirection: 'column', 
          backgroundColor: 'white',
          flexShrink: 0
        }}
        className="chat-sidebar"
        >
          <style>{`
            @media (max-width: 768px) {
              .chat-sidebar {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                bottom: 0 !important;
                width: 280px !important;
                z-index: 300 !important;
                box-shadow: 4px 0 20px rgba(0,0,0,0.15) !important;
                transform: translateX(${showContacts ? '0' : '-100%'});
                transition: transform 0.3s ease !important;
              }
            }
          `}</style>
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            📱 Contacts
            <button onClick={() => setShowContacts(false)} style={{ background: 'none', border: 'none', display: 'none' }} className="mobile-close-contacts">
              <X size={18} />
            </button>
            <style>{`
              @media (max-width: 768px) {
                .mobile-close-contacts { display: block !important; }
              }
            `}</style>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div 
              style={{ padding: '0.75rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: recipient === 'global' ? 'var(--secondary)' : 'transparent', borderBottom: '1px solid #f0f0f0', transition: 'background 0.2s' }}
              onClick={() => { setRecipient('global'); setShowContacts(false); }}
            >
              <MessageSquare size={16} style={{ color: 'var(--primary)' }} />
              <strong>🌐 Global Chat</strong>
            </div>
            {scientists.filter(s => String(s.id) !== String(user.id)).map(s => (
              <div 
                key={s.id}
                style={{ padding: '0.75rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: recipient === String(s.id) ? 'var(--secondary)' : 'transparent', borderBottom: '1px solid #f0f0f0', transition: 'background 0.2s' }}
                onClick={() => { setRecipient(String(s.id)); setShowContacts(false); }}
              >
                {s.avatar ? <img src={s.avatar} alt="Avatar" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} /> : <User size={16} />}
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--secondary)' }}>
            <h2 className="card-title" style={{ margin: 0, fontSize: '1rem' }}>{getRecipientName()}</h2>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', backgroundColor: '#fafafa' }}>
            {filteredMessages.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>💬</div>
                No messages yet. Start the conversation!
              </div>
            ) : (
              filteredMessages.map((msg, idx) => {
                const isMine = String(msg.senderId) === String(user.id);
                const sender = scientists.find(s => String(s.id) === String(msg.senderId));
                const showHeader = idx === 0 || String(filteredMessages[idx-1].senderId) !== String(msg.senderId);

                return (
                  <div key={msg.id} style={{ alignSelf: isMine ? 'flex-end' : 'flex-start', maxWidth: '75%', display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                    {showHeader && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px', marginLeft: isMine ? 0 : '4px', marginRight: isMine ? '4px' : 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {!isMine && sender?.avatar && <img src={sender.avatar} alt="Avatar" style={{ width: '14px', height: '14px', borderRadius: '50%', objectFit: 'cover' }} />}
                        {!isMine && !sender?.avatar && <User size={11} />}
                        {isMine ? 'You' : (sender?.name || 'Unknown')}
                      </div>
                    )}
                    <div style={{ 
                      backgroundColor: isMine ? 'var(--primary)' : 'white', 
                      color: isMine ? 'white' : 'var(--text)', 
                      padding: '0.65rem 0.9rem', 
                      borderRadius: isMine ? '16px 16px 0 16px' : '16px 16px 16px 0',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                      wordBreak: 'break-word',
                      maxWidth: '100%'
                    }}>
                      {/* Attachment preview */}
                      {msg.attachment && (
                        <div style={{ marginBottom: msg.text ? '0.5rem' : 0 }}>
                          {msg.attachment.isImage ? (
                            <img 
                              src={msg.attachment.data} 
                              alt={msg.attachment.name} 
                              style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', cursor: 'pointer', objectFit: 'contain' }} 
                              onClick={() => window.open(msg.attachment.data, '_blank')}
                            />
                          ) : (
                            <a 
                              href={msg.attachment.data} 
                              download={msg.attachment.name}
                              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', backgroundColor: isMine ? 'rgba(255,255,255,0.15)' : '#f7f7f7', borderRadius: '6px', color: 'inherit', textDecoration: 'none', fontSize: '0.8rem' }}
                            >
                              <FileText size={16} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.attachment.name}</span>
                            </a>
                          )}
                        </div>
                      )}
                      {msg.text}
                    </div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '3px', alignSelf: isMine ? 'flex-end' : 'flex-start' }}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* File Preview */}
          {filePreview && (
            <div style={{ padding: '0.5rem 1rem', borderTop: '1px solid var(--border-color)', backgroundColor: '#f7fafc', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {filePreview.isImage ? (
                <img src={filePreview.data} alt="Preview" style={{ width: '48px', height: '48px', borderRadius: '6px', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '48px', height: '48px', borderRadius: '6px', backgroundColor: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={20} />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{filePreview.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{filePreview.isImage ? '🖼️ Image' : '📄 File'}</div>
              </div>
              <button onClick={() => setFilePreview(null)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
          )}

          <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border-color)', backgroundColor: 'white', position: 'relative' }}>
            {showEmojis && (
              <div style={{ position: 'absolute', bottom: '100%', left: '1rem', marginBottom: '0.5rem', backgroundColor: 'white', padding: '0.5rem', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', display: 'flex', gap: '0.25rem', border: '1px solid var(--border-color)', flexWrap: 'wrap', maxWidth: '280px' }}>
                {emojis.map(e => (
                  <span key={e} style={{ cursor: 'pointer', fontSize: '1.25rem', padding: '4px', borderRadius: '4px', transition: 'background 0.2s' }} 
                    onMouseEnter={ev => ev.target.style.background = '#f0f0f0'}
                    onMouseLeave={ev => ev.target.style.background = 'transparent'}
                    onClick={() => setText(prev => prev + e)}>{e}</span>
                ))}
              </div>
            )}
            <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button type="button" className="btn btn-secondary" style={{ padding: '0 0.6rem', height: '38px', flexShrink: 0 }} onClick={() => setShowEmojis(!showEmojis)}>
                <Smile size={18} />
              </button>
              <button type="button" className="btn btn-secondary" style={{ padding: '0 0.6rem', height: '38px', flexShrink: 0 }} onClick={() => fileInputRef.current.click()}>
                <Paperclip size={18} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                onChange={handleFileSelect}
                accept="image/*,.pdf,.doc,.docx,.txt,.xlsx,.csv"
              />
              <input 
                type="text" 
                className="form-control" 
                placeholder="Type your message..." 
                value={text} 
                onChange={e => setText(e.target.value)} 
                style={{ flex: 1, height: '38px', padding: '0.5rem 0.75rem' }} 
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '0 1rem', height: '38px', display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
