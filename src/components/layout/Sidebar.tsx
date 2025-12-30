import React from 'react';
import { Icon, type IconName } from '../common';
import './Sidebar.css';

interface MenuItem {
    id: string;
    label: string;
    icon: IconName;
    path?: string;
    badge?: string | number;
    badgeVariant?: 'primary' | 'success' | 'warning' | 'danger';
    children?: MenuItem[];
}

interface MenuGroup {
    title: string;
    items: MenuItem[];
}

interface SidebarProps {
    isOpen?: boolean;
    isCollapsed?: boolean;
    activeItemId?: string;
    onItemClick?: (item: MenuItem) => void;
    onToggleCollapse?: () => void;
    onClose?: () => void;
}

const menuGroups: MenuGroup[] = [
    {
        title: 'Overview',
        items: [
            { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/' },
        ],
    },
    {
        title: 'Content Management',
        items: [
            { id: 'podcasts', label: 'Podcast Letters', icon: 'podcast', path: '/podcasts', badge: 12 },
            { id: 'posts', label: 'Posts', icon: 'message', path: '/posts' },
            { id: 'playlists', label: 'Playlists', icon: 'playlist', path: '/playlists' },
            { id: 'music', label: 'Music Catalog', icon: 'music', path: '/music' },
        ],
    },
    {
        title: 'Live Sessions',
        items: [
            { id: 'live-sessions', label: 'Session Management', icon: 'radio', path: '/live-sessions', badge: 'LIVE', badgeVariant: 'danger' },
            { id: 'schedule', label: 'Schedule', icon: 'calendar', path: '/schedule' },
            { id: 'requests', label: 'Song Requests', icon: 'music', path: '/requests', badge: 5, badgeVariant: 'warning' },
        ],
    },
    {
        title: 'User Management',
        items: [
            { id: 'users', label: 'Users', icon: 'users', path: '/users' },
            { id: 'hosts', label: 'Hosts / Staff', icon: 'microphone', path: '/hosts' },
        ],
    },
    {
        title: 'System',
        items: [
            { id: 'analytics', label: 'Analytics', icon: 'chart', path: '/analytics' },
            { id: 'settings', label: 'Settings', icon: 'settings', path: '/settings' },
        ],
    },
];

const Sidebar: React.FC<SidebarProps> = ({
    isOpen = true,
    isCollapsed = false,
    activeItemId = 'dashboard',
    onItemClick,
    onToggleCollapse,
    onClose,
}) => {
    const [expandedGroups, setExpandedGroups] = React.useState<string[]>(
        menuGroups.map((g) => g.title)
    );

    const toggleGroup = (title: string) => {
        setExpandedGroups((prev) =>
            prev.includes(title)
                ? prev.filter((t) => t !== title)
                : [...prev, title]
        );
    };

    const renderBadge = (item: MenuItem) => {
        if (!item.badge) return null;
        const variant = item.badgeVariant || 'primary';
        return (
            <span className={`sidebar-badge sidebar-badge-${variant}`}>
                {item.badge}
            </span>
        );
    };

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div className="sidebar-overlay" onClick={onClose} />
            )}

            <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''} ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
                {/* Collapse toggle button */}
                <button
                    className="sidebar-collapse-btn"
                    onClick={onToggleCollapse}
                    title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    <Icon name={isCollapsed ? 'chevron-right' : 'chevron-left'} size={18} />
                </button>

                {/* Navigation */}
                <nav className="sidebar-nav">
                    {menuGroups.map((group) => (
                        <div key={group.title} className="sidebar-group">
                            {!isCollapsed && (
                                <button
                                    className="sidebar-group-title"
                                    onClick={() => toggleGroup(group.title)}
                                >
                                    <span>{group.title}</span>
                                    <Icon
                                        name={expandedGroups.includes(group.title) ? 'chevron-up' : 'chevron-down'}
                                        size={14}
                                    />
                                </button>
                            )}

                            {(isCollapsed || expandedGroups.includes(group.title)) && (
                                <ul className="sidebar-menu">
                                    {group.items.map((item) => (
                                        <li key={item.id}>
                                            <button
                                                className={`sidebar-item ${activeItemId === item.id ? 'sidebar-item-active' : ''}`}
                                                onClick={() => onItemClick?.(item)}
                                                title={isCollapsed ? item.label : undefined}
                                            >
                                                <Icon name={item.icon} size={20} className="sidebar-item-icon" />
                                                {!isCollapsed && (
                                                    <>
                                                        <span className="sidebar-item-label">{item.label}</span>
                                                        {renderBadge(item)}
                                                    </>
                                                )}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </nav>

                {/* Footer */}
                {!isCollapsed && (
                    <div className="sidebar-footer">
                        <div className="sidebar-footer-info">
                            <span className="sidebar-version">SoundMates v1.0.0</span>
                            <span className="sidebar-copyright">© 2024 SP26SE021</span>
                        </div>
                    </div>
                )}
            </aside>
        </>
    );
};

export default Sidebar;
export type { MenuItem, MenuGroup };
