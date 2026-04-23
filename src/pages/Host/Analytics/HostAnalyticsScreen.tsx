import {
  TrendingUp,
  Users,
  Radio,
  Eye,
  RefreshCw,
  BarChart3,
  Heart,
  MessageSquare,
  Music,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import './HostAnalyticsScreen.css';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

import { useState, useEffect } from 'react';
import liveSessionApiService, { type HostAnalyticsOverviewResult } from '../../../services/liveSessionApiService';

interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  isPositive?: boolean;
  icon: React.ReactNode;
}

function MetricCard({ title, value, change, isPositive, icon }: MetricCardProps) {
  return (
    <div className="host-an-card">
      <div className="host-an-icon">{icon}</div>
      <div className="host-an-content">
        <span className="host-an-label">{title}</span>
        <span className="host-an-value">{value}</span>
        {change && (
          <div className={`host-an-change ${isPositive ? 'positive' : 'negative'}`}>
            <TrendingUp size={12} />
            <span>{change}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function HostAnalyticsScreen() {
  const navigate = useNavigate();
  const [data, setData] = useState<HostAnalyticsOverviewResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [days] = useState(7); // Default to 7 days, can be made dynamic later

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const result = await liveSessionApiService.getHostAnalyticsOverview(days);
      setData(result);
    } catch (error) {
      console.error("Failed to fetch host analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [days]);

  if (loading) {
    return <div className="host-an-page">Đang tải dữ liệu...</div>;
  }

  if (!data) {
    return <div className="host-an-page">Không thể tải dữ liệu phân tích.</div>;
  }

  return (
    <div className="host-an-page">
      {/* Header */}
      <div className="host-an-header">
        <div>
          <h1>Phân tích phiên phát sóng</h1>
          <p>Theo dõi hiệu suất và tương tác của các phiên phát sóng của bạn</p>
        </div>
        <button className="host-an-btn host-an-btn--outline" onClick={fetchAnalytics}>
          <RefreshCw size={15} />
          Làm mới
        </button>
      </div>

      {/* Metrics */}
      <div className="host-an-stats-grid">
        <MetricCard
          title="Tổng người nghe"
          value={data.totalListeners.toLocaleString()}
          icon={<Users size={20} />}
        />
        <MetricCard
          title="Phiên đã phát"
          value={data.totalSessions.toString()}
          icon={<Radio size={20} />}
        />
        <MetricCard
          title="Lượt xem đỉnh"
          value={data.peakListeners.toLocaleString()}
          icon={<Eye size={20} />}
        />
        <MetricCard
          title="Yêu cầu nhạc"
          value={data.totalMusicRequests.toLocaleString()}
          icon={<Music size={20} />}
        />
      </div>

      {/* Charts Row */}
      <div className="host-an-charts-row">
        <div className="host-an-chart-card">
          <h3 className="host-an-chart-title">Người nghe & Yêu cầu nhạc theo ngày</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis dataKey="date" stroke="#64748b" tickFormatter={(val) => val.split('-').slice(1).join('/')} />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Bar dataKey="listenersCount" fill="#1a9fd4" radius={[8, 8, 0, 0]} name="Người nghe" />
              <Bar dataKey="requestsCount" fill="#a855f7" radius={[8, 8, 0, 0]} name="Yêu cầu nhạc" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="host-an-chart-card">
          <h3 className="host-an-chart-title">Tương tác chat theo ngày</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis dataKey="date" stroke="#64748b" tickFormatter={(val) => val.split('-').slice(1).join('/')} />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="chatCount"
                stroke="#1a9fd4"
                strokeWidth={3}
                dot={{ r: 4, fill: '#1a9fd4' }}
                name="Tin nhắn chat"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Requests */}
      <div className="host-an-top-requests">
        <div className="host-an-top-header">
          <h3>Bài hát được yêu cầu nhiều nhất</h3>
        </div>
        <div className="host-an-top-list">
          {data.topRequestedSongs.length === 0 ? (
            <p className="no-data-msg">Chưa có bài hát nào được yêu cầu.</p>
          ) : (
            data.topRequestedSongs.map((req) => (
              <div key={req.rank} className="host-an-top-item">
                <span className="host-an-rank">#{req.rank}</span>
                <Music size={16} className="host-an-top-icon" />
                <span className="host-an-top-title">{req.title} {req.artist ? `- ${req.artist}` : ''}</span>
                <span className="host-an-top-count">{req.count} lượt</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Ended Sessions Table */}
      <div className="host-an-table-section">
        <h3 className="host-an-table-title">Phân tích phiên phát sóng đã kết thúc</h3>
        <div className="host-an-table-wrapper">
          <table className="host-an-table">
            <thead>
              <tr>
                <th>Tên phiên</th>
                <th>Kết thúc lúc</th>
                <th>Thời lượng</th>
                <th>Người nghe</th>
                <th>Yêu cầu nhạc</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data.endedSessionsAnalysis.length === 0 ? (
                <tr>
                  <td colSpan={6} className="no-data-msg" style={{ textAlign: 'center', padding: '2rem' }}>
                    Chưa có phiên phát sóng nào kết thúc trong khoảng thời gian này.
                  </td>
                </tr>
              ) : (
                data.endedSessionsAnalysis.map((session) => (
                  <tr key={session.sessionId}>
                    <td className="font-medium text-white">{session.sessionName}</td>
                    <td>{session.endedAt ? format(new Date(session.endedAt), 'HH:mm dd/MM/yyyy', { locale: vi }) : 'N/A'}</td>
                    <td>{Math.round(session.totalDurationMinutes)} phút</td>
                    <td>{session.totalListeners}</td>
                    <td>{session.musicRequestsCount}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="host-an-btn host-an-btn--outline" 
                        style={{ padding: '4px 12px', fontSize: '0.85rem' }}
                        onClick={() => navigate(`/host/analytics/${session.sessionId}`)}
                      >
                        Chi tiết
                      </button>
                    </td>
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
