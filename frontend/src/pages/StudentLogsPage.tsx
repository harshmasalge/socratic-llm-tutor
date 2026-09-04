import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchStudents } from '../services/adminApi';
import type { Student } from '../types/api';

const StudentLogsPage: React.FC = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const filteredStudents = students.filter((s) => {
    const haystack = `${s.id} ${s.name} ${s.roll_no}`.toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchStudents();
        setStudents(data);
      } catch (e: any) {
        setError(e?.response?.data?.detail || 'Failed to load students');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  const handleViewSessions = (studentId: string) => {
    navigate(`/admin/logs/${studentId}`);
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 p-4">
      <h2 className="text-2xl font-bold mb-4">Student Logs</h2>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search students..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-2 w-full md:w-64"
        />
      </div>
      <table className="min-w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Roll No</th>
            <th className="p-2 border">ID</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredStudents.map((s) => (
            <tr key={s.id} className="border-t">
              <td className="p-2 border">{s.name}</td>
              <td className="p-2 border">{s.roll_no}</td>
              <td className="p-2 border break-all">{s.id}</td>
              <td className="p-2 border">
                <button
                  className="text-blue-600 hover:underline"
                  onClick={() => handleViewSessions(s.id)}
                >
                  View Sessions
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StudentLogsPage;
