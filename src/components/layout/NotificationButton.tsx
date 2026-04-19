import { useState, useRef, useEffect, useCallback } from "react";
import { Bell, Check, Loader2, BellOff } from "lucide-react";
import "./NotificationButton.css";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  type NotificationItem,
} from "../../services/notificationService";
import notificationHubService, {
  type RealtimeNotification,
  type BroadcastNotification,
} from "../../services/notificationHubService";

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Date(dateStr).toLocaleDateString("vi-VN");
}

function realtimeToItem(n: RealtimeNotification): NotificationItem {
  return {
    id: n.id,
    type: n.type,
    referenceId: n.referenceId ?? null,
    message: n.message,
    isRead: n.isRead,
    createdAt: n.createdAt,
  };
}

function broadcastToItem(n: BroadcastNotification): NotificationItem {
  return {
    id: n.id,
    type: n.type,
    referenceId: n.referenceId ?? null,
    message: n.message,
    isRead: false,
    createdAt: n.createdAt,
  };
}

// ──────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 60_000; // reduced since SignalR handles real-time

export default function NotificationButton() {
  const [show, setShow] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // ── fetch count (silent, for badge) ──────────────────────────
  const fetchUnreadCount = useCallback(async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;
      const page = await getNotifications(1, 50);
      const count = page.items.filter((n) => !n.isRead).length;
      setUnreadCount(count);
    } catch {
      // suppress — badge just won't update
    }
  }, []);

  // ── fetch full list (when dropdown opens) ────────────────────
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const page = await getNotifications(1, 20);
      setNotifications(page.items);
      setUnreadCount(page.items.filter((n) => !n.isRead).length);
    } catch {
      // keep previous state on error
    } finally {
      setLoading(false);
    }
  }, []);

  // ── SignalR: connect to NotificationHub for real-time push ───
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    let cleanupPersonal: (() => void) | null = null;
    let cleanupBroadcast: (() => void) | null = null;
    let cleanupRemove: (() => void) | null = null;

    notificationHubService
      .start(token)
      .then(() => {
        // Personal notification (host ← member request, member ← host review)
        cleanupPersonal = notificationHubService.onReceiveNotification(
          (n: RealtimeNotification) => {
            const item = realtimeToItem(n);
            setNotifications((prev) => {
              // avoid duplicates
              if (prev.some((x) => x.id === item.id)) return prev;
              return [item, ...prev];
            });
            setUnreadCount((c) => c + 1);
          }
        );

        // Broadcast notification (e.g. new live schedule → all users)
        cleanupBroadcast = notificationHubService.onReceiveBroadcastNotification(
          (n: BroadcastNotification) => {
            const item = broadcastToItem(n);
            setNotifications((prev) => {
              if (prev.some((x) => x.id === item.id)) return prev;
              return [item, ...prev];
            });
            setUnreadCount((c) => c + 1);
          }
        );

        // Remove deleted notifications silently to stay in sync
        cleanupRemove = notificationHubService.onRemoveNotification(
          () => {
            getNotifications(1, 20).then((page) => {
              setNotifications(page.items);
              setUnreadCount(page.items.filter((n) => !n.isRead).length);
            }).catch(() => {});
          }
        );
      })
      .catch((err) => {
        console.warn("[NotificationButton] SignalR connect failed:", err);
      });

    return () => {
      cleanupPersonal?.();
      cleanupBroadcast?.();
      cleanupRemove?.();
    };
  }, []);

  // ── poll badge count periodically (fallback) ─────────────────
  useEffect(() => {
    fetchUnreadCount();
    const id = setInterval(fetchUnreadCount, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchUnreadCount]);

  // ── open dropdown → load fresh list ─────────────────────────
  useEffect(() => {
    if (show) fetchNotifications();
  }, [show, fetchNotifications]);

  // ── close on outside click ───────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShow(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── mark single as read ──────────────────────────────────────
  const handleMarkRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await markAsRead(id);
    } catch {
      // optimistic already applied — ignore error
    }
  };

  // ── mark all as read ─────────────────────────────────────────
  const handleMarkAllRead = async () => {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await markAllAsRead();
    } catch {
      // optimistic already applied — ignore error
    } finally {
      setMarkingAll(false);
    }
  };

  // ──────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────
  return (
    <div className="notif-btn-container" ref={ref}>
      <button
        id="notification-bell-btn"
        className="notif-btn"
        onClick={() => setShow((s) => !s)}
        aria-label="Thông báo"
      >
        <Bell size={20} strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="notif-btn-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {show && (
        <div className="notif-dropdown">
          {/* Header */}
          <div className="notif-dropdown-header">
            <h3>Thông báo</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="notif-mark-read-btn"
                disabled={markingAll}
                aria-label="Đánh dấu tất cả đã đọc"
              >
                {markingAll ? (
                  <Loader2 size={13} className="notif-spin" />
                ) : (
                  <Check size={13} />
                )}
                Đánh dấu đã đọc
              </button>
            )}
          </div>

          {/* List */}
          <div className="notif-list">
            {loading ? (
              <div className="notif-loading">
                <Loader2 size={22} className="notif-spin" />
                <span>Đang tải...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="notif-empty">
                <BellOff size={32} strokeWidth={1.5} />
                <span>Không có thông báo nào</span>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`notif-item ${notif.isRead ? "" : "unread"}`}
                  onClick={() => !notif.isRead && handleMarkRead(notif.id)}
                  role={!notif.isRead ? "button" : undefined}
                  tabIndex={!notif.isRead ? 0 : undefined}
                >
                  {!notif.isRead && <div className="notif-dot" />}
                  <div className="notif-content">
                    <p className="notif-text">{notif.message}</p>
                    <span className="notif-time">{timeAgo(notif.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="notif-dropdown-footer">
              <button onClick={() => setShow(false)}>
                Xem tất cả thông báo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
