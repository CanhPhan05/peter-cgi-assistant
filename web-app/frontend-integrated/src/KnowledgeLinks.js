import React, { useState, useEffect } from 'react';
import config from './config.json';

const KnowledgeLinks = ({ apiUrl }) => {
  const [links, setLinks] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cacheInfo, setCacheInfo] = useState({});

  useEffect(() => {
    if (config.knowledge_links?.links) {
      setLinks(config.knowledge_links.links);
    }
  }, []);

  const testLink = async (url, type) => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/knowledge/test-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, type })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`✅ Link test successful!\nContent length: ${data.content_length} chars\nPreview: ${data.content_preview}`);
      } else {
        alert(`❌ Link test failed: ${data.error}`);
      }
    } catch (error) {
      alert(`❌ Error testing link: ${error.message}`);
    }
    setLoading(false);
  };

  const clearCache = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/knowledge/clear-cache`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`🗑️ ${data.message}`);
        setCacheInfo({ total_cached: 0 });
      }
    } catch (error) {
      alert(`❌ Error clearing cache: ${error.message}`);
    }
  };

  const fetchCacheInfo = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/knowledge/links`);
      const data = await response.json();
      
      if (data.success) {
        setCacheInfo(data.cache_info || {});
      }
    } catch (error) {
      console.error('Error fetching cache info:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCacheInfo();
    }
  }, [isOpen]);

  if (!config.knowledge_links?.enabled) {
    return null;
  }

  return (
    <div className="knowledge-links-widget">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="knowledge-toggle-btn"
        title="Manage Knowledge Links"
      >
        🔗 Knowledge ({links.filter(l => l.active).length})
      </button>

      {isOpen && (
        <div className="knowledge-panel">
          <div className="knowledge-header">
            <h3>🧠 Knowledge Base Links</h3>
            <div className="cache-info">
              <span>📦 Cached: {cacheInfo.total_cached || 0} items</span>
              <button onClick={clearCache} className="clear-cache-btn">
                🗑️ Clear Cache
              </button>
            </div>
          </div>

          <div className="knowledge-links-list">
            {links.map((link) => (
              <div key={link.id} className={`knowledge-link ${link.active ? 'active' : 'inactive'}`}>
                <div className="link-header">
                  <div className="link-info">
                    <strong>{link.title}</strong>
                    <span className={`priority ${link.priority}`}>{link.priority}</span>
                    <span className={`category ${link.category}`}>{link.category}</span>
                  </div>
                  <div className="link-controls">
                    <button 
                      onClick={() => testLink(link.url, link.type)}
                      disabled={loading}
                      className="test-btn"
                      title="Test Link"
                    >
                      🧪
                    </button>
                    <div className={`status-indicator ${link.active ? 'active' : 'inactive'}`}>
                      {link.active ? '🟢' : '🔴'}
                    </div>
                  </div>
                </div>
                
                <div className="link-details">
                  <p>{link.description}</p>
                  <div className="link-meta">
                    <span className="link-type">{link.type}</span>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="link-url">
                      {link.url}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="knowledge-footer">
            <p>💡 Edit links in <code>src/config.json</code> → <code>knowledge_links.links</code></p>
            <p>🔄 Changes auto-applied on app restart</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeLinks; 