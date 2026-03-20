import {
  Users,
  Crown,
  DollarSign,
  TrendingUp,
  FileText,
  Radio,
  Music2,
  Activity,
  Target,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './Dashboard.css';

const revenueData = [
  { month: 'Jan', revenue: 45000, subscriptions: 120 },
  { month: 'Feb', revenue: 52000, subscriptions: 145 },
  { month: 'Mar', revenue: 48000, subscriptions: 135 },
  { month: 'Apr', revenue: 61000, subscriptions: 168 },
  { month: 'May', revenue: 55000, subscriptions: 152 },
  { month: 'Jun', revenue: 67000, subscriptions: 189 },
];

const userGrowthData = [
  { month: 'Jan', users: 1200 },
  { month: 'Feb', users: 1450 },
  { month: 'Mar', users: 1680 },
  { month: 'Apr', users: 1920 },
  { month: 'May', users: 2340 },
  { month: 'Jun', users: 2847 },
];

const subscriptionDistribution = [
  { name: 'Free', value: 1847, color: '#94a3b8' },
  { name: 'Premium', value: 680, color: '#7481F8' },
  { name: 'Elite', value: 320, color: '#004395' },
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
    <div className="admin-stat-card">
      <div className="admin-stat-header">
        <div className="admin-stat-icon">{icon}</div>
        <div className={`admin-stat-change ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
          <span>{change}</span>
        </div>
      </div>
      <h3 className="admin-stat-title">{title}</h3>
      <p className="admin-stat-value">{value}</p>
      {subtitle && <p className="admin-stat-subtitle">{subtitle}</p>}
    </div>
  );
}

interface GoalCardProps {
  title: string;
  current: number;
  target: number;
  unit: string;
  icon: React.ReactNode;
}

function GoalCard({ title, current, target, unit, icon }: GoalCardProps) {
  const percentage = Math.min((current / target) * 100, 100);
  
  return (
    <div className="admin-goal-card">
      <div className="admin-goal-header">
        <div className="admin-goal-icon">{icon}</div>
        <span className="admin-goal-title">{title}</span>
      </div>
      <div className="admin-goal-values">
        <span className="admin-goal-current">{current.toLocaleString()} {unit}</span>
        <span className="admin-goal-target">/ {target.toLocaleString()} {unit}</span>
      </div>
      <div className="admin-goal-progress">
        <div className="admin-goal-progress-bar" style={{ width: `${percentage}%` }}></div>
      </div>
      <span className="admin-goal-percentage">{percentage.toFixed(0)}% achieved</span>
    </div>
  );
}

export function AdminDashboard() {
  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-header">
        <div>
          <h1 className="admin-dashboard-title">Dashboard</h1>
          <p className="admin-dashboard-subtitle">Welcome back! Here's what's happening today.</p>
        </div>
      </div>

      <div className="admin-stats-grid">
        <StatCard
          title="Total Users"
          value="2,847"
          change="+12.5%"
          isPositive={true}
          icon={<Users size={24} />}
          subtitle="vs last month"
        />
        <StatCard
          title="Active Subscriptions"
          value="1,000"
          change="+8.2%"
          isPositive={true}
          icon={<Crown size={24} />}
          subtitle="680 Premium, 320 Elite"
        />
        <StatCard
          title="Monthly Revenue"
          value="$67,000"
          change="+15.3%"
          isPositive={true}
          icon={<DollarSign size={24} />}
          subtitle="vs last month"
        />
        <StatCard
          title="Total Posts"
          value="1,234"
          change="+5.7%"
          isPositive={true}
          icon={<FileText size={24} />}
          subtitle="Published content"
        />
        <StatCard
          title="Live Sessions"
          value="145"
          change="+18.4%"
          isPositive={true}
          icon={<Radio size={24} />}
          subtitle="This month"
        />
        <StatCard
          title="Stations"
          value="12"
          change="0%"
          isPositive={true}
          icon={<Music2 size={24} />}
          subtitle="Active stations"
        />
        <StatCard
          title="Users Online"
          value="234"
          change="-3.2%"
          isPositive={false}
          icon={<Activity size={24} />}
          subtitle="Right now"
        />
        <StatCard
          title="Avg. Session Time"
          value="24m"
          change="+7.1%"
          isPositive={true}
          icon={<TrendingUp size={24} />}
          subtitle="Per user"
        />
      </div>

      <div className="admin-goals-section">
        <h2 className="admin-section-title">Monthly Goals</h2>
        <div className="admin-goals-grid">
          <GoalCard
            title="Revenue Goal"
            current={67000}
            target={80000}
            unit="$"
            icon={<Target size={20} />}
          />
          <GoalCard
            title="Subscription Goal"
            current={1000}
            target={1200}
            unit="subs"
            icon={<Crown size={20} />}
          />
          <GoalCard
            title="Active Users Goal"
            current={2847}
            target={3000}
            unit="users"
            icon={<Users size={20} />}
          />
        </div>
      </div>

      <div className="admin-charts-grid">
        <div className="admin-chart-card">
          <h3 className="admin-chart-title">Revenue & Subscriptions</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#004395" strokeWidth={2} />
              <Line type="monotone" dataKey="subscriptions" stroke="#7481F8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="admin-chart-card">
          <h3 className="admin-chart-title">User Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Bar dataKey="users" fill="#7481F8" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="admin-chart-card">
          <h3 className="admin-chart-title">Subscription Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={subscriptionDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {subscriptionDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
