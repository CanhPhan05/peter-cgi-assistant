# 🚀 HƯỚNG DẪN DEPLOY PETER CGI ASSISTANT - INTEGRATED VERSION

> **Phiên bản tích hợp** với hệ thống authentication hiện có từ `login-modules`

## 📋 TỔNG QUAN

**Peter CGI Assistant - Integrated** sử dụng:
- ✅ **External Authentication**: Tích hợp với API `http://14.225.218.11:5050/login`
- ✅ **Device Tracking**: Machine ID từ browser fingerprint
- ✅ **No Registration**: Không cần đăng ký mới, dùng tài khoản hiện có
- ✅ **Conversation Sync**: Lưu chat history cho mỗi user

---

## 🎯 BƯỚC 1: SETUP DATABASE

### 1.1. Tạo PostgreSQL Database (FREE)

Truy cập [Supabase](https://supabase.com) → **New Project**

```bash
Project Name: peter-cgi-integrated
Database Password: [tạo password mạnh]
Region: Southeast Asia (Singapore)
```

### 1.2. Chạy Database Schema

Vào **SQL Editor** → Copy & paste từ `web-app/backend-integrated/database-schema.sql`:

```sql
-- Paste toàn bộ nội dung file database-schema.sql vào đây
```

**Lưu lại**:
- Database URL: `postgresql://postgres:[password]@[host]:5432/postgres`

---

## 🎯 BƯỚC 2: DEPLOY BACKEND

### 2.1. Deploy lên Railway (FREE)

Truy cập [Railway](https://railway.app) → **New Project** → **Deploy from GitHub**

#### Environment Variables:
```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
JWT_SECRET=[tạo secret key ngẫu nhiên 32 ký tự]
DEFAULT_OPENAI_API_KEY=[optional - OpenAI API key mặc định]
FRONTEND_URL=https://[your-frontend-url].vercel.app
```

#### Deploy Commands:
```bash
# Build Command
npm install

# Start Command  
npm start

# Root Directory
web-app/backend-integrated
```

**Lưu lại**: Backend URL: `https://[your-app].railway.app`

---

## 🎯 BƯỚC 3: DEPLOY FRONTEND

### 3.1. Deploy lên Vercel (FREE)

Truy cập [Vercel](https://vercel.com) → **New Project** → **Import Git Repository**

#### Environment Variables:
```bash
REACT_APP_API_URL=https://[your-backend-url].railway.app
```

#### Build Settings:
```bash
# Framework Preset: Create React App
# Root Directory: web-app/frontend-integrated  
# Build Command: npm run build
# Output Directory: build
```

**Lưu lại**: Frontend URL: `https://[your-app].vercel.app`

---

## 🎯 BƯỚC 4: KIỂM TRA HOẠT ĐỘNG

### 4.1. Test Backend Health
```bash
curl https://[your-backend-url].railway.app/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "service": "Peter CGI Assistant - Integrated",
  "version": "2.1.0",
  "externalAuth": "http://14.225.218.11:5050/login"
}
```

### 4.2. Test External API Connection
```bash
curl https://[your-backend-url].railway.app/api/test-external
```

### 4.3. Test Frontend Login

Truy cập: `https://[your-app].vercel.app`

Đăng nhập bằng **tài khoản hiện có** từ hệ thống chính.

---

## 🔧 CẤU HÌNH NÂNG CAO

### 5.1. Custom Domain (Optional)

**Backend Railway:**
```bash
Settings → Domains → Add Custom Domain
CNAME: api.yoursite.com → [railway-url]
```

**Frontend Vercel:**
```bash
Settings → Domains → Add Domain
A Record: yoursite.com → 76.76.19.61
```

### 5.2. Environment Configuration

**Cập nhật Frontend URL:**
```bash
# Railway Environment Variables
FRONTEND_URL=https://yoursite.com
```

**Cập nhật Backend URL:**
```bash  
# Vercel Environment Variables
REACT_APP_API_URL=https://api.yoursite.com
```

---

## 🛠️ QUẢN LÝ & MONITORING

### 6.1. Database Monitoring

**Supabase Dashboard:**
- 📊 Real-time usage
- 🔍 Query performance  
- 👥 User activity tracking

### 6.2. Backend Monitoring

**Railway Dashboard:**
- 📈 CPU/Memory usage
- 📋 Application logs
- 🚨 Error tracking

### 6.3. Frontend Analytics

**Vercel Dashboard:**
- 🌐 Traffic analytics
- ⚡ Performance metrics
- 🔄 Deployment history

---

## 🔐 BẢO MẬT

### 7.1. API Security
- ✅ CORS configured cho frontend domain
- ✅ JWT token authentication  
- ✅ Device ID tracking
- ✅ External API integration

### 7.2. Database Security
- ✅ Connection SSL enabled
- ✅ Row Level Security (RLS)
- ✅ User data isolation

---

## 📞 HỖ TRỢ

### Troubleshooting Common Issues:

**1. External API Connection Failed:**
```bash
# Kiểm tra IP server 14.225.218.11:5050 có hoạt động
curl -I http://14.225.218.11:5050/login

# Nếu không truy cập được, liên hệ admin hệ thống chính
```

**2. Login Failed - 403 Error:**
```
Lỗi: "Bạn cần mua license để sử dụng"
Giải pháp: Liên hệ admin để kích hoạt tài khoản
```

**3. Database Connection Error:**
```bash
# Kiểm tra DATABASE_URL trong Railway environment variables
# Đảm bảo PostgreSQL service đang chạy
```

**4. CORS Error:**
```bash
# Cập nhật FRONTEND_URL trong Railway environment variables
# Restart backend service
```

---

## ✅ CHECKLIST DEPLOY

- [ ] **Database**: PostgreSQL setup trên Supabase
- [ ] **Schema**: Database tables created successfully  
- [ ] **Backend**: Deployed trên Railway với environment variables
- [ ] **Frontend**: Deployed trên Vercel với API URL
- [ ] **External API**: Connection test successful
- [ ] **Authentication**: Login với tài khoản hiện có works
- [ ] **Chat**: Peter AI responds correctly
- [ ] **Monitoring**: Dashboard access setup

---

## 🎉 HOÀN THÀNH!

**Peter CGI Assistant - Integrated** đã sẵn sàng!

- 🌐 **Frontend**: `https://[your-app].vercel.app`
- 🔧 **Backend**: `https://[your-app].railway.app` 
- 🔐 **Authentication**: Tích hợp với hệ thống hiện có
- 💬 **AI Chat**: Peter CGI expert assistant
- 📱 **Mobile Responsive**: Hoạt động trên mọi thiết bị

**Chi phí**: **$0/tháng** với free tiers!

---

## 📈 SCALE UP (Khi cần)

**Database**: Supabase Pro ($25/tháng)
**Backend**: Railway Pro ($5/tháng)  
**Frontend**: Vercel Pro ($20/tháng)
**Total**: ~$50/tháng cho unlimited usage

> 💡 **Lưu ý**: Phiên bản integrated này không cần registration mới. Tất cả user từ hệ thống chính có thể đăng nhập trực tiếp! 