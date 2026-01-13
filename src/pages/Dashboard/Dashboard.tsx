import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Header, Sidebar, type MenuItem } from '../../components/layout';
import { Stations } from '../Stations';
import { StationManagement } from '../StationDashboard';
import { UserProfileCard, StatsChart, DataTable, type Column } from '../../components/dashboard';
import { Badge, Button, Icon } from '../../components/common';
import './Dashboard.css';

// Sample data for chart
const listenerData = {
    averageListeners: [
        { label: 'Nov 28', value: 0 },
        { label: 'Nov 29', value: 0 },
        { label: 'Nov 30', value: 35 },
        { label: 'Dec 1', value: 47 },
        { label: 'Dec 2', value: 38 },
        { label: 'Dec 3', value: 12 },
        { label: 'Dec 4', value: 48 },
        { label: 'Dec 5', value: 37 },
        { label: 'Dec 6', value: 18 },
        { label: 'Dec 7', value: 21 },
        { label: 'Dec 8', value: 35 },
        { label: 'Dec 9', value: 8 },
        { label: 'Dec 10', value: 32 },
        { label: 'Dec 11', value: 1 },
        { label: 'Dec 12', value: 0 },
    ],
    uniqueListeners: [
        { label: 'Nov 28', value: 0 },
        { label: 'Nov 29', value: 0 },
        { label: 'Nov 30', value: 45 },
        { label: 'Dec 1', value: 62 },
        { label: 'Dec 2', value: 51 },
        { label: 'Dec 3', value: 23 },
        { label: 'Dec 4', value: 58 },
        { label: 'Dec 5', value: 44 },
        { label: 'Dec 6', value: 28 },
        { label: 'Dec 7', value: 31 },
        { label: 'Dec 8', value: 42 },
        { label: 'Dec 9', value: 15 },
        { label: 'Dec 10', value: 39 },
        { label: 'Dec 11', value: 8 },
        { label: 'Dec 12', value: 3 },
    ],
};

// Station data matching AzuraCast style
interface Station extends Record<string, unknown> {
    id: number;
    name: string;
    description: string;
    listeners: number;
    nowPlaying: string;
    isOnline: boolean;
}

const stationsData: Station[] = [
    {
        id: 1,
        name: 'AzuraTest Radio',
        description: 'Public Page',
        listeners: 0,
        nowPlaying: 'Station Offline',
        isOnline: false,
    },
];

interface DashboardProps {
    onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { stationId, page, subpage, section } = useParams<{
        stationId?: string;
        page?: string;
        subpage?: string;
        section?: string;
    }>();

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Determine active menu item from URL
    const getActiveMenuItem = () => {
        if (stationId) return 'stations';
        if (location.pathname.includes('/stations')) return 'stations';
        if (section) return section;
        return 'dashboard';
    };

    const [activeMenuItem, setActiveMenuItem] = useState(getActiveMenuItem());

    // Update active menu item when URL changes
    useEffect(() => {
        setActiveMenuItem(getActiveMenuItem());
    }, [location.pathname, stationId, section]);

    const handleMenuItemClick = (item: MenuItem) => {
        setActiveMenuItem(item.id);
        setSidebarOpen(false);
        // Navigate to the appropriate route
        if (item.id === 'stations') {
            navigate('/stations');
        } else if (item.id === 'dashboard') {
            navigate('/dashboard');
        } else {
            navigate(`/dashboard/${item.id}`);
        }
    };

    const handleManageStation = (station: { id: number }) => {
        navigate(`/station/${station.id}/overview`);
    };

    const handleBackToStations = () => {
        navigate('/stations');
    };

    // Station table columns - matching AzuraCast design
    const columns: Column<Station>[] = [
        {
            key: 'name',
            header: 'Station Name',
            sortable: true,
            render: (_, row) => (
                <div className="station-name-cell">
                    <Icon name="radio" size={16} className="station-icon" />
                    <div className="station-name-info">
                        <span className="station-name-title">{row.name}</span>
                        <a href="#" className="station-name-link">{row.description}</a>
                    </div>
                </div>
            ),
        },
        {
            key: 'listeners',
            header: 'Listeners',
            sortable: true,
            width: '120px',
            render: (_, row) => (
                <span className="listeners-count">
                    <Icon name="headphones" size={14} />
                    {row.listeners}
                </span>
            ),
        },
        {
            key: 'nowPlaying',
            header: 'Now Playing',
            render: (_, row) => (
                <div className="now-playing-cell">
                    <div className="now-playing-icon">
                        <Icon name="music" size={20} />
                    </div>
                    <span className={row.isOnline ? 'now-playing-online' : 'now-playing-offline'}>
                        {row.nowPlaying}
                    </span>
                </div>
            ),
        },
        {
            key: 'actions',
            header: '',
            width: '100px',
            render: () => (
                <Button size="sm" variant="primary">
                    MANAGE
                </Button>
            ),
        },
    ];

    // If viewing a station (from URL), show the StationManagement view
    if (stationId) {
        return (
            <StationManagement
                stationId={parseInt(stationId, 10)}
                onBack={handleBackToStations}
                initialPage={page}
                initialSubpage={subpage}
            />
        );
    }

    return (
        <div className={`dashboard-layout ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>
            <Header
                username="AzuraCast Demo User"
                email="demo@azuracast.com"
                onMenuClick={() => setSidebarOpen(!sidebarOpen)}
                onLogout={onLogout}
                onProfileClick={() => console.log('Profile')}
            />

            <Sidebar
                isOpen={sidebarOpen}
                isCollapsed={sidebarCollapsed}
                activeItemId={activeMenuItem}
                onItemClick={handleMenuItemClick}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                onClose={() => setSidebarOpen(false)}
            />

            <main className="dashboard-main">
                {activeMenuItem === 'stations' ? (
                    <Stations onManageStation={handleManageStation} />
                ) : (
                    <div className="dashboard-content">
                        {/* User Profile Card */}
                        <UserProfileCard
                            name="AzuraCast Demo User"
                            email="demo@azuracast.com"
                            role="Demo Account"
                            onMyAccountClick={() => console.log('My Account')}
                        />

                        {/* Listeners Chart */}
                        <StatsChart
                            title="Listeners Per Station"
                            datasets={[
                                {
                                    name: 'AzuraTest Radio',
                                    data: listenerData.averageListeners,
                                    color: '#0d6efd'
                                },
                                {
                                    name: 'Unique Listeners',
                                    data: listenerData.uniqueListeners,
                                    color: '#0d6efd'
                                },
                            ]}
                            tabs={['Average Listeners', 'Unique Listeners']}
                            height={280}
                        />

                        {/* Station Overview Table */}
                        <DataTable
                            title="Station Overview"
                            columns={columns}
                            data={stationsData}
                            idKey="id"
                            searchPlaceholder="Search"
                            onRefresh={() => console.log('Refresh')}
                        />
                    </div>
                )}
            </main>
        </div>
    );
};

export default Dashboard;

