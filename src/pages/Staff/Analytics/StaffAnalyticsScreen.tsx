import { TrendingUp, Users, Radio, Eye, RefreshCw, BarChart3, Music } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import './StaffAnalyticsScreen.css';

const weeklyData = [
  { day: 'T2', sessions: 3, listeners: 245, chat: 120 },
  { day: 'T3', listeners: 389, sessions: 5, chat: 245 },
  { day: 'T4', listeners: 312, sessions: 4, chat: 198 },
  { day: 'T5', listeners: 456, sessions: 6, chat: 310 },
  { day: 'T6', listeners: 523, sessions: 7, chat: 389 },
  { day: 'T7', listeners: 678, sessions: 8, chat: 520 },
  { day: 'CN', listeners: 534, sessions: 6, chat: 410 },
];

const topContent = [
  { title: 'Bohemian Rhapsody - Queen', type: 'music', requests: 45 },
  { title: 'Tech Talk Episode 3', type: 'podcast', requests: 28 },
  { title: 'Hotel California - Eagles', type: 'music', requests: 32 },
  { title: 'Wellness Wednesday Ep4', type: 'podcast', requests: 19 },
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
    <div className="staff-an-card">
      <div className="staff-an-icon">{icon}</div>
      <div className="staff-an-content">
        <span className="staff-an-label">{title}</span>
        <span className="staff-an-value">{value}</span>
        <div className={`staff-an-change ${isPositive ? 'positive' : 'negative'}`}>
          <TrendingUp size={12} />
          <span>{change}</span>
        </div>
      </div>
    </div>
  );
}

export function StaffAnalyticsScreen() {
  return (
    <div className="staff-an-page">
      <div className="staff-an-header">
        <div>
          <h1>Phân tích & Báo cáo</h1>
          <p>Theo dõi hiệu suất vận hành và tương tác của các phiên phát sóng</p>
        </div>
        <button className="lm-btn lm-btn--outline">
          <RefreshCw size={15} />
          Làm mới
        </button>
      </div>

      <div className="staff-an-stats-grid">
        <MetricCard title="Tổng phiên" value="47" change="+12.5%" isPositive={true} icon={<Radio size={20} />} />
        <MetricCard title="Tổng người nghe" value="3,137" change="+18.3%" isPositive={true} icon={<Users size={20} />} />
        <MetricCard title="Lượt xem đỉnh" value="678" change="+9.1%" isPositive={true} icon={<Eye size={20} />} />
        <MetricCard title="Yêu cầu nhạc" value="1,240" change="+24.7%" isPositive={true} icon={<Music size={20} />} />
      </div>

      <div className="staff-an-charts-row">
        <div className="staff-an-chart-card">
          <h3>Phiên phát sóng & Người nghe theo ngày</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis dataKey="day" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Bar dataKey="sessions" fill="#1a9fd4" radius={[8,8,0,0]} name="Phiên" />
              <Bar dataKey="listeners" fill="#a855f7" radius={[8,8,0,0]} name="Người nghe" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="staff-an-chart-card">
          <h3>Tin nhắn chat theo ngày</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis dataKey="day" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Line type="monotone" dataKey="chat" stroke="#1a9fd4" strokeWidth={3}
                dot={{ r: 4, fill: '#1a9fd4' }} name="Tin nhắn" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="staff-an-top-section">
        <div className="staff-an-top-card">
          <h3>Nội dung được yêu cầu nhiều nhất</h3>
          {topContent.map((item, idx) => (
            <div key={idx} className="staff-an-top-item">
              <span className="staff-an-top-rank">#{idx + 1}</span>
              <span className={`staff-an-top-type ${item.type}`}>
                {item.type === 'music' ? <Music size={12} /> : '🎙️'}
              </span>
              <span className="staff-an-top-title">{item.title}</span>
              <span className="staff-an-top-count">{item.requests} yêu cầu</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
