import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOrGetStudent } from '../services/api';

export default function StudentLogin() {
  const [name, setName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !rollNo) {
      setError('Please fill in both fields');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const student = await createOrGetStudent(name, rollNo);
      localStorage.setItem('studentId', student.id);
      localStorage.setItem('studentName', student.name);
      navigate('/chat');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-3xl font-bold text-center text-gray-800">Socratic Tutor</h2>
        <div className="text-center mb-4">
  <a href="/admin" className="text-blue-600 hover:underline">Admin Login</a>
</div>
<form className="space-y-4" onSubmit={handleSubmit}>
          {error && <div className="p-3 text-sm text-red-600 bg-red-100 rounded-md">{error}</div>}
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Roll Number</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none disabled:bg-blue-400"
          >
            {loading ? 'Entering...' : 'Start Learning'}
          </button>
        </form>
      </div>
    </div>
  );
}
