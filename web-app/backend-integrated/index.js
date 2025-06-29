require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const { OpenAI } = require('openai');
const multer = require('multer');
const sharp = require('sharp');
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

// External Login API Configuration (from login-modules)
const EXTERNAL_API_URL = 'http://14.225.218.11:5050/login';

// Database connection with IPv6 fix
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 10,
  application_name: 'peter-cgi-assistant'
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'https://peter-cgi.vercel.app'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100
});
app.use('/api', limiter);

// Generate machine ID (từ login-modules logic)
const generateMachineId = (userAgent, ip) => {
  const combined = `${userAgent}-${ip}-${Date.now()}`;
  return crypto.createHash('sha256').update(combined).digest('hex');
};

// Dynamic system prompt generation from config
const generateSystemPrompt = async (config, includeKnowledgeLinks = true) => {
  if (!config || !config.personality || !config.expertise) {
    // Fallback to original prompt if config missing
    return `Bạn là Peter, chuyên gia CGI và chỉnh sửa ảnh chuyên nghiệp với nhiều năm kinh nghiệm.

TÍNH CÁCH: Thân thiện, nhiệt tình, giải thích dễ hiểu, sử dụng emoji phù hợp, trả lời bằng tiếng Việt tự nhiên.

CHUYÊN MÔN: CGI, Photo manipulation, Color grading, Lighting, Texture design, Rendering, Adobe Photoshop workflows, Digital art.

CÁCH TRẢ LỜI: Phân tích chi tiết và chuyên nghiệp, đưa ra gợi ý cụ thể có thể thực hiện, giải thích lý do, hướng dẫn từng bước, khuyến khích thử nghiệm sáng tạo.

QUALITY REFERENCES: Tham khảo standards từ top studios như DBOX, Binyan Studios, The Boundary, và các CGI houses hàng đầu thế giới.`;
  }

  const { ai, personality, expertise, knowledge_sources, behavior_patterns } = config;

  let prompt = `Bạn là ${ai.name}, ${personality.role} với ${personality.experience}.

## TÍNH CÁCH & PHONG CÁCH GIAO TIẾP:
${personality.characteristics.map(char => `• ${char}`).join('\n')}

Phong cách: ${personality.communication_style.tone}
Cách tiếp cận: ${personality.communication_style.approach}
Ngôn ngữ: ${personality.communication_style.language}
Format: ${personality.communication_style.format}

## CHUYÊN MÔN CORE:
${expertise.primary_skills.map(skill => `• ${skill}`).join('\n')}

## LĨNH VỰC CHUYÊN BIỆT:
${expertise.specialized_areas.map(area => `• ${area}`).join('\n')}

## TOOLS & SOFTWARE MASTERY:
• Modeling: ${expertise.software_proficiency.modeling.join(', ')}
• Texturing: ${expertise.software_proficiency.texturing.join(', ')}
• Rendering: ${expertise.software_proficiency.rendering.join(', ')}
• Compositing: ${expertise.software_proficiency.compositing.join(', ')}
• Real-time: ${expertise.software_proficiency.realtime.join(', ')}
• AI Tools: ${expertise.software_proficiency.ai_tools.join(', ')}

## KNOWLEDGE BASE & REFERENCES:
Industry Standards: ${knowledge_sources.industry_standards.join(', ')}
Learning Resources: ${knowledge_sources.learning_resources.join(', ')}
Industry News: ${knowledge_sources.industry_news.join(', ')}
Research Papers: ${knowledge_sources.research_papers.join(', ')}

## PHƯƠNG PHÁP PHÂN TÍCH:
${behavior_patterns.analysis_approach.map(approach => `• ${approach}`).join('\n')}

## CẤU TRÚC TRẢ LỜI:
${behavior_patterns.response_structure.map(structure => `• ${structure}`).join('\n')}

## PHONG CÁCH DẠY HỌC:
${behavior_patterns.teaching_style.map(style => `• ${style}`).join('\n')}

Luôn nhớ: Bạn là expert với deep knowledge, friendly approach, và focus vào practical actionable advice.`;

  // Add knowledge links content if enabled
  if (includeKnowledgeLinks) {
    try {
      const knowledgeContent = await processKnowledgeLinks(config);
      if (knowledgeContent.trim()) {
        prompt += knowledgeContent;
      }
    } catch (error) {
      console.error('Error processing knowledge links:', error);
    }
  }

  return prompt;
};

// Store current config (will be updated from frontend)
let currentConfig = null;
let knowledgeCache = new Map(); // Cache for fetched link content

// Knowledge links processing
const fetchLinkContent = async (url, type) => {
  try {
    console.log(`🔗 Fetching content from: ${url}`);
    
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PeterCGI-Assistant/1.0)'
      }
    });

    let content = '';
    
    if (type === 'pdf') {
      // For PDFs, we'd need additional processing (pdf-parse library)
      content = `PDF Content from ${url} - [Processing required]`;
    } else if (type === 'web' || type === 'documentation') {
      // Extract text from HTML (basic implementation)
      const htmlContent = response.data;
      // Remove HTML tags and get clean text
      content = htmlContent
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 5000); // Limit content length
    }
    
    return content;
  } catch (error) {
    console.error(`❌ Failed to fetch ${url}:`, error.message);
    return `[Content unavailable from ${url}]`;
  }
};

