# API Documentation for AzuraCast First-Time Setup

## Phân tích từ AzuraCast Backend

Dựa trên phân tích code PHP của AzuraCast (`backend/src/Controller/Frontend/SetupController.php`), các API sau đây được sử dụng cho việc đăng ký tài khoản:

---

## 1. Setup Routes

### GET/POST `/setup`
- **Controller**: `SetupController::indexAction`
- **Mô tả**: Redirect đến step hiện tại dựa trên trạng thái setup

### GET/POST `/setup/register` 
- **Controller**: `SetupController::registerAction`
- **Mô tả**: **Tạo Super Administrator Account** (chỉ khả dụng khi chưa có user nào)
- **Request Body** (Form Data):
  ```
  username: string (email)
  password: string
  csrf: string (token CSRF)
  ```
- **Response**: 
  - **302 Found** → Redirect đến `/setup/station` (SUCCESS)
  - **200 OK** với error message trong HTML nếu thất bại

### GET/POST `/setup/station`
- **Controller**: `SetupController::stationAction`
- **Mô tả**: Tạo Radio Station đầu tiên
- **Yêu cầu**: Đã đăng nhập

### GET/POST `/setup/settings`
- **Controller**: `SetupController::settingsAction`
- **Mô tả**: Cấu hình System Settings
- **Yêu cầu**: Đã đăng nhập

---

## 2. User Management APIs (Admin)

Các API này yêu cầu authentication và quyền Admin:

### GET `/api/admin/users`
- **Mô tả**: Lấy danh sách tất cả users
- **Response**: `Array<User>`

### POST `/api/admin/users`
- **Mô tả**: Tạo user mới
- **Request Body**:
  ```json
  {
    "email": "string",
    "name": "string (optional)",
    "new_password": "string",
    "roles": [1, 2, ...] // Role IDs
  }
  ```

### GET `/api/admin/user/{id}`
- **Mô tả**: Lấy thông tin user theo ID

### PUT `/api/admin/user/{id}`
- **Mô tả**: Cập nhật thông tin user

### DELETE `/api/admin/user/{id}`
- **Mô tả**: Xóa user

---

## 3. Authentication APIs

### POST `/login`
- **Mô tả**: Đăng nhập
- **Request Body** (Form Data):
  ```
  username: string (email)
  password: string
  remember: "1" (optional)
  ```
- **Response**:
  - **302** → Redirect đến dashboard (SUCCESS)
  - **302** → Redirect đến `/login/2fa` (Cần xác thực 2FA)

### GET `/logout`
- **Mô tả**: Đăng xuất

---

## 4. User Entity Schema

Dựa trên `backend/src/Entity/User.php`:

```typescript
interface User {
  id: number;
  email: string;              // Required, max 100 chars
  name?: string;              // Optional, max 100 chars
  locale?: string;            // Optional, e.g., "en_US"
  show_24_hour_time?: boolean;
  created_at: number;         // Unix timestamp
  updated_at: number;         // Unix timestamp
  roles: Role[];              // Array of assigned roles
}
```

---

## 5. Flow đăng ký trong AzuraCast

1. **Kiểm tra số lượng users**: Nếu `numUsers === 0`, cho phép tạo Super Admin
2. **Submit form** với `username` (email) và `password`
3. **Tạo User entity** và gán role Super Administrator
4. **Validate** dữ liệu user
5. **Persist** vào database
6. **Auto login** sau khi tạo thành công
7. **Redirect** đến bước tiếp theo (Station Setup)

---

## 6. Sử dụng trong Frontend

```typescript
import { api } from './services/api';

// Step 1: Đăng ký Super Admin
const registerResponse = await api.registerSuperAdmin({
  username: 'admin@example.com',
  password: 'SecurePassword123'
});

if (registerResponse.success) {
  console.log('Account created!');
  
  // QUAN TRỌNG: Login ngay sau khi register để có session
  // AzuraCast backend tự động login, nhưng với SPA ta cần đảm bảo session
  try {
    await api.login({
      username: 'admin@example.com',
      password: 'SecurePassword123'
    });
    console.log('Logged in successfully!');
  } catch (e) {
    // Có thể đã được auto-login, tiếp tục
    console.log('Already logged in or auto-logged in');
  }
  
  // Step 2: Tạo Station (yêu cầu đã login)
  const stationResponse = await api.createStation({
    name: 'My Radio Station',
    description: 'A great radio station',
    genre: 'Pop',
    timezone: 'Asia/Ho_Chi_Minh'
  });
  
  console.log('Station created:', stationResponse);
}

// Login thủ công
const loginResponse = await api.login({
  username: 'admin@example.com',
  password: 'SecurePassword123',
  remember: true
});

// Create user (as admin - yêu cầu session)
const newUser = await api.createUser({
  email: 'user@example.com',
  name: 'New User',
  password: 'UserPassword123',
  roles: [2] // Regular user role
});
```

---

## 7. Lưu ý về CORS

Khi frontend chạy trên domain khác với AzuraCast backend, cần cấu hình CORS trong backend hoặc sử dụng proxy.

Trong development, có thể sử dụng Vite proxy:

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:80',
      '/setup': 'http://localhost:80',
      '/login': 'http://localhost:80',
    }
  }
})
```
