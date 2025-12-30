import React from 'react';
import { Icon, type IconName } from '../common';
import './StatsCard.css';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: IconName;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    color?: 'primary' | 'success' | 'warning' | 'danger' | 'purple';
    subtitle?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
    title,
    value,
    icon,
    trend,
    color = 'primary',
    subtitle,
}) => {
    return (
        <div className={`stats-card stats-card-${color}`}>
            <div className="stats-card-icon">
                <Icon name={icon} size={28} />
            </div>
            <div className="stats-card-content">
                <h3 className="stats-card-title">{title}</h3>
                <div className="stats-card-value">{value}</div>
                {(trend || subtitle) && (
                    <div className="stats-card-footer">
                        {trend && (
                            <span className={`stats-card-trend ${trend.isPositive ? 'stats-card-trend-up' : 'stats-card-trend-down'}`}>
                                <Icon name={trend.isPositive ? 'chevron-up' : 'chevron-down'} size={14} />
                                {Math.abs(trend.value)}%
                            </span>
                        )}
                        {subtitle && <span className="stats-card-subtitle">{subtitle}</span>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatsCard;
