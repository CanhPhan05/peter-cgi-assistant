import React, { useState, useEffect } from 'react';
import './App.css';

const KnowledgeLinksManager = ({ adminToken, onStatsUpdate }) => {
  const [links, setLinks] = useState([]);
  const [categories, setCategories] = useState({
    'tools': { name: 'Công cụ & Phần mềm', icon: '🛠️', description: 'Phần mềm và công cụ CGI chuyên nghiệp' },
    'standards': { name: 'Tiêu chuẩn & Quy tắc', icon: '📏', description: 'Tiêu chuẩn ngành và quy tắc chất lượng' },
    'inspiration': { name: 'Cảm hứng & Tham khảo', icon: '🎨', description: 'Portfolio và tác phẩm tham khảo' },
    'industry_trends': { name: 'Xu hướng ngành', icon: '📈', description: 'Tin tức và xu hướng mới nhất' },
    'tutorials': { name: 'Hướng dẫn & Khóa học', icon: '📚', description: 'Tài liệu học tập và hướng dẫn' },
    'general': { name: 'Chung', icon: '📋', description: 'Tài liệu tổng hợp khác' }
  });
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
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

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
        
        // Load categories from config if available
        if (data.categories) {
          setCategories(data.categories);
        }
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

  const addCategory = async (categoryData) => {
    try {
      const response = await fetch(`/api/admin/knowledge-links/categories/${categoryData.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: categoryData.name,
          icon: categoryData.icon || '📋',
          description: categoryData.description || ''
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Reload categories from server
        await loadKnowledgeLinks();
        setMessage('✅ Category đã được thêm');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError(data.error || 'Không thể thêm category');
      }
    } catch (error) {
      console.error('Add category error:', error);
      setError('Lỗi kết nối');
    }
  };

  const updateCategory = async (categoryId, categoryData) => {
    try {
      const response = await fetch(`/api/admin/knowledge-links/categories/${categoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify(categoryData),
      });

      const data = await response.json();
      if (data.success) {
        // Reload categories from server
        await loadKnowledgeLinks();
        setMessage('✅ Category đã được cập nhật');
        setEditingCategory(null);
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError(data.error || 'Không thể cập nhật category');
      }
    } catch (error) {
      console.error('Update category error:', error);
      setError('Lỗi kết nối');
    }
  };

  const deleteCategory = async (categoryId) => {
    const categoryLinks = links.filter(link => link.category === categoryId);
    
    if (categoryLinks.length > 0) {
      if (!window.confirm(`Category này có ${categoryLinks.length} links. Bạn có chắc muốn xóa? (Các links sẽ chuyển về "general")`)) {
        return;
      }
    } else {
      if (!window.confirm('Bạn có chắc muốn xóa category này?')) {
        return;
      }
    }

    try {
      const response = await fetch(`/api/admin/knowledge-links/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        // Reload both categories and links from server
        await loadKnowledgeLinks();
        setMessage('✅ Category đã được xóa');
        onStatsUpdate && onStatsUpdate();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError(data.error || 'Không thể xóa category');
      }
    } catch (error) {
      console.error('Delete category error:', error);
      setError('Lỗi kết nối');
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
            onClick={() => setShowCategoryManager(true)}
            className="admin-btn secondary"
          >
            📁 Quản lý Categories
          </button>
          
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

      {/* Category Manager Modal */}
      {showCategoryManager && (
        <CategoryManager
          categories={categories}
          onAddCategory={addCategory}
          onUpdateCategory={updateCategory}
          onDeleteCategory={deleteCategory}
          onClose={() => setShowCategoryManager(false)}
          editingCategory={editingCategory}
          setEditingCategory={setEditingCategory}
        />
      )}

      {/* Add Link Form */}
      {showAddForm && (
        <LinkForm
          onSave={addLink}
          onCancel={() => setShowAddForm(false)}
          adminToken={adminToken}
          testLink={testLink}
          testResults={testResults}
          categories={categories}
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
          categories={categories}
          isEditing={true}
        />
      )}

      {/* Links by Category */}
      <div className="knowledge-categories">
        {Object.entries(linksByCategory).map(([categoryKey, categoryLinks]) => {
          const categoryInfo = categories[categoryKey] || { name: categoryKey, icon: '📋', description: '' };
          
          return (
            <div key={categoryKey} className="knowledge-category">
              <div className="category-header">
                <div className="category-info">
                  <h3>
                    <span className="category-icon">{categoryInfo.icon}</span>
                    {categoryInfo.name}
                    <span className="category-count">({categoryLinks.length})</span>
                  </h3>
                  {categoryInfo.description && (
                    <p className="category-description">{categoryInfo.description}</p>
                  )}
                </div>
                
                <div className="category-actions">
                  <button
                    onClick={() => setEditingCategory(categoryKey)}
                    className="action-btn edit"
                    title="Chỉnh sửa category"
                  >
                    ✏️
                  </button>
                  {categoryKey !== 'general' && (
                    <button
                      onClick={() => deleteCategory(categoryKey)}
                      className="action-btn delete"
                      title="Xóa category"
                    >
                      🗑️
                    </button>
                  )}
                </div>
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
          );
        })}

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

// Category Manager Component
const CategoryManager = ({ 
  categories, 
  onAddCategory, 
  onUpdateCategory, 
  onDeleteCategory, 
  onClose,
  editingCategory,
  setEditingCategory 
}) => {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="category-manager-overlay">
      <div className="category-manager">
        <div className="form-header">
          <h3>📁 Quản lý Categories</h3>
          <button onClick={onClose} className="close-btn">❌</button>
        </div>

        <div className="category-manager-content">
          <div className="category-manager-header">
            <p>Quản lý các danh mục để phân loại knowledge links</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="admin-btn primary"
            >
              ➕ Thêm Category
            </button>
          </div>

          {/* Add Category Form */}
          {showAddForm && (
            <CategoryForm
              onSave={(data) => {
                onAddCategory(data);
                setShowAddForm(false);
              }}
              onCancel={() => setShowAddForm(false)}
            />
          )}

          {/* Edit Category Form */}
          {editingCategory && (
            <CategoryForm
              category={{
                id: editingCategory,
                ...categories[editingCategory]
              }}
              onSave={(data) => onUpdateCategory(editingCategory, data)}
              onCancel={() => setEditingCategory(null)}
              isEditing={true}
            />
          )}

          {/* Categories List */}
          <div className="categories-list">
            {Object.entries(categories).map(([categoryId, categoryData]) => (
              <div key={categoryId} className="category-item">
                <div className="category-item-info">
                  <div className="category-item-header">
                    <span className="category-icon">{categoryData.icon}</span>
                    <h4>{categoryData.name}</h4>
                    <span className="category-id">({categoryId})</span>
                  </div>
                  {categoryData.description && (
                    <p className="category-item-description">{categoryData.description}</p>
                  )}
                </div>
                
                <div className="category-item-actions">
                  <button
                    onClick={() => setEditingCategory(categoryId)}
                    className="action-btn edit"
                    title="Chỉnh sửa"
                  >
                    ✏️
                  </button>
                  {categoryId !== 'general' && (
                    <button
                      onClick={() => onDeleteCategory(categoryId)}
                      className="action-btn delete"
                      title="Xóa"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Category Form Component
const CategoryForm = ({ category, onSave, onCancel, isEditing = false }) => {
  const [formData, setFormData] = useState({
    id: category?.id || '',
    name: category?.name || '',
    icon: category?.icon || '📋',
    description: category?.description || ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!isEditing && !formData.id.trim()) {
      setError('ID category là bắt buộc');
      return;
    }
    
    if (!formData.name.trim()) {
      setError('Tên category là bắt buộc');
      return;
    }
    
    // Validate ID format (only for new categories)
    if (!isEditing) {
      const idPattern = /^[a-z0-9_]+$/;
      if (!idPattern.test(formData.id)) {
        setError('ID chỉ được chứa chữ thường, số và dấu gạch dưới');
        return;
      }
      
      // Check for reserved IDs
      const reservedIds = ['admin', 'api', 'config', 'general'];
      if (reservedIds.includes(formData.id.toLowerCase())) {
        setError('ID này đã được sử dụng bởi hệ thống');
        return;
      }
    }
    
    setError('');
    setSaving(true);
    
    try {
      await onSave(formData);
      
      // If we reach here, it was successful
      if (!isEditing) {
        // Reset form for new category
        setFormData({
          id: '',
          name: '',
          icon: '📋',
          description: ''
        });
      }
    } catch (error) {
      setError(error.message || 'Có lỗi xảy ra');
    }
    
    setSaving(false);
  };

  const handleIdChange = (e) => {
    let value = e.target.value;
    // Auto-convert to lowercase and replace spaces with underscores
    value = value.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_');
    setFormData(prev => ({ ...prev, id: value }));
  };

  const iconOptions = [
    '📋', '🛠️', '📏', '🎨', '📈', '📚', '🔧', '💡', '🎯', '📊', 
    '🖥️', '📱', '🎮', '🎬', '🎵', '📷', '🖼️', '📝', '📖', '🔍',
    '🌟', '🚀', '💎', '🔥', '⚡', '🌈', '🎭', '🏆', '🎪', '🎨'
  ];

  return (
    <div className="category-form">
      <h4>{isEditing ? '✏️ Chỉnh sửa Category' : '➕ Thêm Category mới'}</h4>
      
      {error && (
        <div className="error-message">❌ {error}</div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label>ID Category *</label>
            <input
              type="text"
              value={formData.id}
              onChange={handleIdChange}
              required
              placeholder="vd: my_category"
              disabled={isEditing || saving}
              minLength="2"
              maxLength="30"
            />
            <small className="form-hint">
              Chỉ sử dụng chữ thường, số và dấu gạch dưới. VD: web_design, tools_3d
            </small>
          </div>

          <div className="form-group">
            <label>Tên hiển thị *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              placeholder="Tên category"
              disabled={saving}
              maxLength="50"
            />
          </div>

          <div className="form-group">
            <label>Icon</label>
            <div className="icon-selector">
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                placeholder="Emoji icon"
                maxLength="2"
                disabled={saving}
              />
              <div className="icon-options">
                {iconOptions.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, icon }))}
                    className={`icon-option ${formData.icon === icon ? 'selected' : ''}`}
                    disabled={saving}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="form-group full-width">
          <label>Mô tả</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Mô tả ngắn gọn về category này (tùy chọn)"
            rows="3"
            disabled={saving}
            maxLength="200"
          />
          <small className="form-hint">
            {formData.description.length}/200 ký tự
          </small>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="admin-btn secondary"
            disabled={saving}
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
  );
};

// Update LinkForm to use dynamic categories
const LinkForm = ({ link, onSave, onCancel, adminToken, testLink, testResults, categories = {}, isEditing = false }) => {
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
                {Object.entries(categories).map(([categoryId, categoryData]) => (
                  <option key={categoryId} value={categoryId}>
                    {categoryData.icon} {categoryData.name}
                  </option>
                ))}
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