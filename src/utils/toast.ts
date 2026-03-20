import { toast } from 'react-toastify';
import type { Id } from 'react-toastify';

/**
 * Toast Utility Functions
 * Sử dụng để hiển thị thông báo trong toàn bộ ứng dụng
 */

export const showToast = {
  /**
   * Toast thành công
   * @param message - Tiêu đề thông báo
   */
  success: (message: string) => {
    toast.success(message);
  },

  /**
   * Toast lỗi
   * @param message - Tiêu đề thông báo
   */
  error: (message: string) => {
    toast.error(message);
  },

  /**
   * Toast cảnh báo
   * @param message - Tiêu đề thông báo
   */
  warning: (message: string) => {
    toast.warning(message);
  },

  /**
   * Toast thông tin
   * @param message - Tiêu đề thông báo
   */
  info: (message: string) => {
    toast.info(message);
  },

  /**
   * Toast loading
   * @param message - Tiêu đề thông báo
   * @returns ID của toast để có thể dismiss sau
   */
  loading: (message: string): Id => {
    return toast.loading(message);
  },

  /**
   * Toast promise - tự động chuyển đổi giữa loading/success/error
   * @param promise - Promise cần theo dõi
   * @param messages - Các message cho từng trạng thái
   */
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      pending: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(promise, messages);
  },

  /**
   * Dismiss toast
   * @param toastId - ID của toast cần dismiss (optional, không truyền sẽ dismiss tất cả)
   */
  dismiss: (toastId?: Id) => {
    toast.dismiss(toastId);
  },
};

// Export default cho các trường hợp đơn giản
export default showToast;
