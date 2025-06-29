import React, { useState, useEffect } from 'react';
import './App.css';

// Backend API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// AuthContext
const AuthContext = React.createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for saved token on app load
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token with backend
      fetch(`${API_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUser(data.user);
        } else {
          localStorage.removeItem('token');
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
      })
      .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    if (data.success) {
      setUser(data.user);
      localStorage.setItem('token', data.token);
      return { success: true };
    } else {
      return { success: false, error: data.error };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Login Page
const LoginPage = () => {
  const { login } = React.useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(email, password);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>🤖 Peter CGI Assistant</h1>
          <p>Chuyên gia AI về CGI và chỉnh sửa ảnh</p>
          <p className="subtitle">Đăng nhập bằng tài khoản hệ thống chính</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder="Nhập email của bạn"
            />
          </div>

          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="Nhập password của bạn"
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Đang xác thực...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="login-info">
          <p>ℹ️ Sử dụng tài khoản từ hệ thống chính của bạn</p>
          <p>💡 Hỗ trợ: Liên hệ admin nếu cần trợ giúp</p>
        </div>
      </div>
    </div>
  );
};

// Chat Page
const ChatPage = () => {
  const { user, logout } = React.useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = React.useRef(null);

  const quickActions = [
    { label: '📊 Phân tích ảnh', prompt: 'Hãy phân tích chi tiết hình ảnh này về mặt kỹ thuật CGI và đưa ra nhận xét chuyên môn.' },
    { label: '💡 Gợi ý cải thiện', prompt: 'Đưa ra những gợi ý cụ thể để cải thiện chất lượng hình ảnh này.' },
    { label: '🎨 Workflow chuyên nghiệp', prompt: 'Hướng dẫn workflow chuyên nghiệp để tạo ra hiệu ứng tương tự.' },
    { label: '⚙️ Đánh giá kỹ thuật', prompt: 'Đánh giá các aspect kỹ thuật như lighting, texturing, và rendering.' },
    { label: '🏆 Tác động thị trường', prompt: 'Phân tích potential của ảnh này trong thị trường CGI hiện tại.' },
    { label: '🌟 Tiêu chuẩn ngành', prompt: 'So sánh với standards của các studio CGI hàng đầu thế giới.' }
  ];

  // Handle file upload
  const handleFileUpload = (files) => {
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) return;
    
    const newImages = imageFiles.map(file => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name
    }));
    
    setSelectedImages(prev => [...prev, ...newImages]);
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    handleFileUpload(files);
  };

  // Handle paste from clipboard
  const handlePaste = (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        const newImage = {
          file: blob,
          url: URL.createObjectURL(blob),
          name: `pasted-image-${Date.now()}.png`
        };
        setSelectedImages(prev => [...prev, newImage]);
        break;
      }
    }
  };

  // Remove selected image
  const removeImage = (index) => {
    setSelectedImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].url);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  // Upload images to backend
  const uploadImages = async (images) => {
    if (!images.length) return [];
    
    const formData = new FormData();
    images.forEach(img => formData.append('images', img.file));
    
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/images/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const data = await response.json();
    return data.success ? data.images : [];
  };

  const sendMessage = async (messageContent = input) => {
    if (!messageContent.trim() && selectedImages.length === 0) return;

    // Upload images first if any
    let imageUrls = [];  
    if (selectedImages.length > 0) {
      imageUrls = await uploadImages(selectedImages);
    }

    const newMessage = { 
      role: 'user', 
      content: messageContent,
      images: imageUrls 
    };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInput('');
    setSelectedImages([]);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          messages: updatedMessages,
          model: 'gpt-4o',
          conversationId
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessages([...updatedMessages, { role: 'assistant', content: data.content }]);
        if (data.conversationId && !conversationId) {
          setConversationId(data.conversationId);
        }
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages([...updatedMessages, { 
        role: 'assistant', 
        content: `❌ Lỗi: ${error.message}` 
      }]);
    }

    setLoading(false);
  };

  // Add paste event listener
  React.useEffect(() => {
    const handlePasteEvent = (e) => {
      // Check if clipboard contains images
      const items = e.clipboardData.items;
      let hasImage = false;
      
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          hasImage = true;
          break;
        }
      }
      
      // If has image, handle it regardless of target
      if (hasImage) {
        e.preventDefault(); // Prevent default paste behavior
        handlePaste(e);
      }
    };
    
    document.addEventListener('paste', handlePasteEvent);
    return () => document.removeEventListener('paste', handlePasteEvent);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickAction = (prompt) => {
    sendMessage(prompt);
  };

  return (
    <div className="chat-page">
      <div className="chat-header">
        <div className="header-info">
          <h1>🤖 Peter CGI Assistant</h1>
          <p>Xin chào <strong>{user?.name || user?.email}</strong>!</p>
        </div>
        <button onClick={logout} className="logout-button">
          Đăng xuất
        </button>
      </div>

      <div className="chat-container">
        <div className="messages-container">
          {messages.length === 0 && (
            <div className="welcome-message">
              <h3>👋 Chào mừng đến với Peter CGI Assistant!</h3>
              <p>Tôi là Peter, chuyên gia CGI với nhiều năm kinh nghiệm. Tôi có thể giúp bạn:</p>
              <ul>
                <li>📊 Phân tích và đánh giá chất lượng hình ảnh CGI</li>
                <li>💡 Đưa ra gợi ý cải thiện kỹ thuật</li>
                <li>🎨 Hướng dẫn workflow chuyên nghiệp</li>
                <li>⚙️ Tư vấn về lighting, texturing, rendering</li>
                <li>🏆 So sánh với tiêu chuẩn ngành</li>
              </ul>
              <p>Hãy upload ảnh hoặc hỏi bất cứ điều gì về CGI nhé! 🚀</p>
            </div>
          )}

          {messages.map((message, index) => (
            <div key={index} className={`message ${message.role}`}>
              <div className="message-content">
                {message.images && message.images.length > 0 && (
                  <div className="message-images">
                    {message.images.map((img, imgIndex) => (
                      <img 
                        key={imgIndex} 
                        src={img.url || img.original_url} 
                        alt={`Uploaded ${imgIndex + 1}`}
                        className="message-image"
                      />
                    ))}
                  </div>
                )}
                <div>{message.content}</div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="message assistant">
              <div className="typing-indicator">
                Peter đang soạn tin nhắn...
              </div>
            </div>
          )}
        </div>

        <div className="quick-actions">
          <div className="quick-actions-label">⚡ Quick Actions:</div>
          <div className="quick-actions-buttons">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleQuickAction(action.prompt)}
                className="quick-action-button"
                disabled={loading}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>

        <div 
          className={`chat-input-area ${dragOver ? 'drag-over' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Selected Images Preview */}
          {selectedImages.length > 0 && (
            <div className="selected-images">
              <div className="selected-images-label">🖼️ Ảnh đã chọn ({selectedImages.length}):</div>
              <div className="selected-images-grid">
                {selectedImages.map((img, index) => (
                  <div key={index} className="selected-image">
                    <img src={img.url} alt={img.name} />
                    <button 
                      type="button"
                      onClick={() => removeImage(index)}
                      className="remove-image-btn"
                    >
                      ❌
                    </button>
                    <div className="image-name">{img.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Drag & Drop Overlay */}
          {dragOver && (
            <div className="drag-overlay">
              <div className="drag-message">
                📂 Thả ảnh vào đây để upload!
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="message-form">
            <div className="input-row">
              <textarea
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  // Auto-expand textarea
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
                }}
                placeholder="Hỏi Peter về CGI... hoặc Ctrl+V để paste ảnh"
                disabled={loading}
                className="message-input"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFileUpload(e.target.files)}
                accept="image/*"
                multiple
                style={{ display: 'none' }}
              />
              
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="upload-button"
                disabled={loading}
                title="Đính kèm tài liệu, hình ảnh"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
              
              <button 
                type="submit" 
                disabled={loading || (!input.trim() && selectedImages.length === 0)} 
                className="send-button"
                title="Gửi tin nhắn"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22,2 15,22 11,13 2,9 22,2"/>
                </svg>
              </button>
            </div>
          </form>

          <div className="upload-hints">
            💡 <strong>Đính kèm file:</strong> 
            <span>Kéo thả ảnh • Ctrl+V paste ảnh • Click nút +</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App
const App = () => {
  return (
    <AuthProvider>
      <div className="App">
        <AuthContext.Consumer>
          {({ user, loading }) => {
            if (loading) {
              return (
                <div className="loading-screen">
                  <div className="spinner"></div>
                  <p>Đang tải...</p>
                </div>
              );
            }
            
            return user ? <ChatPage /> : <LoginPage />;
          }}
        </AuthContext.Consumer>
      </div>
    </AuthProvider>
  );
};

export default App; 