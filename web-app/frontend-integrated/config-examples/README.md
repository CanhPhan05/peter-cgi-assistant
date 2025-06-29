# 🎛️ Configuration Examples

Đây là các file config mẫu để demonstrate khả năng customization của AI Assistant system.

## 📁 Available Configs:

### 1. **Peter CGI Assistant** (Default)
- **File:** `../src/config.json`
- **Specialty:** CGI, VFX, và chỉnh sửa ảnh
- **Personality:** Chuyên gia CGI thân thiện, technical-focused
- **Best for:** 3D modeling, rendering, visual effects

### 2. **Alex Code Assistant**
- **File:** `alex-code-assistant.json`
- **Specialty:** Software Development, System Architecture
- **Personality:** Logic-driven, best practices focused
- **Best for:** Code review, debugging, architecture design

### 3. **Sarah Design Assistant**
- **File:** `sarah-design-assistant.json`
- **Specialty:** UI/UX Design, Creative Direction
- **Personality:** Creative, inspiring, user-focused
- **Best for:** Design critique, UX analysis, visual design

## 🔄 How to Switch Configs:

### Method 1: Replace Main Config
```bash
# Backup current config
cp src/config.json src/config-backup.json

# Use Alex config
cp config-examples/alex-code-assistant.json src/config.json

# Deploy
git add . && git commit -m "Switch to Alex" && git push
```

### Method 2: Manual Copy-Paste
1. Open `config-examples/alex-code-assistant.json`
2. Copy toàn bộ content
3. Paste vào `src/config.json`
4. Save và deploy

## 🎨 Customization Tips:

### Quick Personality Change:
```json
{
  "ai": {
    "name": "YourName",
    "avatar": "🎯",
    "description": "Your specialty"
  },
  "personality": {
    "role": "Your role",
    "characteristics": [
      "Your traits..."
    ]
  }
}
```

### Add New Expertise:
```json
{
  "expertise": {
    "primary_skills": [
      "New Skill 1",
      "New Skill 2"
    ],
    "software_proficiency": {
      "new_category": ["Tool1", "Tool2"]
    }
  }
}
```

### Update Knowledge Sources:
```json
{
  "knowledge_sources": {
    "learning_resources": [
      "Add your preferred resources..."
    ]
  }
}
```

## 🔧 Testing Your Config:

1. **Validate JSON:** Use [jsonlint.com](https://jsonlint.com/)
2. **Test locally:** Check console for config load success
3. **Verify backend:** Visit `/api/config/current` endpoint
4. **Chat test:** Ask specific questions về new expertise

## 💡 Creating Custom Configs:

### Step 1: Define Purpose
- Ai sẽ specialize trong gì?
- Target audience là ai?
- Communication style như nào?

### Step 2: Build Sections
- **ai:** Basic info và branding
- **personality:** Character traits và style
- **expertise:** Skills và knowledge
- **behavior_patterns:** How AI responds

### Step 3: Test & Iterate
- Deploy và test với real conversations
- Adjust personality based on feedback
- Add missing expertise areas

## 🚀 Pro Tips:

- **Start with existing config** rồi modify
- **Keep expertise specific** - avoid too broad
- **Test personality consistency** across different questions  
- **Update knowledge sources** regularly
- **Document changes** for team collaboration

## 🔄 Config Management:

### Version Control:
```bash
# Tag important configs
git tag -a "peter-v1.0" -m "Peter CGI config v1.0"
git tag -a "alex-v1.0" -m "Alex Code config v1.0"

# Branch for experiments
git checkout -b "experiment/sarah-v2"
```

### Backup Strategy:
- Keep config examples updated
- Document major changes
- Test trước khi deploy production 