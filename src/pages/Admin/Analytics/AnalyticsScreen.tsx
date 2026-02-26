import {
    TrendingUp,
    Users,
    Radio,
    Eye,
    Heart,
    Clock,
    Download,
} from 'lucide-react';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import './Analytics.css';

// Mock data
const userGrowthData = [
    { month: 'Tháng 7', users: 1200, activeUsers: 980 },
    { month: 'Tháng 8', users: 1450, activeUsers: 1180 },
    { month: 'Tháng 9', users: 1680, activeUsers: 1350 },
    { month: 'Tháng 10', users: 1920, activeUsers: 1580 },
    { month: 'Tháng 11', users: 2340, activeUsers: 1920 },
    { month: 'Tháng 12', users: 2680, activeUsers: 2180 },
    { month: 'Tháng 1', users: 2847, activeUsers: 2340 },
];

const sessionData = [
    { day: 'T2', sessions: 12, listeners: 456 },
    { day: 'T3', sessions: 19, listeners: 678 },
    { day: 'T4', sessions: 15, listeners: 523 },
    { day: 'T5', sessions: 23, listeners: 892 },
    { day: 'T6', sessions: 28, listeners: 1123 },
    { day: 'T7', sessions: 31, listeners: 1456 },
    { day: 'CN', sessions: 25, listeners: 1089 },
];

const contentEngagementData = [
    { name: 'Nhạc Cổ Điển', value: 2847, color: '#55c5f1' },
    { name: 'Jazz', value: 2134, color: '#8CC5FA' },
    { name: 'Acoustic', value: 1678, color: '#FCE7F3' },
    { name: 'EDM', value: 1456, color: '#D8F51A' },
    { name: 'Podcast', value: 1234, color: '#FB2C36' },
];

const hourlyActivityData = [
    { hour: '0h', activity: 234 },
    { hour: '3h', activity: 145 },
    { hour: '6h', activity: 389 },
    { hour: '9h', activity: 678 },
    { hour: '12h', activity: 892 },
    { hour: '15h', activity: 1023 },
    { hour: '18h', activity: 1456 },
    { hour: '21h', activity: 1678 },
    { hour: '24h', activity: 892 },
];

const topContentData = [
    { title: 'Đêm nhạc cổ điển êm dịu', views: 12847, likes: 3421, shares: 892, host: 'DJ Minh Anh' },
    { title: 'Acoustic Session Vol.5', views: 9876, likes: 2678, shares: 567, host: 'Nguyễn Thảo' },
    { title: 'Jazz Night - Best of 2025', views: 8934, likes: 2234, shares: 489, host: 'Trần Hải' },
    { title: 'Podcast: Âm nhạc và tâm hồn', views: 7621, likes: 1876, shares: 423, host: 'Lê Phương' },
    { title: 'Late Night EDM Party', views: 6543, likes: 1654, shares: 378, host: 'DJ Khoa' },
];

interface MetricCardProps {
    title: string;
    value: string;
    change: string;
    isPositive: boolean;
    icon: React.ReactNode;
    subtext?: string;
}

function MetricCard({ title, value, change, isPositive, icon, subtext }: MetricCardProps) {
    return (
        <div className="metric-card">
            <div className="metric-header">
                <div className="metric-icon-wrapper">
                    <div className="metric-icon">{icon}</div>
                </div>
                <div className={`metric-change ${isPositive ? 'positive' : 'negative'}`}>
                    <TrendingUp size={12} className={!isPositive ? 'rotate-180' : ''} />
                    <span>{change}</span>
                </div>
            </div>
            <h3 className="metric-title">{title}</h3>
            <p className="metric-value">{value}</p>
            {subtext && <p className="metric-subtext">{subtext}</p>}
        </div>
    );
}

