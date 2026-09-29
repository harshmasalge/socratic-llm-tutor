import axios from 'axios';
import type { Student, Session, Message, ChatResponse } from '../types/api';

const rawUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
export const API_BASE_URL = `${rawUrl.replace(/\/+$/, '').replace(/\/api$/, '')}/api`;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const createOrGetStudent = async (name: string, roll_no: string): Promise<Student> => {
  const response = await apiClient.post<Student>('/students/', { name, roll_no });
  return response.data;
};

export const getStudentSessions = async (studentId: string): Promise<Session[]> => {
  const response = await apiClient.get<Session[]>(`/sessions/student/${studentId}`);
  return response.data;
};

export const createSession = async (studentId: string): Promise<Session> => {
  const response = await apiClient.post<Session>('/sessions/', { student_id: studentId });
  return response.data;
};

export const getSessionMessages = async (sessionId: string): Promise<Message[]> => {
  const response = await apiClient.get<Message[]>(`/chat/session/${sessionId}`);
  return response.data;
};

export const sendChatMessage = async (sessionId: string, message: string): Promise<ChatResponse> => {
  const response = await apiClient.post<ChatResponse>('/chat/', { session_id: sessionId, message });
  return response.data;
};

/**
 * Streams the LLM response via Server-Sent Events.
 * Yields string chunks as they arrive from the `/api/chat/stream` endpoint.
 * Uses the native fetch API (not axios) because axios does not expose streaming.
 *
 * SSE event format emitted by the backend:
 *   data: {"type": "chunk", "content": "<token>"}
 *   data: {"type": "done"}
 *   data: {"type": "error", "message": "..."}
 */
export async function* streamChatMessage(
  sessionId: string,
  message: string,
): AsyncGenerator<string, void, unknown> {
  const response = await fetch(`${API_BASE_URL}/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, message }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Stream request failed (${response.status}): ${text}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No readable stream in response');

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE lines are separated by \n\n; each line starts with "data: "
      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? ''; // keep the last incomplete part in the buffer

      for (const part of parts) {
        const line = part.trim();
        if (!line.startsWith('data:')) continue;

        const jsonStr = line.slice(5).trim();
        let event: { type: string; content?: string; message?: string };
        try {
          event = JSON.parse(jsonStr);
        } catch {
          continue; // skip malformed SSE lines
        }

        if (event.type === 'chunk' && event.content) {
          yield event.content;
        } else if (event.type === 'done') {
          return;
        } else if (event.type === 'error') {
          throw new Error(event.message ?? 'LLM stream error');
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

