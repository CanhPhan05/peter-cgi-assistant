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

## 🚀 Build & Deploy:
```bash
cd web-app/frontend-integrated
npm run build
# Hoặc push lên Git để auto-deploy
``` 