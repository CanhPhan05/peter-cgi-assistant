import React, { useState } from 'react';
import './App.css';

const AdminLogin = ({ onLoginSuccess }) => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminInfo', JSON.stringify(data.admin));
        onLoginSuccess(data.admin, data.token);
      } else {
        setError(data.error || 'Đăng nhập thất bại');
      }
    } catch (error) {
      console.error('Admin login error:', error);
      setError('Lỗi kết nối. Vui lòng thử lại.');
    }

    setLoading(false);
  };

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="admin-container">
      <div className="admin-login-card">
        <div className="admin-header">
          <div className="admin-icon">🔐</div>
          <h1>Admin Panel</h1>
          <p>Quản lý cấu hình Peter CGI Assistant</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="form-group">
            <label htmlFor="email">Email Admin</label>
            <input
              type="email"
              id="email"
              name="email"
              value={credentials.email}
              onChange={handleChange}
              required
              placeholder="admin@gmail.com"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              required
              placeholder="Nhập password admin"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="error-message">
              ❌ {error}
            </div>
          )}

          <button 
            type="submit" 
            className="admin-login-btn"
            disabled={loading}
          >
            {loading ? '🔄 Đang đăng nhập...' : '🚀 Đăng nhập Admin'}
          </button>
        </form>

        <div className="admin-footer">
          <p>🔒 Truy cập hạn chế - Chỉ dành cho Admin</p>
          <div className="admin-hint">
            <strong>Mặc định:</strong> admin@gmail.com / Admin
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin; 