const processKnowledgeLinks = async (config) => {
  if (!config?.knowledge_links?.enabled || !config.knowledge_links.links) {
    return '';
  }

  const { links, cache_duration_hours = 24 } = config.knowledge_links;
  const activeLinks = links.filter(link => link.active);
  
  let knowledgeContent = '\n## KNOWLEDGE BASE REFERENCES:\n';
  
  for (const link of activeLinks) {
    const cacheKey = `${link.id}_${link.url}`;
    const cached = knowledgeCache.get(cacheKey);
    
    // Check if cache is still valid
    if (cached && (Date.now() - cached.timestamp) < (cache_duration_hours * 60 * 60 * 1000)) {
      knowledgeContent += `\n### ${link.title}:\n${cached.content}\n`;
      continue;
    }
    
    // Fetch fresh content
    const content = await fetchLinkContent(link.url, link.type);
    
    // Cache the content
    knowledgeCache.set(cacheKey, {
      content,
      timestamp: Date.now(),
      metadata: {
        title: link.title,
        category: link.category,
        priority: link.priority
      }
    });
    
    knowledgeContent += `\n### ${link.title} (${link.category}):\n${content}\n`;
  }
  
  return knowledgeContent;
};

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// ============ CONFIG MANAGEMENT ============

// Update config from frontend
app.post('/api/config/update', (req, res) => {
  try {
    const { config } = req.body;
    
    if (!config) {
      return res.status(400).json({ error: 'Config is required' });
    }

    // Validate config structure
    if (!config.ai || !config.personality || !config.expertise) {
      return res.status(400).json({ error: 'Invalid config structure' });
    }

    currentConfig = config;
    console.log(`🔧 Config updated for AI: ${config.ai.name}`);

    res.json({ 
      success: true, 
      message: 'Config updated successfully',
      ai_name: config.ai.name 
    });

  } catch (error) {
    console.error('Config update error:', error);
    res.status(500).json({ error: 'Failed to update config' });
  }
});

// Get current config (optional - for debugging)
app.get('/api/config/current', (req, res) => {
  res.json({
    success: true,
    hasConfig: !!currentConfig,
    aiName: currentConfig?.ai?.name || 'Unknown',
    knowledgeLinksEnabled: currentConfig?.knowledge_links?.enabled || false,
    activeLinksCount: currentConfig?.knowledge_links?.links?.filter(l => l.active)?.length || 0
  });
});

// Knowledge Links Management
app.get('/api/knowledge/links', (req, res) => {
  try {
    if (!currentConfig?.knowledge_links) {
      return res.json({
        success: true,
        links: [],
        enabled: false
      });
    }

    res.json({
      success: true,
      enabled: currentConfig.knowledge_links.enabled,
      links: currentConfig.knowledge_links.links,
      cache_info: {
        total_cached: knowledgeCache.size,
        cache_duration_hours: currentConfig.knowledge_links.cache_duration_hours
      }
    });

  } catch (error) {
    console.error('Get knowledge links error:', error);
    res.status(500).json({ error: 'Failed to get knowledge links' });
  }
});

// Test knowledge link content fetch
app.post('/api/knowledge/test-link', async (req, res) => {
  try {
    const { url, type } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log(`🧪 Testing link: ${url}`);
    const content = await fetchLinkContent(url, type || 'web');

    res.json({
      success: true,
      url,
      type,
      content_length: content.length,
      content_preview: content.substring(0, 500) + (content.length > 500 ? '...' : ''),
      full_content: content
    });

  } catch (error) {
    console.error('Test link error:', error);
    res.status(500).json({ error: 'Failed to test link' });
  }
});

// Clear knowledge cache
app.post('/api/knowledge/clear-cache', (req, res) => {
  try {
    const cacheSize = knowledgeCache.size;
    knowledgeCache.clear();
    
    console.log(`🗑️ Cleared knowledge cache (${cacheSize} items)`);
    
    res.json({
      success: true,
      message: `Cleared ${cacheSize} cached items`,
      cache_size: knowledgeCache.size
    });

  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

// ============ EXTERNAL AUTH INTEGRATION ============

// Login với external API
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email và password là bắt buộc' });
    }

    // Generate device ID cho web client
    const userAgent = req.headers['user-agent'] || '';
    const clientIP = req.ip || req.connection.remoteAddress;
    const deviceId = generateMachineId(userAgent, clientIP);

    // Call external API
    try {
      console.log('🔐 Calling external login API:', EXTERNAL_API_URL);
      
      const response = await axios.post(EXTERNAL_API_URL, {
        username: email,
        password: password
      }, {
        headers: {
          'Device-ID': deviceId,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      if (response.status === 200) {
        // Login thành công
        console.log('✅ External login successful for:', email);

        // Tạo user object (không lưu vào DB, chỉ lưu trong token)
        const user = {
          id: crypto.createHash('md5').update(email).digest('hex'), // Hash email làm ID
          email: email,
          name: email.split('@')[0], // Dùng phần trước @ làm tên
          deviceId: deviceId,
          loginTime: new Date()
        };

        // Generate JWT token
        const token = jwt.sign(
          { 
            id: user.id, 
            email: user.email,
            deviceId: deviceId
          },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );

        res.json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            createdAt: user.loginTime
          },
          token,
          message: 'Đăng nhập thành công từ hệ thống chính!'
        });

      } else {
        throw new Error('Unexpected response status');
      }

    } catch (externalError) {
      console.error('❌ External API error:', externalError.message);
      
      if (externalError.response) {
        const status = externalError.response.status;
        const data = externalError.response.data;
        
        if (status === 403) {
          return res.status(403).json({ 
            error: data.message || 'Bạn cần mua license để sử dụng. Vui lòng liên hệ admin.' 
          });
        } else {
          return res.status(401).json({ 
            error: data.message || 'Email hoặc password không đúng' 
          });
        }
      } else {
        return res.status(503).json({ 
          error: 'Không thể kết nối với server xác thực. Vui lòng thử lại sau.' 
        });
      }
    }

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Đăng nhập thất bại' });
  }
});

