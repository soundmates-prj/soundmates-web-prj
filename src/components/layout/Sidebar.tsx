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
        title: 'Dashboard',
        items: [
            { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/' },
        ],
    },
    // {
    //     title: 'System Maintenance',
    //     items: [
    //         { id: 'system-settings', label: 'System Settings', icon: 'settings', path: '/admin/settings' },
    //         { id: 'custom-branding', label: 'Custom Branding', icon: 'palette', path: '/admin/branding' },
    //         { id: 'system-logs', label: 'System Logs', icon: 'document', path: '/admin/logs' },
    //         { id: 'storage-locations', label: 'Storage Locations', icon: 'folder', path: '/admin/storage' },
    //         { id: 'backups', label: 'Backups', icon: 'database', path: '/admin/backups' },
    //         { id: 'system-debugger', label: 'System Debugger', icon: 'bug', path: '/admin/debug' },
    //         { id: 'update-azuracast', label: 'Update AzuraCast', icon: 'update', path: '/admin/update' },
    //     ],
    // },
    // {
    //     title: 'Users',
    //     items: [
    //         { id: 'user-accounts', label: 'User Accounts', icon: 'users', path: '/admin/users' },
    //         { id: 'roles-permissions', label: 'Roles & Permissions', icon: 'shield', path: '/admin/permissions' },
    //         { id: 'audit-log', label: 'Audit Log', icon: 'clipboard', path: '/admin/audit' },
    //         { id: 'api-keys', label: 'API Keys', icon: 'key', path: '/admin/api-keys' },
    //     ],
    // },
    {
        title: 'Stations',
        items: [
            { id: 'stations', label: 'Stations', icon: 'station', path: '/admin/stations' },
            // { id: 'custom-fields', label: 'Custom Fields', icon: 'fields', path: '/admin/custom-fields' },
            // { id: 'connected-relays', label: 'Connected AzuraRelays', icon: 'relay', path: '/admin/relays' },
        ],
    },
    // {
    //     title: 'Third-Party Software',
    //     items: [
    //         { id: 'shoutcast', label: 'Shoutcast 2 DNAS', icon: 'broadcast', path: '/admin/install-shoutcast' },
    //         { id: 'rsas', label: 'Rocket Streaming Audio Server (RSAS)', icon: 'server', path: '/admin/install-rsas' },
    //         { id: 'stereo-tool', label: 'Stereo Tool', icon: 'tool', path: '/admin/install-stereo' },
    //         { id: 'geolite', label: 'MaxMind GeoLite IP Database', icon: 'globe', path: '/admin/install-geolite' },
    //     ],
    // },
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
