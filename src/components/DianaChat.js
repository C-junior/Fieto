'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, Trash2 } from 'lucide-react';

export default function DianaChat({ messages, loading, sendMessage, clearChat }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    sendMessage(input);
    setInput('');
  };

  const handleQuickQuestion = (question) => {
    if (loading) return;
    sendMessage(question);
  };

  return (
    <div className="chat-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '520px' }}>
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(15, 22, 41, 0.4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="metric-icon metric-icon-cyan" style={{ width: '32px', height: '32px', borderRadius: '8px' }}>
            <Bot size={16} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>Conversar com Diana</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-green)', display: 'inline-block' }}></span>
              Online e Monitorando
            </div>
          </div>
        </div>
        {messages.length > 1 && (
          <button
            className="btn btn-ghost btn-sm btn-icon"
            onClick={clearChat}
            title="Limpar conversa"
            style={{ padding: 0, width: '32px', height: '32px' }}
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="chat-messages" style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
        {messages.map((msg, index) => (
          <div
            key={msg.id || index}
            className={`chat-bubble ${
              msg.papel === 'user' ? 'chat-bubble-user' : 'chat-bubble-diana'
            } animate-fade-in`}
          >
            {msg.conteudo}
          </div>
        ))}
        {loading && (
          <div className="chat-bubble chat-bubble-diana" style={{ opacity: 0.8 }}>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '4px 0' }}>
              <span className="spinner" style={{ width: '12px', height: '12px', borderWidth: '2px' }}></span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Diana está analisando...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestions (quando chat está com poucas msgs) */}
      {messages.length <= 1 && (
        <div style={{ padding: '0 20px 10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => handleQuickQuestion('O que está mais perto de vencer hoje?')}
            style={{ fontSize: '0.75rem', padding: '6px 12px' }}
          >
            ⏰ Validades Críticas
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => handleQuickQuestion('Como posso reaproveitar pão amanhecido?')}
            style={{ fontSize: '0.75rem', padding: '6px 12px' }}
          >
            🍞 Reaproveitamento de Pão
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => handleQuickQuestion('Qual a previsão de demanda para amanhã?')}
            style={{ fontSize: '0.75rem', padding: '6px 12px' }}
          >
            📊 Demanda de Amanhã
          </button>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="chat-input-area">
        <input
          type="text"
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pergunte sobre estoque, demanda ou reaproveitamento..."
          disabled={loading}
        />
        <button type="submit" className="chat-send-btn" disabled={!input.trim() || loading}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
