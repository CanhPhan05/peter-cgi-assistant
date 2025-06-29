# 🔗 Knowledge Links System Guide

## 📋 Overview

Knowledge Links System cho phép Peter CGI Assistant truy cập và sử dụng external knowledge sources để đưa ra responses chính xác và up-to-date hơn.

## 🚀 Features

### ✅ **Core Capabilities:**
- **Auto-fetch content** từ public URLs, PDFs, Google Drive
- **Intelligent caching** with configurable duration
- **Priority-based processing** (high/medium/low)
- **Category organization** (tools, standards, inspiration, etc.)
- **Real-time content injection** vào AI system prompt
- **Link testing & validation** tools
- **Cache management** interface

### 🎯 **Supported Content Types:**
- **Web pages:** Documentation, articles, news
- **PDFs:** Research papers, guidelines, tutorials
- **Google Drive:** Shared documents and files
- **Documentation sites:** Official tool docs
- **Gallery/Portfolio sites:** Reference materials

## ⚙️ Configuration

### **Location:** `src/config.json` → `knowledge_links`

```json
{
  "knowledge_links": {
    "enabled": true,
    "auto_fetch": true,
    "cache_duration_hours": 24,
    "max_content_length": 50000,
    "links": [
      {
        "id": "unique_link_id",
        "title": "Display Name",
        "url": "https://example.com/page",
        "type": "web|pdf|documentation|gallery",
        "category": "tools|standards|inspiration|industry_trends",
        "description": "What this link provides",
        "priority": "high|medium|low",
        "active": true|false
      }
    ]
  }
}
```

### **Configuration Options:**

| Field | Type | Description |
|-------|------|-------------|
| `enabled` | boolean | Enable/disable entire system |
| `auto_fetch` | boolean | Automatically fetch content on chat |
| `cache_duration_hours` | number | How long to cache content |
| `max_content_length` | number | Max chars per link content |
| `links` | array | Array of knowledge link objects |

### **Link Object Fields:**

| Field | Required | Description | Examples |
|-------|----------|-------------|----------|
| `id` | ✅ | Unique identifier | `"blender_docs"` |
| `title` | ✅ | Display name | `"Blender Manual"` |
| `url` | ✅ | Target URL | `"https://docs.blender.org"` |
| `type` | ✅ | Content type | `web`, `pdf`, `documentation` |
| `category` | ✅ | Content category | `tools`, `standards`, `inspiration` |
| `description` | ✅ | What it provides | `"Complete rendering guide"` |
| `priority` | ✅ | Processing priority | `high`, `medium`, `low` |
| `active` | ✅ | Enable this link | `true`, `false` |

## 🎨 Examples

### **CGI Studio Setup:**
```json
{
  "links": [
    {
      "id": "studio_style_guide",
      "title": "Studio VFX Standards",
      "url": "https://drive.google.com/file/d/abc123/view",
      "type": "pdf",
      "category": "standards", 
      "description": "Internal quality standards and workflows",
      "priority": "high",
      "active": true
    },
    {
      "id": "blender_latest_features",
      "title": "Blender 4.0 Release Notes",
      "url": "https://wiki.blender.org/wiki/Reference/Release_Notes/4.0",
      "type": "documentation",
      "category": "tools",
      "description": "Latest Blender features and improvements",
      "priority": "medium", 
      "active": true
    }
  ]
}
```

### **Learning & Development:**
```json
{
  "links": [
    {
      "id": "siggraph_2024",
      "title": "SIGGRAPH 2024 Papers",
      "url": "https://s2024.siggraph.org/program/papers/",
      "type": "web",
      "category": "research",
      "description": "Latest computer graphics research",
      "priority": "high",
      "active": true
    },
    {
      "id": "cgi_portfolio_inspiration",
      "title": "Top CGI Artists Portfolio",
      "url": "https://www.artstation.com/channels/cgi",
      "type": "gallery",
      "category": "inspiration",
      "description": "High-quality CGI works for reference",
      "priority": "medium",
      "active": true
    }
  ]
}
```

## 🔧 Technical Implementation

### **Backend Processing:**
1. **Config Reception:** Frontend sends config to `/api/config/update`
2. **Link Processing:** Extract active links by priority
3. **Content Fetching:** HTTP requests with smart parsing
4. **Caching:** Store content with timestamp
5. **Prompt Injection:** Add to system prompt before AI call

### **Content Processing Pipeline:**
```
URL → HTTP Fetch → Content Extraction → Text Cleaning → Cache Storage → Prompt Injection
```

### **Caching Strategy:**
- **Memory cache** với Map() structure
- **TTL-based expiration** theo cache_duration_hours
- **Automatic refresh** khi cache expired
- **Manual cache clearing** via UI

