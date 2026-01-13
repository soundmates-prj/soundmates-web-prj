import React, { useState } from 'react';
import { Icon } from '../../components/common';
import type { IconName } from '../../components/common';
import './StationSidebar.css';

type ActivePage =
    | 'overview'
    | 'settings'
    | 'public-pages'
    | 'media'
    | 'media-files'
    | 'media-duplicates'
    | 'media-unprocessable'
    | 'media-unassigned'
    | 'media-sftp'
    | 'media-bulk'
    | 'playlists'
    | 'podcasts'
    | 'webhooks'
    | 'reports'
    | 'reports-overview'
    | 'reports-listeners'
    | 'reports-requests'
    | 'reports-timeline'
    | 'broadcasting'
    | 'broadcasting-mounts'
    | 'broadcasting-hls'
    | 'broadcasting-remotes'
    | 'broadcasting-fallback'
    | 'broadcasting-queue'
    | 'broadcasting-restart'
    | 'logs';

interface SubMenuItem {
    id: ActivePage;
    label: string;
}

interface MenuItem {
    id: ActivePage;
    label: string;
    icon: IconName;
    children?: SubMenuItem[];
}

interface StationSidebarProps {
    stationName: string;
    currentTime: string;
    isEnabled: boolean;
    hasStarted: boolean;
    activePage: ActivePage;
    onPageChange: (page: ActivePage) => void;
    onStartStation: (service: 'frontend' | 'backend') => void;
}

const menuItems: MenuItem[] = [
    { id: 'overview', label: 'Overview', icon: 'dashboard' },
    // { id: 'settings', label: 'Edit Station Settings', icon: 'settings' },
    // { id: 'public-pages', label: 'Public Pages', icon: 'globe' },
    {
        id: 'media',
        label: 'Media',
        icon: 'music',
        children: [
            { id: 'media-files', label: 'Music Files' },
            // { id: 'media-duplicates', label: 'Duplicate Songs' },
            // { id: 'media-unprocessable', label: 'Unprocessable Files' },
            // { id: 'media-unassigned', label: 'Unassigned Files' },
            // { id: 'media-sftp', label: 'SFTP Users' },
            // { id: 'media-bulk', label: 'Bulk Media Import/Export' },
        ]
    },
    { id: 'playlists', label: 'Playlists', icon: 'playlist' },
    // { id: 'podcasts', label: 'Podcasts', icon: 'microphone' },
    // { id: 'webhooks', label: 'Web Hooks', icon: 'code' },
    // {
    //     id: 'reports',
    //     label: 'Reports',
    //     icon: 'chart',
    //     children: [
    //         { id: 'reports-overview', label: 'Station Statistics' },
    //         { id: 'reports-listeners', label: 'Listeners' },
    //         { id: 'reports-requests', label: 'Song Requests' },
    //         { id: 'reports-timeline', label: 'Song Playback Timeline' },
    //     ]
    // },
    {
        id: 'broadcasting',
        label: 'Broadcasting',
        icon: 'radio',
        children: [
            // { id: 'broadcasting-mounts', label: 'Mount Points' },
            // { id: 'broadcasting-hls', label: 'HLS Streams' },
            // { id: 'broadcasting-remotes', label: 'Remote Relays' },
            // { id: 'broadcasting-fallback', label: 'Custom Fallback File' },
            // { id: 'broadcasting-queue', label: 'Upcoming Song Queue' },
            { id: 'broadcasting-restart', label: 'Restart Broadcasting' },
        ]
    },
    // { id: 'logs', label: 'Logs', icon: 'file-text' as IconName },
];

const StationSidebar: React.FC<StationSidebarProps> = ({
    stationName,
    currentTime,
    isEnabled,
    hasStarted,
    activePage,
    onPageChange,
    onStartStation,
}) => {
    // Track which menus are expanded
    const [expandedMenus, setExpandedMenus] = useState<string[]>(['media', 'reports', 'broadcasting']);

    // Show start banner only if station is enabled but not started
    const showStartBanner = isEnabled && !hasStarted;

    const toggleMenu = (menuId: string) => {
        setExpandedMenus(prev =>
            prev.includes(menuId)
                ? prev.filter(id => id !== menuId)
                : [...prev, menuId]
        );
    };

    const isMenuExpanded = (menuId: string) => expandedMenus.includes(menuId);

    const isChildActive = (item: MenuItem) => {
        if (!item.children) return false;
        return item.children.some(child => child.id === activePage);
    };

    return (
        <aside className="station-sidebar">
            {/* Station Header */}
            <div className="sidebar-header">
                <h2 className="station-name-sidebar">{stationName}</h2>
                <span className="station-time">{currentTime}</span>
            </div>

            {/* Start Station Banner */}
            {showStartBanner && (
                <div className="start-station-banner">
                    <div className="banner-content">
                        <strong>Start Station</strong>
                        <p>Ready to start broadcasting? Click to start your station.</p>
                    </div>
                    <button
                        className="start-btn"
                        onClick={() => onStartStation('frontend')}
                    >
                        <Icon name="play" size={16} />
                        Start
                    </button>
                </div>
            )}

            {/* Navigation Menu */}
            <nav className="sidebar-nav">
                <ul className="nav-list">
                    {menuItems.map((item) => (
                        <li key={item.id} className="nav-item">
                            {item.children ? (
                                // Menu with children - expandable
                                <>
                                    <button
                                        className={`nav-link has-children ${isMenuExpanded(item.id) ? 'expanded' : ''} ${isChildActive(item) ? 'active' : ''}`}
                                        onClick={() => toggleMenu(item.id)}
                                    >
                                        <Icon name={item.icon} size={18} className="nav-icon" />
                                        <span className="nav-label">{item.label}</span>
                                        <Icon
                                            name={isMenuExpanded(item.id) ? 'chevron-up' : 'chevron-down'}
                                            size={14}
                                            className="nav-chevron"
                                        />
                                    </button>
                                    {isMenuExpanded(item.id) && (
                                        <ul className="nav-submenu">
                                            {item.children.map((child) => (
                                                <li key={child.id} className="nav-subitem">
                                                    <button
                                                        className={`nav-sublink ${activePage === child.id ? 'active' : ''}`}
                                                        onClick={() => onPageChange(child.id)}
                                                    >
                                                        <span className="nav-sublabel">{child.label}</span>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </>
                            ) : (
                                // Simple menu item
                                <button
                                    className={`nav-link ${activePage === item.id ? 'active' : ''}`}
                                    onClick={() => onPageChange(item.id)}
                                >
                                    <Icon name={item.icon} size={18} className="nav-icon" />
                                    <span className="nav-label">{item.label}</span>
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            </nav>
        </aside>
    );
};

export default StationSidebar;
