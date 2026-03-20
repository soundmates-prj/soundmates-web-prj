import {
    TrendingUp,
    Users,
    Radio,
    Eye,
    Heart,
    Clock,
    Download,
} from 'lucide-react';
import { ResponsiveLine } from '@nivo/line';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import './Analytics.css';

// Mock data
const userGrowthData = [
    {
        "id": "Tổng Users",
        "data": [
            { "x": "Tháng 7", "y": 1200 },
            { "x": "Tháng 8", "y": 1450 },
            { "x": "Tháng 9", "y": 1680 },
            { "x": "Tháng 10", "y": 1920 },
            { "x": "Tháng 11", "y": 2340 },
            { "x": "Tháng 12", "y": 2680 },
            { "x": "Tháng 1", "y": 2847 },
        ]
    },
    {
        "id": "Active Users",
        "data": [
            { "x": "Tháng 7", "y": 980 },
            { "x": "Tháng 8", "y": 1180 },
            { "x": "Tháng 9", "y": 1350 },
            { "x": "Tháng 10", "y": 1580 },
            { "x": "Tháng 11", "y": 1920 },
            { "x": "Tháng 12", "y": 2180 },
            { "x": "Tháng 1", "y": 2340 },
        ]
    }
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
    { id: 'Nhạc Cổ Điển', label: 'Nhạc Cổ Điển', value: 2847, color: '#55c5f1' },
    { id: 'Jazz', label: 'Jazz', value: 2134, color: '#8CC5FA' },
    { id: 'Acoustic', label: 'Acoustic', value: 1678, color: '#FCE7F3' },
    { id: 'EDM', label: 'EDM', value: 1456, color: '#D8F51A' },
    { id: 'Podcast', label: 'Podcast', value: 1234, color: '#FB2C36' },
];