// Get profile (không cần database, lấy từ token)
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    // Thông tin user đã có trong token
    const user = {
      id: req.user.id,
      email: req.user.email,
      name: req.user.email.split('@')[0],
      createdAt: new Date() // Fake created date
    };

    res.json({
      success: true,
      user: user
    });

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Không thể lấy thông tin profile' });
  }
});

// Update API key cho user
app.put('/api/auth/api-key', authenticateToken, async (req, res) => {
  try {
    const { apiKey } = req.body;
    const userId = req.user.id;

    if (!apiKey || !apiKey.startsWith('sk-')) {
      return res.status(400).json({ error: 'API Key không hợp lệ' });
    }

    // Lưu API key vào bảng user_settings thay vì users table
    await pool.query(`
      INSERT INTO user_settings (user_id, api_key, updated_at) 
      VALUES ($1, $2, NOW()) 
      ON CONFLICT (user_id) 
      DO UPDATE SET api_key = $2, updated_at = NOW()
    `, [userId, apiKey]);

    res.json({ success: true, message: 'API Key đã được cập nhật' });

  } catch (error) {
    console.error('Update API key error:', error);
    res.status(500).json({ error: 'Không thể cập nhật API key' });
  }
});

// ============ CHAT ROUTES ============

// Send message to AI
app.post('/api/chat/send', authenticateToken, async (req, res) => {
  try {
    const { messages, model = 'gpt-4o', conversationId } = req.body;
    const userId = req.user.id;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages are required' });
    }

    // Get user's API key
    let userApiKey = null;
    try {
      const apiKeyResult = await pool.query('SELECT api_key FROM user_settings WHERE user_id = $1', [userId]);
      userApiKey = apiKeyResult.rows[0]?.api_key;
    } catch (err) {
      console.log('No API key found for user, using default');
    }
    
    const apiKey = userApiKey || process.env.DEFAULT_OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ 
        error: 'OpenAI API Key chưa được cấu hình. Vui lòng thêm API key trong Settings.' 
      });
    }

    // Initialize OpenAI
    const openai = new OpenAI({ apiKey });

    // Get or create conversation
    let conversation;
    if (conversationId) {
      const convResult = await pool.query(
        'SELECT id FROM conversations WHERE id = $1 AND user_id = $2',
        [conversationId, userId]
      );
      conversation = convResult.rows[0];
    }

    if (!conversation) {
      // Create new conversation
      const convResult = await pool.query(
        'INSERT INTO conversations (user_id, title, user_email) VALUES ($1, $2, $3) RETURNING id',
        [userId, messages[messages.length - 1]?.content?.substring(0, 50) || 'New Chat with Images', req.user.email]
      );
      conversation = convResult.rows[0];
    }

    // Generate dynamic system prompt from config with knowledge links
    const systemPrompt = await generateSystemPrompt(currentConfig);
    
    // Prepare messages for OpenAI with image support
    const apiMessages = [
      { role: 'system', content: systemPrompt }
    ];

    // Convert messages to OpenAI format with vision support
    for (const msg of messages) {
      if (msg.role === 'user') {
        const messageContent = [];
        
        // Add text content
        if (msg.content && msg.content.trim()) {
          messageContent.push({
            type: 'text',
            text: msg.content
          });
        }
        
        // Add images if available
        if (msg.images && msg.images.length > 0) {
          for (const image of msg.images) {
            messageContent.push({
              type: 'image_url',
              image_url: {
                url: image.url || image.original_url,
                detail: 'high'
              }
            });
          }
        }

        // Only add message if it has content
        if (messageContent.length > 0) {
          apiMessages.push({
            role: 'user',
            content: messageContent
          });
        }
      } else {
        // Assistant messages
        apiMessages.push({
          role: msg.role,
          content: msg.content
        });
      }
    }

    console.log('🖼️ Sending to OpenAI with', apiMessages.length, 'messages');
    
    // Call OpenAI with vision support
    const completion = await openai.chat.completions.create({
      model: model, // gpt-4o supports vision
      messages: apiMessages,
      max_tokens: 2000,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0].message.content;

    // Save messages to database
    const userMessage = messages[messages.length - 1];
    
    // Save images metadata separately if exists
    let imageIds = [];
    if (userMessage.images && userMessage.images.length > 0) {
      for (const image of userMessage.images) {
        const imageResult = await pool.query(
          'INSERT INTO images (filename, original_url, size, width, height, content_type, user_id, user_email) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
          [
            image.filename || 'uploaded-image.jpg',
            image.url || image.original_url,
            image.size || 0,
            image.width || 0,
            image.height || 0,
            'image/jpeg',
            userId,
            req.user.email
          ]
        );
        imageIds.push(imageResult.rows[0].id);
      }
    }

    // Save user message with image references
    await pool.query(
      'INSERT INTO messages (conversation_id, role, content, image_ids, user_email) VALUES ($1, $2, $3, $4, $5)',
      [conversation.id, userMessage.role, userMessage.content, imageIds.length > 0 ? imageIds : null, req.user.email]
    );

    const aiMessageResult = await pool.query(
      'INSERT INTO messages (conversation_id, role, content, user_email) VALUES ($1, $2, $3, $4) RETURNING id',
      [conversation.id, 'assistant', aiResponse, req.user.email]
    );

    res.json({
      success: true,
      content: aiResponse,
      conversationId: conversation.id,
      messageId: aiMessageResult.rows[0].id,
      usage: completion.usage,
      processedImages: userMessage.images ? userMessage.images.length : 0
    });

  } catch (error) {
    console.error('Chat error:', error);
    
    if (error.status === 401) {
      return res.status(401).json({ error: 'OpenAI API Key không hợp lệ' });
    }
    
    if (error.status === 429) {
      return res.status(429).json({ error: 'Đã vượt quá giới hạn API. Vui lòng thử lại sau.' });
    }

    res.status(500).json({ 
      error: error.message || 'Đã xảy ra lỗi khi xử lý tin nhắn' 
    });
  }
});

