import React from 'react';
import './Avatar.css';

interface AvatarProps {
    src?: string;
    alt?: string;
    name?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    status?: 'online' | 'offline' | 'away' | 'busy';
    className?: string;
}

const Avatar: React.FC<AvatarProps> = ({
    src,
    alt = 'Avatar',
    name,
    size = 'md',
    status,
    className = '',
}) => {
    const getInitials = (name: string): string => {
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return name.slice(0, 2).toUpperCase();
    };

    const getBackgroundColor = (name: string): string => {
        const colors = [
            '#3b82f6', '#1a9fd4', '#55c5f1', '#0ea5e9',
            '#22c55e', '#06b6d4', '#f59e0b', '#ef4444'
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    return (
        <div className={`avatar avatar-${size} ${className}`.trim()}>
            {src ? (
                <img src={src} alt={alt} className="avatar-image" />
            ) : name ? (
                <div
                    className="avatar-initials"
                    style={{ backgroundColor: getBackgroundColor(name) }}
                >
                    {getInitials(name)}
                </div>
            ) : (
                <div className="avatar-placeholder">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="avatar-placeholder-icon">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                </div>
            )}
            {status && <span className={`avatar-status avatar-status-${status}`} />}
        </div>
    );
};

export default Avatar;