const hourlyActivityData = [
    { "x": "0h", "y": 234 },
    { "x": "3h", "y": 145 },
    { "x": "6h", "y": 389 },
    { "x": "9h", "y": 678 },
    { "x": "12h", "y": 892 },
    { "x": "15h", "y": 1023 },
    { "x": "18h", "y": 1456 },
    { "x": "21h", "y": 1678 },
    { "x": "24h", "y": 892 },
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
    const theme = {
        axis: {
            ticks: {
                text: {
                    fill: '#64748b',
                    fontSize: '12px',
                    fontFamily: 'Arimo',
                },
            },
            legend: {
                text: {
                    fill: '#64748b',
                    fontSize: '14px',
                    fontFamily: 'Arimo',
                },
            },
        },
        grid: {
            line: {
                stroke: '#e5e7eb',
                strokeDasharray: '3 3',
            },
        },
        tooltip: {
            container: {
                background: '#fafafa',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '12px',
                fontFamily: 'Arimo',
            },
        },
    };

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
                    <div style={{ height: 280 }}>
                        <ResponsiveLine
                            data={userGrowthData}
                            theme={theme}
                            margin={{ top: 20, right: 20, bottom: 60, left: 60 }}
                            xScale={{ type: 'point' }}
                            yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false, reverse: false }}
                            yFormat=">-.2f"
                            axisTop={null}
                            axisRight={null}
                            axisBottom={{
                                tickSize: 5,
                                tickPadding: 5,
                                tickRotation: 0,
                                legend: 'Tháng',
                                legendOffset: 36,
                                legendPosition: 'middle'
                            }}
                            axisLeft={{
                                tickSize: 5,
                                tickPadding: 5,
                                tickRotation: 0,
                                legend: 'Số lượng người dùng',
                                legendOffset: -40,
                                legendPosition: 'middle'
                            }}
                            enableGridX={false}
                            colors={['#55c5f1', '#8CC5FA']}
                            lineWidth={2}
                            pointSize={10}
                            pointColor={{ theme: 'background' }}
                            pointBorderWidth={2}
                            pointBorderColor={{ from: 'serieColor' }}
                            pointLabelYOffset={-12}
                            useMesh={true}
                            enableArea={true}
                        />
                    </div>
                </div>

                {/* Content Engagement Pie Chart */}
                <div className="chart-card">
                    <h3 className="chart-title">Nội Dung Phổ Biến</h3>
                    <p className="chart-subtitle mb-6">Phân bố theo thể loại</p>
                    <div style={{ height: 240 }}>
                        <ResponsivePie
                            data={contentEngagementData}
                            theme={theme}
                            margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                            innerRadius={0.6}
                            padAngle={5}
                            cornerRadius={3}
                            activeOuterRadiusOffset={8}
                            borderWidth={1}
                            borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                            arcLinkLabelsSkipAngle={10}
                            arcLinkLabelsTextColor="#64748b"
                            arcLinkLabelsThickness={2}
                            arcLinkLabelsColor={{ from: 'color' }}
                            arcLabelsSkipAngle={10}
                            arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                            colors={{ datum: 'data.color' }}
                        />
                    </div>
                    <div className="pie-legend">
                        {contentEngagementData.map((item, idx) => (
                            <div key={idx} className="pie-legend-item">
                                <div className="pie-legend-label">
                                    <div className="legend-dot" style={{ backgroundColor: item.color }} />
                                    <span className="legend-text">{item.label}</span>
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
                    <div style={{ height: 280 }}>
                        <ResponsiveBar
                            data={sessionData}
                            theme={theme}
                            keys={['sessions', 'listeners']}
                            indexBy="day"
                            margin={{ top: 20, right: 20, bottom: 60, left: 60 }}
                            padding={0.3}
                            valueScale={{ type: 'linear' }}
                            indexScale={{ type: 'band', round: true }}
                            colors={['#55c5f1', '#8CC5FA']}
                            borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                            axisTop={null}
                            axisRight={null}
                            axisBottom={{
                                tickSize: 5,
                                tickPadding: 5,
                                tickRotation: 0,
                                legend: 'Ngày trong tuần',
                                legendPosition: 'middle',
                                legendOffset: 32
                            }}
                            axisLeft={{
                                tickSize: 5,
                                tickPadding: 5,
                                tickRotation: 0,
                                legend: 'Số lượng',
                                legendPosition: 'middle',
                                legendOffset: -40
                            }}
                            labelSkipWidth={12}
                            labelSkipHeight={12}
                            labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                            legends={[
                                {
                                    dataFrom: 'keys',
                                    anchor: 'bottom-right',
                                    direction: 'row',
                                    justify: false,
                                    translateX: 20,
                                    translateY: 50,
                                    itemsSpacing: 2,
                                    itemWidth: 100,
                                    itemHeight: 20,
                                    itemDirection: 'left-to-right',
                                    itemOpacity: 0.85,
                                    symbolSize: 20,
                                }
                            ]}
                            animate={true}
                        />
                    </div>
                </div>

                {/* Hourly Activity */}
                <div className="chart-card">
                    <div className="chart-header">
                        <div>
                            <h3 className="chart-title">Hoạt Động Theo Giờ</h3>
                            <p className="chart-subtitle">Peak hours trong ngày</p>
                        </div>
                    </div>
                    <div style={{ height: 280 }}>
                        <ResponsiveLine
                            data={[{ id: 'activity', data: hourlyActivityData }]}
                            theme={theme}
                            margin={{ top: 20, right: 20, bottom: 60, left: 60 }}
                            xScale={{ type: 'point' }}
                            yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false, reverse: false }}
                            yFormat=">-.2f"
                            axisTop={null}
                            axisRight={null}
                            axisBottom={{
                                tickSize: 5,
                                tickPadding: 5,
                                tickRotation: 0,
                                legend: 'Giờ trong ngày',
                                legendOffset: 36,
                                legendPosition: 'middle'
                            }}
                            axisLeft={{
                                tickSize: 5,
                                tickPadding: 5,
                                tickRotation: 0,
                                legend: 'Mức độ hoạt động',
                                legendOffset: -40,
                                legendPosition: 'middle'
                            }}
                            enableGridX={false}
                            colors={['#55c5f1']}
                            lineWidth={3}
                            pointSize={10}
                            pointColor={{ theme: 'background' }}
                            pointBorderWidth={3}
                            pointBorderColor={{ from: 'serieColor' }}
                            pointLabelYOffset={-12}
                            useMesh={true}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
