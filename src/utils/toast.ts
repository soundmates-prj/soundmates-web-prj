import { toast } from 'sonner';

/**
 * Toast Utility Functions
 * Sử dụng để hiển thị thông báo trong toàn bộ ứng dụng
 */

export const showToast = {
  /**
   * Toast thành công
   * @param message - Tiêu đề thông báo
   * @param description - Mô tả chi tiết (optional)
   */
  success: (message: string, description?: string) => {
    toast.success(message, {
      description,
    });
  },

  /**
   * Toast lỗi
   * @param message - Tiêu đề thông báo
   * @param description - Mô tả chi tiết (optional)
   */
  error: (message: string, description?: string) => {
    toast.error(message, {
      description,
    });
  },

  /**
   * Toast cảnh báo
   * @param message - Tiêu đề thông báo
   * @param description - Mô tả chi tiết (optional)
   */
  warning: (message: string, description?: string) => {
    toast.warning(message, {
      description,
    });
  },

  /**
   * Toast thông tin
   * @param message - Tiêu đề thông báo
   * @param description - Mô tả chi tiết (optional)
   */
  info: (message: string, description?: string) => {
    toast.info(message, {
      description,
    });
  },

  /**
   * Toast loading
   * @param message - Tiêu đề thông báo
   * @returns ID của toast để có thể dismiss sau
   */
  loading: (message: string) => {
    return toast.loading(message);
  },

  /**
   * Toast với action button
   * @param message - Tiêu đề thông báo
   * @param options - Các tùy chọn
   */
  action: (
    message: string,
    options: {
      description?: string;
      actionLabel: string;
      onAction: () => void;
      cancelLabel?: string;
      onCancel?: () => void;
    }
  ) => {
    toast(message, {
      description: options.description,
      action: {
        label: options.actionLabel,
        onClick: options.onAction,
      },
      cancel: options.cancelLabel && options.onCancel
        ? {
            label: options.cancelLabel,
            onClick: options.onCancel,
          }
        : undefined,
    });
  },

  /**
   * Toast promise - tự động chuyển đổi giữa loading/success/error
   * @param promise - Promise cần theo dõi
   * @param messages - Các message cho từng trạng thái
   */
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return toast.promise(promise, messages);
  },

  /**
   * Dismiss toast
   * @param toastId - ID của toast cần dismiss (optional, không truyền sẽ dismiss tất cả)
   */
  dismiss: (toastId?: string | number) => {
    toast.dismiss(toastId);
  },

  /**
   * Custom toast
   * @param message - Tiêu đề thông báo
   * @param options - Các tùy chọn custom
   */
  custom: (message: string, options?: any) => {
    toast(message, options);
  },
};

// Export default cho các trường hợp đơn giản
export default showToast;
