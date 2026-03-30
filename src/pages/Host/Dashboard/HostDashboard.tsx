import {
  Radio,
  Calendar,
  Music,
  Mic,
  Clock,
  ArrowUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import './HostDashboard.css';

const sessionData = [
  { day: 'T2', sessions: 2, listeners: 145 },
  { day: 'T3', sessions: 3, listeners: 220 },
  { day: 'T4', sessions: 2, listeners: 198 },
  { day: 'T5', sessions: 4, listeners: 310 },
  { day: 'T6', sessions: 3, listeners: 285 },
  { day: 'T7', sessions: 5, listeners: 420 },
  { day: 'CN', sessions: 3, listeners: 310 },
];

const upcomingSessions = [
  { id: 1, title: 'Chill Night Radio', time: '20:00 - 22:00', date: 'Hôm nay', host: 'Bạn', status: 'scheduled' },
  { id: 2, title: 'Morning Jazz', time: '08:00 - 10:00', date: 'Ngày mai', host: 'Bạn', status: 'scheduled' },
];

const recentRequests = [
  { id: 1, type: 'music', title: 'Bohemian Rhapsody - Queen', user: 'User123', status: 'pending', time: '5 phút trước' },
  { id: 2, type: 'podcast', title: 'Tech Talk Episode 5', user: 'PodcastFan', status: 'approved', time: '15 phút trước' },
  { id: 3, type: 'music', title: 'Imagine - John Lennon', user: 'MusicLover', status: 'pending', time: '23 phút trước' },
];

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: React.ReactNode;
  subtitle?: string;
}

function StatCard({ title, value, change, isPositive, icon, subtitle }: StatCardProps) {
  return (
    <div className="host-stat-card">
      <div className="host-stat-header">
        <div className="host-stat-icon">{icon}</div>
        <div className={`host-stat-change ${isPositive ? 'positive' : 'negative'}`}>
          <ArrowUp size={14} />
          <span>{change}</span>
        </div>
      </div>
      <h3 className="host-stat-title">{title}</h3>
      <p className="host-stat-value">{value}</p>
      {subtitle && <p className="host-stat-subtitle">{subtitle}</p>}
    </div>
  );
}

export function HostDashboard() {
  const navigate = useNavigate();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle size={16} className="status-icon approved" />;
      case 'rejected': return <XCircle size={16} className="status-icon rejected" />;
      default: return <AlertCircle size={16} className="status-icon pending" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Đã duyệt';
      case 'rejected': return 'Từ chối';
      default: return 'Đang chờ';
    }
  };

  return (
    <div className="host-dashboard">
      <div className="host-dashboard-header">
        <div>
          <h1 className="host-dashboard-title">Bảng Điều Khiển Host</h1>
          <p className="host-dashboard-subtitle">Xin chào, MC! Theo dõi lịch phát sóng và yêu cầu của bạn.</p>
        </div>
        <button className="host-btn host-btn--primary" onClick={() => navigate('/host/live')}>
          <Radio size={16} />
          Điều khiển Live
        </button>
      </div>

      <div className="host-stats-grid">
        <StatCard
          title="Phiên của tôi"
          value="12"
          change="+2"
          isPositive={true}
          icon={<Radio size={24} />}
          subtitle="Tổng phiên đã phát"
        />
        <StatCard
          title="Người nghe tuần này"
          value="1,688"
          change="+18%"
          isPositive={true}
          icon={<Users size={24} />}
          subtitle="Lượt nghe tích lũy"
        />
        <StatCard
          title="Yêu cầu nhạc"
          value="8"
          change="+3"
          isPositive={true}
          icon={<Music size={24} />}
          subtitle="Đang chờ duyệt"
        />
        <StatCard
          title="Yêu cầu podcast"
          value="3"
          change="+1"
          isPositive={true}
          icon={<Mic size={24} />}
          subtitle="Đang chờ duyệt"
        />
      </div>

      <div className="host-content-grid">
        <div className="host-chart-card">
          <h3 className="host-chart-title">Phiên & Người nghe trong tuần</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={sessionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis dataKey="day" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Bar dataKey="sessions" fill="#1a9fd4" radius={[8, 8, 0, 0]} />
              <Bar dataKey="listeners" fill="#55c5f1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="host-list-card">
          <div className="host-list-header">
            <h3 className="host-list-title">Lịch sắp tới</h3>
            <button className="host-view-all-btn" onClick={() => navigate('/host/schedule')}>Xem lịch</button>
          </div>
          <div className="host-list-content">
            {upcomingSessions.map((session) => (
              <div key={session.id} className="host-session-item">
                <div className="host-session-icon">
                  <Radio size={20} />
                </div>
                <div className="host-session-info">
                  <h4 className="host-session-title">{session.title}</h4>
                  <p className="host-session-meta">
                    <Clock size={14} />
                    {session.time} • {session.date}
                  </p>
                </div>
                <span className="host-session-badge scheduled">Đã lên lịch</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="host-requests-card">
        <div className="host-list-header">
          <h3 className="host-list-title">Yêu cầu gần đây</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="host-view-all-btn" onClick={() => navigate('/host/music-requests')}>Yêu cầu nhạc</button>
            <button className="host-view-all-btn" onClick={() => navigate('/host/podcast-requests')}>Yêu cầu podcast</button>
          </div>
        </div>
        <div className="host-requests-table">
          <table>
            <thead>
              <tr>
                <th>Loại</th>
                <th>Tiêu đề</th>
                <th>Người dùng</th>
                <th>Trạng thái</th>
                <th>Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {recentRequests.map((request) => (
                <tr key={request.id}>
                  <td>
                    <span className={`host-type-badge ${request.type}`}>
                      {request.type === 'music' ? <Music size={14} /> : <Mic size={14} />}
                      {request.type === 'music' ? 'Nhạc' : 'Podcast'}
                    </span>
                  </td>
                  <td className="host-request-title">{request.title}</td>
                  <td>{request.user}</td>
                  <td>
                    <span className={`host-status-badge ${request.status}`}>
                      {getStatusIcon(request.status)}
                      {getStatusLabel(request.status)}
                    </span>
                  </td>
                  <td className="host-request-time">{request.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
