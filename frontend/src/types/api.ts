export interface Student {
  id: string;
  name: string;
  roll_no: string;
  created_at: string;
}

export interface Session {
  id: string;
  student_id: string;
  started_at: string;
  ended_at: string | null;
}

export interface Message {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatResponse {
  session_id: string;
  response: string;
}
