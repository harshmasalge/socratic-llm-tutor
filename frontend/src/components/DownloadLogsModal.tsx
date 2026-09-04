import React, { useState, useEffect } from 'react';
import { fetchStudents, fetchStudentSessions } from '../services/adminApi';
import type { Student, Session } from '../types/api';

interface DownloadLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DownloadLogsModal: React.FC<DownloadLogsModalProps> = ({ isOpen, onClose }) => {
  const [scope, setScope] = useState<'all' | 'student' | 'session'>('all');
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [start, setStart] = useState<string>('');
  const [end, setEnd] = useState<string>('');
  const [format, setFormat] = useState<'xlsx' | 'csv'>('xlsx');

  // Load students when needed
  useEffect(() => {
    if (scope === 'student' || scope === 'session') {
      fetchStudents().then(setStudents).catch(() => {});
    }
  }, [scope]);

  // Load sessions for selected student
  useEffect(() => {
    if (scope === 'session' && selectedStudent) {
      fetchStudentSessions(selectedStudent).then(setSessions).catch(() => {});
    }
  }, [scope, selectedStudent]);

  const download = async () => {
    const token = localStorage.getItem('admin_token');
    const params = new URLSearchParams({
      format,
      ...(start && { start }),
      ...(end && { end }),
    });
    const base = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
    let url = '';
    if (scope === 'all') {
      url = `${base}/admin/export/all?${params.toString()}`;
    } else if (scope === 'student') {
      url = `${base}/admin/export/student/${selectedStudent}?${params.toString()}`;
    } else {
      url = `${base}/admin/export/session/${selectedSession}?${params.toString()}`;
    }
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const blob = await response.blob();
    const disposition = response.headers.get('Content-Disposition');
    let filename = 'download';
    if (disposition) {
      const match = disposition.match(/filename=([^;]+)/);
      if (match) filename = match[1].replace(/"/g, '');
    }
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    onClose();
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded w-96">
        <h2 className="text-lg font-bold mb-4">Download Logs</h2>
        <label className="block mb-2">Scope</label>
        <select
          value={scope}
          onChange={e => setScope(e.target.value as any)}
          className="w-full mb-3 border p-1"
        >
          <option value="all">All Students</option>
          <option value="student">One Student</option>
          <option value="session">One Session</option>
        </select>
        {scope === 'student' && (
          <>
            <label className="block mb-2">Student</label>
            <select
              value={selectedStudent}
              onChange={e => setSelectedStudent(e.target.value)}
              className="w-full mb-3 border p-1"
            >
              <option value="">Select student</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.roll_no})
                </option>
              ))}
            </select>
          </>
        )}
        {scope === 'session' && (
          <>
            <label className="block mb-2">Student</label>
            <select
              value={selectedStudent}
              onChange={e => setSelectedStudent(e.target.value)}
              className="w-full mb-3 border p-1"
            >
              <option value="">Select student</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.roll_no})
                </option>
              ))}
            </select>
            <label className="block mb-2">Session</label>
            <select
              value={selectedSession}
              onChange={e => setSelectedSession(e.target.value)}
              className="w-full mb-3 border p-1"
              disabled={!selectedStudent}
            >
              <option value="">Select session</option>
              {sessions.map(sess => (
                <option key={sess.id} value={sess.id}>Session {sess.id}</option>
              ))}
            </select>
          </>
        )}
        <label className="block mb-2">Start Date & Time (optional)</label>
        <input
          type="datetime-local"
          value={start}
          onChange={e => setStart(e.target.value)}
          className="w-full mb-3 border p-1"
        />
        <label className="block mb-2">End Date & Time (optional)</label>
        <input
          type="datetime-local"
          value={end}
          onChange={e => setEnd(e.target.value)}
          className="w-full mb-3 border p-1"
        />
        <label className="block mb-2">Format</label>
        <div className="flex space-x-4 mb-4">
          <label>
            <input
              type="radio"
              name="format"
              value="xlsx"
              checked={format === 'xlsx'}
              onChange={() => setFormat('xlsx')}
            />{' '}
            Excel (.xlsx)
          </label>
          <label>
            <input
              type="radio"
              name="format"
              value="csv"
              checked={format === 'csv'}
              onChange={() => setFormat('csv')}
            />{' '}
            CSV
          </label>
        </div>
        <div className="flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 border rounded">
            Cancel
          </button>
          <button onClick={download} className="px-4 py-2 bg-blue-600 text-white rounded">
            Download
          </button>
        </div>
      </div>
    </div>
  );
};

export default DownloadLogsModal;
