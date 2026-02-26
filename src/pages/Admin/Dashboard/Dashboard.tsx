import {
  Users,
  Radio,
  FileText,
  Music,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Activity,
  Calendar,
  Bell
} from 'lucide-react';
import './Dashboard.css';

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: React.ReactNode;
}

function StatsCard({ title, value, change, isPositive, icon }: StatsCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-icon-wrapper">
        <div className="stat-icon">{icon}</div>
      </div>
      <div className="stat-content">
        <span className="stat-label">{title}</span>
        <span className="stat-value">{value}</span>
      </div>
      <div className={`stat-change ${isPositive ? 'up' : 'down'}`}>
        <TrendingUp size={14} />
        <span>{change}</span>
      </div>
    </div>
  );
}

interface ActivityItemProps {
  title: string;
  subtitle: string;
  time: string;
  type: 'broadcast' | 'content' | 'user' | 'music';
}

function ActivityItem({ title, subtitle, time, type }: ActivityItemProps) {
  return (
    <div className="activity-item">
      <div className={`activity-dot ${type}`} />
      <div className="activity-content">
        <p className="activity-title">{title}</p>
        <p className="activity-desc">{subtitle}</p>
      </div>
      <span className="activity-time">{time}</span>
    </div>
  );
}

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

function QuickAction({ icon, label, onClick }: QuickActionProps) {
  return (
    <button onClick={onClick} className="quick-action-btn">
      <div className="action-icon">{icon}</div>
      <span>{label}</span>
    </button>
  );
}

export function AdminDashboard() {
  // Get current date formatted in Vietnamese
  const currentDate = new Date().toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="dashboard-content">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1 className="page-title">Dashboard Tổng Quan</h1>
          <p className="page-subtitle">Xin chào, hãy quản lý hệ thống của bạn</p>
        </div>
        <div className="header-right">
          <div className="header-date">
            <Calendar size={20} />
            <span>{currentDate}</span>
          </div>
          <button className="notification-btn">
            <Bell size={20} />
            <span className="notification-badge" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-section">
        <StatsCard
          title="Tổng Người Dùng"
          value="2,847"
          change="+12.5%"
          isPositive={true}
          icon={<Users size={24} />}
        />
        <StatsCard
          title="Phiên Phát Sóng"
          value="145"
          change="+8.2%"
          isPositive={true}
          icon={<Radio size={24} />}
        />
        <StatsCard
          title="Nội Dung Đã Đăng"
          value="1,234"
          change="+5.7%"
          isPositive={true}
          icon={<FileText size={24} />}
        />
        <StatsCard
          title="Bài Hát Trong Thư Viện"
          value="8,921"
          change="+15.3%"
          isPositive={true}
          icon={<Music size={24} />}
        />
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="content-grid">
        {/* Quick Actions */}
        <div className="quick-actions-card">
          <h3 className="card-title">Thao Tác Nhanh</h3>
          <div className="quick-actions-grid">
            <QuickAction icon={<Sparkles size={20} />} label="Nội Dung AI" />
            <QuickAction icon={<Radio size={20} />} label="Phát Sóng Mới" />
            <QuickAction icon={<FileText size={20} />} label="Tạo Bài Viết" />
            <QuickAction icon={<Bell size={20} />} label="Gửi Thông Báo" />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="activity-card">
          <div className="card-header">
            <h3 className="card-title">Hoạt Động Gần Đây</h3>
            <button className="view-all-link">
              Xem tất cả
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="activity-list">
            <ActivityItem
              type="broadcast"
              title="Live broadcast bắt đầu"
              subtitle="Đêm nhạc cổ điển êm dịu - 156 người tham gia"
              time="5 phút trước"
            />
            <ActivityItem
              type="content"
              title="Nội dung mới được đăng"
              subtitle="Podcast: Âm nhạc và tâm hồn - Đang chờ duyệt"
              time="15 phút trước"
            />
            <ActivityItem
              type="user"
              title="Người dùng mới đăng ký"
              subtitle="32 người dùng mới trong 1 giờ qua"
              time="1 giờ trước"
            />
            <ActivityItem
              type="music"
              title="Playlist được cập nhật"
              subtitle="Aethereal Flow - 12 bài hát mới"
              time="2 giờ trước"
            />
            <ActivityItem
              type="broadcast"
              title="Session đã kết thúc"
              subtitle="Jazz Night - 4.8★ rating từ 89 người"
              time="3 giờ trước"
            />
          </div>
        </div>
      </div>

      {/* Live Sessions & Pending Approvals */}
      <div className="content-grid bottom-grid">
        {/* Active Live Sessions */}
        <div className="live-sessions-card">
          <div className="card-header">
            <h3 className="card-title">Live Sessions Đang Hoạt Động</h3>
            <div className="live-badge">
              <span className="pulse-dot" />
              <span>3 LIVE</span>
            </div>
          </div>
          <div className="sessions-list">
            {[
              { title: 'Đêm nhạc cổ điển êm dịu', host: 'DJ Minh Anh', viewers: 156, duration: '45 phút' },
              { title: 'Acoustic Session', host: 'Nguyễn Thảo', viewers: 89, duration: '1 giờ 20 phút' },
              { title: 'Late Night Jazz', host: 'Trần Hải', viewers: 234, duration: '30 phút' },
            ].map((session, idx) => (
              <div key={idx} className="session-item">
                <div className="session-info">
                  <p className="session-title">{session.title}</p>
                  <span className="session-host">Host: {session.host}</span>
                  <span className="session-duration">Thời lượng: {session.duration}</span>
                </div>
                <div className="session-stats">
                  <div className="listeners-count">
                    <Activity size={16} />
                    <span>{session.viewers}</span>
                  </div>
                  <button className="session-link">Xem chi tiết</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="pending-card">
          <div className="card-header">
            <h3 className="card-title">Chờ Phê Duyệt</h3>
            <div className="pending-count">12 items</div>
          </div>
          <div className="pending-list">
            {[
              { type: 'Podcast', title: 'Âm nhạc và tâm hồn - Tập 5', author: 'Lê Phương', time: '2 giờ trước' },
              { type: 'Post', title: 'Top 10 bài hát hay nhất tuần', author: 'Mai Linh', time: '4 giờ trước' },
              { type: 'Broadcast', title: 'EDM Night - Đêm nhạc điện tử', author: 'DJ Khoa', time: '5 giờ trước' },
              { type: 'Music', title: '25 bài hát mới từ nghệ sĩ indie', author: 'Admin Team', time: '1 ngày trước' },
            ].map((item, idx) => (
              <div key={idx} className="pending-item">
                <div className="pending-header">
                  <span className={`pending-type type-${item.type.toLowerCase()}`}>{item.type}</span>
                  <span className="pending-time">{item.time}</span>
                </div>
                <p className="pending-title">{item.title}</p>
                <span className="pending-author">Bởi: {item.author}</span>
                <div className="pending-actions">
                  <button className="approve-btn">Duyệt</button>
                  <button className="reject-btn">Từ chối</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}