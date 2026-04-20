import React from 'react';
import { X, Mic, MicOff, Send, Globe } from 'lucide-react';

const ChatPanel = ({ selectedOrder, messages, user, newMessage, setNewMessage, sendMessage, toggleRecording, isRecording, chatLang, handleLanguageChange, messagesEndRef, setShowChat }) => {
  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div>
          <p className="chat-title">💬 #{selectedOrder._id.slice(-6).toUpperCase()}</p>
          <p style={{ fontSize: '.7rem', color: 'var(--slate-500)' }}>Industrial Project Correspondence</p>
        </div>
        <button className="chat-close" onClick={() => setShowChat(false)}><X size={18}/></button>
      </div>

      <div className="chat-messages" style={{ background: 'var(--slate-50)' }}>
         {messages.length === 0 ? (
           <p style={{ fontSize: '.8rem', color: 'var(--slate-400)', textAlign: 'center', marginTop: 32 }}>No messages yet. Start the discussion.</p>
         ) : messages.map((msg, i) => {
           const isMe = String(msg.sender?._id || msg.sender) === String(user.id);
           const showTranslation = !isMe && msg.translation;
           
           return (
             <div key={i} className={`msg ${isMe ? 'mine' : 'theirs'}`}>
               {!isMe && <p className="msg-sender">{msg.sender?.name || 'Partner'}</p>}
               <div className="msg-bubble" style={{ boxShadow: 'var(--shadow-sm)' }}>
                 {msg.audioUrl ? (
                    <audio src={msg.audioUrl} controls style={{ width: 180, height: 40 }} />
                 ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {showTranslation ? (
                        <>
                          <span style={{ fontSize: '.9rem' }}>{msg.translation}</span>
                          <span style={{ fontSize: '.7rem', opacity: 0.6, marginTop: 4, borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: 2 }}>Original: {msg.text}</span>
                        </>
                      ) : (
                        <span>{msg.text}</span>
                      )}
                    </div>
                 )}
               </div>
             </div>
           );
         })}
         <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-row" style={{ padding: '12px 16px', background: '#fff', borderTop: '1px solid var(--slate-100)' }}>
        <div style={{ position: 'relative' }}>
          <select 
            value={user.preferredLanguage || chatLang} 
            onChange={e => handleLanguageChange(e.target.value)}
            style={{ appearance: 'none', border: 'none', background: 'var(--slate-100)', padding: '6px 20px 6px 10px', borderRadius: 4, fontSize: '.75rem', fontWeight: 600, color: 'var(--slate-600)', cursor: 'pointer' }}
          >
            <option value="en">ENG</option>
            <option value="ta">TAM</option>
            <option value="hi">HIN</option>
          </select>
          <Globe size={11} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--slate-400)' }}/>
        </div>
        
        <button className={`btn-icon ${isRecording ? 'recording' : ''}`} onClick={toggleRecording} style={{ color: isRecording ? 'var(--red-500)' : 'var(--slate-400)', margin: '0 8px' }}>
          {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
        </button>
        
        <input 
          className="chat-input" 
          placeholder="Type message..." 
          value={newMessage} 
          onChange={e=>setNewMessage(e.target.value)} 
          onKeyPress={e => e.key === 'Enter' && sendMessage()} 
          style={{ flex: 1 }}
        />
        
        <button className="btn-send" onClick={sendMessage} style={{ marginLeft: 8 }}><Send size={18}/></button>
      </div>
    </div>
  );
};

export default ChatPanel;
