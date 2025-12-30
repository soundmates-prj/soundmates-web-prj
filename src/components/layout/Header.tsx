import React from 'react';
import { Icon, Avatar, Badge } from '../common';
import './Header.css';

interface HeaderProps {
    username?: string;
    email?: string;
    avatarUrl?: string;
    onMenuClick?: () => void;
    onLogout?: () => void;
    onProfileClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({
    username = 'SoundMates User',
    email = 'user@soundmates.com',
    avatarUrl,
    onMenuClick,
    onLogout,
    onProfileClick,
}) => {
    const [showDropdown, setShowDropdown] = React.useState(false);
    const [notificationCount] = React.useState(3);

    return (
        <header className="header">
            <div className="header-left">
                <button className="header-menu-btn" onClick={onMenuClick}>
                    <Icon name="menu" size={24} />
                </button>
                <div className="header-brand">
                    <div className="header-logo">
                        <span className="header-logo-text">sound</span>
                        <span className="header-logo-highlight">mates</span>
                    </div>
                    <span className="header-tagline">admin panel</span>
                </div>
            </div>

            <div className="header-right">
                {/* Notifications */}
                <button className="header-icon-btn">
                    <Icon name="bell" size={20} />
                    {notificationCount > 0 && (
                        <span className="header-notification-badge">{notificationCount}</span>
                    )}
                </button>

                {/* Settings */}
                <button className="header-icon-btn">
                    <Icon name="settings" size={20} />
                </button>

                {/* User dropdown */}
                <div className="header-user-dropdown">
                    <button
                        className="header-user-btn"
                        onClick={() => setShowDropdown(!showDropdown)}
                    >
                        <Avatar
                            src={avatarUrl}
                            name={username}
                            size="sm"
                            status="online"
                        />
                        <span className="header-user-name">{username}</span>
                        <Icon name="chevron-down" size={16} />
                    </button>

                    {showDropdown && (
                        <div className="header-dropdown-menu">
                            <div className="header-dropdown-header">
                                <Avatar src={avatarUrl} name={username} size="lg" />
                                <div className="header-dropdown-user-info">
                                    <span className="header-dropdown-name">{username}</span>
                                    <span className="header-dropdown-email">{email}</span>
                                    <Badge variant="primary" size="sm">Admin</Badge>
                                </div>
                            </div>
                            <div className="header-dropdown-divider" />
                            <button className="header-dropdown-item" onClick={onProfileClick}>
                                <Icon name="user" size={16} />
                                <span>My Account</span>
                            </button>
                            <button className="header-dropdown-item">
                                <Icon name="settings" size={16} />
                                <span>Settings</span>
                            </button>
                            <div className="header-dropdown-divider" />
                            <button className="header-dropdown-item header-dropdown-item-danger" onClick={onLogout}>
                                <Icon name="logout" size={16} />
                                <span>Logout</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
