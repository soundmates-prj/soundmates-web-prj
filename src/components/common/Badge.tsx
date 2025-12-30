import React from 'react';
import './Badge.css';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
    size?: 'sm' | 'md';
    dot?: boolean;
    className?: string;
}

const Badge: React.FC<BadgeProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    dot = false,
    className = '',
}) => {
    return (
        <span className={`badge badge-${variant} badge-${size} ${className}`.trim()}>
            {dot && <span className="badge-dot" />}
            {children}
        </span>
    );
};

export default Badge;
