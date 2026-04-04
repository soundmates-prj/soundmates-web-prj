import api from './axios';

// ── Enum — matches backend AccountStatusEnum ──────────────────────
export const AccountStatusEnum = {
  Active: 1,
  Deactivated: 2,
  Suspended: 3,
  DeletionPending: 4,
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
  firstName?: string | null;
  lastName?: string | null;
  roleId?: string;
  roleName?: string;
  isActive: boolean;
  isVerified: boolean;
  emailVerifiedAt?: string | null;
  accountStatus?: number;           // 1=Active 2=Deactivated 3=Suspended 4=DeletionPending
  deactivatedAt?: string | null;
  deactivationReason?: string | null;
  deletionRequestedAt?: string | null;
  deletionScheduledAt?: string | null;
  bannedAt?: string | null;
  banReason?: string | null;
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

export interface UpdatePasswordPayload {
  oldPassword: string;
  newPassword: string;
}

export interface UpdateAccountStatusPayload {
  status: AccountStatusEnum;
  reason?: string;
  note?: string;
}

// ── Account deactivation / deletion payloads ─────────────────────────

export interface DeactivateAccountPayload {
  password: string;
  reason: string;
  additionalNote?: string;
}

export interface RequestDeletionPayload {
  password: string;
  confirmationText: string;
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
  // CHANGE PASSWORD
  // ═══════════════════════════════════════════════════════════════════

  /**
   * POST /api/v1/auth/change-password
   * Authenticated user changes their own password.
   */
  async updatePassword(
    payload: UpdatePasswordPayload,
  ): Promise<ApiResponse<void>> {
    try {
      const res = await api.post<ApiResponse<void>>(
        '/auth/change-password',
        {
          oldPassword: payload.oldPassword,
          newPassword: payload.newPassword,
        },
      );
      return res.data;
    } catch (err: any) {
      console.error('[UserService] updatePassword error:', err);
      return this.fail(err, 'Không thể đổi mật khẩu');
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

  // ═══════════════════════════════════════════════════════════════════
  // MEMBER ACCOUNT SELF-SERVICE
  // ═══════════════════════════════════════════════════════════════════

  /**
   * POST /api/v1/auth/deactivate-account
   * Member-initiated account deactivation (soft lock, reversible within 90 days).
   */
  async deactivateAccount(
    payload: DeactivateAccountPayload,
  ): Promise<ApiResponse<void>> {
    try {
      const res = await api.post<ApiResponse<void>>(
        '/auth/deactivate-account',
        {
          password: payload.password,
          reason: payload.reason,
          additionalNote: payload.additionalNote,
        },
      );
      return res.data;
    } catch (err: any) {
      console.error('[UserService] deactivateAccount error:', err);
      return this.fail(err, 'Không thể vô hiệu hóa tài khoản');
    }
  }

  /**
   * POST /api/v1/auth/request-account-deletion
   * Member-initiated permanent deletion request (30-day grace period).
   */
  async requestAccountDeletion(
    payload: RequestDeletionPayload,
  ): Promise<ApiResponse<void>> {
    try {
      const res = await api.post<ApiResponse<void>>(
        '/auth/request-account-deletion',
        {
          password: payload.password,
          confirmationText: payload.confirmationText,
        },
      );
      return res.data;
    } catch (err: any) {
      console.error('[UserService] requestAccountDeletion error:', err);
      return this.fail(err, 'Không thể xóa tài khoản');
    }
  }

  /**
   * POST /api/v1/auth/cancel-account-deletion
   * Cancels a pending deletion within the 30-day grace period.
   */
  async cancelAccountDeletion(): Promise<ApiResponse<void>> {
    try {
      const res = await api.post<ApiResponse<void>>(
        '/auth/cancel-account-deletion',
      );
      return res.data;
    } catch (err: any) {
      console.error('[UserService] cancelAccountDeletion error:', err);
      return this.fail(err, 'Không thể hủy yêu cầu xóa tài khoản');
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
