# API Test Examples - Podcast Script Generation

## Endpoint
```
POST http://localhost:8080/api/v1/scripts/podcast:generate
```

## Headers
```
Authorization: Bearer <your_access_token>
Content-Type: application/json
```

## Test Cases

### 1. Basic Script Generation (Minimal)
Tạo script cơ bản chỉ với chủ đề.

```json
{
  "topic": "Trí tuệ nhân tạo đang thay đổi thế giới như thế nào",
  "contextType": "podcast",
  "useAutoContext": true,
  "strictFactMode": false
}
```

### 2. Script with Title and Instructions
Tạo script với tiêu đề và hướng dẫn tùy chỉnh.

```json
{
  "topic": "Lợi ích của thiền định đối với sức khỏe tinh thần",
  "title": "Thiền Định - Chìa Khóa Cho Tâm Trí Khỏe Mạnh",
  "contextType": "podcast",
  "editorInstruction": "Viết theo phong cách thân thiện, dễ hiểu, sử dụng ví dụ thực tế. Tránh thuật ngữ y học phức tạp.",
  "useAutoContext": true,
  "strictFactMode": false
}
```

### 3. Script with Custom Model and Temperature
Tạo script với model và temperature tùy chỉnh.

```json
{
  "topic": "Khám phá vũ trụ: Những phát hiện mới nhất về sao Hỏa",
  "title": "Hành Trình Khám Phá Sao Hỏa",
  "contextType": "podcast",
  "modelName": "gemini-2.5-flash",
  "temperature": 0.8,
  "maxTokens": 3000,
  "editorInstruction": "Viết theo phong cách khoa học nhưng hấp dẫn, sử dụng ngôn ngữ sinh động để mô tả các khám phá.",
  "useAutoContext": true,
  "strictFactMode": true
}
```

### 4. Interview Style Script
Tạo script theo phong cách phỏng vấn.

```json
{
  "topic": "Phỏng vấn chuyên gia về biến đổi khí hậu",
  "title": "Cuộc Trò Chuyện Về Khí Hậu",
  "contextType": "interview",
  "editorInstruction": "Viết dưới dạng hỏi đáp giữa người dẫn chương trình và chuyên gia. Bao gồm 5-7 câu hỏi sâu về biến đổi khí hậu.",
  "useAutoContext": true,
  "strictFactMode": true
}
```

### 5. Story Style Script
Tạo script theo phong cách kể chuyện.

```json
{
  "topic": "Câu chuyện về Steve Jobs và sự ra đời của iPhone",
  "title": "Hành Trình Tạo Ra iPhone",
  "contextType": "story",
  "temperature": 0.9,
  "maxTokens": 4000,
  "editorInstruction": "Kể câu chuyện theo trình tự thời gian, tập trung vào những thử thách và quyết định quan trọng. Sử dụng ngôn ngữ cảm xúc và sinh động.",
  "useAutoContext": true,
  "strictFactMode": false
}
```

### 6. News Style Script
Tạo script theo phong cách tin tức.

```json
{
  "topic": "Tổng quan về tình hình kinh tế Việt Nam quý 1/2024",
  "title": "Bản Tin Kinh Tế Quý 1",
  "contextType": "news",
  "temperature": 0.5,
  "maxTokens": 2000,
  "editorInstruction": "Viết theo phong cách tin tức chính thống, khách quan, trình bày các số liệu và sự kiện quan trọng.",
  "useAutoContext": true,
  "strictFactMode": true
}
```

### 7. Conservative Mode (Low Temperature)
Tạo script với độ sáng tạo thấp, tập trung vào sự thật.

```json
{
  "topic": "Hướng dẫn cách phòng chống COVID-19",
  "title": "Phòng Chống COVID-19 Hiệu Quả",
  "contextType": "podcast",
  "temperature": 0.2,
  "maxTokens": 2000,
  "editorInstruction": "Chỉ cung cấp thông tin chính xác từ WHO và Bộ Y tế. Tránh đưa ra ý kiến cá nhân.",
  "useAutoContext": false,
  "strictFactMode": true
}
```

### 8. Creative Mode (High Temperature)
Tạo script với độ sáng tạo cao.

```json
{
  "topic": "Tưởng tượng cuộc sống trên Trái Đất năm 2100",
  "title": "Trái Đất 2100: Một Tương Lai Khả Thi",
  "contextType": "podcast",
  "temperature": 1.0,
  "maxTokens": 5000,
  "editorInstruction": "Sử dụng trí tưởng tượng để mô tả cuộc sống tương lai, nhưng dựa trên xu hướng công nghệ hiện tại. Tạo ra một câu chuyện hấp dẫn và đầy cảm hứng.",
  "useAutoContext": true,
  "strictFactMode": false
}
```

## Expected Response Format

```json
{
  "success": true,
  "message": null,
  "data": {
    "script": {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "topic": "Trí tuệ nhân tạo đang thay đổi thế giới như thế nào",
      "title": "AI và Tương Lai",
      "content": "Xin chào các bạn...\n\n[Nội dung script đầy đủ]",
      "contextType": "podcast",
      "status": "completed",
      "modelName": "gemini-2.5-flash",
      "temperature": 0.7,
      "maxTokens": 2000,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  },
  "errorCode": null
}
```

## Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Invalid token",
  "data": null,
  "errorCode": "HB40101"
}
```

### 400 Bad Request
```json
{
  "success": false,
  "message": "Topic is required",
  "data": null,
  "errorCode": "HB40001"
}
```

## Testing with cURL

### Basic Test
```bash
curl -X POST http://localhost:8080/api/v1/scripts/podcast:generate \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Trí tuệ nhân tạo trong y tế",
    "contextType": "podcast",
    "useAutoContext": true,
    "strictFactMode": false
  }'
```

### Advanced Test
```bash
curl -X POST http://localhost:8080/api/v1/scripts/podcast:generate \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Khám phá vũ trụ",
    "title": "Hành Trình Vũ Trụ",
    "contextType": "podcast",
    "modelName": "gemini-2.5-flash",
    "temperature": 0.8,
    "maxTokens": 3000,
    "editorInstruction": "Viết theo phong cách khoa học nhưng dễ hiểu",
    "useAutoContext": true,
    "strictFactMode": true
  }'
```

## Testing with Postman

1. Create a new POST request
2. URL: `http://localhost:8080/api/v1/scripts/podcast:generate`
3. Headers:
   - `Authorization`: `Bearer YOUR_ACCESS_TOKEN`
   - `Content-Type`: `application/json`
4. Body (raw JSON): Copy any example from above
5. Send request

## Notes

- `topic` là field bắt buộc
- `temperature` nên trong khoảng 0.2 - 1.0
- `maxTokens` nên >= 100
- `contextType` có thể là: `podcast`, `interview`, `story`, `news`
- `useAutoContext=true`: Kết hợp system context với editor instruction
- `strictFactMode=true`: Kiểm tra tính chính xác nghiêm ngặt hơn
