import { useState, useEffect } from 'react';
import {
  Radio,
  Music,
  Clock,
  ArrowUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  Activity
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import liveSessionApiService, { type HostDashboardOverviewResult } from '../../../services/liveSessionApiService';
import './HostDashboard.css';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon: React.ReactNode;
  subtitle?: string;
}

function StatCard({ title, value, change, isPositive, icon, subtitle }: StatCardProps) {
  return (
    <div className="host-stat-card">
      <div className="host-stat-header">
        <div className="host-stat-icon">{icon}</div>
        {change && (
          <div className={`host-stat-change ${isPositive ? 'positive' : 'negative'}`}>
            <ArrowUp size={14} />
            <span>{change}</span>
          </div>
        )}
      </div>
      <h3 className="host-stat-title">{title}</h3>
      <p className="host-stat-value">{value}</p>
      {subtitle && <p className="host-stat-subtitle">{subtitle}</p>}
    </div>
  );
}

export function HostDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<HostDashboardOverviewResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const result = await liveSessionApiService.getHostDashboardOverview(7);
        setData(result);
      } catch (error) {
        console.error("Failed to fetch host dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return <CheckCircle size={16} className="status-icon approved" />;
      case 'rejected': return <XCircle size={16} className="status-icon rejected" />;
      default: return <AlertCircle size={16} className="status-icon pending" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return 'Đã duyệt';
      case 'rejected': return 'Từ chối';
      default: return 'Đang chờ';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} giây trước`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} ngày trước`;
  };

  if (loading) {
    return <div className="host-dashboard">Đang tải dữ liệu...</div>;
  }

  if (!data) {
    return <div className="host-dashboard">Không thể tải dữ liệu bảng điều khiển.</div>;
  }

  return (
    <div className="host-dashboard">
      <div className="host-dashboard-header">
        <div>
          <h1 className="host-dashboard-title">Bảng Điều Khiển Host</h1>
          <p className="host-dashboard-subtitle">Xin chào, MC! Theo dõi số liệu và lịch phát sóng của bạn.</p>
        </div>
        <button className="host-btn host-btn--primary" onClick={() => navigate('/host/sessions')}>
          <Radio size={16} />
          Điều khiển Live
        </button>
      </div>

      <div className="host-stats-grid">
        <StatCard
          title="Tổng số phiên"
          value={data.totalSessions}
          icon={<Radio size={24} />}
          subtitle="Tất cả các phiên đã tạo"
        />
        <StatCard
          title="Tổng lượt nghe"
          value={data.totalListeners}
          icon={<Users size={24} />}
          subtitle="Lượt nghe tích lũy"
        />
        <StatCard
          title="Yêu cầu nhạc đang chờ"
          value={data.pendingMusicRequests}
          icon={<Music size={24} />}
          subtitle="Cần được phê duyệt"
        />
        <StatCard
          title="Lịch sắp tới"
          value={data.upcomingSchedules.length}
          icon={<Clock size={24} />}
          subtitle="Phiên phát sóng đã hẹn"
        />
      </div>

      <div className="host-content-grid">
        <div className="host-chart-card">
          <h3 className="host-chart-title">Phiên & Người nghe 7 ngày qua</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis dataKey="date" stroke="#64748b" tickFormatter={(val) => val.split('-').slice(1).join('/')} />
              <YAxis yAxisId="left" stroke="#64748b" />
              <YAxis yAxisId="right" orientation="right" stroke="#64748b" />
              <Tooltip />
              <Bar yAxisId="left" dataKey="sessionsCount" name="Số phiên" fill="#1a9fd4" radius={[8, 8, 0, 0]} />
              <Bar yAxisId="right" dataKey="listenersCount" name="Người nghe" fill="#55c5f1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="host-list-card">
          <div className="host-list-header">
            <h3 className="host-list-title">Lịch sắp tới</h3>
            <button className="host-view-all-btn" onClick={() => navigate('/host/schedule')}>Xem lịch</button>
          </div>
          <div className="host-list-content">
            {data.upcomingSchedules.length === 0 ? (
              <p className="no-data-msg">Chưa có lịch phát sóng nào.</p>
            ) : (
              data.upcomingSchedules.map((session) => (
                <div key={session.id} className="host-session-item">
                  <div className="host-session-icon">
                    <Radio size={20} />
                  </div>
                  <div className="host-session-info">
                    <h4 className="host-session-title">{session.title || 'Không tên'}</h4>
                    <p className="host-session-meta">
                      <Clock size={14} />
                      {session.startTime} - {session.endTime} • {formatDate(session.startDate)}
                    </p>
                  </div>
                  <span className="host-session-badge scheduled">Đã lên lịch</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="host-requests-card" style={{ marginTop: '24px' }}>
        <div className="host-list-header">
          <h3 className="host-list-title">Phân tích phiên đã kết thúc</h3>
        </div>
        <div className="host-requests-table">
          <table>
            <thead>
              <tr>
                <th>Tên Phiên</th>
                <th>Ngày kết thúc</th>
                <th>Thời lượng (phút)</th>
                <th>Lượt nghe</th>
                <th>Yêu cầu nhạc</th>
              </tr>
            </thead>
            <tbody>
              {data.endedSessionsAnalysis.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center' }}>Chưa có dữ liệu phiên kết thúc.</td>
                </tr>
              ) : (
                data.endedSessionsAnalysis.map((session) => (
                  <tr key={session.sessionId}>
                    <td className="host-request-title">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Activity size={16} />
                        {session.sessionName}
                      </div>
                    </td>
                    <td>{formatDate(session.endedAt)}</td>
                    <td>{session.totalDurationMinutes.toFixed(1)}</td>
                    <td>{session.totalListeners}</td>
                    <td>{session.musicRequestsCount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="host-requests-card" style={{ marginTop: '24px' }}>
        <div className="host-list-header">
          <h3 className="host-list-title">Yêu cầu nhạc gần đây</h3>
          <button className="host-view-all-btn" onClick={() => navigate('/host/music-requests')}>Xem tất cả</button>
        </div>
        <div className="host-requests-table">
          <table>
            <thead>
              <tr>
                <th>Tiêu đề</th>
                <th>Trạng thái</th>
                <th>Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {data.recentMusicRequests.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center' }}>Không có yêu cầu nhạc nào.</td>
                </tr>
              ) : (
                data.recentMusicRequests.map((request) => (
                  <tr key={request.id}>
                    <td className="host-request-title">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Music size={14} />
                        {request.songTitle} {request.songArtist ? `- ${request.songArtist}` : ''}
                      </div>
                    </td>
                    <td>
                      <span className={`host-status-badge ${request.status.toLowerCase()}`}>
                        {getStatusIcon(request.status)}
                        {getStatusLabel(request.status)}
                      </span>
                    </td>
                    <td className="host-request-time">{formatTimeAgo(request.requestedAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
