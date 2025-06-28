# 🌐 Peter CGI Assistant - Web Application

**Migrated from Adobe Photoshop Extension to Full Web Application**

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- OpenAI API Key

### 1. Clone & Install

```bash
# Clone repository
git clone <repository-url>
cd peter-cgi-web

# Install frontend dependencies
cd web-app/frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb peter_cgi_web

# Copy environment variables
cp .env.example .env

# Edit .env file with your settings:
# DATABASE_URL="postgresql://username:password@localhost:5432/peter_cgi_web"
# JWT_SECRET="your-super-secret-jwt-key"
# ENCRYPTION_KEY="your-32-char-encryption-key"
# AWS_ACCESS_KEY_ID="your-aws-key"
# AWS_SECRET_ACCESS_KEY="your-aws-secret"
# AWS_REGION="us-east-1"
# S3_BUCKET="peter-images"

# Run database migrations
npm run db:migrate
npm run db:generate
```

### 3. Start Development

```bash
# Terminal 1: Start backend (port 3001)
cd web-app/backend
npm run dev

# Terminal 2: Start frontend (port 3000)
cd web-app/frontend
npm start
```

🎉 **Open http://localhost:3000 - Peter Web App is ready!**

## 📁 Project Structure

```
web-app/
├── frontend/                # React TypeScript Frontend
│   ├── src/
│   │   ├── components/      # React Components
│   │   │   ├── Chat/        # Chat UI Components
│   │   │   ├── ImageUpload/ # Image handling
│   │   │   ├── Settings/    # Settings panel
│   │   │   └── Layout/      # Layout components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API services
│   │   ├── stores/          # State management (Zustand)
│   │   ├── types/           # TypeScript definitions
│   │   └── utils/           # Utility functions
│   ├── package.json
│   └── tailwind.config.js
│
├── backend/                 # Express.js API Backend
│   ├── src/
│   │   ├── routes/          # API routes
│   │   │   ├── auth.js      # Authentication
│   │   │   ├── chat.js      # Chat functionality
│   │   │   ├── images.js    # Image upload
│   │   │   └── users.js     # User management
│   │   ├── middleware/      # Express middleware
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Utility functions
│   │   └── server.js        # Entry point
│   ├── prisma/              # Database schema & migrations
│   └── package.json
│
└── README.md               # This file
```

## 🔄 Migration from Adobe Extension

### What Changed:
- ❌ **Removed**: CEP Extension, Photoshop integration, Local proxy
- ✅ **Added**: React frontend, Express API, Database, User auth
- ✅ **Kept**: Peter personality, Quick actions, Vision analysis

### Key Differences:

| Adobe Extension | Web Application |
|-----------------|-----------------|
| Local installation | Cloud-hosted |
| Single user | Multi-user with accounts |
| Photoshop documents | File upload |
| Local storage | Database persistence |
| CEP framework | React + Express |

## 🛠️ Core Features

### 🤖 **AI Chat Assistant**
- Peter personality preserved from original
- Multi-model support (GPT-4o, GPT-4, etc.)
- Conversation history & persistence
- Real-time typing indicators

### 📸 **Image Analysis**
- Drag & drop file upload
- Multi-image support
- Vision API integration
- Automatic optimization

### ⚡ **Quick Actions** (Migrated)
- 🔍 Phân Tích Chuyên Sâu
- ⚡ Lộ Trình Cải Thiện  
- 🎨 Quy Trình Chuyên Nghiệp
- 🔧 Đánh Giá Kỹ Thuật
- 👥 Tác Động Thị Trường
- 📋 Tiêu Chuẩn Ngành

### 👥 **User Management**
- Account registration/login
- Encrypted API key storage
- Usage tracking & analytics
- Settings persistence

## 🔧 Configuration

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/peter_web"

# Security
JWT_SECRET="your-super-secret-key-min-32-chars"
ENCRYPTION_KEY="your-32-character-encryption-key"

# AWS S3 (for image storage)
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
S3_BUCKET="peter-images-bucket"

# Optional: Email service
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Frontend URL (for CORS)
FRONTEND_URL="http://localhost:3000"
```

### Model Configuration

```javascript
// Available models (in backend/src/config/models.js)
const AVAILABLE_MODELS = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    supportsVision: true,
    cost: 'medium'
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo', 
    supportsVision: true,
    cost: 'high'
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    supportsVision: true,
    cost: 'low'
  }
];
```

## 🚀 Deployment

### Frontend (Vercel - Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd web-app/frontend
vercel --prod
```

### Backend (Railway - Recommended)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Deploy backend
cd web-app/backend
railway deploy
```

### Database (Supabase - Recommended)

```bash
# Create Supabase project
npx supabase init
npx supabase start

# Update DATABASE_URL in production
```

## 📊 API Documentation

### Authentication
```bash
POST /api/auth/register     # Register new user
POST /api/auth/login        # Login user
POST /api/auth/refresh      # Refresh JWT token
```

### Chat
```bash
POST /api/chat/send         # Send message to AI
GET  /api/chat/conversations # Get user conversations
GET  /api/chat/conversations/:id # Get specific conversation
DELETE /api/chat/conversations/:id # Delete conversation
```

### Images  
```bash
POST /api/images/upload     # Upload image
GET  /api/images/:id        # Get image metadata
DELETE /api/images/:id      # Delete image
```

### Users
```bash
GET  /api/users/profile     # Get user profile
PUT  /api/users/profile     # Update profile
PUT  /api/users/api-key     # Update OpenAI API key
```

## 🔒 Security Features

- **JWT Authentication** with refresh tokens
- **API Key Encryption** using AES-256
- **Rate Limiting** to prevent abuse
- **Input Validation** with Joi schemas
- **CORS Protection** for cross-origin requests
- **Helmet.js** for HTTP headers security

## 📈 Performance Optimizations

- **Image Compression** with Sharp
- **Database Indexing** for fast queries
- **API Response Caching** with Redis (optional)
- **CDN Integration** for static assets
- **Lazy Loading** in React components

## 🧪 Testing

```bash
# Backend tests
cd web-app/backend
npm test

# Frontend tests  
cd web-app/frontend
npm test
```

## 📞 Support

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions  
- **Email**: support@peter-cgi.com

## 📄 License

MIT License - see LICENSE file for details.

---

**🎉 Peter CGI Assistant - Now available on the web for everyone!**

*Powered by OpenAI GPT-4 Vision • Built with React & Express.js* 