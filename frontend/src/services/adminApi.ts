import axios from 'axios';
import type { Student, Session, Message } from '../types/api';

const API_URL = 'http://127.0.0.1:8000/api';

// Helper to get JWT token from localStorage
const getAuthHeaders = () => {
  const token = localStorage.getItem('admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchStudents = async (): Promise<Student[]> => {
  const response = await axios.get<Student[]>(`${API_URL}/admin/students`, {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export const fetchStudent = async (studentId: string): Promise<Student & { sessions: Session[] }> => {
  const response = await axios.get<Student & { sessions: Session[] }>(
    `${API_URL}/admin/students/${studentId}`,
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const fetchStudentSessions = async (studentId: string): Promise<Session[]> => {
  const response = await axios.get<Session[]>(
    `${API_URL}/admin/students/${studentId}/sessions`,
    { headers: getAuthHeaders() }
  );
  return response.data;
};

export const fetchSessionMessages = async (studentId: string, sessionId: string): Promise<Message[]> => {
  const response = await axios.get<Message[]>(
    `${API_URL}/admin/students/${studentId}/sessions/${sessionId}`,
    { headers: getAuthHeaders() }
  );
  return response.data;
};
