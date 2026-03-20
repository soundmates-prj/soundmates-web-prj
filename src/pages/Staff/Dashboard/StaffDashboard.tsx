import {
  Radio,
  Calendar,
  Music,
  Mic,
  Clock,
  ArrowUp,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './StaffDashboard.css';

const sessionData = [
  { day: 'Mon', sessions: 3, listeners: 245 },
  { day: 'Tue', sessions: 5, listeners: 389 },
  { day: 'Wed', sessions: 4, listeners: 312 },
  { day: 'Thu', sessions: 6, listeners: 456 },
  { day: 'Fri', sessions: 7, listeners: 523 },
  { day: 'Sat', sessions: 8, listeners: 678 },
  { day: 'Sun', sessions: 6, listeners: 534 },
];

const upcomingSessions = [
  { id: 1, title: 'Chill Night Radio', time: '20:00 - 22:00', date: 'Today', host: 'DJ Minh', status: 'scheduled' },
  { id: 2, title: 'Morning Jazz', time: '08:00 - 10:00', date: 'Tomorrow', host: 'Sarah Lee', status: 'scheduled' },
  { id: 3, title: 'Acoustic Session', time: '15:00 - 17:00', date: 'Tomorrow', host: 'John Doe', status: 'scheduled' },
];

const recentRequests = [
  { id: 1, type: 'music', title: 'Bohemian Rhapsody - Queen', user: 'User123', status: 'pending', time: '5 min ago' },
  { id: 2, type: 'podcast', title: 'Tech Talk Episode 5', user: 'PodcastFan', status: 'approved', time: '15 min ago' },
  { id: 3, type: 'music', title: 'Imagine - John Lennon', user: 'MusicLover', status: 'pending', time: '23 min ago' },
  { id: 4, type: 'podcast', title: 'Daily News Briefing', user: 'NewsJunkie', status: 'rejected', time: '1 hour ago' },
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
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={16} className="status-icon approved" />;
      case 'rejected':
        return <XCircle size={16} className="status-icon rejected" />;
      default:
        return <AlertCircle size={16} className="status-icon pending" />;
    }
  };

  return (
    <div className="staff-dashboard">
      <div className="staff-dashboard-header">
        <div>
          <h1 className="staff-dashboard-title">Staff Dashboard</h1>
          <p className="staff-dashboard-subtitle">Manage your live sessions and content requests</p>
        </div>
      </div>

      <div className="staff-stats-grid">
        <StatCard
          title="Active Sessions"
          value="3"
          change="+2"
          isPositive={true}
          icon={<Radio size={24} />}
          subtitle="Currently live"
        />
        <StatCard
          title="Scheduled Today"
          value="5"
          change="+1"
          isPositive={true}
          icon={<Calendar size={24} />}
          subtitle="Sessions planned"
        />
        <StatCard
          title="Music Requests"
          value="12"
          change="+5"
          isPositive={true}
          icon={<Music size={24} />}
          subtitle="Pending approval"
        />
        <StatCard
          title="Podcast Requests"
          value="8"
          change="+3"
          isPositive={true}
          icon={<Mic size={24} />}
          subtitle="Pending review"
        />
      </div>

      <div className="staff-content-grid">
        <div className="staff-chart-card">
          <h3 className="staff-chart-title">Weekly Sessions & Listeners</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sessionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis dataKey="day" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Bar dataKey="sessions" fill="#7481F8" radius={[8, 8, 0, 0]} />
              <Bar dataKey="listeners" fill="#004395" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="staff-list-card">
          <div className="staff-list-header">
            <h3 className="staff-list-title">Upcoming Sessions</h3>
            <button className="staff-view-all-btn">View All</button>
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
                <span className="staff-session-badge scheduled">Scheduled</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="staff-requests-card">
        <div className="staff-list-header">
          <h3 className="staff-list-title">Recent Requests</h3>
          <button className="staff-view-all-btn">View All</button>
        </div>
        <div className="staff-requests-table">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Title</th>
                <th>User</th>
                <th>Status</th>
                <th>Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentRequests.map((request) => (
                <tr key={request.id}>
                  <td>
                    <span className={`staff-type-badge ${request.type}`}>
                      {request.type === 'music' ? <Music size={14} /> : <Mic size={14} />}
                      {request.type}
                    </span>
                  </td>
                  <td className="staff-request-title">{request.title}</td>
                  <td>{request.user}</td>
                  <td>
                    <span className={`staff-status-badge ${request.status}`}>
                      {getStatusIcon(request.status)}
                      {request.status}
                    </span>
                  </td>
                  <td className="staff-request-time">{request.time}</td>
                  <td>
                    {request.status === 'pending' && (
                      <div className="staff-action-buttons">
                        <button className="staff-action-btn approve">Approve</button>
                        <button className="staff-action-btn reject">Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
