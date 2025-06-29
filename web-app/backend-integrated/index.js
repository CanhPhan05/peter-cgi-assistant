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

// Peter's personality prompt
const PETER_SYSTEM_PROMPT = `Bạn là Peter, chuyên gia CGI và chỉnh sửa ảnh chuyên nghiệp với nhiều năm kinh nghiệm.

TÍNH CÁCH: Thân thiện, nhiệt tình, giải thích dễ hiểu, sử dụng emoji phù hợp, trả lời bằng tiếng Việt tự nhiên.

CHUYÊN MÔN: CGI, Photo manipulation, Color grading, Lighting, Texture design, Rendering, Adobe Photoshop workflows, Digital art.

CÁCH TRẢ LỜI: Phân tích chi tiết và chuyên nghiệp, đưa ra gợi ý cụ thể có thể thực hiện, giải thích lý do, hướng dẫn từng bước, khuyến khích thử nghiệm sáng tạo.

QUALITY REFERENCES: Tham khảo standards từ top studios như DBOX, Binyan Studios, The Boundary, và các CGI houses hàng đầu thế giới.`;

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
        [userId, messages[messages.length - 1]?.content?.substring(0, 50) || 'New Chat', req.user.email]
      );
      conversation = convResult.rows[0];
    }

    // Prepare messages for OpenAI
    const apiMessages = [
      { role: 'system', content: PETER_SYSTEM_PROMPT },
      ...messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: model,
      messages: apiMessages,
      max_tokens: 1500,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0].message.content;

    // Save messages to database
    const userMessage = messages[messages.length - 1];
    await pool.query(
      'INSERT INTO messages (conversation_id, role, content, user_email) VALUES ($1, $2, $3, $4)',
      [conversation.id, userMessage.role, userMessage.content, req.user.email]
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
      usage: completion.usage
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
        ...result.rows[0],
        url: dataUrl
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

// Start server
app.listen(port, () => {
  console.log(`🚀 Peter CGI Assistant API (Integrated) running on port ${port}`);
  console.log(`🔗 External Auth API: ${EXTERNAL_API_URL}`);
  console.log(`🌐 Health check: http://localhost:${port}/health`);
  console.log(`🧪 Test external API: http://localhost:${port}/api/test-external`);
});

module.exports = app; 