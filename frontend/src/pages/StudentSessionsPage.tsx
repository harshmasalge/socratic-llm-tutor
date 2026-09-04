import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { fetchStudent, fetchStudentSessions, fetchSessionMessages } from '../services/adminApi';
import type { Session } from '../types/api';

  const StudentSessionsPage: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<{ name: string; roll_no: string } | null>(null);
  const title = student ? `Sessions for ${student.name} (${student.roll_no})` : `Sessions for Student ${studentId}`;

  // Load student details
  useEffect(() => {
    if (!studentId) return;
    const loadStudent = async () => {
      try {
        const data = await fetchStudent(studentId);
        setStudent({ name: data.name, roll_no: data.roll_no });
      } catch (e) {
        // ignore for now
      }
    };
    loadStudent();
  }, [studentId]);

  // Title with name and roll


  const [sessions, setSessions] = useState<Session[]>([]);
  const [msgCounts, setMsgCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
const [search, setSearch] = useState('');

  // Load sessions on mount
  useEffect(() => {
    if (!studentId) return;
    const load = async () => {
      try {
        const data = await fetchStudentSessions(studentId);
        setSessions(data);
        // For each session, fetch its messages to compute count (client‑side)
        const counts: Record<string, number> = {};
        await Promise.all(
          data.map(async (sess) => {
            const msgs = await fetchSessionMessages(studentId, sess.id);
            counts[sess.id] = msgs.length;
          })
        );
        setMsgCounts(counts);
      } catch (e: any) {
        setError(e?.response?.data?.detail || 'Failed to load sessions');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [studentId]);

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  const formatDate = (d: string) => new Date(d).toLocaleString();

  // // const filteredSessions = sessions.filter((s) => {
  //   const status = s.ended_at ? 'completed' : 'ongoing';
  //   const haystack = `${s.id} ${status} ${formatDate(s.started_at)} ${s.ended_at ? formatDate(s.ended_at) : ''}`.toLowerCase();
  //   return haystack.includes(search.toLowerCase());
  // });

  return (
    <div className="max-w-4xl mx-auto mt-10 p-4">
      <Link to="/admin/logs" className="text-blue-600 hover:underline mb-4 inline-block">
        ← Back to Students
      </Link>
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search sessions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded px-3 py-2 w-full md:w-64"
          />
        </div>
        <table className="min-w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Started At</th>
            <th className="p-2 border">Ended At</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border">Messages</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s) => (
            <tr key={s.id} className="border-t">
              <td className="p-2 border">{formatDate(s.started_at)}</td>
              <td className="p-2 border">{s.ended_at ? formatDate(s.ended_at) : 'Ongoing'}</td>
              <td className="p-2 border">
                {s.ended_at ? 'Completed' : 'Ongoing'}
              </td>
              <td className="p-2 border text-center">
                {msgCounts[s.id] ?? '…'}
              </td>
              <td className="p-2 border">
                <button
                  className="text-blue-600 hover:underline"
                  onClick={() => navigate(`/admin/logs/${studentId}/${s.id}`)}
                >
                  View Conversation
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StudentSessionsPage;