## 🎮 Usage

### **1. Management UI:**
- Click **🔗 Knowledge (X)** button in chat header
- View all configured links with status
- Test individual links with 🧪 button
- Clear cache with 🗑️ button
- Monitor cache statistics

### **2. Link Testing:**
```javascript
// Test any URL via API
POST /api/knowledge/test-link
{
  "url": "https://example.com",
  "type": "web"
}
```

### **3. Cache Management:**
```javascript
// Clear all cached content
POST /api/knowledge/clear-cache

// Get cache statistics  
GET /api/knowledge/links
```

## 🎯 Best Practices

### **Link Selection:**
- ✅ Choose **authoritative sources** (official docs, research papers)
- ✅ Prefer **stable URLs** that won't change frequently
- ✅ Use **specific pages** rather than general homepages
- ✅ Mix **different content types** for comprehensive knowledge
- ❌ Avoid **dynamic/personalized content**
- ❌ Don't use **login-required pages**

### **Priority Guidelines:**
- **High:** Critical standards, style guides, current project docs
- **Medium:** Tool documentation, tutorials, industry news
- **Low:** Inspiration galleries, general reference materials

### **Performance Optimization:**
- Keep **max_content_length** reasonable (≤50k chars)
- Set appropriate **cache_duration** (24h for stable content)
- Limit **total active links** (≤10 for optimal performance)
- Test links regularly to ensure **availability**

## 🔍 Monitoring & Debugging

### **Backend Logs:**
```bash
# Success
🔗 Fetching content from: https://example.com
🔧 Config updated for AI: Peter

# Errors  
❌ Failed to fetch https://example.com: timeout
🗑️ Cleared knowledge cache (5 items)
```

### **API Endpoints:**
- `GET /api/config/current` - Check system status
- `GET /api/knowledge/links` - View links & cache info
- `POST /api/knowledge/test-link` - Test specific URL
- `POST /api/knowledge/clear-cache` - Reset cache

### **Common Issues & Solutions:**

| Issue | Cause | Solution |
|-------|-------|----------|
| Link not working | Invalid URL | Test with 🧪 button |
| Content not updated | Cache still valid | Clear cache manually |
| Slow responses | Too many links | Reduce active links |
| Fetch errors | Network/CORS issues | Check URL accessibility |
| Large content | Content too long | Adjust max_content_length |

## 🔄 Deployment & Updates

### **Development Workflow:**
1. **Edit config:** Modify `src/config.json`
2. **Test locally:** Use knowledge panel
3. **Deploy:** Push to Git for auto-deploy
4. **Monitor:** Check logs and performance

### **Production Maintenance:**
- **Regular testing:** Validate links monthly
- **Performance monitoring:** Watch response times
- **Content updates:** Refresh cache for critical links
- **Link rotation:** Update URLs as needed

## 🚀 Advanced Usage

### **Google Drive Integration:**
```json
{
  "id": "team_style_guide",
  "title": "Team Style Guide",
  "url": "https://drive.google.com/file/d/FILE_ID/view",
  "type": "pdf",
  "category": "standards",
  "description": "Team visual standards document",
  "priority": "high",
  "active": true
}
```

### **Documentation Scraping:**
```json
{
  "id": "unreal_docs", 
  "title": "Unreal Engine Documentation",
  "url": "https://docs.unrealengine.com/5.3/en-US/",
  "type": "documentation",
  "category": "tools",
  "description": "Complete UE5 documentation",
  "priority": "medium",
  "active": true
}
```

### **Multi-source Knowledge:**
```json
{
  "links": [
    {
      "id": "industry_standards",
      "url": "https://www.oscars.org/science-technology/sci-tech-projects/aces",
      "category": "standards",
      "priority": "high"
    },
    {
      "id": "latest_techniques", 
      "url": "https://www.fxguide.com/fxfeatured/",
      "category": "industry_trends",
      "priority": "medium"
    },
    {
      "id": "tool_tutorials",
      "url": "https://www.gnomon.edu/workshops",
      "category": "learning_resources", 
      "priority": "medium"
    }
  ]
}
```

## 💡 Future Enhancements

### **Planned Features:**
- **PDF text extraction** with pdf-parse library
- **Semantic search** within cached content
- **Content summarization** with AI
- **Link health monitoring** and alerts
- **Collaborative link sharing** between team members
- **AI-powered content relevance** scoring

### **Integration Ideas:**
- **Notion/Confluence** workspace integration
- **GitHub repositories** for code examples
- **YouTube transcripts** for video tutorials
- **RSS feeds** for industry news
- **Slack/Discord** knowledge sharing 