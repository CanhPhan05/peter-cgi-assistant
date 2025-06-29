# 🎨 Hướng Dẫn Customization AI Assistant

## 📁 File Config: `src/config.json`

Bạn có thể dễ dàng tùy chỉnh AI assistant bằng cách chỉnh sửa file `src/config.json`

## 🤖 AI Configuration

### Thông tin cơ bản:
```json
{
  "ai": {
    "name": "Peter",                    // Tên ngắn hiển thị ở header
    "fullName": "Peter CGI Assistant",  // Tên đầy đủ ở trang login
    "avatar": "🤖",                     // Emoji hoặc ký tự đại diện
    "description": "Chuyên gia AI về CGI và chỉnh sửa ảnh"
  }
}
```

### Avatar Options:
- **Image File**: `"./avatar.png"` (recommend 256x256px PNG)
- **Emoji**: `"🤖"`, `"👨‍💻"`, `"🎨"`, `"⚡"`, `"🚀"`
- **Text**: `"AI"`, `"P"`, `"CGI"`
- **Icon**: Có thể dùng Unicode symbols

### Setup Avatar Image:
1. **Tạo/chọn ảnh avatar:**
   - Kích thước: 256x256px hoặc 512x512px (vuông)
   - Format: PNG với background trong suốt
   - Style: Professional, dễ nhận biết
   - Dung lượng: < 100KB

2. **Thêm vào project:**
   ```
   src/
   ├── config.json
   ├── avatar.png  ← Ảnh avatar của bạn
   └── App.js
   ```

3. **Config setup:**
   ```json
   {
     "avatar": "./avatar.png",      // Đường dẫn tới ảnh
     "avatarFallback": "🤖"        // Backup nếu ảnh lỗi
   }
   ```

### Welcome Message:
```json
{
  "welcomeTitle": "👋 Chào mừng đến với Peter CGI Assistant!",
  "welcomeDescription": "Tôi là Peter, chuyên gia CGI...",
  "capabilities": [
    "📊 Phân tích hình ảnh CGI",
    "💡 Gợi ý cải thiện",
    // Thêm hoặc sửa capabilities
  ],
  "welcomeFooter": "Hãy upload ảnh hoặc hỏi về CGI nhé! 🚀"
}
```

### Messages & Model:
```json
{
  "typingMessage": "Peter đang soạn tin nhắn...",
  "model": "gpt-4o"  // Có thể đổi thành gpt-4, gpt-3.5-turbo, etc.
}
```

## 🎨 UI Configuration

### Colors & Theme:
```json
{
  "ui": {
    "theme": "dark",           // dark | light
    "primaryColor": "#10a37f", // Màu chính của giao diện
  }
}
```

### Text & Placeholders:
```json
{
  "chatPlaceholder": "Hỏi Peter về CGI...",
  "uploadHint": "💡 **Đính kèm file:** Kéo thả ảnh • Ctrl+V paste ảnh",
  "uploadTooltip": "Đính kèm tài liệu, hình ảnh",
  "sendTooltip": "Gửi tin nhắn",
  "deleteImageTooltip": "Xóa ảnh"
}
```

## 🔥 Ví dụ Customization

### Tạo "Sarah Design Assistant":
```json
{
  "ai": {
    "name": "Sarah",
    "fullName": "Sarah Design Assistant", 
    "avatar": "🎨",
    "description": "Chuyên gia AI về thiết kế và sáng tạo",
    "welcomeTitle": "✨ Chào mừng đến với Sarah Design Studio!",
    "welcomeDescription": "Tôi là Sarah, chuyên gia thiết kế...",
    "typingMessage": "Sarah đang suy nghĩ..."
  }
}
```

### Tạo "Alex Code Assistant":
```json
{
  "ai": {
    "name": "Alex", 
    "fullName": "Alex Code Assistant",
    "avatar": "👨‍💻",
    "description": "Chuyên gia AI về lập trình và công nghệ",
    "welcomeTitle": "🚀 Chào mừng đến với Alex Code Lab!",
    "typingMessage": "Alex đang code..."
  }
}
```

