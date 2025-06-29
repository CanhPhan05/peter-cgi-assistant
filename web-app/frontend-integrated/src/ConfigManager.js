import React, { useState, useEffect } from 'react';
import './App.css';

const ConfigManager = ({ adminToken, onStatsUpdate }) => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [activeSection, setActiveSection] = useState('basic');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/admin/config', {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data.config);
      } else {
        setError('Không thể tải cấu hình');
      }
    } catch (error) {
      console.error('Load config error:', error);
      setError('Lỗi kết nối khi tải cấu hình');
    }
    setLoading(false);
  };

  const saveConfig = async () => {
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ config }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('✅ Cấu hình đã được lưu thành công!');
        onStatsUpdate && onStatsUpdate();
        // Auto-hide message after 3 seconds
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError(data.error || 'Lưu cấu hình thất bại');
      }
    } catch (error) {
      console.error('Save config error:', error);
      setError('Lỗi kết nối khi lưu cấu hình');
    }

    setSaving(false);
  };

  const updateConfig = (path, value) => {
    const newConfig = { ...config };
    const keys = path.split('.');
    let current = newConfig;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setConfig(newConfig);
  };

  const addArrayItem = (path, newItem) => {
    const newConfig = { ...config };
    const keys = path.split('.');
    let current = newConfig;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    
    if (!current[keys[keys.length - 1]]) {
      current[keys[keys.length - 1]] = [];
    }
    
    current[keys[keys.length - 1]].push(newItem);
    setConfig(newConfig);
  };

  const removeArrayItem = (path, index) => {
    const newConfig = { ...config };
    const keys = path.split('.');
    let current = newConfig;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]].splice(index, 1);
    setConfig(newConfig);
  };

  const updateArrayItem = (path, index, value) => {
    const newConfig = { ...config };
    const keys = path.split('.');
    let current = newConfig;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]][index] = value;
    setConfig(newConfig);
  };

  if (loading) {
    return (
      <div className="config-manager">
        <div className="loading-message">
          🔄 Đang tải cấu hình...
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="config-manager">
        <div className="error-message">
          ❌ Không thể tải cấu hình
        </div>
      </div>
    );
  }

  const sections = [
    { id: 'basic', name: 'Thông tin cơ bản', icon: '🤖' },
    { id: 'personality', name: 'Tính cách', icon: '😊' },
    { id: 'expertise', name: 'Chuyên môn', icon: '🎯' },
    { id: 'knowledge', name: 'Nguồn tri thức', icon: '📚' },
    { id: 'behavior', name: 'Hành vi', icon: '🧠' },
    { id: 'ui', name: 'Giao diện', icon: '🎨' }
  ];

  return (
    <div className="config-manager">
      <div className="config-header">
        <h2>🤖 Cấu hình AI Assistant</h2>
        <div className="config-actions">
          {message && (
            <div className="success-message">{message}</div>
          )}
          {error && (
            <div className="error-message">❌ {error}</div>
          )}
          <button 
            onClick={saveConfig}
            className="admin-btn primary"
            disabled={saving}
          >
            {saving ? '🔄 Đang lưu...' : '💾 Lưu cấu hình'}
          </button>
        </div>
      </div>

      <div className="config-content">
        {/* Section Navigation */}
        <div className="config-nav">
          {sections.map(section => (
            <button
              key={section.id}
              className={`config-nav-btn ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              <span className="nav-icon">{section.icon}</span>
              <span className="nav-name">{section.name}</span>
            </button>
          ))}
        </div>

        {/* Section Content */}
        <div className="config-section">
          {activeSection === 'basic' && (
            <BasicInfoSection 
              config={config} 
              updateConfig={updateConfig} 
            />
          )}
          
          {activeSection === 'personality' && (
            <PersonalitySection 
              config={config} 
              updateConfig={updateConfig}
              addArrayItem={addArrayItem}
              removeArrayItem={removeArrayItem}
              updateArrayItem={updateArrayItem}
            />
          )}
          
          {activeSection === 'expertise' && (
            <ExpertiseSection 
              config={config} 
              updateConfig={updateConfig}
              addArrayItem={addArrayItem}
              removeArrayItem={removeArrayItem}
              updateArrayItem={updateArrayItem}
            />
          )}
          
          {activeSection === 'knowledge' && (
            <KnowledgeSourcesSection 
              config={config} 
              updateConfig={updateConfig}
              addArrayItem={addArrayItem}
              removeArrayItem={removeArrayItem}
              updateArrayItem={updateArrayItem}
            />
          )}
          
          {activeSection === 'behavior' && (
            <BehaviorSection 
              config={config} 
              updateConfig={updateConfig}
              addArrayItem={addArrayItem}
              removeArrayItem={removeArrayItem}
              updateArrayItem={updateArrayItem}
            />
          )}
          
          {activeSection === 'ui' && (
            <UISection 
              config={config} 
              updateConfig={updateConfig} 
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Basic Info Section
const BasicInfoSection = ({ config, updateConfig }) => (
  <div className="config-section-content">
    <h3>🤖 Thông tin cơ bản</h3>
    
    <div className="form-group">
      <label>Tên AI</label>
      <input
        type="text"
        value={config.ai.name}
        onChange={(e) => updateConfig('ai.name', e.target.value)}
        placeholder="Tên ngắn gọn"
      />
    </div>

    <div className="form-group">
      <label>Tên đầy đủ</label>
      <input
        type="text"
        value={config.ai.fullName}
        onChange={(e) => updateConfig('ai.fullName', e.target.value)}
        placeholder="Tên hiển thị đầy đủ"
      />
    </div>

    <div className="form-group">
      <label>Avatar</label>
      <input
        type="text"
        value={config.ai.avatar}
        onChange={(e) => updateConfig('ai.avatar', e.target.value)}
        placeholder="Đường dẫn hoặc emoji"
      />
    </div>

    <div className="form-group">
      <label>Avatar Fallback</label>
      <input
        type="text"
        value={config.ai.avatarFallback}
        onChange={(e) => updateConfig('ai.avatarFallback', e.target.value)}
        placeholder="Avatar dự phòng"
      />
    </div>

    <div className="form-group">
      <label>Mô tả</label>
      <textarea
        value={config.ai.description}
        onChange={(e) => updateConfig('ai.description', e.target.value)}
        placeholder="Mô tả ngắn gọn về AI"
        rows="2"
      />
    </div>

    <div className="form-group">
      <label>Subtitle</label>
      <input
        type="text"
        value={config.ai.subtitle}
        onChange={(e) => updateConfig('ai.subtitle', e.target.value)}
        placeholder="Subtitle hiển thị"
      />
    </div>

    <div className="form-group">
      <label>Welcome Title</label>
      <input
        type="text"
        value={config.ai.welcomeTitle}
        onChange={(e) => updateConfig('ai.welcomeTitle', e.target.value)}
        placeholder="Tiêu đề chào mừng"
      />
    </div>

    <div className="form-group">
      <label>Welcome Description</label>
      <textarea
        value={config.ai.welcomeDescription}
        onChange={(e) => updateConfig('ai.welcomeDescription', e.target.value)}
        placeholder="Mô tả chào mừng"
        rows="3"
      />
    </div>

    <div className="form-group">
      <label>Welcome Footer</label>
      <textarea
        value={config.ai.welcomeFooter}
        onChange={(e) => updateConfig('ai.welcomeFooter', e.target.value)}
        placeholder="Footer chào mừng"
        rows="2"
      />
    </div>

    <div className="form-group">
      <label>Typing Message</label>
      <input
        type="text"
        value={config.ai.typingMessage}
        onChange={(e) => updateConfig('ai.typingMessage', e.target.value)}
        placeholder="Tin nhắn khi AI đang gõ"
      />
    </div>

    <div className="form-group">
      <label>Model</label>
      <select
        value={config.ai.model}
        onChange={(e) => updateConfig('ai.model', e.target.value)}
      >
        <option value="gpt-4o">GPT-4o</option>
        <option value="gpt-4">GPT-4</option>
        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
      </select>
    </div>
  </div>
);

// Array Editor Component
const ArrayEditor = ({ items, onAdd, onRemove, onUpdate, placeholder }) => {
  const [newItem, setNewItem] = useState('');

  const handleAdd = () => {
    if (newItem.trim()) {
      onAdd(newItem.trim());
      setNewItem('');
    }
  };

  return (
    <div className="array-editor">
      <div className="array-items">
        {items.map((item, index) => (
          <div key={index} className="array-item">
            <input
              type="text"
              value={item}
              onChange={(e) => onUpdate(index, e.target.value)}
              className="array-item-input"
            />
            <button
              onClick={() => onRemove(index)}
              className="array-item-remove"
              title="Xóa"
            >
              ❌
            </button>
          </div>
        ))}
      </div>
      <div className="array-add">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder={placeholder}
          className="array-add-input"
          onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button
          onClick={handleAdd}
          className="array-add-btn"
          disabled={!newItem.trim()}
        >
          ➕ Thêm
        </button>
      </div>
    </div>
  );
};

// Personality Section
const PersonalitySection = ({ config, updateConfig, addArrayItem, removeArrayItem, updateArrayItem }) => (
  <div className="config-section-content">
    <h3>😊 Tính cách & Phong cách</h3>
    
    <div className="form-group">
      <label>Vai trò</label>
      <input
        type="text"
        value={config.personality.role}
        onChange={(e) => updateConfig('personality.role', e.target.value)}
        placeholder="Vai trò chính"
      />
    </div>

    <div className="form-group">
      <label>Kinh nghiệm</label>
      <input
        type="text"
        value={config.personality.experience}
        onChange={(e) => updateConfig('personality.experience', e.target.value)}
        placeholder="Mô tả kinh nghiệm"
      />
    </div>

    <div className="form-group">
      <label>Đặc điểm tính cách</label>
      <ArrayEditor
        items={config.personality.characteristics}
        onAdd={(item) => addArrayItem('personality.characteristics', item)}
        onRemove={(index) => removeArrayItem('personality.characteristics', index)}
        onUpdate={(index, value) => updateArrayItem('personality.characteristics', index, value)}
        placeholder="Thêm đặc điểm tính cách"
      />
    </div>

    <div className="form-group">
      <label>Tone</label>
      <input
        type="text"
        value={config.personality.communication_style.tone}
        onChange={(e) => updateConfig('personality.communication_style.tone', e.target.value)}
        placeholder="Giọng điệu giao tiếp"
      />
    </div>

    <div className="form-group">
      <label>Approach</label>
      <input
        type="text"
        value={config.personality.communication_style.approach}
        onChange={(e) => updateConfig('personality.communication_style.approach', e.target.value)}
        placeholder="Cách tiếp cận"
      />
    </div>

    <div className="form-group">
      <label>Language</label>
      <input
        type="text"
        value={config.personality.communication_style.language}
        onChange={(e) => updateConfig('personality.communication_style.language', e.target.value)}
        placeholder="Ngôn ngữ sử dụng"
      />
    </div>

    <div className="form-group">
      <label>Format</label>
      <input
        type="text"
        value={config.personality.communication_style.format}
        onChange={(e) => updateConfig('personality.communication_style.format', e.target.value)}
        placeholder="Định dạng trả lời"
      />
    </div>
  </div>
);

// Expertise Section
const ExpertiseSection = ({ config, updateConfig, addArrayItem, removeArrayItem, updateArrayItem }) => (
  <div className="config-section-content">
    <h3>🎯 Chuyên môn</h3>
    
    <div className="form-group">
      <label>Kỹ năng chính</label>
      <ArrayEditor
        items={config.expertise.primary_skills}
        onAdd={(item) => addArrayItem('expertise.primary_skills', item)}
        onRemove={(index) => removeArrayItem('expertise.primary_skills', index)}
        onUpdate={(index, value) => updateArrayItem('expertise.primary_skills', index, value)}
        placeholder="Thêm kỹ năng chính"
      />
    </div>

    <div className="form-group">
      <label>Lĩnh vực chuyên biệt</label>
      <ArrayEditor
        items={config.expertise.specialized_areas}
        onAdd={(item) => addArrayItem('expertise.specialized_areas', item)}
        onRemove={(index) => removeArrayItem('expertise.specialized_areas', index)}
        onUpdate={(index, value) => updateArrayItem('expertise.specialized_areas', index, value)}
        placeholder="Thêm lĩnh vực chuyên biệt"
      />
    </div>

    <div className="form-group">
      <label>Modeling Software</label>
      <ArrayEditor
        items={config.expertise.software_proficiency.modeling}
        onAdd={(item) => addArrayItem('expertise.software_proficiency.modeling', item)}
        onRemove={(index) => removeArrayItem('expertise.software_proficiency.modeling', index)}
        onUpdate={(index, value) => updateArrayItem('expertise.software_proficiency.modeling', index, value)}
        placeholder="Thêm phần mềm modeling"
      />
    </div>

    <div className="form-group">
      <label>Texturing Software</label>
      <ArrayEditor
        items={config.expertise.software_proficiency.texturing}
        onAdd={(item) => addArrayItem('expertise.software_proficiency.texturing', item)}
        onRemove={(index) => removeArrayItem('expertise.software_proficiency.texturing', index)}
        onUpdate={(index, value) => updateArrayItem('expertise.software_proficiency.texturing', index, value)}
        placeholder="Thêm phần mềm texturing"
      />
    </div>

    <div className="form-group">
      <label>Rendering Software</label>
      <ArrayEditor
        items={config.expertise.software_proficiency.rendering}
        onAdd={(item) => addArrayItem('expertise.software_proficiency.rendering', item)}
        onRemove={(index) => removeArrayItem('expertise.software_proficiency.rendering', index)}
        onUpdate={(index, value) => updateArrayItem('expertise.software_proficiency.rendering', index, value)}
        placeholder="Thêm phần mềm rendering"
      />
    </div>

    <div className="form-group">
      <label>Compositing Software</label>
      <ArrayEditor
        items={config.expertise.software_proficiency.compositing}
        onAdd={(item) => addArrayItem('expertise.software_proficiency.compositing', item)}
        onRemove={(index) => removeArrayItem('expertise.software_proficiency.compositing', index)}
        onUpdate={(index, value) => updateArrayItem('expertise.software_proficiency.compositing', index, value)}
        placeholder="Thêm phần mềm compositing"
      />
    </div>

    <div className="form-group">
      <label>Real-time Software</label>
      <ArrayEditor
        items={config.expertise.software_proficiency.realtime}
        onAdd={(item) => addArrayItem('expertise.software_proficiency.realtime', item)}
        onRemove={(index) => removeArrayItem('expertise.software_proficiency.realtime', index)}
        onUpdate={(index, value) => updateArrayItem('expertise.software_proficiency.realtime', index, value)}
        placeholder="Thêm phần mềm real-time"
      />
    </div>

    <div className="form-group">
      <label>AI Tools</label>
      <ArrayEditor
        items={config.expertise.software_proficiency.ai_tools}
        onAdd={(item) => addArrayItem('expertise.software_proficiency.ai_tools', item)}
        onRemove={(index) => removeArrayItem('expertise.software_proficiency.ai_tools', index)}
        onUpdate={(index, value) => updateArrayItem('expertise.software_proficiency.ai_tools', index, value)}
        placeholder="Thêm AI tools"
      />
    </div>
  </div>
);

// Knowledge Sources Section
const KnowledgeSourcesSection = ({ config, updateConfig, addArrayItem, removeArrayItem, updateArrayItem }) => (
  <div className="config-section-content">
    <h3>📚 Nguồn tri thức</h3>
    
    <div className="form-group">
      <label>Industry Standards</label>
      <ArrayEditor
        items={config.knowledge_sources.industry_standards}
        onAdd={(item) => addArrayItem('knowledge_sources.industry_standards', item)}
        onRemove={(index) => removeArrayItem('knowledge_sources.industry_standards', index)}
        onUpdate={(index, value) => updateArrayItem('knowledge_sources.industry_standards', index, value)}
        placeholder="Thêm tiêu chuẩn ngành"
      />
    </div>

    <div className="form-group">
      <label>Learning Resources</label>
      <ArrayEditor
        items={config.knowledge_sources.learning_resources}
        onAdd={(item) => addArrayItem('knowledge_sources.learning_resources', item)}
        onRemove={(index) => removeArrayItem('knowledge_sources.learning_resources', index)}
        onUpdate={(index, value) => updateArrayItem('knowledge_sources.learning_resources', index, value)}
        placeholder="Thêm nguồn học tập"
      />
    </div>

    <div className="form-group">
      <label>Industry News</label>
      <ArrayEditor
        items={config.knowledge_sources.industry_news}
        onAdd={(item) => addArrayItem('knowledge_sources.industry_news', item)}
        onRemove={(index) => removeArrayItem('knowledge_sources.industry_news', index)}
        onUpdate={(index, value) => updateArrayItem('knowledge_sources.industry_news', index, value)}
        placeholder="Thêm nguồn tin ngành"
      />
    </div>

    <div className="form-group">
      <label>Research Papers</label>
      <ArrayEditor
        items={config.knowledge_sources.research_papers}
        onAdd={(item) => addArrayItem('knowledge_sources.research_papers', item)}
        onRemove={(index) => removeArrayItem('knowledge_sources.research_papers', index)}
        onUpdate={(index, value) => updateArrayItem('knowledge_sources.research_papers', index, value)}
        placeholder="Thêm bài nghiên cứu"
      />
    </div>
  </div>
);

// Behavior Section
const BehaviorSection = ({ config, updateConfig, addArrayItem, removeArrayItem, updateArrayItem }) => (
  <div className="config-section-content">
    <h3>🧠 Hành vi & Phương pháp</h3>
    
    <div className="form-group">
      <label>Cách tiếp cận phân tích</label>
      <ArrayEditor
        items={config.behavior_patterns.analysis_approach}
        onAdd={(item) => addArrayItem('behavior_patterns.analysis_approach', item)}
        onRemove={(index) => removeArrayItem('behavior_patterns.analysis_approach', index)}
        onUpdate={(index, value) => updateArrayItem('behavior_patterns.analysis_approach', index, value)}
        placeholder="Thêm phương pháp phân tích"
      />
    </div>

    <div className="form-group">
      <label>Cấu trúc trả lời</label>
      <ArrayEditor
        items={config.behavior_patterns.response_structure}
        onAdd={(item) => addArrayItem('behavior_patterns.response_structure', item)}
        onRemove={(index) => removeArrayItem('behavior_patterns.response_structure', index)}
        onUpdate={(index, value) => updateArrayItem('behavior_patterns.response_structure', index, value)}
        placeholder="Thêm cấu trúc trả lời"
      />
    </div>

    <div className="form-group">
      <label>Phong cách dạy học</label>
      <ArrayEditor
        items={config.behavior_patterns.teaching_style}
        onAdd={(item) => addArrayItem('behavior_patterns.teaching_style', item)}
        onRemove={(index) => removeArrayItem('behavior_patterns.teaching_style', index)}
        onUpdate={(index, value) => updateArrayItem('behavior_patterns.teaching_style', index, value)}
        placeholder="Thêm phong cách dạy học"
      />
    </div>
  </div>
);

// UI Section
const UISection = ({ config, updateConfig }) => (
  <div className="config-section-content">
    <h3>🎨 Giao diện</h3>
    
    <div className="form-group">
      <label>Theme</label>
      <select
        value={config.ui.theme}
        onChange={(e) => updateConfig('ui.theme', e.target.value)}
      >
        <option value="dark">Dark</option>
        <option value="light">Light</option>
      </select>
    </div>

    <div className="form-group">
      <label>Primary Color</label>
      <input
        type="color"
        value={config.ui.primaryColor}
        onChange={(e) => updateConfig('ui.primaryColor', e.target.value)}
      />
      <input
        type="text"
        value={config.ui.primaryColor}
        onChange={(e) => updateConfig('ui.primaryColor', e.target.value)}
        placeholder="#10a37f"
        style={{ marginLeft: '10px', width: '100px' }}
      />
    </div>

    <div className="form-group">
      <label>Chat Placeholder</label>
      <input
        type="text"
        value={config.ui.chatPlaceholder}
        onChange={(e) => updateConfig('ui.chatPlaceholder', e.target.value)}
        placeholder="Placeholder cho chat input"
      />
    </div>

    <div className="form-group">
      <label>Upload Hint</label>
      <textarea
        value={config.ui.uploadHint}
        onChange={(e) => updateConfig('ui.uploadHint', e.target.value)}
        placeholder="Hướng dẫn upload file"
        rows="2"
      />
    </div>

    <div className="form-group">
      <label>Upload Tooltip</label>
      <input
        type="text"
        value={config.ui.uploadTooltip}
        onChange={(e) => updateConfig('ui.uploadTooltip', e.target.value)}
        placeholder="Tooltip nút upload"
      />
    </div>

    <div className="form-group">
      <label>Send Tooltip</label>
      <input
        type="text"
        value={config.ui.sendTooltip}
        onChange={(e) => updateConfig('ui.sendTooltip', e.target.value)}
        placeholder="Tooltip nút send"
      />
    </div>

    <div className="form-group">
      <label>Delete Image Tooltip</label>
      <input
        type="text"
        value={config.ui.deleteImageTooltip}
        onChange={(e) => updateConfig('ui.deleteImageTooltip', e.target.value)}
        placeholder="Tooltip nút xóa ảnh"
      />
    </div>
  </div>
);

export default ConfigManager; 