import React, { useState, useEffect } from 'react';
import './App.css';

const KnowledgeLinksManager = ({ adminToken, onStatsUpdate }) => {
  const [links, setLinks] = useState([]);
  const [settings, setSettings] = useState({
    enabled: true,
    auto_fetch: true,
    cache_duration_hours: 24
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [testResults, setTestResults] = useState({});

  useEffect(() => {
    loadKnowledgeLinks();
  }, []);

  const loadKnowledgeLinks = async () => {
    try {
      const response = await fetch('/api/admin/knowledge-links', {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLinks(data.links || []);
        setSettings({
          enabled: data.enabled,
          auto_fetch: data.auto_fetch,
          cache_duration_hours: data.cache_duration_hours
        });
      } else {
        setError('Không thể tải knowledge links');
      }
    } catch (error) {
      console.error('Load knowledge links error:', error);
      setError('Lỗi kết nối khi tải knowledge links');
    }
    setLoading(false);
  };

  const toggleKnowledgeLinks = async () => {
    try {
      const response = await fetch('/api/admin/knowledge-links/toggle', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ enabled: !settings.enabled }),
      });

      const data = await response.json();
      if (data.success) {
        setSettings(prev => ({ ...prev, enabled: data.enabled }));
        setMessage(`✅ Knowledge links đã được ${data.enabled ? 'bật' : 'tắt'}`);
        onStatsUpdate && onStatsUpdate();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError(data.error || 'Không thể toggle knowledge links');
      }
    } catch (error) {
      console.error('Toggle knowledge links error:', error);
      setError('Lỗi kết nối');
    }
  };

  const addLink = async (linkData) => {
    try {
      const response = await fetch('/api/admin/knowledge-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify(linkData),
      });

      const data = await response.json();
      if (data.success) {
        setLinks(prev => [...prev, data.link]);
        setMessage('✅ Knowledge link đã được thêm');
        setShowAddForm(false);
        onStatsUpdate && onStatsUpdate();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError(data.error || 'Không thể thêm knowledge link');
      }
    } catch (error) {
      console.error('Add knowledge link error:', error);
      setError('Lỗi kết nối');
    }
  };

  const updateLink = async (linkId, updateData) => {
    try {
      const response = await fetch(`/api/admin/knowledge-links/${linkId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();
      if (data.success) {
        setLinks(prev => prev.map(link => 
          link.id === linkId ? data.link : link
        ));
        setMessage('✅ Knowledge link đã được cập nhật');
        setEditingLink(null);
        onStatsUpdate && onStatsUpdate();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError(data.error || 'Không thể cập nhật knowledge link');
      }
    } catch (error) {
      console.error('Update knowledge link error:', error);
      setError('Lỗi kết nối');
    }
  };

  const deleteLink = async (linkId) => {
    if (!window.confirm('Bạn có chắc muốn xóa knowledge link này?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/knowledge-links/${linkId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setLinks(prev => prev.filter(link => link.id !== linkId));
        setMessage('✅ Knowledge link đã được xóa');
        onStatsUpdate && onStatsUpdate();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError(data.error || 'Không thể xóa knowledge link');
      }
    } catch (error) {
      console.error('Delete knowledge link error:', error);
      setError('Lỗi kết nối');
    }
  };

  const testLink = async (url, type) => {
    const testKey = `${url}_${type}`;
    setTestResults(prev => ({ ...prev, [testKey]: { loading: true } }));

    try {
      const response = await fetch('/api/admin/knowledge-links/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ url, type }),
      });

      const data = await response.json();
      if (data.success) {
        setTestResults(prev => ({ 
          ...prev, 
          [testKey]: { 
            success: true, 
            content_length: data.content_length,
            content_preview: data.content_preview
          } 
        }));
      } else {
        setTestResults(prev => ({ 
          ...prev, 
          [testKey]: { 
            success: false, 
            error: data.error || 'Test thất bại' 
          } 
        }));
      }
    } catch (error) {
      console.error('Test link error:', error);
      setTestResults(prev => ({ 
        ...prev, 
        [testKey]: { 
          success: false, 
          error: 'Lỗi kết nối' 
        } 
      }));
    }
  };

  // Group links by category
  const linksByCategory = links.reduce((acc, link) => {
    const category = link.category || 'general';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(link);
    return acc;
  }, {});

  const categories = {
    'tools': { name: 'Công cụ & Phần mềm', icon: '🛠️' },
    'standards': { name: 'Tiêu chuẩn & Quy tắc', icon: '📏' },
    'inspiration': { name: 'Cảm hứng & Tham khảo', icon: '🎨' },
    'industry_trends': { name: 'Xu hướng ngành', icon: '📈' },
    'tutorials': { name: 'Hướng dẫn & Khóa học', icon: '📚' },
    'general': { name: 'Chung', icon: '📋' }
  };

  if (loading) {
    return (
      <div className="knowledge-links-manager">
        <div className="loading-message">
          🔄 Đang tải knowledge links...
        </div>
      </div>
    );
  }

  return (
    <div className="knowledge-links-manager">
      <div className="knowledge-header">
        <div className="header-left">
          <h2>🔗 Knowledge Links Manager</h2>
          <p>Quản lý nguồn tri thức và tài liệu tham khảo</p>
        </div>
        
        <div className="header-right">
          <div className="knowledge-toggle">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={toggleKnowledgeLinks}
              />
              <span className="toggle-slider"></span>
            </label>
            <span>{settings.enabled ? '🟢 Hoạt động' : '🔴 Tắt'}</span>
          </div>
          
          <button
            onClick={() => setShowAddForm(true)}
            className="admin-btn primary"
          >
            ➕ Thêm Link
          </button>
        </div>
      </div>

      {message && (
        <div className="success-message">{message}</div>
      )}
      
      {error && (
        <div className="error-message">❌ {error}</div>
      )}

      {/* Add Link Form */}
      {showAddForm && (
        <LinkForm
          onSave={addLink}
          onCancel={() => setShowAddForm(false)}
          adminToken={adminToken}
          testLink={testLink}
          testResults={testResults}
        />
      )}

      {/* Edit Link Form */}
      {editingLink && (
        <LinkForm
          link={editingLink}
          onSave={(data) => updateLink(editingLink.id, data)}
          onCancel={() => setEditingLink(null)}
          adminToken={adminToken}
          testLink={testLink}
          testResults={testResults}
          isEditing={true}
        />
      )}

      {/* Links by Category */}
      <div className="knowledge-categories">
        {Object.entries(linksByCategory).map(([categoryKey, categoryLinks]) => (
          <div key={categoryKey} className="knowledge-category">
            <div className="category-header">
              <h3>
                <span className="category-icon">
                  {categories[categoryKey]?.icon || '📋'}
                </span>
                {categories[categoryKey]?.name || categoryKey}
                <span className="category-count">({categoryLinks.length})</span>
              </h3>
            </div>

            <div className="category-links">
              {categoryLinks.map((link) => (
                <LinkCard
                  key={link.id}
                  link={link}
                  onEdit={() => setEditingLink(link)}
                  onDelete={() => deleteLink(link.id)}
                  onTest={() => testLink(link.url, link.type)}
                  testResult={testResults[`${link.url}_${link.type}`]}
                />
              ))}
            </div>
          </div>
        ))}

        {links.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🔗</div>
            <h3>Chưa có Knowledge Links</h3>
            <p>Thêm links tài liệu để AI có thể tham khảo thêm tri thức</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="admin-btn primary"
            >
              ➕ Thêm Link đầu tiên
            </button>
          </div>
        )}
      </div>

      {/* Settings Section */}
      <div className="knowledge-settings">
        <h3>⚙️ Cài đặt</h3>
        <div className="settings-grid">
          <div className="setting-item">
            <label>Auto Fetch</label>
            <div className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.auto_fetch}
                onChange={(e) => setSettings(prev => ({ ...prev, auto_fetch: e.target.checked }))}
              />
              <span className="toggle-slider"></span>
            </div>
          </div>
          
          <div className="setting-item">
            <label>Cache Duration (giờ)</label>
            <input
              type="number"
              value={settings.cache_duration_hours}
              onChange={(e) => setSettings(prev => ({ ...prev, cache_duration_hours: parseInt(e.target.value) }))}
              min="1"
              max="168"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Link Form Component
const LinkForm = ({ link, onSave, onCancel, adminToken, testLink, testResults, isEditing = false }) => {
  const [formData, setFormData] = useState({
    title: link?.title || '',
    url: link?.url || '',
    type: link?.type || 'web',
    category: link?.category || 'general',
    description: link?.description || '',
    priority: link?.priority || 'medium',
    active: link?.active !== false
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(formData);
    setSaving(false);
  };

  const handleTest = () => {
    if (formData.url) {
      testLink(formData.url, formData.type);
    }
  };

  const testKey = `${formData.url}_${formData.type}`;
  const testResult = testResults[testKey];

  return (
    <div className="link-form-overlay">
      <div className="link-form">
        <div className="form-header">
          <h3>{isEditing ? '✏️ Chỉnh sửa Link' : '➕ Thêm Link mới'}</h3>
          <button onClick={onCancel} className="close-btn">❌</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Tiêu đề *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
                placeholder="Tên hiển thị của link"
              />
            </div>

            <div className="form-group">
              <label>URL *</label>
              <div className="url-input-group">
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  required
                  placeholder="https://example.com"
                />
                <button
                  type="button"
                  onClick={handleTest}
                  className="test-btn"
                  disabled={!formData.url || testResult?.loading}
                >
                  {testResult?.loading ? '🔄' : '🧪'}
                </button>
              </div>
              
              {testResult && (
                <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
                  {testResult.success ? (
                    <div>
                      ✅ Test thành công - {testResult.content_length} ký tự
                      <details>
                        <summary>Preview content</summary>
                        <pre>{testResult.content_preview}</pre>
                      </details>
                    </div>
                  ) : (
                    <div>❌ {testResult.error}</div>
                  )}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Loại</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              >
                <option value="web">Web Page</option>
                <option value="pdf">PDF Document</option>
                <option value="documentation">Documentation</option>
                <option value="gallery">Gallery/Portfolio</option>
              </select>
            </div>

            <div className="form-group">
              <label>Danh mục</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              >
                <option value="tools">Công cụ & Phần mềm</option>
                <option value="standards">Tiêu chuẩn & Quy tắc</option>
                <option value="inspiration">Cảm hứng & Tham khảo</option>
                <option value="industry_trends">Xu hướng ngành</option>
                <option value="tutorials">Hướng dẫn & Khóa học</option>
                <option value="general">Chung</option>
              </select>
            </div>

            <div className="form-group">
              <label>Độ ưu tiên</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
              >
                <option value="high">Cao</option>
                <option value="medium">Trung bình</option>
                <option value="low">Thấp</option>
              </select>
            </div>

            <div className="form-group">
              <label>Trạng thái</label>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                  />
                  <span>Kích hoạt</span>
                </label>
              </div>
            </div>
          </div>

          <div className="form-group full-width">
            <label>Mô tả</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Mô tả ngắn gọn về nội dung link"
              rows="3"
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={onCancel}
              className="admin-btn secondary"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="admin-btn primary"
              disabled={saving}
            >
              {saving ? '🔄 Đang lưu...' : (isEditing ? '💾 Cập nhật' : '➕ Thêm')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Link Card Component
const LinkCard = ({ link, onEdit, onDelete, onTest, testResult }) => {
  const priorityColors = {
    high: '🔴',
    medium: '🟡',
    low: '🟢'
  };

  const typeIcons = {
    web: '🌐',
    pdf: '📄',
    documentation: '📚',
    gallery: '🖼️'
  };

  return (
    <div className={`link-card ${link.active ? 'active' : 'inactive'}`}>
      <div className="link-header">
        <div className="link-title">
          <span className="link-type">{typeIcons[link.type] || '📄'}</span>
          <h4>{link.title}</h4>
          <span className="link-priority">{priorityColors[link.priority]}</span>
        </div>
        
        <div className="link-actions">
          <button
            onClick={onTest}
            className="action-btn test"
            title="Test link"
          >
            🧪
          </button>
          <button
            onClick={onEdit}
            className="action-btn edit"
            title="Chỉnh sửa"
          >
            ✏️
          </button>
          <button
            onClick={onDelete}
            className="action-btn delete"
            title="Xóa"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="link-url">
        <a href={link.url} target="_blank" rel="noopener noreferrer">
          {link.url}
        </a>
      </div>

      {link.description && (
        <div className="link-description">
          {link.description}
        </div>
      )}

      <div className="link-meta">
        <span className={`link-status ${link.active ? 'active' : 'inactive'}`}>
          {link.active ? '✅ Active' : '⏸️ Inactive'}
        </span>
        
        {link.cache_status && (
          <span className={`cache-status ${link.cache_status.cached ? 'cached' : 'not-cached'}`}>
            {link.cache_status.cached 
              ? `💾 Cached (${link.cache_status.age_hours}h ago)`
              : '📥 Not cached'
            }
          </span>
        )}
      </div>

      {testResult && (
        <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
          {testResult.loading ? (
            <div>🔄 Testing...</div>
          ) : testResult.success ? (
            <div>✅ Test OK - {testResult.content_length} chars</div>
          ) : (
            <div>❌ {testResult.error}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default KnowledgeLinksManager; 