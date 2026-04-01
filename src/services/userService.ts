import api from './axios';

// ── Enum — matches backend AccountStatusEnum ──────────────────────
export const AccountStatusEnum = {
  Active: 1,
  Deactivated: 2,
  Suspended: 3,
} as const;
export type AccountStatusEnum = typeof AccountStatusEnum[keyof typeof AccountStatusEnum];

export const AccountStatusLabel: Record<number, string> = {
  [AccountStatusEnum.Active]: 'Hoạt động',
  [AccountStatusEnum.Deactivated]: 'Đã vô hiệu hóa',
  [AccountStatusEnum.Suspended]: 'Đã tạm khóa',
};

// ── Types — camelCase to match backend JSON ───────────────────────

export interface UserDto {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roleId?: string;
  roleName?: string;
  isActive: boolean;
  isVerified: boolean;
  emailVerifiedAt?: string | null;
  isBanned: boolean;
  bannedAt?: string | null;
  banReason?: string | null;
  deactivatedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  // Profile
  bio?: string;
  profileImageUrl?: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  location?: string;
  website?: string;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

/**
 * API response wrapper — camelCase matches backend [JsonPropertyName] attributes.
 */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errorCode?: number;
  requestId?: string;
  timestamp?: string;
}

export interface GetUsersParams {
  q?: string;
  page?: number;
  pageSize?: number;
}

// ── Request payloads ───────────────────────────────────────────────

export interface UpdateAccountStatusPayload {
  status: AccountStatusEnum;
  reason?: string;
  note?: string;
}

// ── User Service ──────────────────────────────────────────────────

class UserService {
  // GET /users — paginated list
  async getUsers(params?: GetUsersParams): Promise<ApiResponse<PagedResult<UserDto>>> {
    try {
      const res = await api.get<ApiResponse<PagedResult<UserDto>>>('/users', {
        params: { q: params?.q, page: params?.page || 1, pageSize: params?.pageSize || 20 },
      });
      return res.data;
    } catch (err: any) {
      console.error('[UserService] getUsers error:', err);
      return this.fail(err, 'Lỗi khi tải danh sách người dùng');
    }
  }

  // GET /users/{id}
  async getUserById(id: string): Promise<ApiResponse<UserDto>> {
    try {
      const res = await api.get<ApiResponse<UserDto>>(`/users/${id}`);
      return res.data;
    } catch (err: any) {
      console.error('[UserService] getUserById error:', err);
      return this.fail(err, 'Lỗi khi tải thông tin người dùng');
    }
  }

  // POST /users — create user (Admin)
  async createUser(payload: {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    roleId?: string;
  }): Promise<ApiResponse<string>> {
    try {
      const res = await api.post<ApiResponse<string>>('/users', payload);
      return res.data;
    } catch (err: any) {
      console.error('[UserService] createUser error:', err);
      return this.fail(err, 'Không thể tạo người dùng');
    }
  }

  // PUT /users/{id} — update user (Admin)
  async updateUser(
    id: string,
    payload: {
      username: string;
      email: string;
      firstName?: string;
      lastName?: string;
      roleId?: string;
    },
  ): Promise<ApiResponse<void>> {
    try {
      const res = await api.put<ApiResponse<void>>(`/users/${id}`, payload);
      return res.data;
    } catch (err: any) {
      console.error('[UserService] updateUser error:', err);
      return this.fail(err, 'Không thể cập nhật người dùng');
    }
  }

  // DELETE /users/{id} — hard delete (Admin)
  async deleteUser(id: string): Promise<ApiResponse<void>> {
    try {
      await api.delete(`/users/${id}`);
      return { success: true };
    } catch (err: any) {
      console.error('[UserService] deleteUser error:', err);
      return this.fail(err, 'Không thể xóa người dùng');
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // STATUS — Unified PATCH endpoint
  // Idempotent: setting same status twice = 200 OK (no-op)
  // ═══════════════════════════════════════════════════════════════════

  /**
   * PATCH /api/v1/users/{id}/status
   * Idempotent — replaces: deactivate, activate, ban, unban
   */
  async updateAccountStatus(
    id: string,
    payload: UpdateAccountStatusPayload,
  ): Promise<ApiResponse<void>> {
    try {
      const res = await api.patch<ApiResponse<void>>(
        `/users/${id}/status`,
        payload,
      );
      return res.data;
    } catch (err: any) {
      console.error('[UserService] updateAccountStatus error:', err);
      return this.fail(err, 'Không thể cập nhật trạng thái tài khoản');
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // EMAIL VERIFICATION
  // ═══════════════════════════════════════════════════════════════════

  /**
   * PATCH /api/v1/users/{id}/email-verification
   * Admin manually verifies user email and activates account (no OTP required).
   */
  async verifyEmail(id: string): Promise<ApiResponse<void>> {
    try {
      const res = await api.patch<ApiResponse<void>>(
        `/users/${id}/email-verification`,
      );
      return res.data;
    } catch (err: any) {
      console.error('[UserService] verifyEmail error:', err);
      return this.fail(err, 'Không thể xác minh email người dùng');
    }
  }

  // ── Private helpers ───────────────────────────────────────────

  /** Normalizes axios error → ApiResponse. */
  private fail<T>(err: any, fallback: string): ApiResponse<T> {
    return {
      success: false,
      message: err?.response?.data?.message || fallback,
      errorCode: err?.response?.status,
    };
  }
}

export default new UserService();
