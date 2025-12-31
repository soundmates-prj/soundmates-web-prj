import React, { useState, useEffect } from 'react';
import { Icon } from '../../components/common';
import { api } from '../../services/api';
import './UpdateStationConfig.css';

interface UpdateStationConfigProps {
    stationId: number;
    supportsReload?: boolean;
    onConfigUpdated?: () => void;
}

const UpdateStationConfig: React.FC<UpdateStationConfigProps> = ({
    stationId,
    supportsReload = true,
    onConfigUpdated
}) => {
    const [isReloading, setIsReloading] = useState(false);
    const [isRestarting, setIsRestarting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [serviceStatus, setServiceStatus] = useState<{ backendRunning: boolean; frontendRunning: boolean } | null>(null);

    // Fetch service status
    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const status = await api.getStationServiceStatus(stationId);
                setServiceStatus(status);
            } catch (error) {
                console.error('Failed to fetch service status:', error);
            }
        };
        fetchStatus();
    }, [stationId]);

    const handleReloadConfiguration = async () => {
        setIsReloading(true);
        setMessage(null);

        try {
            const result = await api.reloadStationConfiguration(stationId);
            setMessage({ type: 'success', text: result.message || 'Station configuration reloaded successfully.' });

            // Refresh service status
            const status = await api.getStationServiceStatus(stationId);
            setServiceStatus(status);

            // Notify parent to refresh station data
            if (onConfigUpdated) {
                onConfigUpdated();
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to reload configuration. Please try again.' });
            console.error('Failed to reload configuration:', error);
        } finally {
            setIsReloading(false);
        }
    };

    const handleRestartBroadcasting = async () => {
        setIsRestarting(true);
        setMessage(null);

        try {
            const result = await api.restartBroadcasting(stationId);
            setMessage({ type: 'success', text: result.message || 'Broadcasting restarted successfully.' });

            // Refresh service status
            const status = await api.getStationServiceStatus(stationId);
            setServiceStatus(status);

            // Notify parent to refresh station data
            if (onConfigUpdated) {
                onConfigUpdated();
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to restart broadcasting. Please try again.' });
            console.error('Failed to restart broadcasting:', error);
        } finally {
            setIsRestarting(false);
        }
    };

    return (
        <div className="update-station-config">
            <h1 className="page-title">Update Station Configuration</h1>

            {/* Message */}
            {message && (
                <div className={`message-banner ${message.type}`}>
                    <Icon name={message.type === 'success' ? 'check' : 'warning'} size={16} />
                    {message.text}
                </div>
            )}

            {/* Service Status */}
            {serviceStatus && (
                <div className="service-status">
                    <span className={`status-indicator ${serviceStatus.frontendRunning ? 'running' : 'stopped'}`}>
                        Frontend: {serviceStatus.frontendRunning ? 'Running' : 'Stopped'}
                    </span>
                    <span className={`status-indicator ${serviceStatus.backendRunning ? 'running' : 'stopped'}`}>
                        Backend: {serviceStatus.backendRunning ? 'Running' : 'Stopped'}
                    </span>
                </div>
            )}

            <div className="config-cards">
                {/* Reload Configuration Card */}
                <div className="config-card reload-card">
                    <div className="card-header">
                        <h2>Reload Configuration</h2>
                    </div>
                    <div className="card-body">
                        <p>
                            Stations using Icecast can soft-reload the station configuration, applying changes while keeping
                            the stream broadcast running.
                        </p>
                        <p className="highlight-text">
                            <strong>Reloading broadcasting will not disconnect your listeners.</strong>
                        </p>
                        {supportsReload ? (
                            <p className="support-text success">
                                <Icon name="check" size={14} />
                                Your station supports reloading configuration.
                            </p>
                        ) : (
                            <p className="support-text warning">
                                <Icon name="warning" size={14} />
                                Your station does not support soft-reloading. Use Restart instead.
                            </p>
                        )}
                        <button
                            className="btn-reload"
                            onClick={handleReloadConfiguration}
                            disabled={isReloading || !supportsReload}
                        >
                            {isReloading ? (
                                <>
                                    <span className="btn-spinner"></span>
                                    RELOADING...
                                </>
                            ) : (
                                'RELOAD CONFIGURATION'
                            )}
                        </button>
                    </div>
                </div>

                {/* Restart Broadcasting Card */}
                <div className="config-card restart-card">
                    <div className="card-header">
                        <h2>Restart Broadcasting</h2>
                    </div>
                    <div className="card-body">
                        <p>
                            Restarting broadcasting will rewrite all configuration files and restart all services.
                        </p>
                        <p className="highlight-text warning">
                            <strong>Restarting broadcasting will briefly disconnect your listeners.</strong>
                        </p>
                        <button
                            className="btn-restart"
                            onClick={handleRestartBroadcasting}
                            disabled={isRestarting}
                        >
                            {isRestarting ? (
                                <>
                                    <span className="btn-spinner"></span>
                                    RESTARTING...
                                </>
                            ) : (
                                'RESTART BROADCASTING'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpdateStationConfig;
