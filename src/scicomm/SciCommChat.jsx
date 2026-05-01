import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLiveCollection, db } from '../db';
import { Send, Plus, UserCircle, Users, Search } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { AVATARS, timeAgo } from './scicommConstants';

export default function SciCommChat() {
  const { user } = useAuth();
  const scientists = useLiveCollection('scientists') || [];
  const rooms = useLiveCollection('scicomm_chat_rooms') || [];
  const allMessages = useLiveCollection('scicomm_chat_messages') || [];
  const connections = useLiveCollection('scicomm_connections') || [];
  const [searchParams] = useSearchParams();

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [msgText, setMsgText] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const messagesEnd = useRef(null);

  // Auto-open chat if ?with= param
  useEffect(() => {
    const withId = searchParams.get('with');
    if (withId && rooms.length > 0) {
      const existing = rooms.find(r => r.type === 'private' && r.members?.includes(user.id) && r.members?.includes(withId));
      if (existing) setSelectedRoom(existing.id);
      else {
        const other = scientists.find(s => String(s.id) === String(withId));
        if (other) {
          createPrivateRoom(withId, other.name);
        }
      }
    }
  }, [searchParams.get('with'), rooms.length]);

  const renderAvatar = (member, size = 40) => {
    if (!member) return <div style={{ width: size, height: size, borderRadius: '50%', background: '#eef3f8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><UserCircle size={size * 0.6} color="#666" /></div>;
    if (member.avatar) return <img src={member.avatar} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
    const av = AVATARS.find(a => a.id === member.avatarId);
    if (av) return <div style={{ width: size, height: size, borderRadius: '50%', background: av.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.45, flexShrink: 0 }}>{av.svg}</div>;
    return <div style={{ width: size, height: size, borderRadius: '50%', background: '#eef3f8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><UserCircle size={size * 0.6} color="#666" /></div>;
  };

  // Rooms I'm in
  const myRooms = rooms.filter(r => (r.members || []).includes(user.id)).sort((a, b) => new Date(b.lastMessageAt || b.createdAt || 0).getTime() - new Date(a.lastMessageAt || a.createdAt || 0).getTime());

  // Messages for selected room
  const roomMessages = allMessages.filter(m => m.roomId === selectedRoom).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [roomMessages.length, selectedRoom]);

  const createPrivateRoom = async (otherId, otherName) => {
    const existing = rooms.find(r => r.type === 'private' && r.members?.includes(user.id) && r.members?.includes(otherId));
    if (existing) { setSelectedRoom(existing.id); return; }
    const roomId = await db.scicomm_chat_rooms.add({
      type: 'private',
      members: [user.id, otherId],
      memberNames: { [user.id]: user.name, [otherId]: otherName },
      createdAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString()
    });
    setSelectedRoom(roomId);
    setShowNewChat(false);
  };

  const createGroupRoom = async () => {
    if (!newGroupName.trim() || selectedMembers.length === 0) return;
    const memberNames = { [user.id]: user.name };
    selectedMembers.forEach(id => {
      const m = scientists.find(s => String(s.id) === String(id));
      if (m) memberNames[id] = m.name;
    });
    const roomId = await db.scicomm_chat_rooms.add({
      type: 'group',
      name: newGroupName,
      members: [user.id, ...selectedMembers],
      memberNames,
      createdAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString()
    });
    setSelectedRoom(roomId);
    setShowNewChat(false);
    setNewGroupName('');
    setSelectedMembers([]);
  };

  const sendMessage = async () => {
    if (!msgText.trim() || !selectedRoom) return;
    await db.scicomm_chat_messages.add({
      roomId: selectedRoom,
      senderId: user.id,
      senderName: user.name,
      content: msgText,
      createdAt: new Date().toISOString()
    });
    await db.scicomm_chat_rooms.update(selectedRoom, { lastMessageAt: new Date().toISOString(), lastMessage: msgText, lastSender: user.name });
    setMsgText('');
  };

  const getRoomTitle = (room) => {
    if (room.type === 'group') return room.name || 'Group Chat';
    const otherId = (room.members || []).find(id => id !== user.id);
    return room.memberNames?.[otherId] || 'Chat';
  };

  const getRoomOther = (room) => {
    if (room.type === 'group') return null;
    const otherId = (room.members || []).find(id => id !== user.id);
    return scientists.find(s => String(s.id) === String(otherId));
  };

  const activeRoom = rooms.find(r => r.id === selectedRoom);

  // Connected members for new chat
  const myConnectedIds = new Set();
  connections.filter(c => c.status === 'accepted' && (String(c.fromId) === String(user.id) || String(c.toId) === String(user.id))).forEach(c => {
    myConnectedIds.add(String(c.fromId));
    myConnectedIds.add(String(c.toId));
  });
  myConnectedIds.delete(String(user.id));
  const connectedMembers = scientists.filter(s => myConnectedIds.has(String(s.id)));

  return (
    <div style={{ display: 'flex', height: 'calc(100dvh - 100px)', maxWidth: '900px', margin: '0 auto', gap: '0', overflow: 'hidden', borderRadius: '8px', border: '1px solid #e0dfdc', background: 'white' }}>
      {/* Room List */}
      <div style={{ width: '280px', borderRight: '1px solid #e0dfdc', display: 'flex', flexDirection: 'column', flexShrink: 0 }} className="scicomm-chat-sidebar">
        <div style={{ padding: '12px', borderBottom: '1px solid #e0dfdc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>💬 Messaging</h3>
          <button onClick={() => setShowNewChat(!showNewChat)} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={16} /></button>
        </div>

        {showNewChat && (
          <div style={{ padding: '12px', borderBottom: '1px solid #e0dfdc', background: '#f9fafb' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>New Chat</div>
            {connectedMembers.map(m => (
              <div key={m.id} onClick={() => createPrivateRoom(m.id, m.name)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px', cursor: 'pointer', borderRadius: '6px' }}
                onMouseEnter={e => e.currentTarget.style.background = '#eef3f8'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                {renderAvatar(m, 28)}
                <span style={{ fontSize: '13px' }}>{m.name}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid #e0dfdc', marginTop: '8px', paddingTop: '8px' }}>
              <input type="text" placeholder="Group name..." value={newGroupName} onChange={e => setNewGroupName(e.target.value)} style={{ width: '100%', padding: '6px 8px', border: '1px solid #e0dfdc', borderRadius: '6px', fontSize: '13px', marginBottom: '6px', boxSizing: 'border-box' }} />
              {connectedMembers.map(m => (
                <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', marginBottom: '4px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={selectedMembers.includes(m.id)} onChange={e => setSelectedMembers(e.target.checked ? [...selectedMembers, m.id] : selectedMembers.filter(id => id !== m.id))} />
                  {m.name}
                </label>
              ))}
              <button className="scicomm-btn-primary" onClick={createGroupRoom} style={{ width: '100%', padding: '6px', fontSize: '12px', marginTop: '6px', justifyContent: 'center' }}>Create Group</button>
            </div>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {myRooms.map(r => (
            <div key={r.id} onClick={() => setSelectedRoom(r.id)} style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', cursor: 'pointer',
              background: selectedRoom === r.id ? '#eef3f8' : 'transparent', borderBottom: '1px solid #f3f2ef'
            }}>
              {r.type === 'group' ? <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Users size={20} color="#10b981" /></div> : renderAvatar(getRoomOther(r), 40)}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getRoomTitle(r)}</div>
                <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.lastSender ? `${r.lastSender}: ${r.lastMessage || ''}` : 'No messages yet'}</div>
              </div>
            </div>
          ))}
          {myRooms.length === 0 && <div style={{ padding: '24px', textAlign: 'center', color: '#666', fontSize: '13px' }}>No conversations yet. Connect with team members to start chatting!</div>}
        </div>
      </div>

      {/* Chat Panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {selectedRoom && activeRoom ? (
          <>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e0dfdc', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {activeRoom.type === 'group' ? <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={18} color="#10b981" /></div> : renderAvatar(getRoomOther(activeRoom), 36)}
              <div>
                <div style={{ fontWeight: 600, fontSize: '15px' }}>{getRoomTitle(activeRoom)}</div>
                {activeRoom.type === 'group' && <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.5)' }}>{(activeRoom.members || []).length} members</div>}
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: '#f9fafb' }}>
              {roomMessages.map(m => {
                const isMe = m.senderId === user.id;
                return (
                  <div key={m.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: '8px' }}>
                    <div style={{
                      maxWidth: '70%', padding: '10px 14px', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: isMe ? '#10b981' : 'white', color: isMe ? 'white' : 'rgba(0,0,0,0.9)',
                      border: isMe ? 'none' : '1px solid #e0dfdc', fontSize: '14px', lineHeight: '1.4'
                    }}>
                      {!isMe && activeRoom.type === 'group' && <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: '#10b981' }}>{m.senderName}</div>}
                      {m.content}
                      <div style={{ fontSize: '10px', marginTop: '4px', opacity: 0.7, textAlign: 'right' }}>{timeAgo(m.createdAt)}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEnd} />
            </div>
            <div style={{ display: 'flex', gap: '8px', padding: '12px 16px', borderTop: '1px solid #e0dfdc' }}>
              <input type="text" value={msgText} onChange={e => setMsgText(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..." style={{ flex: 1, padding: '10px 14px', border: '1px solid #e0dfdc', borderRadius: '24px', fontSize: '14px', outline: 'none' }} />
              <button className="scicomm-btn-primary" onClick={sendMessage} style={{ padding: '10px 16px' }}><Send size={16} /></button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#666' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>💬</div>
            <h3 style={{ margin: '0 0 8px' }}>Select a conversation</h3>
            <p style={{ fontSize: '14px' }}>Or start a new chat with the + button</p>
          </div>
        )}
      </div>
    </div>
  );
}