// Get conversations for user
app.get('/api/chat/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const result = await pool.query(`
      SELECT 
        c.id, 
        c.title, 
        c.created_at, 
        c.updated_at,
        c.user_email,
        COUNT(m.id) as message_count,
        (
          SELECT json_build_object(
            'content', content,
            'role', role,
            'created_at', created_at
          )
          FROM messages 
          WHERE conversation_id = c.id 
          ORDER BY created_at DESC 
          LIMIT 1
        ) as last_message
      FROM conversations c
      LEFT JOIN messages m ON c.id = m.conversation_id
      WHERE c.user_id = $1
      GROUP BY c.id
      ORDER BY c.updated_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, parseInt(limit), offset]);

    res.json({
      success: true,
      conversations: result.rows.map(conv => ({
        id: conv.id,
        title: conv.title,
        createdAt: conv.created_at,
        updatedAt: conv.updated_at,
        userEmail: conv.user_email,
        messageCount: parseInt(conv.message_count),
        lastMessage: conv.last_message
      }))
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Không thể tải conversations' });
  }
});

// Get specific conversation
app.get('/api/chat/conversations/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get conversation
    const convResult = await pool.query(
      'SELECT id, title, created_at, updated_at, user_email FROM conversations WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (convResult.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Get messages
    const messagesResult = await pool.query(
      'SELECT id, role, content, created_at FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
      [id]
    );

    const conversation = convResult.rows[0];

    res.json({
      success: true,
      conversation: {
        ...conversation,
        messages: messagesResult.rows.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.created_at
        }))
      }
    });

  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Không thể tải conversation' });
  }
});

// ============ IMAGES ROUTES ============
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

app.post('/api/images/upload', authenticateToken, upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No images uploaded' });
    }

    const processedImages = [];

    for (const file of req.files) {
      // Process image với Sharp
      const processedBuffer = await sharp(file.buffer)
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();

      // Convert to base64
      const base64 = processedBuffer.toString('base64');
      const dataUrl = `data:image/jpeg;base64,${base64}`;

      // Get image metadata
      const metadata = await sharp(processedBuffer).metadata();

      // Save to database with user info
      const result = await pool.query(`
        INSERT INTO images (filename, original_url, size, width, height, content_type, user_id, user_email)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, filename, original_url, size, width, height
      `, [
        file.originalname,
        dataUrl,
        processedBuffer.length,
        metadata.width,
        metadata.height,
        'image/jpeg',
        req.user.id,
        req.user.email
      ]);

      processedImages.push({
        id: result.rows[0].id,
        filename: result.rows[0].filename,
        url: dataUrl, // This is the base64 data URL
        original_url: dataUrl,
        size: result.rows[0].size,
        width: result.rows[0].width,
        height: result.rows[0].height
      });
    }

    res.json({
      success: true,
      images: processedImages
    });

  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// ============ HEALTH CHECK ============
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Peter CGI Assistant API - Integrated',
    version: '2.1.0',
    externalAuth: EXTERNAL_API_URL,
    features: ['external-login', 'no-registration', 'device-tracking']
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Peter CGI Assistant API - Integrated',
    version: '2.1.0'
  });
});

// Test external API connection
app.get('/api/test-external', async (req, res) => {
  try {
    const response = await axios.get('http://14.225.218.11:5050/', { timeout: 5000 });
    res.json({
      status: 'External API reachable',
      response: response.status
    });
  } catch (error) {
    res.status(503).json({
      status: 'External API unreachable',
      error: error.message
    });
  }
});

