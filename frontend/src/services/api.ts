import axios from 'axios';
import type { Student, Session, Message, ChatResponse } from '../types/api';

const API_URL = 'http://127.0.0.1:8000/api';

const apiClient = axios.create({
  baseURL: API_URL,
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
