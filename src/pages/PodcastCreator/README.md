# Podcast Creator

Tính năng tạo podcast với AI, hỗ trợ tạo script và audio.

## Các Tab

### 1. Tạo Script (Script-Only)
Sử dụng API `POST /api/scripts/podcast:generate` để tạo script podcast từ chủ đề và các tùy chọn prompt.

**Tính năng:**
- Nhập chủ đề và tiêu đề (tùy chọn)
- Tùy chỉnh phong cách với Editor Instruction
- Cấu hình nâng cao:
  - Context Type (podcast, interview, story, news)
  - Model AI (gemini-2.5-flash, v.v.)
  - Temperature (0.2 - 1.0): Độ sáng tạo
  - Max Tokens: Giới hạn độ dài output
  - Use Auto Context: Kết hợp system context
  - Strict Fact Mode: Kiểm tra tính chính xác

**API Endpoint:**
```
POST /api/scripts/podcast:generate
```

**Request Body:**
```json
{
  "topic": "string (required)",
  "title": "string (optional)",
  "contextType": "podcast",
  "modelName": "string (optional)",
  "temperature": 0.7,
  "maxTokens": 2000,
  "editorInstruction": "string (optional)",
  "useAutoContext": true,
  "strictFactMode": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "script": {
      "id": "uuid",
      "userId": "uuid",
      "topic": "string",
      "title": "string",
      "content": "string",
      "contextType": "podcast",
      "status": "completed",
      "modelName": "string",
      "temperature": 0.7,
      "maxTokens": 2000,
      "createdAt": "datetime",
      "updatedAt": "datetime"
    }
  }
}
```

### 2. Tạo Nhanh (Full)
Tạo cả script và audio trong một bước sử dụng API `POST /api/podcasts/generate-full`.

**Tính năng:**
- Tạo script và audio cùng lúc
- Chọn giọng đọc
- Cấu hình phong cách, thời lượng, ngôn ngữ

### 3. Từng Bước (Step-by-Step)
Đang phát triển - Workflow tạo podcast theo từng bước riêng biệt.

### 4. Nội Dung Của Tôi (My Content)
Đang phát triển - Quản lý các script và audio đã tạo.

## Services

### ScriptService
Service xử lý các thao tác liên quan đến script.

**Methods:**
- `generateScript(params)`: Tạo script mới
- `getMyScripts(filter)`: Lấy danh sách scripts
- `getScriptById(scriptId)`: Lấy chi tiết script
- `splitScript(scriptId, maxCharsPerPart)`: Chia script thành các phần nhỏ

### PodcastService
Service xử lý tạo podcast đầy đủ (script + audio).

**Methods:**
- `generateFullPodcast(params)`: Tạo podcast hoàn chỉnh

## Components

### ScriptGenerateForm
Component form tạo script podcast với đầy đủ tùy chọn.

**Props:** Không có (self-contained)

**Features:**
- Form validation
- Advanced options (collapsible)
- Script preview sau khi tạo
- Copy script to clipboard
- Error handling với toast notifications

### QuickGenerateForm
Component form tạo podcast nhanh (script + audio).

**Props:** Không có (self-contained)

**Features:**
- Voice selector
- Audio player
- Full podcast generation

## Styling

Các component sử dụng CSS modules riêng biệt và hỗ trợ dark mode thông qua CSS variables.

**CSS Variables:**
- `--primary-*`: Primary colors
- `--neutral-*`: Neutral colors
- `--error-*`: Error colors
- `--success-*`: Success colors
- `--warning-*`: Warning colors

## Usage Example

```typescript
import scriptService from '../../services/scriptService';

// Tạo script
const script = await scriptService.generateScript({
  topic: 'Trí tuệ nhân tạo trong y tế',
  title: 'AI và Y tế hiện đại',
  contextType: 'podcast',
  editorInstruction: 'Viết theo phong cách chuyên nghiệp, dễ hiểu',
  useAutoContext: true,
  strictFactMode: true,
  temperature: 0.7,
  maxTokens: 2000
});

console.log(script.content);
```

## Error Handling

Tất cả các service methods đều throw error với message rõ ràng. UI components sử dụng toast notifications để hiển thị lỗi cho người dùng.

```typescript
try {
  const script = await scriptService.generateScript(params);
  showSuccess('Tạo script thành công!');
} catch (error) {
  showError(error.message || 'Lỗi khi tạo script');
}
```
