import {
    TrendingUp,
    Users,
    Radio,
    Eye,
    RefreshCw,
    BarChart3
} from 'lucide-react';
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
    return (
        <div className="lm-page">
            {/* Header */}
            <div className="lm-header">
                <div className="lm-header-left">
                    <h1>Phân tích & Báo cáo</h1>
                    <p>Theo dõi hiệu suất và xu hướng người dùng</p>
                </div>
                <div className="lm-header-actions">
                    <button className="lm-btn lm-btn--outline">
                        <RefreshCw size={15} />
                        Làm mới
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div className="lm-stats-grid">
                <MetricCard
                    title="Tổng Users"
                    value="2,847"
                    change="+12.5%"
                    isPositive={true}
                    icon={<Users size={20} />}
                />
                <MetricCard
                    title="Phiên Phát Sóng"
                    value="145"
                    change="+8.2%"
                    isPositive={true}
                    icon={<Radio size={20} />}
                />
                <MetricCard
                    title="Lượt Xem"
                    value="12,456"
                    change="+15.3%"
                    isPositive={true}
                    icon={<Eye size={20} />}
                />
                <MetricCard
                    title="Tương Tác"
                    value="8,921"
                    change="+5.7%"
                    isPositive={true}
                    icon={<BarChart3 size={20} />}
                />
            </div>

            {/* Empty state */}
            <div className="lm-empty">
                <BarChart3 size={48} />
                <p>Chưa có API backend cho Analytics</p>
                <p style={{ fontSize: '12px', marginTop: '8px', color: '#64748b' }}>
                    Vui lòng implement API backend trước
                </p>
            </div>
        </div>
    );
}
