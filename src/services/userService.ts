import api from './axios';

// Types based on backend DTOs from AuthQueryService

/**
 * User DTO - matches UserReadDto from backend
 */
export interface UserDto {
  id: string; // Guid
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roleId?: string; // Guid
  roleName?: string;
  isActive: boolean;
  createdAt?: string; // DateTime ISO string
  updatedAt?: string; // DateTime ISO string
}

/**
 * Paginated result wrapper - matches PagedResult<T> from backend
 */
export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

/**
 * API Response wrapper - matches ApiResponse<T> from backend
 */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errorCode?: number;
}

/**
 * Query parameters for getting users
 */
export interface GetUsersParams {
  q?: string; // Search query (username, email, display name)
  page?: number; // Page number (default: 1)
  pageSize?: number; // Page size (default: 20)
}

/**
 * User Service - handles user-related API calls
 */
class UserService {
  /**
   * Get paginated list of users
   * @param params Query parameters
   * @returns Paginated list of users
   */
  async getUsers(params?: GetUsersParams): Promise<ApiResponse<PagedResult<UserDto>>> {
    try {
      const response = await api.get<ApiResponse<PagedResult<UserDto>>>('/users', {
        params: {
          q: params?.q,
          page: params?.page || 1,
          pageSize: params?.pageSize || 20,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching users:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Lỗi khi tải danh sách người dùng',
        errorCode: error.response?.status,
      };
    }
  }

  /**
   * Get user by ID
   * @param id User ID (Guid)
   * @returns User details
   */
  async getUserById(id: string): Promise<ApiResponse<UserDto>> {
    try {
      const response = await api.get<ApiResponse<UserDto>>(`/users/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching user:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Lỗi khi tải thông tin người dùng',
        errorCode: error.response?.status,
      };
    }
  }

  /**
   * Get user by username
   * @param username Username to search
   * @returns User details
   */
  async getUserByUsername(username: string): Promise<ApiResponse<UserDto>> {
    try {
      const response = await api.get<ApiResponse<UserDto>>(`/users/by-username/${username}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching user by username:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Lỗi khi tải thông tin người dùng',
        errorCode: error.response?.status,
      };
    }
  }
}

export default new UserService();