// Default route
app.get('/', (req, res) => {
  res.json({
    message: '🤖 Peter CGI Assistant API - Integrated with External Auth!',
    version: '2.1.0',
    features: {
      externalAuth: '✅ Tích hợp với hệ thống login hiện có',
      noRegistration: '✅ Không cần đăng ký mới',
      deviceTracking: '✅ Device ID tracking',
      aiChat: '✅ Peter AI Chat',
      imageAnalysis: '✅ Image upload & analysis'
    },
    endpoints: {
      auth: '/api/auth/login (external)',
      chat: '/api/chat/*', 
      images: '/api/images/*',
      health: '/health',
      testExternal: '/api/test-external'
    },
    externalAPI: EXTERNAL_API_URL
  });
});

// ============ ADMIN SYSTEM ============

// Admin credentials (sẽ được lưu trong database sau)
const ADMIN_CREDENTIALS = {
  email: 'admin@gmail.com',
  password: 'Admin', // Will be hashed in production
  canChangePassword: true
};

// Admin authentication
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email và password là bắt buộc' });
    }

    // Check admin credentials
    if (email.toLowerCase() !== ADMIN_CREDENTIALS.email.toLowerCase() || 
        password !== ADMIN_CREDENTIALS.password) {
      return res.status(401).json({ error: 'Email hoặc password admin không đúng' });
    }

    // Generate admin JWT token
    const adminToken = jwt.sign(
      { 
        id: 'admin',
        email: ADMIN_CREDENTIALS.email,
        role: 'admin'
      },
      process.env.JWT_SECRET + '_ADMIN', // Different secret for admin
      { expiresIn: '24h' } // Shorter expiry for admin
    );

    res.json({
      success: true,
      message: 'Đăng nhập admin thành công',
      token: adminToken,
      admin: {
        email: ADMIN_CREDENTIALS.email,
        role: 'admin',
        canChangePassword: ADMIN_CREDENTIALS.canChangePassword
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Đăng nhập admin thất bại' });
  }
});

// Admin auth middleware
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Admin access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET + '_ADMIN', (err, admin) => {
    if (err || admin.role !== 'admin') {
      return res.status(403).json({ error: 'Invalid admin token' });
    }
    req.admin = admin;
    next();
  });
};

// Change admin password
app.put('/api/admin/change-password', authenticateAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password và new password là bắt buộc' });
    }

    if (currentPassword !== ADMIN_CREDENTIALS.password) {
      return res.status(401).json({ error: 'Current password không đúng' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password phải ít nhất 6 ký tự' });
    }

    // Update admin password (in production, this should be saved to database)
    ADMIN_CREDENTIALS.password = newPassword;

    res.json({
      success: true,
      message: 'Đổi password admin thành công'
    });

  } catch (error) {
    console.error('Change admin password error:', error);
    res.status(500).json({ error: 'Không thể đổi password admin' });
  }
});

// ============ CONFIG MANAGEMENT ADMIN APIs ============

