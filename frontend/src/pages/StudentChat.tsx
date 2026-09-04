import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStudentSessions, createSession, getSessionMessages, sendChatMessage } from '../services/api';
import type { Session, Message } from '../types/api';
import { PlusCircle, MessageSquare, Send, Loader2 } from 'lucide-react';

export default function StudentChat() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  
  const studentId = localStorage.getItem('studentId');
  const studentName = localStorage.getItem('studentName');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!studentId) {
      navigate('/');
      return;
    }
    loadSessions();
  }, [studentId]);

  useEffect(() => {
    if (currentSessionId) {
      loadMessages(currentSessionId);
    }
  }, [currentSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadSessions = async () => {
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
  };

  const loadMessages = async (sessionId: string) => {
    try {
      const data = await getSessionMessages(sessionId);
      setMessages(data);
    } catch (err) {
      console.error('Failed to load messages', err);
    }
  };

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !currentSessionId || loading) return;

    const userMessageText = inputValue.trim();
    setInputValue('');
    
    // Optimistic UI update
    const tempUserMessage: Message = {
      id: Date.now().toString(),
      session_id: currentSessionId,
      role: 'user',
      content: userMessageText,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, tempUserMessage]);
    setLoading(true);

    try {
      const response = await sendChatMessage(currentSessionId, userMessageText);
      
      const tempAiMessage: Message = {
        id: (Date.now() + 1).toString(),
        session_id: currentSessionId,
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, tempAiMessage]);
    } catch (err) {
      console.error('Failed to send message', err);
      // In a real app we'd show an error or retry button
    } finally {
      setLoading(false);
    }
  };

  if (!studentId) return null;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">Socratic Tutor</h2>
          <p className="text-sm text-gray-400 mt-1">Welcome, {studentName}</p>
        </div>
        
        <div className="p-4">
          <button 
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            <PlusCircle size={18} />
            New Chat
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-2">
          {sessions.map(session => (
            <button
              key={session.id}
              onClick={() => setCurrentSessionId(session.id)}
              className={`w-full flex items-center gap-3 p-3 mb-1 text-left rounded-md transition-colors ${currentSessionId === session.id ? 'bg-gray-800' : 'hover:bg-gray-800'}`}
            >
              <MessageSquare size={16} className="text-gray-400" />
              <div className="truncate text-sm">
                Chat {new Date(session.started_at).toLocaleDateString()}
              </div>
            </button>
          ))}
        </div>
        
        <div className="p-4 border-t border-gray-700">
          <button 
            onClick={() => {
              localStorage.removeItem('studentId');
              localStorage.removeItem('studentName');
              navigate('/');
            }}
            className="text-sm text-gray-400 hover:text-white"
          >
            Switch User
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <MessageSquare size={48} className="mb-4 text-gray-300" />
              <p>Start a conversation to begin learning.</p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[70%] rounded-lg px-4 py-3 ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-br-none' 
                      : 'bg-gray-100 text-gray-800 rounded-bl-none'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg rounded-bl-none px-4 py-3 text-gray-500 flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t bg-gray-50">
          <form 
            onSubmit={handleSendMessage}
            className="max-w-4xl mx-auto relative flex items-center"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message..."
              disabled={!currentSessionId || loading}
              className="w-full pl-4 pr-12 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-200"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || !currentSessionId || loading}
              className="absolute right-2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
