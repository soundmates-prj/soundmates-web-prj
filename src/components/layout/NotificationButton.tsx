import { useState, useRef, useEffect } from "react";
import { Bell, Check } from "lucide-react";
import "./NotificationButton.css";

interface Notification {
  id: string;
  text: string;
  time: string;
  unread: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: "1", text: "Bạn đã đăng ký tài khoản thành công!", time: "Vừa xong", unread: true },
  { id: "2", text: "Có phiên Live mới từ SpaceSpeakers", time: "5 phút trước", unread: true },
  { id: "3", text: 'Podcast mới: "Tâm lý học ứng dụng" đã phát hành', time: "1 giờ trước", unread: true },
];

export default function NotificationButton() {
  const [show, setShow] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => n.unread).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShow(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  return (
    <div className="notif-btn-container" ref={ref}>
      <button className="notif-btn" onClick={() => setShow(!show)}>
        <Bell size={20} strokeWidth={2} />
        {unreadCount > 0 && <span className="notif-btn-badge">{unreadCount}</span>}
      </button>

      {show && (
        <div className="notif-dropdown">
          <div className="notif-dropdown-header">
            <h3>Thông báo</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="notif-mark-read-btn">
                <Check size={14} />
                Đánh dấu đã đọc
              </button>
            )}
          </div>

          <div className="notif-list">
            {notifications.map((notif) => (
              <div key={notif.id} className={`notif-item ${notif.unread ? "unread" : ""}`}>
                {notif.unread && <div className="notif-dot" />}
                <div className="notif-content">
                  <p className="notif-text">{notif.text}</p>
                  <span className="notif-time">{notif.time}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="notif-dropdown-footer">
            <button>Xem tất cả thông báo</button>
          </div>
        </div>
      )}
    </div>
  );
}
