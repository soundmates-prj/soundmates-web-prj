import api from "./axios";

export interface NotificationItem {
  id: string;
  type: string;
  referenceId: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationPage {
  items: NotificationItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

const BASE = "/api/v1";

/** Lấy tất cả notifications (có phân trang) */
export async function getNotifications(
  page = 1,
  pageSize = 20
): Promise<NotificationPage> {
  const res = await api.get<ApiResponse<NotificationPage>>(
    `${BASE}/me/notifications`,
    { params: { page, pageSize } }
  );
  return res.data.data;
}

/** Lấy notifications chưa đọc */
export async function getUnreadNotifications(
  page = 1,
  pageSize = 20
): Promise<NotificationPage> {
  const res = await api.get<ApiResponse<NotificationPage>>(
    `${BASE}/me/notifications/not-read`,
    { params: { page, pageSize } }
  );
  return res.data.data;
}

/** Đánh dấu một notification là đã đọc */
export async function markAsRead(notificationId: string): Promise<void> {
  await api.put(`${BASE}/notifications/${notificationId}/read`);
}

/** Đánh dấu tất cả notifications là đã đọc */
export async function markAllAsRead(): Promise<void> {
  await api.put(`${BASE}/notifications/read-all`);
}
