import React from 'react';
import { Icon } from '../../components/common';
import type { StationDashboardData, StationServiceStatus, NowPlayingData } from '../../services/api';
import './StationOverview.css';

// Helper function to format seconds to mm:ss
const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

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
                        <div className="panel-header on-air-header">
                            <div className="on-air-left">
                                <button className="btn-play" title="Listen">
                                    <Icon name="play" size={18} />
                                </button>
                                <h3>On the Air</h3>
                            </div>
                            <div className="on-air-right">
                                <Icon name="headphones" size={16} />
                                <span className="listeners-count">{listeners?.total ?? listeners?.current ?? 0} Listener{(listeners?.total ?? listeners?.current ?? 0) !== 1 ? 's' : ''}</span>
                                <br />
                                <small className="unique-count">{listeners?.unique ?? 0} Unique</small>
                            </div>
                        </div>
                        <div className="panel-body">
                            {nowPlaying && (currentSong || nowPlaying.now_playing) ? (
                                <div className="now-playing-section">
                                    <div className="now-playing-row">
                                        {/* Now Playing Column */}
                                        <div className="now-playing-column">
                                            <div className="column-label">
                                                <Icon name="music" size={14} />
                                                Now Playing
                                            </div>
                                            <div className="song-info">
                                                <div className="song-art">
                                                    {(currentSong?.art || nowPlaying.now_playing?.song?.art) ? (
                                                        <a href={currentSong?.art || nowPlaying.now_playing?.song?.art} target="_blank" rel="noopener noreferrer">
                                                            <img src={currentSong?.art || nowPlaying.now_playing?.song?.art} alt="Album Art" />
                                                        </a>
                                                    ) : (
                                                        <div className="art-placeholder">
                                                            <Icon name="music" size={32} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="song-details">
                                                    {!nowPlaying.is_online ? (
                                                        <div className="song-title text-muted">{dashboardData.offlineText || 'Station Offline'}</div>
                                                    ) : (
                                                        <>
                                                            <div className="song-title">
                                                                {currentSong?.title || nowPlaying.now_playing?.song?.title || nowPlaying.now_playing?.song?.text || 'Unknown'}
                                                            </div>
                                                            <div className="song-artist">
                                                                {currentSong?.artist || nowPlaying.now_playing?.song?.artist || ''}
                                                            </div>
                                                            {nowPlaying.now_playing?.playlist && (
                                                                <div className="song-playlist">
                                                                    Playlist: {nowPlaying.now_playing.playlist}
                                                                </div>
                                                            )}
                                                            {nowPlaying.now_playing?.elapsed !== undefined && nowPlaying.now_playing?.duration !== undefined && nowPlaying.now_playing.duration > 0 && (
                                                                <div className="song-progress">
                                                                    {formatTime(nowPlaying.now_playing.elapsed)} / {formatTime(nowPlaying.now_playing.duration)}
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Playing Next or Live Streamer Column */}
                                        <div className="now-playing-column">
                                            {isLive ? (
                                                <>
                                                    <div className="column-label">
                                                        <Icon name="microphone" size={14} />
                                                        Live
                                                    </div>
                                                    <div className="live-streamer-name">
                                                        {nowPlaying.live?.streamer_name || 'Unknown Streamer'}
                                                    </div>
                                                </>
                                            ) : nowPlaying.playing_next ? (
                                                <>
                                                    <div className="column-label">
                                                        <Icon name="chevron-right" size={14} />
                                                        Playing Next
                                                    </div>
                                                    <div className="song-info">
                                                        <div className="song-art small">
                                                            {nowPlaying.playing_next?.song?.art ? (
                                                                <img src={nowPlaying.playing_next.song.art} alt="Next Album Art" />
                                                            ) : (
                                                                <div className="art-placeholder small">
                                                                    <Icon name="music" size={20} />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="song-details">
                                                            <div className="song-title">
                                                                {nowPlaying.playing_next?.song?.title || nowPlaying.playing_next?.song?.text || 'No upcoming song'}
                                                            </div>
                                                            <div className="song-artist">
                                                                {nowPlaying.playing_next?.song?.artist || ''}
                                                            </div>
                                                            {nowPlaying.playing_next?.playlist && (
                                                                <div className="song-playlist">
                                                                    Playlist: {nowPlaying.playing_next.playlist}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="no-next-song">No upcoming songs in queue</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="on-air-actions">
                                        {!isLive && (
                                            <button className="btn-action-secondary">
                                                <Icon name="chevron-right" size={14} />
                                                Skip Song
                                            </button>
                                        )}
                                        {isLive && (
                                            <button className="btn-action-secondary">
                                                <Icon name="headphones" size={14} />
                                                Disconnect Streamer
                                            </button>
                                        )}
                                        <button className="btn-action-secondary">
                                            <Icon name="refresh" size={14} />
                                            Update Metadata
                                        </button>
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
