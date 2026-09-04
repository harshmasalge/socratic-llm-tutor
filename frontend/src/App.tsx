
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import StudentLogin from './pages/StudentLogin';
import StudentChat from './pages/StudentChat';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import StudentLogsPage from './pages/StudentLogsPage';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import StudentSessionsPage from './pages/StudentSessionsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StudentLogin />} />
        <Route path="/chat" element={<StudentChat />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route
          path="/admin/dashboard"
          element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/logs"
          element={
            <AdminProtectedRoute>
              <StudentLogsPage />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/logs/:studentId"
          element={
            <AdminProtectedRoute>
              <StudentSessionsPage />
            </AdminProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