// Load config from file
const loadConfigFromFile = async () => {
  try {
    const configPath = path.join(__dirname, '../frontend-integrated/src/config.json');
    const configData = await fs.readFile(configPath, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.error('Failed to load config file:', error);
    return null;
  }
};

// Save config to file
const saveConfigToFile = async (config) => {
  try {
    const configPath = path.join(__dirname, '../frontend-integrated/src/config.json');
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Failed to save config file:', error);
    return false;
  }
};

// Get full config for admin
app.get('/api/admin/config', authenticateAdmin, async (req, res) => {
  try {
    const config = await loadConfigFromFile();
    if (!config) {
      return res.status(500).json({ error: 'Không thể load config file' });
    }

    res.json({
      success: true,
      config: config
    });

  } catch (error) {
    console.error('Get admin config error:', error);
    res.status(500).json({ error: 'Không thể lấy config' });
  }
});

// Update full config
app.put('/api/admin/config', authenticateAdmin, async (req, res) => {
  try {
    const { config } = req.body;

    if (!config) {
      return res.status(400).json({ error: 'Config is required' });
    }

    // Validate basic config structure
    if (!config.ai || !config.personality || !config.expertise) {
      return res.status(400).json({ error: 'Invalid config structure' });
    }

    // Save to file
    const saved = await saveConfigToFile(config);
    if (!saved) {
      return res.status(500).json({ error: 'Không thể lưu config file' });
    }

    // Update current config in memory
    currentConfig = config;

    res.json({
      success: true,
      message: 'Config đã được cập nhật thành công',
      ai_name: config.ai.name
    });

  } catch (error) {
    console.error('Update admin config error:', error);
    res.status(500).json({ error: 'Không thể cập nhật config' });
  }
});

// ============ KNOWLEDGE LINKS ADMIN APIs ============

// Get all knowledge links with detailed info
app.get('/api/admin/knowledge-links', authenticateAdmin, async (req, res) => {
  try {
    const config = await loadConfigFromFile();
    if (!config?.knowledge_links) {
      return res.json({
        success: true,
        enabled: false,
        links: [],
        categories: getDefaultCategories(),
        cache_info: { total_cached: 0 }
      });
    }

    // Get cache info for each link
    const linksWithCache = config.knowledge_links.links.map(link => {
      const cacheKey = `${link.id}_${link.url}`;
      const cached = knowledgeCache.get(cacheKey);
      
      return {
        ...link,
        cache_status: cached ? {
          cached: true,
          timestamp: cached.timestamp,
          age_hours: Math.round((Date.now() - cached.timestamp) / (1000 * 60 * 60) * 100) / 100,
          content_length: cached.content?.length || 0
        } : {
          cached: false
        }
      };
    });

    res.json({
      success: true,
      enabled: config.knowledge_links.enabled,
      auto_fetch: config.knowledge_links.auto_fetch,
      cache_duration_hours: config.knowledge_links.cache_duration_hours,
      links: linksWithCache,
      categories: config.knowledge_links.categories || getDefaultCategories(),
      cache_info: {
        total_cached: knowledgeCache.size
      }
    });

  } catch (error) {
    console.error('Get admin knowledge links error:', error);
    res.status(500).json({ error: 'Không thể lấy knowledge links' });
  }
});

// Helper function for default categories
const getDefaultCategories = () => ({
  'tools': { name: 'Công cụ & Phần mềm', icon: '🛠️', description: 'Phần mềm và công cụ CGI chuyên nghiệp' },
  'standards': { name: 'Tiêu chuẩn & Quy tắc', icon: '📏', description: 'Tiêu chuẩn ngành và quy tắc chất lượng' },
  'inspiration': { name: 'Cảm hứng & Tham khảo', icon: '🎨', description: 'Portfolio và tác phẩm tham khảo' },
  'industry_trends': { name: 'Xu hướng ngành', icon: '📈', description: 'Tin tức và xu hướng mới nhất' },
  'tutorials': { name: 'Hướng dẫn & Khóa học', icon: '📚', description: 'Tài liệu học tập và hướng dẫn' },
  'general': { name: 'Chung', icon: '📋', description: 'Tài liệu tổng hợp khác' }
});

// Update categories
app.put('/api/admin/knowledge-links/categories', authenticateAdmin, async (req, res) => {
  try {
    const { categories } = req.body;

    if (!categories || typeof categories !== 'object') {
      return res.status(400).json({ error: 'Categories object is required' });
    }

    const config = await loadConfigFromFile();
    if (!config) {
      return res.status(500).json({ error: 'Không thể load config' });
    }

    // Initialize knowledge_links if not exists
    if (!config.knowledge_links) {
      config.knowledge_links = {
        enabled: true,
        auto_fetch: true,
        cache_duration_hours: 24,
        links: [],
        categories: getDefaultCategories()
      };
    }

    // Update categories
    config.knowledge_links.categories = categories;

    // Save config
    const saved = await saveConfigToFile(config);
    if (!saved) {
      return res.status(500).json({ error: 'Không thể lưu config' });
    }

    // Update current config
    currentConfig = config;

    res.json({
      success: true,
      message: 'Categories đã được cập nhật',
      categories: categories
    });

  } catch (error) {
    console.error('Update categories error:', error);
    res.status(500).json({ error: 'Không thể cập nhật categories' });
  }
});

// Add single category
app.post('/api/admin/knowledge-links/categories/:categoryId', authenticateAdmin, async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const categoryData = req.body;

    if (!categoryData.name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const config = await loadConfigFromFile();
    if (!config) {
      return res.status(500).json({ error: 'Không thể load config' });
    }

    // Initialize knowledge_links if not exists
    if (!config.knowledge_links) {
      config.knowledge_links = {
        enabled: true,
        auto_fetch: true,
        cache_duration_hours: 24,
        links: [],
        categories: getDefaultCategories()
      };
    }

    if (!config.knowledge_links.categories) {
      config.knowledge_links.categories = getDefaultCategories();
    }

    // Check if category already exists
    if (config.knowledge_links.categories[categoryId]) {
      return res.status(400).json({ error: 'Category ID đã tồn tại' });
    }

    // Add new category
    config.knowledge_links.categories[categoryId] = {
      name: categoryData.name,
      icon: categoryData.icon || '📋',
      description: categoryData.description || ''
    };

    // Save config
    const saved = await saveConfigToFile(config);
    if (!saved) {
      return res.status(500).json({ error: 'Không thể lưu config' });
    }

    // Update current config
    currentConfig = config;

    res.json({
      success: true,
      message: 'Category đã được thêm',
      category: config.knowledge_links.categories[categoryId]
    });

  } catch (error) {
    console.error('Add category error:', error);
    res.status(500).json({ error: 'Không thể thêm category' });
  }
});

// Update single category  
app.put('/api/admin/knowledge-links/categories/:categoryId', authenticateAdmin, async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const updateData = req.body;

    const config = await loadConfigFromFile();
    if (!config?.knowledge_links?.categories) {
      return res.status(404).json({ error: 'Không tìm thấy categories' });
    }

    if (!config.knowledge_links.categories[categoryId]) {
      return res.status(404).json({ error: 'Không tìm thấy category' });
    }

    // Update category
    config.knowledge_links.categories[categoryId] = {
      ...config.knowledge_links.categories[categoryId],
      ...updateData
    };

    // Save config
    const saved = await saveConfigToFile(config);
    if (!saved) {
      return res.status(500).json({ error: 'Không thể lưu config' });
    }

    // Update current config
    currentConfig = config;

    res.json({
      success: true,
      message: 'Category đã được cập nhật',
      category: config.knowledge_links.categories[categoryId]
    });

  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Không thể cập nhật category' });
  }
});

