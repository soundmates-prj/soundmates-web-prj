import api from './axios';

export interface RoleDto {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errorCode?: number;
  requestId?: string;
  timestamp?: string;
}

export interface RolePayload {
  name: string;
}

class RoleService {
  /** GET /api/v1/roles */
  async getRoles(): Promise<ApiResponse<RoleDto[]>> {
    try {
      const res = await api.get<ApiResponse<RoleDto[]>>('/roles');
      return res.data;
    } catch (err: any) {
      console.error('[RoleService] getRoles error:', err);
      return this.fail(err, 'Không thể tải danh sách vai trò');
    }
  }

  /** POST /api/v1/command/roles */
  async createRole(payload: RolePayload): Promise<ApiResponse<string>> {
    try {
      const res = await api.post<ApiResponse<string>>('/command/roles', {
        name: payload.name.trim().toUpperCase(),
      });
      return res.data;
    } catch (err: any) {
      console.error('[RoleService] createRole error:', err);
      return this.fail(err, 'Không thể tạo vai trò');
    }
  }

  /** PUT /api/v1/command/roles/{id} */
  async updateRole(id: string, payload: RolePayload): Promise<ApiResponse<boolean>> {
    try {
      const res = await api.put<ApiResponse<boolean>>(`/command/roles/${id}`, {
        name: payload.name.trim().toUpperCase(),
      });
      return res.data;
    } catch (err: any) {
      console.error('[RoleService] updateRole error:', err);
      return this.fail(err, 'Không thể cập nhật vai trò');
    }
  }

  /** DELETE /api/v1/command/roles/{id} */
  async deleteRole(id: string): Promise<ApiResponse<void>> {
    try {
      await api.delete(`/command/roles/${id}`);
      return { success: true };
    } catch (err: any) {
      console.error('[RoleService] deleteRole error:', err);
      return this.fail(err, 'Không thể xóa vai trò');
    }
  }

  private fail<T>(err: any, fallback: string): ApiResponse<T> {
    return {
      success: false,
      message: err?.response?.data?.message || fallback,
      errorCode: err?.response?.status,
    };
  }
}

export default new RoleService();
