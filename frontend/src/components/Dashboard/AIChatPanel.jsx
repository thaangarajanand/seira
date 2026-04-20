import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Loader2, Zap } from 'lucide-react';

const AIChatPanel = ({ onClose, API }) => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your SEIRA AI Assistant. How can I help you with your manufacturing or sourcing needs today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/ai/chat`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] })
      });

      if (!res.ok) throw new Error('AI Assistant is currently unavailable');
      
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-chat-panel glass" style={{
      position: 'fixed',
      bottom: 100,
      right: 30,
      width: '380px',
      maxHeight: '600px',
      height: '70vh',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1001,
      borderRadius: '24px',
      boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
      overflow: 'hidden',
      border: '1px solid var(--teal-200)',
      animation: 'slideUp 0.3s ease-out'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        background: 'linear-gradient(135deg, var(--teal-600), var(--teal-700))',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Zap size={20} fill="#fff" />
          <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>SEIRA AI Assistant</span>
        </div>
        <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.8)', background: 'none', border: 'none', cursor: 'pointer' }}>
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        background: 'rgba(255,255,255,0.8)'
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            gap: 10,
            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
            alignItems: 'flex-start'
          }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: msg.role === 'user' ? 'var(--slate-100)' : 'var(--teal-100)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} color="var(--teal-600)" />}
            </div>
            <div style={{
              maxWidth: '80%',
              padding: '12px 16px',
              borderRadius: '16px',
              borderTopRightRadius: msg.role === 'user' ? '4px' : '16px',
              borderTopLeftRadius: msg.role === 'assistant' ? '4px' : '16px',
              background: msg.role === 'user' ? 'var(--teal-600)' : '#fff',
              color: msg.role === 'user' ? '#fff' : 'var(--slate-800)',
              fontSize: '0.875rem',
              lineHeight: 1.5,
              boxShadow: 'var(--shadow-sm)',
              border: msg.role === 'assistant' ? '1px solid var(--slate-100)' : 'none',
              whiteSpace: 'pre-wrap'
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--teal-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bot size={16} color="var(--teal-600)" />
            </div>
            <div style={{ background: '#fff', padding: '12px 16px', borderRadius: '16px', borderTopLeftRadius: '4px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--slate-100)' }}>
              <Loader2 size={16} className="animate-spin" color="var(--teal-600)" />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '16px', background: '#fff', borderTop: '1px solid var(--slate-100)' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            className="form-input"
            placeholder="Ask about materials, specs, or sourcing..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSend()}
            style={{ borderRadius: '12px', fontSize: '0.875rem' }}
          />
          <button 
            className="btn-primary" 
            onClick={handleSend}
            disabled={loading}
            style={{ width: 42, height: 42, borderRadius: '12px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            <Send size={18} />
          </button>
        </div>
        <p style={{ fontSize: '0.65rem', color: 'var(--slate-400)', marginTop: 8, textAlign: 'center' }}>
          Powered by Groq Llama 3 • Industrial Intelligence
        </p>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
};

export default AIChatPanel;
