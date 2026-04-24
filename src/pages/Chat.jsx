import { useState, useRef, useEffect } from 'react';
import { db, useLiveCollection } from '../db';
import { Send, User, MessageSquare, Smile } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Chat() {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [recipient, setRecipient] = useState('global');
  const [showEmojis, setShowEmojis] = useState(false);
  const messagesEndRef = useRef(null);

  const rawMessages = useLiveCollection('messages');
  const scientists = useLiveCollection('scientists');

  const emojis = ['😀', '👍', '🔬', '🧪', '✅', '❌', '🔥', '👀', '🎉', '💡'];

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

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await db.messages.add({
        text,
        senderId: user.id,
        receiverId: recipient,
        timestamp: new Date().toISOString()
      });
      setText('');
      setShowEmojis(false);
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  const getRecipientName = () => {
    if (recipient === 'global') return 'Global Team Chat';
    const s = scientists?.find(s => String(s.id) === String(recipient));
    return s ? `Private Chat: ${s.name}` : 'Private Chat';
  };

  if (!rawMessages || !scientists) return <div className="page-content container">Loading chat...</div>;

  return (
    <div style={{ height: 'calc(100vh - 180px)', display: 'flex', flexDirection: 'column' }}>
      <h1 style={{ marginBottom: '1rem' }}>Lab Communication</h1>
      
      <div className="card" style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: 0 }}>
        
        {/* Sidebar */}
        <div style={{ width: '250px', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', backgroundColor: 'white' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', fontWeight: 'bold' }}>
            Contacts
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div 
              style={{ padding: '0.75rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: recipient === 'global' ? 'var(--secondary)' : 'transparent', borderBottom: '1px solid #f0f0f0' }}
              onClick={() => setRecipient('global')}
            >
              <MessageSquare size={16} style={{ color: 'var(--primary)' }} />
              <strong>Global Chat</strong>
            </div>
            {scientists.filter(s => String(s.id) !== String(user.id)).map(s => (
              <div 
                key={s.id}
                style={{ padding: '0.75rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: recipient === String(s.id) ? 'var(--secondary)' : 'transparent', borderBottom: '1px solid #f0f0f0' }}
                onClick={() => setRecipient(String(s.id))}
              >
                {s.avatar ? <img src={s.avatar} alt="Avatar" style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} /> : <User size={16} />}
                <span>{s.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--secondary)' }}>
            <h2 className="card-title" style={{ margin: 0 }}>{getRecipientName()}</h2>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: '#fafafa' }}>
            {filteredMessages.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>No messages yet. Start the conversation!</div>
            ) : (
              filteredMessages.map((msg, idx) => {
                const isMine = String(msg.senderId) === String(user.id);
                const sender = scientists.find(s => String(s.id) === String(msg.senderId));
                const showHeader = idx === 0 || String(filteredMessages[idx-1].senderId) !== String(msg.senderId);

                return (
                  <div key={msg.id} style={{ alignSelf: isMine ? 'flex-end' : 'flex-start', maxWidth: '75%', display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                    {showHeader && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', marginLeft: isMine ? 0 : '4px', marginRight: isMine ? '4px' : 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {!isMine && sender?.avatar && <img src={sender.avatar} alt="Avatar" style={{ width: '16px', height: '16px', borderRadius: '50%', objectFit: 'cover' }} />}
                        {!isMine && !sender?.avatar && <User size={12} />}
                        {isMine ? 'You' : (sender?.name || 'Unknown')}
                      </div>
                    )}
                    <div style={{ 
                      backgroundColor: isMine ? 'var(--primary)' : 'white', 
                      color: isMine ? 'white' : 'var(--text)', 
                      padding: '0.75rem 1rem', 
                      borderRadius: isMine ? '18px 18px 0 18px' : '18px 18px 18px 0',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      wordBreak: 'break-word'
                    }}>
                      {msg.text}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px', alignSelf: isMine ? 'flex-end' : 'flex-start' }}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', backgroundColor: 'white', position: 'relative' }}>
            {showEmojis && (
              <div style={{ position: 'absolute', bottom: '100%', left: '1rem', marginBottom: '0.5rem', backgroundColor: 'white', padding: '0.5rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'flex', gap: '0.5rem', border: '1px solid var(--border-color)' }}>
                {emojis.map(e => (
                  <span key={e} style={{ cursor: 'pointer', fontSize: '1.25rem' }} onClick={() => setText(prev => prev + e)}>{e}</span>
                ))}
              </div>
            )}
            <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" className="btn btn-secondary" style={{ padding: '0 0.75rem' }} onClick={() => setShowEmojis(!showEmojis)}>
                <Smile size={18} />
              </button>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Type your message..." 
                value={text} 
                onChange={e => setText(e.target.value)} 
                style={{ flex: 1 }} 
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '0 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Send size={18} /> <span className="hide-mobile">Send</span>
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
