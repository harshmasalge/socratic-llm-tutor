import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getStudentSessions,
  createSession,
  getSessionMessages,
  streamChatMessage,
} from '../services/api';
import type { Session, Message } from '../types/api';
import { PlusCircle, MessageSquare, Send, Loader2, LogOut, Bot } from 'lucide-react';
import StructuredMessage from '../components/chat/StructuredMessage';
import { MessageErrorBoundary } from '../components/chat/MessageErrorBoundary';

export default function StudentChat() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  /** Content of the in-progress streamed assistant reply (not yet in messages[]) */
  const [streamingContent, setStreamingContent] = useState<string | null>(null);

  const studentId = localStorage.getItem('studentId');
  const studentName = localStorage.getItem('studentName');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<boolean>(false);

  const loadSessions = useCallback(async () => {
    if (!studentId) return;
    try {
      const data = await getStudentSessions(studentId);
      setSessions(data);
      if (data.length > 0 && !currentSessionId) {
        setCurrentSessionId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load sessions', err);
    }
  }, [studentId, currentSessionId]);

  const loadMessages = useCallback(async (sessionId: string) => {
    try {
      const data = await getSessionMessages(sessionId);
      setMessages(data);
    } catch (err) {
      console.error('Failed to load messages', err);
    }
  }, []);

  useEffect(() => {
    if (!studentId) {
      navigate('/');
      return;
    }
    loadSessions();
  }, [studentId, navigate, loadSessions]);

  useEffect(() => {
    if (currentSessionId) {
      loadMessages(currentSessionId);
    }
  }, [currentSessionId, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleNewChat = async () => {
    if (!studentId) return;
    try {
      const session = await createSession(studentId);
      setSessions([session, ...sessions]);
      setCurrentSessionId(session.id);
      setMessages([]);
    } catch (err) {
      console.error('Failed to create session', err);
    }
  };

  const handleSendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!inputValue.trim() || !currentSessionId || loading) return;

      const userMessageText = inputValue.trim();
      setInputValue('');

      // Optimistic UI: add user message immediately
      const tempUserMessage: Message = {
        id: Date.now().toString(),
        session_id: currentSessionId,
        role: 'user',
        content: userMessageText,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, tempUserMessage]);
      setLoading(true);
      setStreamingContent('');
      abortRef.current = false;

      try {
        let accumulated = '';

        for await (const chunk of streamChatMessage(currentSessionId, userMessageText)) {
          if (abortRef.current) break;
          accumulated += chunk;
          setStreamingContent(accumulated);
        }

        // Stream done — promote the streamed content to a permanent message
        if (accumulated) {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            session_id: currentSessionId,
            role: 'assistant',
            content: accumulated,
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
        }
      } catch (err) {
        console.error('Streaming failed', err);
        // Optionally fall back here, but for now just log
      } finally {
        setStreamingContent(null);
        setLoading(false);
      }
    },
    [inputValue, currentSessionId, loading],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as unknown as React.FormEvent);
    }
  };

  if (!studentId) return null;

  return (
    <div className="flex h-screen" style={{ background: '#f8f9fc', fontFamily: "'Inter', sans-serif" }}>
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <div
        className="w-64 flex flex-col"
        style={{
          background: 'linear-gradient(180deg, #1a1b2e 0%, #16172a 100%)',
          borderRight: '1px solid #2d2e42',
        }}
      >
        {/* Brand */}
        <div className="px-5 pt-6 pb-4" style={{ borderBottom: '1px solid #2d2e42' }}>
          <div className="flex items-center gap-2.5 mb-1">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              <Bot size={16} color="white" />
            </div>
            <h2 className="text-white font-bold text-base tracking-tight">Socratic Tutor</h2>
          </div>
          <p className="text-xs mt-1 truncate" style={{ color: '#6b7280' }}>
            {studentName}
          </p>
        </div>

        {/* New Chat */}
        <div className="px-4 py-3">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-150"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white',
              boxShadow: '0 2px 8px rgba(99,102,241,0.35)',
            }}
          >
            <PlusCircle size={15} />
            New Chat
          </button>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-0.5">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => setCurrentSessionId(session.id)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left rounded-lg text-sm transition-all duration-150"
              style={{
                background:
                  currentSessionId === session.id ? 'rgba(99,102,241,0.15)' : 'transparent',
                color: currentSessionId === session.id ? '#a5b4fc' : '#6b7280',
                border:
                  currentSessionId === session.id
                    ? '1px solid rgba(99,102,241,0.3)'
                    : '1px solid transparent',
              }}
            >
              <MessageSquare size={14} style={{ flexShrink: 0 }} />
              <span className="truncate leading-tight">
                Chat {new Date(session.started_at).toLocaleDateString()}
              </span>
            </button>
          ))}
        </div>

        {/* Sign out */}
        <div className="px-4 py-4" style={{ borderTop: '1px solid #2d2e42' }}>
          <button
            onClick={() => {
              localStorage.removeItem('studentId');
              localStorage.removeItem('studentName');
              navigate('/');
            }}
            className="flex items-center gap-2 text-xs transition-colors duration-150"
            style={{ color: '#4b5563' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#9ca3af')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#4b5563')}
          >
            <LogOut size={13} />
            Switch User
          </button>
        </div>
      </div>

      {/* ── Main Chat Area ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ padding: '2rem 0', background: '#f8f9fc' }}
        >
          <div className="max-w-3xl mx-auto px-4 space-y-6">
            {messages.length === 0 && !streamingContent ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-24">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                >
                  <Bot size={28} color="white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Ready to start learning?
                </h3>
                <p className="text-gray-500 text-sm max-w-xs">
                  Ask me anything. I'll guide you through with questions, not just answers.
                </p>
              </div>
            ) : (
              <>
                {messages.map((msg, index) => (
                  <MessageBubble key={`${msg.id}-${index}`} message={msg} />
                ))}

                {/* Streaming assistant reply */}
                {streamingContent !== null && (
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                    >
                      <Bot size={15} color="white" />
                    </div>
                    <div
                      className="flex-1 min-w-0 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm"
                      style={{
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        maxWidth: 'calc(100% - 44px)',
                      }}
                    >
                      {streamingContent === '' ? (
                        /* Typing indicator */
                        <div className="flex items-center gap-1.5 py-1">
                          <span
                            className="block w-2 h-2 rounded-full"
                            style={{
                              background: '#6366f1',
                              animation: 'pulse 1.2s ease-in-out infinite',
                            }}
                          />
                          <span
                            className="block w-2 h-2 rounded-full"
                            style={{
                              background: '#6366f1',
                              animation: 'pulse 1.2s ease-in-out 0.4s infinite',
                            }}
                          />
                          <span
                            className="block w-2 h-2 rounded-full"
                            style={{
                              background: '#6366f1',
                              animation: 'pulse 1.2s ease-in-out 0.8s infinite',
                            }}
                          />
                        </div>
                      ) : (
                        <MessageErrorBoundary rawContent={streamingContent}>
                          <StructuredMessage content={streamingContent} />
                        </MessageErrorBoundary>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div
          className="px-4 py-4"
          style={{
            background: 'white',
            borderTop: '1px solid #e5e7eb',
            boxShadow: '0 -4px 16px rgba(0,0,0,0.04)',
          }}
        >
          <form
            onSubmit={handleSendMessage}
            className="max-w-3xl mx-auto relative"
          >
            <textarea
              rows={1}
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                // auto-grow
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 180) + 'px';
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything… (Shift+Enter for new line)"
              disabled={!currentSessionId || loading}
              className="w-full pl-5 pr-14 py-3.5 rounded-2xl resize-none overflow-hidden text-sm transition-all duration-150 disabled:opacity-50"
              style={{
                border: '1.5px solid #d1d5db',
                outline: 'none',
                lineHeight: '1.6',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                fontFamily: 'inherit',
                background: '#fafafa',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#6366f1')}
              onBlur={(e) => (e.target.style.borderColor = '#d1d5db')}
            />

            <button
              type="submit"
              disabled={!inputValue.trim() || !currentSessionId || loading}
              className="absolute right-3 bottom-3 w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: loading
                  ? '#e0e0e0'
                  : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                boxShadow: '0 2px 6px rgba(99,102,241,0.3)',
              }}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin text-gray-500" />
              ) : (
                <Send size={16} color="white" />
              )}
            </button>
          </form>
          <p className="text-center text-xs text-gray-400 mt-2">
            AI can make mistakes. Use your own judgment.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Individual message bubble ─────────────────────────────────────────────── */
interface MessageBubbleProps {
  message: Message;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[75%] px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: 'white',
            boxShadow: '0 2px 8px rgba(99,102,241,0.25)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  // Assistant message — structured rendering
  return (
    <div className="flex items-start gap-3">
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
      >
        <Bot size={15} color="white" />
      </div>
      <div
        className="flex-1 min-w-0 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm"
        style={{
          background: 'white',
          border: '1px solid #e5e7eb',
          maxWidth: 'calc(100% - 44px)',
        }}
      >
        <MessageErrorBoundary rawContent={message.content}>
          <StructuredMessage content={message.content} />
        </MessageErrorBoundary>
      </div>
    </div>
  );
}
