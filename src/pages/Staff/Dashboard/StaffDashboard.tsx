import {
  Radio,
  Calendar,
  Clock,
  ArrowUp,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './StaffDashboard.css';

const sessionData = [
  { day: 'T2', sessions: 3, listeners: 245 },
  { day: 'T3', sessions: 5, listeners: 389 },
  { day: 'T4', sessions: 4, listeners: 312 },
  { day: 'T5', sessions: 6, listeners: 456 },
  { day: 'T6', sessions: 7, listeners: 523 },
  { day: 'T7', sessions: 8, listeners: 678 },
  { day: 'CN', sessions: 6, listeners: 534 },
];

const upcomingSessions = [
  { id: 1, title: 'Chill Night Radio', time: '20:00 - 22:00', date: 'Hôm nay', host: 'DJ Minh', status: 'scheduled' },
  { id: 2, title: 'Morning Jazz', time: '08:00 - 10:00', date: 'Ngày mai', host: 'Sarah Lee', status: 'scheduled' },
  { id: 3, title: 'Acoustic Session', time: '15:00 - 17:00', date: 'Ngày mai', host: 'John Doe', status: 'scheduled' },
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
    <div className="staff-stat-card">
      <div className="staff-stat-header">
        <div className="staff-stat-icon">{icon}</div>
        <div className={`staff-stat-change ${isPositive ? 'positive' : 'negative'}`}>
          <ArrowUp size={14} />
          <span>{change}</span>
        </div>
      </div>
      <h3 className="staff-stat-title">{title}</h3>
      <p className="staff-stat-value">{value}</p>
      {subtitle && <p className="staff-stat-subtitle">{subtitle}</p>}
    </div>
  );
}

export function StaffDashboard() {
  return (
    <div className="staff-dashboard">
      <div className="staff-dashboard-header">
        <div>
          <h1 className="staff-dashboard-title" style={{
            background: 'linear-gradient(135deg, #1a9fd4 0%, #55c5f1 50%, #a0e4ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>Bảng Điều Khiển</h1>
          <p className="staff-dashboard-subtitle">Quản lý phiên phát sóng và yêu cầu nội dung</p>
        </div>
      </div>

      <div className="staff-stats-grid">
        <StatCard
          title="Phiên đang hoạt động"
          value="3"
          change="+2"
          isPositive={true}
          icon={<Radio size={24} />}
          subtitle="Đang phát sóng"
        />
        <StatCard
          title="Đã lên lịch hôm nay"
          value="5"
          change="+1"
          isPositive={true}
          icon={<Calendar size={24} />}
          subtitle="Phiên đã lên kế hoạch"
        />

      </div>

      <div className="staff-content-grid">
        <div className="staff-chart-card">
          <h3 className="staff-chart-title">Phiên & Người nghe trong tuần</h3>
          <ResponsiveContainer width="100%" height={300}>
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

        <div className="staff-list-card">
          <div className="staff-list-header">
            <h3 className="staff-list-title">Phiên sắp tới</h3>
            <button className="staff-view-all-btn">Xem tất cả</button>
          </div>
          <div className="staff-list-content">
            {upcomingSessions.map((session) => (
              <div key={session.id} className="staff-session-item">
                <div className="staff-session-icon">
                  <Radio size={20} />
                </div>
                <div className="staff-session-info">
                  <h4 className="staff-session-title">{session.title}</h4>
                  <p className="staff-session-meta">
                    <Clock size={14} />
                    {session.time} • {session.date}
                  </p>
                  <p className="staff-session-host">Host: {session.host}</p>
                </div>
                <span className="staff-session-badge scheduled">Đã lên lịch</span>
              </div>
            ))}
          </div>
        </div>
      </div>


    </div>
  );
}
