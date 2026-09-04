import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api';

type Config = {
  model: string;
  system_prompt: string;
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('admin_token');
  const [config, setConfig] = useState<Config>({ model: '', system_prompt: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!token) {
      navigate('/admin');
      return;
    }
    const fetchConfig = async () => {
      try {
        const resp = await axios.get<Config>(`${API_URL}/admin/config`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setConfig(resp.data);
      } catch (err: any) {
        setError(err?.response?.data?.detail || 'Failed to load config');
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [navigate, token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const resp = await axios.put<Config>(`${API_URL}/admin/config`, config, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConfig(resp.data);
      alert('Configuration saved successfully');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Update failed');
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="max-w-lg mx-auto mt-10 p-4 border rounded">
      <div className="mb-4">
        <Link to="/admin/logs" className="text-blue-600 hover:underline">Student Logs</Link>
      </div>
      <h2 className="text-xl font-bold mb-4">Admin Dashboard</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">LLM Model</label>
          <input
            type="text"
            name="model"
            value={config.model}
            onChange={handleChange}
            className="w-full border px-2 py-1"
            required
          />
        </div>
        <div>
          <label className="block mb-1">System Prompt</label>
          <textarea
            name="system_prompt"
            value={config.system_prompt}
            onChange={handleChange}
            rows={4}
            className="w-full border px-2 py-1"
            required
          />
        </div>
        <button type="submit" className="w-full bg-green-600 text-white py-2 rounded">
          Save Config
        </button>
      </form>
    </div>
  );
};

export default AdminDashboard;
