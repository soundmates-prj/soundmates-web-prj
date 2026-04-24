import { useEffect, useState } from 'react';
import {
    TrendingUp,
    Users,
    Radio,
    Eye,
    RefreshCw,
    BarChart3
} from 'lucide-react';
import liveSessionApiService, { type LiveSessionResult, type AdminAnalyticsOverviewResult } from '../../../services/liveSessionApiService';
import userService, { type UserDto } from '../../../services/userService';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './Analytics.css';

interface MetricCardProps {
    title: string;
    value: string;
    change: string;
    isPositive: boolean;
    icon: React.ReactNode;
}

function MetricCard({ title, value, change, isPositive, icon }: MetricCardProps) {
    return (
        <div className="lm-stat-card">
            <div className="lm-stat-icon">
                {icon}
            </div>
            <div className="lm-stat-content">
                <span className="lm-stat-label">{title}</span>
                <span className="lm-stat-value">{value}</span>
                <div className={`lm-stat-change ${isPositive ? 'positive' : 'negative'}`}>
                    <TrendingUp size={12} />
                    <span>{change}</span>
                </div>
            </div>
        </div>
    );
}

export function AnalyticsScreen() {
    const [loading, setLoading] = useState(true);
    const [analyticsData, setAnalyticsData] = useState<AdminAnalyticsOverviewResult | null>(null);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalSessions: 0,
        totalViews: 0,
        totalInteractions: 0
    });

    const [activeSessions, setActiveSessions] = useState<LiveSessionResult[]>([]);
    const [recentUsers, setRecentUsers] = useState<UserDto[]>([]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const [usersRes, analyticsRes, activeSessionsRes, recentUsersRes] = await Promise.all([
                userService.getUsers({ page: 1, pageSize: 1 }),
                liveSessionApiService.getAdminAnalyticsOverview(),
                liveSessionApiService.getActiveSessions(),
                userService.getUsers({ page: 1, pageSize: 5 })
            ]);

            setStats({
                totalUsers: usersRes.success && usersRes.data ? usersRes.data.totalItems : 0,
                totalSessions: analyticsRes?.totalSessions || 0,
                totalViews: analyticsRes?.totalViews || 0,
                totalInteractions: analyticsRes?.totalInteractions || 0
            });
            
            if (analyticsRes) {
                setAnalyticsData(analyticsRes);
            }

            if (activeSessionsRes) {
                setActiveSessions(activeSessionsRes);
            }

            if (recentUsersRes.success && recentUsersRes.data) {
                setRecentUsers(recentUsersRes.data.items);
            }
        } catch (error) {
            console.error("Failed to fetch admin analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    return (
        <div className="lm-page">
            {/* Header */}
            <div className="lm-header">
                <div className="lm-header-left">
                    <h1>Phân tích & Báo cáo</h1>
                    <p>Theo dõi hiệu suất và xu hướng người dùng</p>
                </div>
                <div className="lm-header-actions">
                    <button className="lm-btn lm-btn--outline" onClick={fetchAnalytics} disabled={loading}>
                        <RefreshCw size={15} className={loading ? "spin" : ""} />
                        {loading ? 'Đang tải...' : 'Làm mới'}
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div className="lm-stats-grid">
                <MetricCard
                    title="Tổng Users"
                    value={stats.totalUsers.toLocaleString()}
                    change="Thực tế"
                    isPositive={true}
                    icon={<Users size={20} />}
                />
                <MetricCard
                    title="Phiên Phát Sóng"
                    value={stats.totalSessions.toLocaleString()}
                    change="Thực tế"
                    isPositive={true}
                    icon={<Radio size={20} />}
                />
                <MetricCard
                    title="Lượt Xem"
                    value={stats.totalViews.toLocaleString()}
                    change="Thực tế"
                    isPositive={true}
                    icon={<Eye size={20} />}
                />
                <MetricCard
                    title="Tương Tác"
                    value={stats.totalInteractions.toLocaleString()}
                    change="Thực tế"
                    isPositive={true}
                    icon={<BarChart3 size={20} />}
                />
            </div>

            {/* Charts Grid */}
            {analyticsData && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '24px' }}>
                    <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px', color: '#1e293b' }}>Lượt Tạo Phiên (7 ngày)</h3>
                        <div style={{ height: '200px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={analyticsData.sessionGrowthChart?.map(d => ({ ...d, dayFormatted: d.date ? format(parseISO(d.date), 'dd/MM') : '' })) || []}>
                                    <defs>
                                        <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="dayFormatted" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} allowDecimals={false} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                    <Area type="monotone" dataKey="count" name="Số phiên" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSessions)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px', color: '#1e293b' }}>Lượt Kết Nối Nghe (7 ngày)</h3>
                        <div style={{ height: '200px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analyticsData.listenerGrowthChart?.map(d => ({ ...d, dayFormatted: d.date ? format(parseISO(d.date), 'dd/MM') : '' })) || []}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="dayFormatted" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} allowDecimals={false} />
                                    <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                    <Bar dataKey="listenerCount" name="Lượt nghe" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '20px', color: '#1e293b' }}>Tương Tác Hệ Thống (7 ngày)</h3>
                        <div style={{ height: '200px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={analyticsData.interactionGrowthChart?.map(d => ({ ...d, dayFormatted: d.date ? format(parseISO(d.date), 'dd/MM') : '' })) || []}>
                                    <defs>
                                        <linearGradient id="colorInteractions" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="dayFormatted" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} allowDecimals={false} />
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                    <Area type="monotone" dataKey="count" name="Tương tác" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorInteractions)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* Content Lists */}
            <div className="lm-lists-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '24px' }}>
                <div className="lm-list-card" style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: '#1e293b' }}>Phiên Phát Sóng Đang Hoạt Động</h3>
                    {activeSessions.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {activeSessions.map(session => (
                                <div key={session.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Radio size={20} color="#3b82f6" />
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: 500, color: '#0f172a', fontSize: '14px', margin: 0 }}>{session.sessionName}</p>
                                            <p style={{ color: '#64748b', fontSize: '12px', margin: '4px 0 0 0' }}>Trạng thái: {session.status}</p>
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '12px', background: '#ecfdf5', color: '#10b981', padding: '4px 8px', borderRadius: '12px', fontWeight: 500 }}>
                                        Active
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748b' }}>
                            <p>Không có phiên phát sóng nào đang hoạt động</p>
                        </div>
                    )}
                </div>

                <div className="lm-list-card" style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: '#1e293b' }}>Người Dùng Mới</h3>
                    {recentUsers.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {recentUsers.map(user => (
                                <div key={user.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '20px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                            {user.profileImageUrl ? (
                                                <img src={user.profileImageUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <Users size={20} color="#64748b" />
                                            )}
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: 500, color: '#0f172a', fontSize: '14px', margin: 0 }}>{user.firstName} {user.lastName}</p>
                                            <p style={{ color: '#64748b', fontSize: '12px', margin: '4px 0 0 0' }}>{user.email}</p>
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                                        {user.createdAt ? format(new Date(user.createdAt), 'dd/MM/yyyy') : ''}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748b' }}>
                            <p>Không có người dùng mới</p>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
