import React from 'react';
import { Icon } from '../../components/common';
import type { StationDashboardData, StationServiceStatus, NowPlayingData } from '../../services/api';
import './StationOverview.css';

interface StationOverviewProps {
    dashboardData: StationDashboardData;
    serviceStatus: StationServiceStatus;
    nowPlaying: NowPlayingData | null;
    onToggleFeature: (feature: 'enable_requests' | 'enable_streamers' | 'enable_public_page' | 'enable_on_demand') => void;
    onStartService: (service: 'frontend' | 'backend') => void;
    onRefresh: () => void;
}

const StationOverview: React.FC<StationOverviewProps> = ({
    dashboardData,
    serviceStatus,
    nowPlaying,
    onToggleFeature,
    // onStartService will be used later for start/stop buttons
    onRefresh,
}) => {
    const isOnline = nowPlaying?.is_online ?? false;
    const currentSong = nowPlaying?.now_playing?.song;
    const listeners = nowPlaying?.listeners;
    const isLive = nowPlaying?.live?.is_live ?? false;

    return (
        <div className="station-overview">
            {/* Station Name Header */}
            <div className="overview-header">
                <h1 className="overview-title">{dashboardData.name}</h1>
                <button className="refresh-btn" onClick={onRefresh} title="Refresh">
                    <Icon name="refresh" size={16} />
                </button>
            </div>

            <div className="overview-content">
                {/* Left Column */}
                <div className="overview-left">
                    {/* On the Air Panel */}
                    <div className="panel panel-primary">
                        <div className="panel-header">
                            <h3>On the Air</h3>
                            {isOnline && (
                                <span className="status-badge running">Live</span>
                            )}
                        </div>
                        <div className="panel-body">
                            {isOnline && currentSong ? (
                                <div className="now-playing-info">
                                    <div className="now-playing-art">
                                        {currentSong.art ? (
                                            <img src={currentSong.art} alt="Album Art" />
                                        ) : (
                                            <div className="art-placeholder">
                                                <Icon name="music" size={40} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="now-playing-details">
                                        <div className="song-title">{currentSong.title || 'Unknown Title'}</div>
                                        <div className="song-artist">{currentSong.artist || 'Unknown Artist'}</div>
                                        {currentSong.album && (
                                            <div className="song-album">{currentSong.album}</div>
                                        )}
                                        {isLive && nowPlaying?.live?.streamer_name && (
                                            <div className="live-streamer">
                                                <Icon name="microphone" size={14} />
                                                Live: {nowPlaying.live.streamer_name}
                                            </div>
                                        )}
                                    </div>
                                    <div className="listeners-info">
                                        <Icon name="headphones" size={20} />
                                        <span className="listeners-count">{listeners?.current ?? 0}</span>
                                        <span className="listeners-label">Listeners</span>
                                    </div>
                                </div>
                            ) : (
                                <p className="info-text">
                                    {dashboardData.hasStarted
                                        ? 'Information about the current playing track will appear here once your station has started.'
                                        : dashboardData.offlineText || 'Station is currently offline. Start broadcasting to see what\'s playing.'}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Public Pages Panel */}
                    <div className="panel panel-info">
                        <div className="panel-header">
                            <h3>Public Pages</h3>
                            <span className={`status-badge ${dashboardData.enablePublicPages ? 'enabled' : 'disabled'}`}>
                                {dashboardData.enablePublicPages ? 'Enabled' : 'Disabled'}
                            </span>
                        </div>
                        <div className="panel-body">
                            {dashboardData.enablePublicPages ? (
                                <div className="public-links">
                                    <div className="link-row">
                                        <span className="link-label">Public Page</span>
                                        <a href={dashboardData.publicPageUrl} className="link-value" target="_blank" rel="noopener noreferrer">
                                            {dashboardData.publicPageUrl}
                                        </a>
                                    </div>
                                    <div className="link-row">
                                        <span className="link-label">Podcasts</span>
                                        <a href={dashboardData.publicPodcastsUrl} className="link-value" target="_blank" rel="noopener noreferrer">
                                            {dashboardData.publicPodcastsUrl}
                                        </a>
                                    </div>
                                    <div className="link-row">
                                        <span className="link-label">Schedule</span>
                                        <a href={dashboardData.publicScheduleUrl} className="link-value" target="_blank" rel="noopener noreferrer">
                                            {dashboardData.publicScheduleUrl}
                                        </a>
                                    </div>
                                    <div className="panel-actions">
                                        <button className="action-link">
                                            <Icon name="code" size={14} />
                                            EMBED WIDGETS
                                        </button>
                                        <button className="action-link">
                                            <Icon name="edit" size={14} />
                                            EDIT BRANDING
                                        </button>
                                        <button
                                            className="action-link danger"
                                            onClick={() => onToggleFeature('enable_public_page')}
                                        >
                                            <Icon name="close" size={14} />
                                            DISABLE
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="feature-disabled">
                                    <button
                                        className="enable-btn"
                                        onClick={() => onToggleFeature('enable_public_page')}
                                    >
                                        <Icon name="check" size={14} />
                                        ENABLE
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="overview-right">
                    {/* Song Requests Panel */}
                    {dashboardData.features.requests && (
                        <div className="panel panel-feature">
                            <div className="panel-header">
                                <h3>Song Requests</h3>
                                <span className={`status-badge ${dashboardData.enableRequests ? 'enabled' : 'disabled'}`}>
                                    {dashboardData.enableRequests ? 'Enabled' : 'Disabled'}
                                </span>
                            </div>
                            <div className="panel-body">
                                <button
                                    className="enable-btn"
                                    onClick={() => onToggleFeature('enable_requests')}
                                >
                                    <Icon name="check" size={14} />
                                    {dashboardData.enableRequests ? 'DISABLE' : 'ENABLE'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Streamers/DJs Panel */}
                    {dashboardData.features.streamers && (
                        <div className="panel panel-feature">
                            <div className="panel-header">
                                <h3>Streamers/DJs</h3>
                                <span className={`status-badge ${dashboardData.enableStreamers ? 'enabled' : 'disabled'}`}>
                                    {dashboardData.enableStreamers ? 'Enabled' : 'Disabled'}
                                </span>
                            </div>
                            <div className="panel-body">
                                <button
                                    className="enable-btn"
                                    onClick={() => onToggleFeature('enable_streamers')}
                                >
                                    <Icon name="check" size={14} />
                                    {dashboardData.enableStreamers ? 'DISABLE' : 'ENABLE'}
                                </button>
                                {dashboardData.enableStreamers && (
                                    <button className="credentials-btn">
                                        <Icon name="key" size={14} />
                                        SHOW CREDENTIALS
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* On-Demand Panel */}
                    {dashboardData.features.media && (
                        <div className="panel panel-feature">
                            <div className="panel-header">
                                <h3>On-Demand Media</h3>
                                <span className={`status-badge ${dashboardData.enableOnDemand ? 'enabled' : 'disabled'}`}>
                                    {dashboardData.enableOnDemand ? 'Enabled' : 'Disabled'}
                                </span>
                            </div>
                            <div className="panel-body">
                                <button
                                    className="enable-btn"
                                    onClick={() => onToggleFeature('enable_on_demand')}
                                >
                                    <Icon name="check" size={14} />
                                    {dashboardData.enableOnDemand ? 'DISABLE' : 'ENABLE'}
                                </button>
                                {dashboardData.enableOnDemand && (
                                    <a href={dashboardData.onDemandUrl} className="view-link" target="_blank" rel="noopener noreferrer">
                                        <Icon name="eye" size={14} />
                                        VIEW PAGE
                                    </a>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Broadcasting Service Panel */}
                    <div className="panel panel-service">
                        <div className="panel-header service-header">
                            <div>
                                <h3>Broadcasting Service</h3>
                                <span className="service-type">
                                    {dashboardData.frontendType || 'Icecast'}
                                </span>
                            </div>
                            <span className={`status-badge ${serviceStatus.frontendRunning ? 'running' : 'stopped'}`}>
                                {serviceStatus.frontendRunning ? 'Running' : 'Not Running'}
                            </span>
                        </div>
                    </div>

                    {/* AutoDJ Service Panel */}
                    <div className="panel panel-service">
                        <div className="panel-header service-header">
                            <div>
                                <h3>AutoDJ Service</h3>
                                <span className="service-type">
                                    {dashboardData.backendType || 'Liquidsoap'}
                                </span>
                            </div>
                            <span className={`status-badge ${serviceStatus.backendRunning ? 'running' : 'stopped'}`}>
                                {serviceStatus.backendRunning ? 'Running' : 'Not Running'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StationOverview;
