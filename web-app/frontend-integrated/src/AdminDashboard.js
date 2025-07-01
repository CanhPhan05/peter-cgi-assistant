import React, { useState, useEffect } from 'react';
import ConfigManager from './ConfigManager';
import KnowledgeLinksManager from './KnowledgeLinksManager';
import './App.css';

// Backend API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const AdminDashboard = ({ adminInfo, adminToken, onLogout }) => {
  const [activeTab, setActiveTab] = useState('config');
  const [systemStats, setSystemStats] = useState(null);

  // Load system stats on component mount
  useEffect(() => {
    loadSystemStats();
  }, []);

  const loadSystemStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/config`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const config = data.config;
        
        setSystemStats({
          aiName: config?.ai?.name || 'Unknown',
          knowledgeLinksEnabled: config?.knowledge_links?.enabled || false,
          totalLinks: config?.knowledge_links?.links?.length || 0,
          activeLinks: config?.knowledge_links?.links?.filter(l => l.active)?.length || 0
        });
      }
    } catch (error) {
      console.error('Load system stats error:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    onLogout();
  };

  const tabs = [
    { id: 'config', name: 'Cấu hình AI', icon: '🤖' },
    { id: 'knowledge', name: 'Knowledge Links', icon: '🔗' },
    { id: 'settings', name: 'Cài đặt', icon: '⚙️' }
  ];

  return (
    <div className="admin-container">
      <div className="admin-dashboard">
        {/* Header */}
        <div className="admin-dashboard-header">
          <div className="admin-dashboard-title">
            <h1>🔐 Peter CGI Admin Panel</h1>
            <p>Quản lý cấu hình và tri thức AI</p>
          </div>
          
          <div className="admin-dashboard-user">
            <span>👋 Chào {adminInfo.email}</span>
            <button 
              onClick={handleLogout}
              className="admin-logout-btn"
            >
              🚪 Đăng xuất
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {systemStats && (
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <div className="stat-icon">🤖</div>
              <div className="stat-content">
                <h3>AI Assistant</h3>
                <p>{systemStats.aiName}</p>
              </div>
            </div>
            
            <div className="admin-stat-card">
              <div className="stat-icon">🔗</div>
              <div className="stat-content">
                <h3>Knowledge Links</h3>
                <p>{systemStats.activeLinks}/{systemStats.totalLinks} active</p>
              </div>
            </div>
            
            <div className="admin-stat-card">
              <div className="stat-icon">⚡</div>
              <div className="stat-content">
                <h3>Status</h3>
                <p>{systemStats.knowledgeLinksEnabled ? 'Hoạt động' : 'Tạm dừng'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="admin-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-name">{tab.name}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="admin-tab-content">
          {activeTab === 'config' && (
            <ConfigManager 
              adminToken={adminToken}
              onStatsUpdate={loadSystemStats}
            />
          )}
          
          {activeTab === 'knowledge' && (
            <KnowledgeLinksManager 
              adminToken={adminToken}
              onStatsUpdate={loadSystemStats}
            />
          )}
          
          {activeTab === 'settings' && (
            <AdminSettings 
              adminInfo={adminInfo}
              adminToken={adminToken}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Settings tab component
const AdminSettings = ({ adminInfo, adminToken }) => {
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New password và confirm password không khớp');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError('New password phải ít nhất 6 ký tự');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`${API_URL}/api/admin/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('✅ Đổi password thành công!');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setError(data.error || 'Đổi password thất bại');
      }
    } catch (error) {
      console.error('Change password error:', error);
      setError('Lỗi kết nối. Vui lòng thử lại.');
    }

    setLoading(false);
  };

  const handleInputChange = (e) => {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="admin-settings">
      <div className="settings-section">
        <h2>🔒 Bảo mật Admin</h2>
        
        <div className="admin-info-card">
          <h3>Thông tin tài khoản</h3>
          <p><strong>Email:</strong> {adminInfo.email}</p>
          <p><strong>Role:</strong> {adminInfo.role}</p>
          <p><strong>Quyền đổi password:</strong> {adminInfo.canChangePassword ? '✅ Có' : '❌ Không'}</p>
        </div>

        {adminInfo.canChangePassword && (
          <div className="change-password-card">
            <h3>Đổi Password Admin</h3>
            
            <form onSubmit={handlePasswordChange} className="password-form">
              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handleInputChange}
                  required
                  minLength="6"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handleInputChange}
                  required
                  minLength="6"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="error-message">❌ {error}</div>
              )}

              {message && (
                <div className="success-message">{message}</div>
              )}

              <button 
                type="submit" 
                className="admin-btn primary"
                disabled={loading}
              >
                {loading ? '🔄 Đang cập nhật...' : '🔐 Đổi Password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard; 