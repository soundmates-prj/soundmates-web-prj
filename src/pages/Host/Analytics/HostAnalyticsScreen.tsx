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

const weeklyData = [
  { day: 'T2', listeners: 245, requests: 18, chat: 120 },
  { day: 'T3', listeners: 389, requests: 32, chat: 245 },
  { day: 'T4', listeners: 312, requests: 24, chat: 198 },
  { day: 'T5', listeners: 456, requests: 41, chat: 310 },
  { day: 'T6', listeners: 523, requests: 55, chat: 389 },
  { day: 'T7', listeners: 678, requests: 72, chat: 520 },
  { day: 'CN', listeners: 534, requests: 48, chat: 410 },
];

const topRequests = [
  { rank: 1, title: 'Bohemian Rhapsody - Queen', count: 28 },
  { rank: 2, title: 'Imagine - John Lennon', count: 24 },
  { rank: 3, title: 'Hotel California - Eagles', count: 21 },
  { rank: 4, title: 'Stairway to Heaven - Led Zeppelin', count: 18 },
  { rank: 5, title: 'Billie Jean - Michael Jackson', count: 15 },
];

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: React.ReactNode;
}

function MetricCard({ title, value, change, isPositive, icon }: MetricCardProps) {
  return (
    <div className="host-an-card">
      <div className="host-an-icon">{icon}</div>
      <div className="host-an-content">
        <span className="host-an-label">{title}</span>
        <span className="host-an-value">{value}</span>
        <div className={`host-an-change ${isPositive ? 'positive' : 'negative'}`}>
          <TrendingUp size={12} />
          <span>{change}</span>
        </div>
      </div>
    </div>
  );
}

export function HostAnalyticsScreen() {
  return (
    <div className="host-an-page">
      {/* Header */}
      <div className="host-an-header">
        <div>
          <h1>Phân tích phiên phát sóng</h1>
          <p>Theo dõi hiệu suất và tương tác của các phiên phát sóng của bạn</p>
        </div>
        <button className="host-an-btn host-an-btn--outline">
          <RefreshCw size={15} />
          Làm mới
        </button>
      </div>

      {/* Metrics */}
      <div className="host-an-stats-grid">
        <MetricCard
          title="Tổng người nghe"
          value="3,137"
          change="+23.5%"
          isPositive={true}
          icon={<Users size={20} />}
        />
        <MetricCard
          title="Phiên đã phát"
          value="12"
          change="+4"
          isPositive={true}
          icon={<Radio size={20} />}
        />
        <MetricCard
          title="Lượt xem đỉnh"
          value="678"
          change="+12.3%"
          isPositive={true}
          icon={<Eye size={20} />}
        />
        <MetricCard
          title="Yêu cầu nhạc"
          value="290"
          change="+35.8%"
          isPositive={true}
          icon={<Music size={20} />}
        />
      </div>

      {/* Charts Row */}
      <div className="host-an-charts-row">
        <div className="host-an-chart-card">
          <h3 className="host-an-chart-title">Người nghe & Yêu cầu nhạc theo ngày</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis dataKey="day" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Bar dataKey="listeners" fill="#1a9fd4" radius={[8, 8, 0, 0]} name="Người nghe" />
              <Bar dataKey="requests" fill="#a855f7" radius={[8, 8, 0, 0]} name="Yêu cầu nhạc" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="host-an-chart-card">
          <h3 className="host-an-chart-title">Tương tác chat theo ngày</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis dataKey="day" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="chat"
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
          {topRequests.map((req) => (
            <div key={req.rank} className="host-an-top-item">
              <span className="host-an-rank">#{req.rank}</span>
              <Music size={16} className="host-an-top-icon" />
              <span className="host-an-top-title">{req.title}</span>
              <span className="host-an-top-count">{req.count} lượt</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
