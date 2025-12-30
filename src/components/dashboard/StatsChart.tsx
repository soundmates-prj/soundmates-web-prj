import React, { useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    ComposedChart,
} from 'recharts';
import { Card, Button } from '../common';
import './StatsChart.css';

interface DataPoint {
    label: string;
    value: number;
}

interface ChartDataset {
    name: string;
    data: DataPoint[];
    color?: string;
}

interface StatsChartProps {
    title: string;
    datasets: ChartDataset[];
    tabs?: string[];
    defaultTab?: number;
    showHideButton?: boolean;
    height?: number;
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
    if (active && payload && payload.length) {
        return (
            <div className="stats-chart-tooltip">
                <div className="stats-chart-tooltip-label">{label}</div>
                <div className="stats-chart-tooltip-value">{payload[0].value}</div>
            </div>
        );
    }
    return null;
};

const StatsChart: React.FC<StatsChartProps> = ({
    title,
    datasets,
    tabs,
    defaultTab = 0,
    showHideButton = true,
    height = 280,
}) => {
    const [activeTab, setActiveTab] = useState(defaultTab);
    const [isHidden, setIsHidden] = useState(false);

    const currentDataset = datasets[activeTab] || datasets[0];
    const chartData = currentDataset?.data || [];
    const lineColor = currentDataset?.color || '#0d6efd';

    return (
        <Card className="stats-chart-card">
            <Card.Header
                actions={
                    showHideButton && (
                        <Button
                            size="sm"
                            onClick={() => setIsHidden(!isHidden)}
                        >
                            {isHidden ? 'Show Charts' : 'Hide Charts'}
                        </Button>
                    )
                }
            >
                {title}
            </Card.Header>

            {!isHidden && (
                <Card.Body noPadding>
                    {tabs && tabs.length > 0 && (
                        <div className="stats-chart-tabs">
                            {tabs.map((tab, index) => (
                                <button
                                    key={tab}
                                    className={`stats-chart-tab ${activeTab === index ? 'stats-chart-tab-active' : ''}`}
                                    onClick={() => setActiveTab(index)}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="stats-chart-container">
                        {/* Legend */}
                        <div className="stats-chart-legend">
                            {datasets.map((dataset, index) => (
                                <div
                                    key={dataset.name}
                                    className={`stats-chart-legend-item ${activeTab === index ? 'active' : ''}`}
                                >
                                    <span
                                        className="stats-chart-legend-color"
                                        style={{ backgroundColor: dataset.color || '#0d6efd' }}
                                    />
                                    <span className="stats-chart-legend-label">{dataset.name}</span>
                                </div>
                            ))}
                        </div>

                        {/* Chart using Recharts */}
                        <div className="stats-chart-wrapper" style={{ height }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart
                                    data={chartData}
                                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                                >
                                    <defs>
                                        <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={lineColor} stopOpacity={0.15} />
                                            <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid
                                        strokeDasharray="0"
                                        stroke="#f1f3f5"
                                        vertical={false}
                                    />
                                    <XAxis
                                        dataKey="label"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fill: '#adb5bd' }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 10, fill: '#adb5bd' }}
                                        width={35}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area
                                        type="linear"
                                        dataKey="value"
                                        stroke="none"
                                        fill="url(#colorGradient)"
                                    />
                                    <Line
                                        type="linear"
                                        dataKey="value"
                                        stroke={lineColor}
                                        strokeWidth={2}
                                        dot={{
                                            r: 4,
                                            fill: 'white',
                                            stroke: lineColor,
                                            strokeWidth: 2,
                                        }}
                                        activeDot={{
                                            r: 6,
                                            fill: 'white',
                                            stroke: lineColor,
                                            strokeWidth: 2,
                                        }}
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </Card.Body>
            )}
        </Card>
    );
};

export default StatsChart;