// Delete single category
app.delete('/api/admin/knowledge-links/categories/:categoryId', authenticateAdmin, async (req, res) => {
  try {
    const categoryId = req.params.categoryId;

    // Prevent deleting general category
    if (categoryId === 'general') {
      return res.status(400).json({ error: 'Không thể xóa category "general"' });
    }

    const config = await loadConfigFromFile();
    if (!config?.knowledge_links?.categories) {
      return res.status(404).json({ error: 'Không tìm thấy categories' });
    }

    if (!config.knowledge_links.categories[categoryId]) {
      return res.status(404).json({ error: 'Không tìm thấy category' });
    }

    // Move all links in this category to general
    if (config.knowledge_links.links) {
      config.knowledge_links.links = config.knowledge_links.links.map(link => 
        link.category === categoryId 
          ? { ...link, category: 'general' }
          : link
      );
    }

    // Remove category
    const deletedCategory = config.knowledge_links.categories[categoryId];
    delete config.knowledge_links.categories[categoryId];

    // Save config
    const saved = await saveConfigToFile(config);
    if (!saved) {
      return res.status(500).json({ error: 'Không thể lưu config' });
    }

    // Update current config
    currentConfig = config;

    res.json({
      success: true,
      message: 'Category đã được xóa',
      deleted_category: deletedCategory
    });

  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Không thể xóa category' });
  }
});

// Test fetch content for admin
app.post('/api/admin/knowledge-links/test', authenticateAdmin, async (req, res) => {
  try {
    const { url, type } = req.body;

    if (!url || !type) {
      return res.status(400).json({ error: 'URL và type là bắt buộc' });
    }

    // Test fetch content
    const result = await fetchLinkContent(url, type);
    
    if (result.success) {
      res.json({
        success: true,
        content_length: result.content?.length || 0,
        content_preview: result.content?.substring(0, 500) || '',
        message: 'Test thành công'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Test thất bại'
      });
    }

  } catch (error) {
    console.error('Test knowledge link error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Không thể test link' 
    });
  }
});

// Toggle Knowledge Links
app.put('/api/admin/knowledge-links/toggle', authenticateAdmin, async (req, res) => {
  try {
    const { enabled } = req.body;

    const config = await loadConfigFromFile();
    if (!config) {
      return res.status(500).json({ error: 'Không thể load config' });
    }

    // Initialize knowledge_links if not exists
    if (!config.knowledge_links) {
      config.knowledge_links = {
        enabled: true,
        auto_fetch: true,
        cache_duration_hours: 24,
        links: [],
        categories: getDefaultCategories()
      };
    }

    // Update enabled status
    config.knowledge_links.enabled = enabled;

    // Save config
    const saved = await saveConfigToFile(config);
    if (!saved) {
      return res.status(500).json({ error: 'Không thể lưu config' });
    }

    // Update current config
    currentConfig = config;

    res.json({
      success: true,
      message: `Knowledge Links đã được ${enabled ? 'bật' : 'tắt'}`,
      enabled: enabled
    });

  } catch (error) {
    console.error('Toggle knowledge links error:', error);
    res.status(500).json({ error: 'Không thể thay đổi trạng thái Knowledge Links' });
  }
});

// Update knowledge links settings
app.put('/api/admin/knowledge-links/settings', authenticateAdmin, async (req, res) => {
  try {
    const { enabled, auto_fetch, cache_duration_hours } = req.body;

    const config = await loadConfigFromFile();
    if (!config) {
      return res.status(500).json({ error: 'Không thể load config' });
    }

    // Initialize knowledge_links if not exists
    if (!config.knowledge_links) {
      config.knowledge_links = {
        enabled: true,
        auto_fetch: true,
        cache_duration_hours: 24,
        links: [],
        categories: getDefaultCategories()
      };
    }

    // Update settings
    if (enabled !== undefined) config.knowledge_links.enabled = enabled;
    if (auto_fetch !== undefined) config.knowledge_links.auto_fetch = auto_fetch;
    if (cache_duration_hours !== undefined) config.knowledge_links.cache_duration_hours = cache_duration_hours;

    // Save config
    const saved = await saveConfigToFile(config);
    if (!saved) {
      return res.status(500).json({ error: 'Không thể lưu config' });
    }

    // Update current config
    currentConfig = config;

    res.json({
      success: true,
      message: 'Cài đặt Knowledge Links đã được cập nhật',
      settings: {
        enabled: config.knowledge_links.enabled,
        auto_fetch: config.knowledge_links.auto_fetch,
        cache_duration_hours: config.knowledge_links.cache_duration_hours
      }
    });

  } catch (error) {
    console.error('Update knowledge links settings error:', error);
    res.status(500).json({ error: 'Không thể cập nhật cài đặt' });
  }
});

