import React, { useState, useEffect } from 'react';
import { Icon } from '../../components/common';
import { api, type StationDashboardData, type StationServiceStatus, type NowPlayingData } from '../../services/api';
import StationSidebar from './StationSidebar';
import StationOverview from './StationOverview';
import MusicFiles from './MusicFiles';
import './StationManagement.css';

interface StationManagementProps {
    stationId: number;
    onBack: () => void;
}

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

const StationManagement: React.FC<StationManagementProps> = ({
    stationId,
    onBack,
}) => {
    const [activePage, setActivePage] = useState<ActivePage>('overview');
    const [dashboardData, setDashboardData] = useState<StationDashboardData | null>(null);
    const [serviceStatus, setServiceStatus] = useState<StationServiceStatus>({
        frontendRunning: false,
        backendRunning: false,
    });
    const [nowPlaying, setNowPlaying] = useState<NowPlayingData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchStationData();
    }, [stationId]);

    const fetchStationData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Fetch dashboard data (station globals)
            const dashboard = await api.getStationDashboard(stationId);
            setDashboardData(dashboard);

            // Fetch profile for service status
            try {
                const profile = await api.getStationProfile(stationId);
                setServiceStatus({
                    frontendRunning: profile.services?.frontendRunning ?? false,
                    backendRunning: profile.services?.backendRunning ?? false,
                });
            } catch (profileError) {
                console.warn('Could not fetch service status:', profileError);
            }

            // Fetch now playing data
            try {
                const np = await api.getNowPlaying(stationId);
                setNowPlaying(np);
            } catch (npError) {
                console.warn('Could not fetch now playing:', npError);
            }
        } catch (err) {
            console.error('Failed to fetch station dashboard:', err);
            // Fallback: try to get basic station data from profile
            try {
                const profile = await api.getStationProfile(stationId);
                // Convert profile to dashboard-like data
                setDashboardData({
                    id: profile.station.id,
                    name: profile.station.name,
                    shortName: profile.station.shortcode || profile.station.short_name || '',
                    description: profile.station.description,
                    isEnabled: profile.station.is_enabled ?? true,
                    hasStarted: false,
                    needsRestart: false,
                    timezone: profile.station.timezone || 'UTC',
                    enablePublicPages: profile.station.enable_public_page ?? true,
                    publicPageUrl: `/public/${profile.station.shortcode || profile.station.short_name}`,
                    enableOnDemand: profile.station.enable_on_demand ?? false,
                    onDemandUrl: `/public/${profile.station.shortcode || profile.station.short_name}/ondemand`,
                    enableStreamers: profile.station.enable_streamers ?? false,
                    webDjUrl: '',
                    publicPodcastsUrl: `/public/${profile.station.shortcode || profile.station.short_name}/podcasts`,
                    publicScheduleUrl: `/public/${profile.station.shortcode || profile.station.short_name}/schedule`,
                    enableRequests: profile.station.enable_requests ?? profile.station.requests_enabled ?? false,
                    features: {
                        media: true,
                        sftp: false,
                        podcasts: true,
                        streamers: true,
                        webhooks: true,
                        requests: true,
                        mountPoints: true,
                        hlsStreams: false,
                        remoteRelays: true,
                        customLiquidsoapConfig: false,
                        autoDjQueue: true,
                    },
                    backendType: profile.station.backend || profile.station.backend_type || 'liquidsoap',
                    frontendType: profile.station.frontend || profile.station.frontend_type || 'icecast',
                    canReload: true,
                    useManualAutoDj: false,
                    maxBitrate: 0,
                    maxMounts: 0,
                    maxHlsStreams: 0,
                });
                setServiceStatus({
                    frontendRunning: profile.services?.frontendRunning ?? false,
                    backendRunning: profile.services?.backendRunning ?? false,
                });
            } catch (fallbackError) {
                console.error('Failed to fetch station profile:', fallbackError);
                setError('Could not load station data. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleFeature = async (feature: 'enable_requests' | 'enable_streamers' | 'enable_public_page' | 'enable_on_demand') => {
        if (!dashboardData) return;

        const currentValue = feature === 'enable_requests' ? dashboardData.enableRequests
            : feature === 'enable_streamers' ? dashboardData.enableStreamers
                : feature === 'enable_public_page' ? dashboardData.enablePublicPages
                    : dashboardData.enableOnDemand;

        try {
            await api.toggleStationFeature(stationId, feature, !currentValue);
            // Refresh data after toggle
            await fetchStationData();
        } catch (err) {
            console.error(`Failed to toggle ${feature}:`, err);
            alert(`Failed to toggle feature. Please try again.`);
        }
    };

    const handleStartService = async (service: 'frontend' | 'backend') => {
        try {
            await api.controlStationService(stationId, 'start');
            // Refresh to get new service status
            await fetchStationData();
        } catch (err) {
            console.error(`Failed to start ${service}:`, err);
            alert(`Failed to start ${service} service. Please try again.`);
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="station-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading station data...</p>
                </div>
            );
        }

        if (error || !dashboardData) {
            return (
                <div className="station-error">
                    <Icon name="warning" size={48} />
                    <h3>Failed to load station</h3>
                    <p>{error || 'Could not retrieve station information.'}</p>
                    <button className="btn-retry" onClick={fetchStationData}>
                        Retry
                    </button>
                </div>
            );
        }

        switch (activePage) {
            case 'overview':
                return (
                    <StationOverview
                        dashboardData={dashboardData}
                        serviceStatus={serviceStatus}
                        nowPlaying={nowPlaying}
                        onToggleFeature={handleToggleFeature}
                        onStartService={handleStartService}
                        onRefresh={fetchStationData}
                    />
                );
            case 'settings':
                return <div className="placeholder-content">Edit Station Settings - Coming Soon</div>;
            case 'public-pages':
                return <div className="placeholder-content">Public Pages - Coming Soon</div>;

            // Media sub-pages
            case 'media':
            case 'media-files':
                return <MusicFiles stationId={stationId} />;
            case 'media-duplicates':
                return <div className="placeholder-content">Duplicate Songs - Coming Soon</div>;
            case 'media-unprocessable':
                return <div className="placeholder-content">Unprocessable Files - Coming Soon</div>;
            case 'media-unassigned':
                return <div className="placeholder-content">Unassigned Files - Coming Soon</div>;
            case 'media-sftp':
                return <div className="placeholder-content">SFTP Users - Coming Soon</div>;
            case 'media-bulk':
                return <div className="placeholder-content">Bulk Media Import/Export - Coming Soon</div>;

            case 'playlists':
                return <div className="placeholder-content">Playlists - Coming Soon</div>;
            case 'podcasts':
                return <div className="placeholder-content">Podcasts - Coming Soon</div>;
            case 'webhooks':
                return <div className="placeholder-content">Web Hooks - Coming Soon</div>;

            // Reports sub-pages
            case 'reports':
            case 'reports-overview':
                return <div className="placeholder-content">Station Statistics - Coming Soon</div>;
            case 'reports-listeners':
                return <div className="placeholder-content">Listeners Report - Coming Soon</div>;
            case 'reports-requests':
                return <div className="placeholder-content">Song Requests Report - Coming Soon</div>;
            case 'reports-timeline':
                return <div className="placeholder-content">Song Playback Timeline - Coming Soon</div>;

            // Broadcasting sub-pages
            case 'broadcasting':
            case 'broadcasting-mounts':
                return <div className="placeholder-content">Mount Points - Coming Soon</div>;
            case 'broadcasting-hls':
                return <div className="placeholder-content">HLS Streams - Coming Soon</div>;
            case 'broadcasting-remotes':
                return <div className="placeholder-content">Remote Relays - Coming Soon</div>;
            case 'broadcasting-fallback':
                return <div className="placeholder-content">Custom Fallback File - Coming Soon</div>;
            case 'broadcasting-queue':
                return <div className="placeholder-content">Upcoming Song Queue - Coming Soon</div>;
            case 'broadcasting-restart':
                return <div className="placeholder-content">Restart Broadcasting - Coming Soon</div>;

            case 'logs':
                return <div className="placeholder-content">Logs - Coming Soon</div>;
            default:
                return <div className="placeholder-content">Page not found</div>;
        }
    };

    // Get current time in station timezone
    const getCurrentTime = () => {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
        return `${timeString} ${dashboardData?.timezone || 'UTC'}`;
    };

    return (
        <div className="station-management">
            {/* Top Header Bar */}
            <div className="station-top-bar">
                <button className="back-btn" onClick={onBack}>
                    <Icon name="chevron-left" size={20} />
                    Back to Stations
                </button>
            </div>

            <div className="station-layout">
                {/* Sidebar */}
                <StationSidebar
                    stationName={dashboardData?.name || 'Loading...'}
                    currentTime={getCurrentTime()}
                    isEnabled={dashboardData?.isEnabled ?? false}
                    hasStarted={dashboardData?.hasStarted ?? false}
                    activePage={activePage}
                    onPageChange={setActivePage}
                    onStartStation={handleStartService}
                />

                {/* Main Content */}
                <main className="station-main">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default StationManagement;
