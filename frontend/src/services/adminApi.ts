import axios from 'axios';
import type { Student, Session, Message } from '../types/api';
import { API_BASE_URL } from './api';

const API_URL = API_BASE_URL;

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

// ---- Export / Download helpers ----

const triggerDownload = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

export const downloadSessionExport = async (sessionId: string): Promise<void> => {
  const response = await axios.get(`${API_URL}/admin/export/session/${sessionId}`, {
    headers: getAuthHeaders(),
    responseType: 'blob',
  });
  triggerDownload(response.data, `session_${sessionId}.xlsx`);
};

export const downloadStudentExport = async (studentId: string): Promise<void> => {
  const response = await axios.get(`${API_URL}/admin/export/student/${studentId}`, {
    headers: getAuthHeaders(),
    responseType: 'blob',
  });
  triggerDownload(response.data, `student_${studentId}.xlsx`);
};

export const downloadAllExport = async (format: 'xlsx' | 'csv' = 'xlsx', start?: string, end?: string): Promise<void> => {
  const params = new URLSearchParams({ format });
  if (start) params.set('start', start);
  if (end) params.set('end', end);
  const response = await axios.get(`${API_URL}/admin/export/all?${params.toString()}`, {
    headers: getAuthHeaders(),
    responseType: 'blob',
  });
  const ext = format;
  const dateTag = start || end ? `_${(start ?? '').split('T')[0]}_${(end ?? '').split('T')[0]}` : '_all';
  triggerDownload(response.data, `logs${dateTag}.${ext}`);
};

