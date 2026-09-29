import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchSessionMessages, downloadSessionExport } from '../services/adminApi';
import type { Message } from '../types/api';
import StructuredMessage from '../components/chat/StructuredMessage';
import { MessageErrorBoundary } from '../components/chat/MessageErrorBoundary';

const ConversationPage: React.FC = () => {
  const { studentId, sessionId } = useParams<{ studentId: string; sessionId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!studentId || !sessionId) return;
    const load = async () => {
      try {
        const data = await fetchSessionMessages(studentId, sessionId);
        setMessages(data);
      } catch (e: any) {
        setError(e?.response?.data?.detail || 'Failed to load messages');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [studentId, sessionId]);

  const handleDownload = async () => {
    if (!sessionId) return;
    setDownloading(true);
    try {
      await downloadSessionExport(sessionId);
    } catch (e: any) {
      alert('Download failed: ' + (e?.response?.data?.detail || e.message));
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="max-w-3xl mx-auto mt-10 p-4">
      <div className="flex items-center justify-between mb-4">
        <Link
          to={`/admin/logs/${studentId}`}
          className="text-blue-600 hover:underline"
        >
          ← Back to Sessions
        </Link>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          {downloading ? 'Downloading…' : '⬇ Export Session (.xlsx)'}
        </button>
      </div>

      <h2 className="text-2xl font-bold mb-6">Conversation</h2>

      {messages.length === 0 ? (
        <p className="text-gray-500">No messages in this session.</p>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] px-4 py-3 rounded-xl shadow-xs ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                }`}
              >
                <p className="text-xs font-semibold mb-2 opacity-70">
                  {msg.role === 'user' ? 'Student' : 'Tutor'}
                </p>
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <MessageErrorBoundary rawContent={msg.content}>
                    <StructuredMessage content={msg.content} />
                  </MessageErrorBoundary>
                )}
                <p className="text-xs mt-2 opacity-60 text-right">
                  {new Date(msg.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConversationPage;