## 📝 Lưu ý:
- Sau khi chỉnh sửa config, cần **build lại** frontend
- Emoji có thể không hiển thị đồng nhất trên mọi thiết bị
- Tên quá dài có thể bị cắt trên mobile
- Test trên nhiều trình duyệt khác nhau

## 🧠 Personality & Knowledge System

### PERSONALITY CONFIGURATION:
```json
{
  "personality": {
    "role": "Chuyên gia CGI và VFX hàng đầu",
    "experience": "15+ năm kinh nghiệm",
    "characteristics": [
      "Nhiệt tình và am hiểu sâu về công nghệ CGI",
      "Luôn cập nhật xu hướng mới nhất",
      // Thêm tính cách khác...
    ],
    "communication_style": {
      "tone": "Chuyên nghiệp nhưng thân thiện",
      "approach": "Phân tích chi tiết, đưa ra giải pháp cụ thể"
    }
  }
}
```

### EXPERTISE & SKILLS:
```json
{
  "expertise": {
    "primary_skills": [
      "3D Modeling & Sculpting (Blender, Maya, 3ds Max)",
      "Lighting & Rendering (V-Ray, Arnold, Cycles)"
    ],
    "software_proficiency": {
      "modeling": ["Blender", "Maya", "3ds Max"],
      "ai_tools": ["Stable Diffusion", "Midjourney"]
    }
  }
}
```

### KNOWLEDGE SOURCES:
```json
{
  "knowledge_sources": {
    "industry_standards": [
      "Academy of Motion Picture Arts and Sciences guidelines",
      "Visual Effects Society best practices"
    ],
    "learning_resources": [
      "SIGGRAPH papers",
      "Gnomon Workshop tutorials"
    ]
  }
}
```

### BEHAVIOR PATTERNS:
```json
{
  "behavior_patterns": {
    "analysis_approach": [
      "Đánh giá technical quality trước",
      "Phân tích workflow efficiency"
    ],
    "teaching_style": [
      "Giải thích từ cơ bản đến nâng cao",
      "Khuyến khích hands-on practice"
    ]
  }
}
```

## 🔄 Dynamic System:
- **Backend tự động nhận config** từ frontend
- **AI personality thay đổi real-time** theo config
- **Không cần restart server** khi cập nhật
- **Fallback safety** nếu config lỗi

## 🎛️ Customization Examples:

### Tạo "Alex Code Assistant":
```json
{
  "ai": { "name": "Alex", "avatar": "👨‍💻" },
  "personality": {
    "role": "Senior Software Engineer",
    "characteristics": [
      "Tư duy logic và systematic",
      "Passion for clean code và best practices"
    ]
  },
  "expertise": {
    "primary_skills": [
      "Full-stack Development",
      "System Architecture", 
      "DevOps & CI/CD"
    ]
  }
}
```

### Tạo "Sarah Design Expert":
```json
{
  "ai": { "name": "Sarah", "avatar": "🎨" },
  "personality": {
    "role": "Creative Director & UX Expert",
    "characteristics": [
      "Creative mindset với eye for detail",
      "User-centered design approach"
    ]
  },
  "expertise": {
    "primary_skills": [
      "UI/UX Design",
      "Brand Identity",
      "Design Systems"
    ]
  }
}
```

## 🚀 Build & Deploy:
```bash
cd web-app/frontend-integrated
npm run build
# Hoặc push lên Git để auto-deploy
```

## 🔧 Advanced Tips:
- **Test config** trước khi deploy với `/api/config/current`
- **Backup config** quan trọng trước khi thay đổi lớn
- **Monitor logs** để đảm bảo config được load đúng
- **A/B test** personality khác nhau cho different use cases 