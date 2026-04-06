import api from './axios';

export interface RoleDto {
  id: string;
  name: string;
  description?: string;
  permissions?: string[];
  createdAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

class RoleService {
  /** GET /api/v1/roles — all roles (Admin only via auth-query-service) */
  async getRoles(): Promise<ApiResponse<RoleDto[]>> {
    try {
      const res = await api.get<ApiResponse<RoleDto[]>>('/roles');
      return res.data;
    } catch (err: any) {
      console.error('[RoleService] getRoles error:', err);
      return { success: false, message: 'Không thể tải danh sách vai trò' };
    }
  }
}

export default new RoleService();
