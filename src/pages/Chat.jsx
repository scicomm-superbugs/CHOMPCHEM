import { useState, useRef, useEffect } from 'react';
import { db, useLiveCollection } from '../db';
import { Send, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Chat() {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const messagesEndRef = useRef(null);

  const rawMessages = useLiveCollection('messages');
  const scientists = useLiveCollection('scientists');

  const messages = rawMessages ? [...rawMessages].sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) : [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await db.messages.add({
        text,
        senderId: user.id,
        timestamp: new Date().toISOString()
      });
      setText('');
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  if (!rawMessages || !scientists) return <div className="page-content container">Loading chat...</div>;

  return (
    <div style={{ height: 'calc(100vh - 180px)', display: 'flex', flexDirection: 'column' }}>
      <h1 style={{ marginBottom: '1rem' }}>Lab Communication</h1>
      
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--secondary)' }}>
          <h2 className="card-title" style={{ margin: 0 }}>Global Team Chat</h2>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: '#fafafa' }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>No messages yet. Start the conversation!</div>
          ) : (
            messages.map((msg, idx) => {
              const isMine = String(msg.senderId) === String(user.id);
              const sender = scientists.find(s => String(s.id) === String(msg.senderId));
              const showHeader = idx === 0 || String(messages[idx-1].senderId) !== String(msg.senderId);

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
        
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', backgroundColor: 'white' }}>
          <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.5rem' }}>
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
  );
}