export function AnalyticsScreen() {
    return (
        <div className="analytics-content p-8">
            {/* Header */}
            <div className="dashboard-header mb-8 border-b-0 p-0 bg-transparent">
                <div className="header-left">
                    <h2 className="page-title">Analytics & Reports</h2>
                    <p className="page-subtitle">Phân tích chi tiết hoạt động hệ thống</p>
                </div>
                <div className="analytics-actions">
                    <select className="period-select">
                        <option>7 ngày qua</option>
                        <option>30 ngày qua</option>
                        <option>90 ngày qua</option>
                        <option>Năm nay</option>
                    </select>
                    <button className="export-btn">
                        <Download size={16} />
                        Xuất Báo Cáo
                    </button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="metrics-grid">
                <MetricCard
                    title="Tổng Lượt Xem"
                    value="45.8K"
                    change="+18.2%"
                    isPositive={true}
                    icon={<Eye size={20} />}
                    subtext="So với tuần trước"
                />
                <MetricCard
                    title="Người Dùng Hoạt Động"
                    value="2,340"
                    change="+12.5%"
                    isPositive={true}
                    icon={<Users size={20} />}
                    subtext="82% tổng users"
                />
                <MetricCard
                    title="Phiên Phát Sóng"
                    value="145"
                    change="+8.7%"
                    isPositive={true}
                    icon={<Radio size={20} />}
                    subtext="20.7 sessions/ngày"
                />
                <MetricCard
                    title="Thời Gian TB"
                    value="45 phút"
                    change="+5.3%"
                    isPositive={true}
                    icon={<Clock size={20} />}
                    subtext="Mỗi session"
                />
                <MetricCard
                    title="Tương Tác"
                    value="12.3K"
                    change="+22.1%"
                    isPositive={true}
                    icon={<Heart size={20} />}
                    subtext="Likes & shares"
                />
            </div>

            {/* Charts Row 1 */}
            <div className="charts-grid-primary">
                {/* User Growth Chart */}
                <div className="chart-card wide">
                    <div className="chart-header">
                        <div>
                            <h3 className="chart-title">Tăng Trưởng Người Dùng</h3>
                            <p className="chart-subtitle">Theo dõi số lượng người dùng qua các tháng</p>
                        </div>
                        <div className="legend-wrapper">
                            <div className="legend-item">
                                <div className="legend-dot" style={{ backgroundColor: '#55c5f1' }} />
                                <span className="legend-text">Tổng Users</span>
                            </div>
                            <div className="legend-item">
                                <div className="legend-dot" style={{ backgroundColor: '#8CC5FA' }} />
                                <span className="legend-text">Active Users</span>
                            </div>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={userGrowthData}>
                            <defs>
                                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#55c5f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#55c5f1" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8CC5FA" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#8CC5FA" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                                dataKey="month"
                                stroke="#64748b"
                                style={{ fontSize: '12px', fontFamily: 'Arimo' }}
                            />
                            <YAxis
                                stroke="#64748b"
                                style={{ fontSize: '12px', fontFamily: 'Arimo' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#fafafa',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    fontFamily: 'Arimo'
                                }}
                            />
                            <Area type="monotone" dataKey="users" stroke="#55c5f1" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" />
                            <Area type="monotone" dataKey="activeUsers" stroke="#8CC5FA" strokeWidth={2} fillOpacity={1} fill="url(#colorActive)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Content Engagement Pie Chart */}
                <div className="chart-card">
                    <h3 className="chart-title">Nội Dung Phổ Biến</h3>
                    <p className="chart-subtitle mb-6">Phân bố theo thể loại</p>
                    <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                            <Pie
                                data={contentEngagementData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {contentEngagementData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#fafafa',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    fontFamily: 'Arimo'
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="pie-legend">
                        {contentEngagementData.map((item, idx) => (
                            <div key={idx} className="pie-legend-item">
                                <div className="pie-legend-label">
                                    <div className="legend-dot" style={{ backgroundColor: item.color }} />
                                    <span className="legend-text">{item.name}</span>
                                </div>
                                <span className="pie-legend-value">{item.value.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Charts Row 2 */}
            <div className="charts-grid-secondary">
                {/* Session Activity */}
                <div className="chart-card">
                    <div className="chart-header">
                        <div>
                            <h3 className="chart-title">Hoạt Động Sessions Theo Tuần</h3>
                            <p className="chart-subtitle">Sessions và người nghe theo ngày</p>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={sessionData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                                dataKey="day"
                                stroke="#64748b"
                                style={{ fontSize: '12px', fontFamily: 'Arimo' }}
                            />
                            <YAxis
                                stroke="#64748b"
                                style={{ fontSize: '12px', fontFamily: 'Arimo' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#fafafa',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    fontFamily: 'Arimo'
                                }}
                            />
                            <Legend
                                wrapperStyle={{ fontSize: '12px', fontFamily: 'Arimo' }}
                            />
                            <Bar dataKey="sessions" fill="#55c5f1" radius={[8, 8, 0, 0]} name="Sessions" />
                            <Bar dataKey="listeners" fill="#8CC5FA" radius={[8, 8, 0, 0]} name="Listeners" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Hourly Activity */}
                <div className="chart-card">
                    <div className="chart-header">
                        <div>
                            <h3 className="chart-title">Hoạt Động Theo Giờ</h3>
                            <p className="chart-subtitle">Peak hours trong ngày</p>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={hourlyActivityData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                                dataKey="hour"
                                stroke="#64748b"
                                style={{ fontSize: '12px', fontFamily: 'Arimo' }}
                            />
                            <YAxis
                                stroke="#64748b"
                                style={{ fontSize: '12px', fontFamily: 'Arimo' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#fafafa',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    fontFamily: 'Arimo'
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="activity"
                                stroke="#55c5f1"
                                strokeWidth={3}
                                dot={{ fill: '#55c5f1', r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Top Content Table */}
            {/* <div className="table-card">
                <div className="chart-header">
                    <div>
                        <h3 className="chart-title">Nội Dung Hàng Đầu</h3>
                        <p className="chart-subtitle">Top 5 sessions có hiệu suất cao nhất</p>
                    </div>
                    <button className="view-all-link text-[#55c5f1] text-[14px]">
                        Xem tất cả
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[rgba(0,0,0,0.1)]">
                                <th className="text-left py-3 px-4 font-['Arimo:Bold',sans-serif] text-[#64748b] text-[12px]">#</th>
                                <th className="text-left py-3 px-4 font-['Arimo:Bold',sans-serif] text-[#64748b] text-[12px]">Tiêu Đề</th>
                                <th className="text-left py-3 px-4 font-['Arimo:Bold',sans-serif] text-[#64748b] text-[12px]">Host</th>
                                <th className="text-center py-3 px-4 font-['Arimo:Bold',sans-serif] text-[#64748b] text-[12px]">Lượt Xem</th>
                                <th className="text-center py-3 px-4 font-['Arimo:Bold',sans-serif] text-[#64748b] text-[12px]">Likes</th>
                                <th className="text-center py-3 px-4 font-['Arimo:Bold',sans-serif] text-[#64748b] text-[12px]">Shares</th>
                                <th className="text-center py-3 px-4 font-['Arimo:Bold',sans-serif] text-[#64748b] text-[12px]">Engagement</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topContentData.map((content, idx) => {
                                const engagementRate = ((content.likes + content.shares) / content.views * 100).toFixed(1);
                                return (
                                    <tr key={idx} className="border-b border-[rgba(0,0,0,0.1)] last:border-0 hover:bg-[rgba(85,197,241,0.05)] transition-colors">
                                        <td className="py-4 px-4">
                                            <div className="rank-badge">
                                                {idx + 1}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <p className="content-title">{content.title}</p>
                                        </td>
                                        <td className="py-4 px-4">
                                            <p className="text-[#64748b] text-[14px]">{content.host}</p>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Eye size={14} className="text-[#64748b]" />
                                                <span className="text-[#1e293b] text-[14px]">{content.views.toLocaleString()}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Heart size={14} className="text-[#64748b]" />
                                                <span className="text-[#1e293b] text-[14px]">{content.likes.toLocaleString()}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Share2 size={14} className="text-[#64748b]" />
                                                <span className="text-[#1e293b] text-[14px]">{content.shares.toLocaleString()}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <div className="engagement-badge">
                                                <TrendingUp size={12} />
                                                <span>{engagementRate}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div> */}
        </div>
    );
}
