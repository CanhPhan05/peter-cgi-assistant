import React, { useState, useEffect } from 'react';
import './App.css';
import config from './config.json';
import Avatar from './Avatar';

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
          <div className="login-avatar-section">
            <Avatar size="large" />
            <div className="login-title-section">
              <h1>{config.ai.fullName}</h1>
              <p>{config.ai.description}</p>
              <p className="subtitle">{config.ai.subtitle}</p>
            </div>
          </div>
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
  const messagesEndRef = React.useRef(null);

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
          model: config.ai.model,
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

  // Scroll to bottom function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto scroll when messages change
  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    setInput(prompt); // Just fill the input, don't send immediately
  };

  return (
    <div className="chat-page">
      <div className="chat-header">
        <div className="header-info">
          <div className="chat-avatar-section">
            <Avatar size="normal" />
            <div className="chat-title-section">
              <h1>{config.ai.name}</h1>
              <p>Xin chào <strong>{user?.name || user?.email}</strong>!</p>
            </div>
          </div>
        </div>
        <button onClick={logout} className="logout-button">
          Đăng xuất
        </button>
      </div>

      <div className="chat-container">
        <div className="messages-container">
          {messages.length === 0 && (
            <div className="welcome-message">
              <h3>{config.ai.welcomeTitle}</h3>
              <p>{config.ai.welcomeDescription}</p>
              <ul>
                {config.ai.capabilities.map((capability, index) => (
                  <li key={index}>{capability}</li>
                ))}
              </ul>
              <p>{config.ai.welcomeFooter}</p>
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
                {config.ai.typingMessage}
              </div>
            </div>
          )}
          
          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
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
                      title={config.ui.deleteImageTooltip}
                    >
                      ✕
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
                placeholder={config.ui.chatPlaceholder}
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
                title={config.ui.uploadTooltip}
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
                title={config.ui.sendTooltip}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22,2 15,22 11,13 2,9 22,2"/>
                </svg>
              </button>
            </div>
          </form>

          {/* Grok-style Quick Actions - Always show below input */}
          <div className="grok-quick-actions">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleQuickAction(action.prompt)}
                className="grok-action-button"
                disabled={loading}
              >
                {action.label}
              </button>
            ))}
          </div>

          <div className="upload-hints">
            {config.ui.uploadHint.split('**').map((part, index) => 
              index % 2 === 1 ? <strong key={index}>{part}</strong> : part
            )}
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