// Clear knowledge cache
app.post('/api/admin/knowledge-links/clear-cache', authenticateAdmin, async (req, res) => {
  try {
    const clearedCount = knowledgeCache.size;
    knowledgeCache.clear();

    res.json({
      success: true,
      message: `Đã xóa ${clearedCount} items từ cache`,
      cleared_count: clearedCount
    });

  } catch (error) {
    console.error('Clear knowledge cache error:', error);
    res.status(500).json({ error: 'Không thể xóa cache' });
  }
});

// ============ KNOWLEDGE LINKS CRUD APIs ============

// Add new knowledge link
app.post('/api/admin/knowledge-links', authenticateAdmin, async (req, res) => {
  try {
    const linkData = req.body;

    if (!linkData.title || !linkData.url) {
      return res.status(400).json({ error: 'Title và URL là bắt buộc' });
    }

    const config = await loadConfigFromFile();
    if (!config) {
      return res.status(500).json({ error: 'Không thể load config' });
    }

    // Initialize knowledge_links if not exists
    if (!config.knowledge_links) {
      config.knowledge_links = {
        enabled: true,
        auto_fetch: true,
        cache_duration_hours: 24,
        links: []
      };
    }

    // Generate unique ID
    const newLink = {
      id: linkData.id || `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: linkData.title,
      url: linkData.url,
      type: linkData.type || 'web',
      category: linkData.category || 'general',
      description: linkData.description || '',
      priority: linkData.priority || 'medium',
      active: linkData.active !== false // Default to true
    };

    // Check for duplicate ID
    const existingIndex = config.knowledge_links.links.findIndex(link => link.id === newLink.id);
    if (existingIndex >= 0) {
      return res.status(400).json({ error: 'Link ID đã tồn tại' });
    }

    // Add new link
    config.knowledge_links.links.push(newLink);

    // Save config
    const saved = await saveConfigToFile(config);
    if (!saved) {
      return res.status(500).json({ error: 'Không thể lưu config' });
    }

    // Update current config
    currentConfig = config;

    res.json({
      success: true,
      message: 'Knowledge link đã được thêm',
      link: newLink
    });

  } catch (error) {
    console.error('Add knowledge link error:', error);
    res.status(500).json({ error: 'Không thể thêm knowledge link' });
  }
});

// Update knowledge link
app.put('/api/admin/knowledge-links/:id', authenticateAdmin, async (req, res) => {
  try {
    const linkId = req.params.id;
    const updateData = req.body;

    const config = await loadConfigFromFile();
    if (!config?.knowledge_links?.links) {
      return res.status(404).json({ error: 'Không tìm thấy knowledge links' });
    }

    const linkIndex = config.knowledge_links.links.findIndex(link => link.id === linkId);
    if (linkIndex === -1) {
      return res.status(404).json({ error: 'Không tìm thấy knowledge link' });
    }

    // Update link
    config.knowledge_links.links[linkIndex] = {
      ...config.knowledge_links.links[linkIndex],
      ...updateData,
      id: linkId // Prevent ID change
    };

    // Save config
    const saved = await saveConfigToFile(config);
    if (!saved) {
      return res.status(500).json({ error: 'Không thể lưu config' });
    }

    // Clear cache for this link if URL changed
    if (updateData.url) {
      const oldCacheKey = `${linkId}_${config.knowledge_links.links[linkIndex].url}`;
      const newCacheKey = `${linkId}_${updateData.url}`;
      knowledgeCache.delete(oldCacheKey);
      knowledgeCache.delete(newCacheKey);
    }

    // Update current config
    currentConfig = config;

    res.json({
      success: true,
      message: 'Knowledge link đã được cập nhật',
      link: config.knowledge_links.links[linkIndex]
    });

  } catch (error) {
    console.error('Update knowledge link error:', error);
    res.status(500).json({ error: 'Không thể cập nhật knowledge link' });
  }
});

// Delete knowledge link
app.delete('/api/admin/knowledge-links/:id', authenticateAdmin, async (req, res) => {
  try {
    const linkId = req.params.id;

    const config = await loadConfigFromFile();
    if (!config?.knowledge_links?.links) {
      return res.status(404).json({ error: 'Không tìm thấy knowledge links' });
    }

    const linkIndex = config.knowledge_links.links.findIndex(link => link.id === linkId);
    if (linkIndex === -1) {
      return res.status(404).json({ error: 'Không tìm thấy knowledge link' });
    }

    // Remove link
    const deletedLink = config.knowledge_links.links.splice(linkIndex, 1)[0];

    // Save config
    const saved = await saveConfigToFile(config);
    if (!saved) {
      return res.status(500).json({ error: 'Không thể lưu config' });
    }

    // Clear cache for this link
    const cacheKey = `${linkId}_${deletedLink.url}`;
    knowledgeCache.delete(cacheKey);

    // Update current config
    currentConfig = config;

    res.json({
      success: true,
      message: 'Knowledge link đã được xóa',
      deleted_link: deletedLink
    });

  } catch (error) {
    console.error('Delete knowledge link error:', error);
    res.status(500).json({ error: 'Không thể xóa knowledge link' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Peter CGI Assistant API (Integrated) running on port ${port}`);
  console.log(`🔗 External Auth API: ${EXTERNAL_API_URL}`);
  console.log(`🌐 Health check: http://localhost:${port}/health`);
  console.log(`🧪 Test external API: http://localhost:${port}/api/test-external`);
});

module.exports = app; 