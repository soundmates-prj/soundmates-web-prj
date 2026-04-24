import { useEffect, useState } from 'react';
import {
  Radio,
  Calendar,
  Clock,
  ArrowUp,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './StaffDashboard.css';

import liveSessionApiService, { type StaffDashboardOverviewResult, type SessionScheduleResult } from '../../../services/liveSessionApiService';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';

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
  const [data, setData] = useState<StaffDashboardOverviewResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upcomingSessions, setUpcomingSessions] = useState<SessionScheduleResult[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [overviewRes, schedulesRes] = await Promise.all([
          liveSessionApiService.getStaffDashboardOverview(7),
          liveSessionApiService.getSchedules()
        ]);

        console.log("overviewRes:", overviewRes);
        if (overviewRes) {
          setData(overviewRes);
        }

        if (schedulesRes) {
          // Sort by start time and take first 5 upcoming
          const upcoming = schedulesRes
            .filter(s => new Date(`${s.startDate}T${s.startTime}Z`) > new Date())
            .sort((a, b) => new Date(`${a.startDate}T${a.startTime}Z`).getTime() - new Date(`${b.startDate}T${b.startTime}Z`).getTime())
            .slice(0, 5);
          setUpcomingSessions(upcoming);
        }
      } catch (err: any) {
        console.error("Failed to fetch dashboard data:", err);
        setError(err?.response?.data?.message || err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, []);

  if (loading) {
    return <div className="staff-dashboard">Đang tải bảng điều khiển...</div>;
  }

  if (error) {
    return <div className="staff-dashboard" style={{ color: 'red', padding: '2rem' }}>Lỗi: {error}</div>;
  }

  if (!data) {
    return <div className="staff-dashboard">Không có dữ liệu tổng quan.</div>;
  }

  // Format chart data
  const chartData = (data.dailyListeners || []).map(d => ({
    day: d.date ? format(parseISO(d.date), 'dd/MM', { locale: vi }) : 'N/A',
    listeners: d.listenerCount || 0,
    sessions: 0 // Optional: if backend provided session count per day, we'd use it here.
  }));

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
          title="Tổng phiên phát sóng"
          value={data?.totalSessions?.toString() || '0'}
          change=""
          isPositive={true}
          icon={<Radio size={24} />}
          subtitle="Tất cả phiên"
        />
        <StatCard
          title="Phiên đang hoạt động"
          value={data?.liveSessions?.toString() || '0'}
          change=""
          isPositive={true}
          icon={<Radio size={24} color="#10b981" />}
          subtitle="Đang phát sóng"
        />
        <StatCard
          title="Trạm đã tạo hôm nay"
          value={data?.stationsCreatedToday?.toString() || '0'}
          change=""
          isPositive={true}
          icon={<Calendar size={24} />}
          subtitle={`Tổng số trạm: ${data?.totalStations || 0}`}
        />
        <StatCard
          title="Người nghe hôm nay"
          value={data?.listenersToday?.toString() || '0'}
          change=""
          isPositive={true}
          icon={<Radio size={24} />}
          subtitle="Unique Listeners"
        />

      </div>

      <div className="staff-content-grid">
        <div className="staff-chart-card">
          <h3 className="staff-chart-title">Người nghe trong 7 ngày qua</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis dataKey="day" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Bar dataKey="listeners" fill="#1a9fd4" radius={[8, 8, 0, 0]} name="Người nghe" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="staff-list-card">
          <div className="staff-list-header">
            <h3 className="staff-list-title">Phiên sắp tới</h3>
            <button className="staff-view-all-btn">Xem tất cả</button>
          </div>
          <div className="staff-list-content">
            {upcomingSessions.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Không có phiên phát sóng sắp tới</div>
            ) : (
              upcomingSessions.map((session) => (
                <div key={session.id} className="staff-session-item">
                  <div className="staff-session-icon">
                    <Radio size={20} />
                  </div>
                  <div className="staff-session-info">
                    <h4 className="staff-session-title">{session.title || 'Không có tiêu đề'}</h4>
                    <p className="staff-session-meta">
                      <Clock size={14} />
                      {session.startTime} - {session.endTime} • {session.startDate ? format(parseISO(session.startDate), 'dd/MM/yyyy') : ''}
                    </p>
                  </div>
                  <span className="staff-session-badge scheduled">Đã lên lịch</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>


    </div>
  );
}
