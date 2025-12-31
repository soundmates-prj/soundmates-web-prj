import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../../components/common';
import './AddStationModal.css';

interface StationFormData {
    // Profile
    name: string;
    description: string;
    genre: string;
    websiteUrl: string;
    timezone: string;
    urlStub: string;
    visibleRecentSongs: number | 'disabled' | 'custom';
    customRecentSongs: number;
    enablePublicPages: boolean;
    enableOnDemandStreaming: boolean;
    // Broadcasting
    enableBroadcasting: boolean;
    // AutoDJ
    enableAutoDJ: boolean;
    // HLS
    enableHLS: boolean;
    // Song Requests
    enableSongRequests: boolean;
    // Streamers/DJs
    enableStreamers: boolean;
}

// Default values for form data
const defaultFormData: StationFormData = {
    name: '',
    description: '',
    genre: '',
    websiteUrl: '',
    timezone: 'UTC',
    urlStub: '',
    visibleRecentSongs: 5,
    customRecentSongs: 5,
    enablePublicPages: true,
    enableOnDemandStreaming: false,
    enableBroadcasting: true,
    enableAutoDJ: true,
    enableHLS: false,
    enableSongRequests: true,
    enableStreamers: true,
};

interface AddStationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: StationFormData) => void;
    isLoading?: boolean;
    /** Initial data for editing a station */
    initialData?: Partial<StationFormData>;
    /** Custom title for the modal (default: 'Add Station') */
    title?: string;
}

type TabId = 'profile' | 'broadcasting' | 'autodj' | 'hls' | 'song-requests' | 'streamers' | 'administration';

const tabs: { id: TabId; label: string }[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'broadcasting', label: 'Broadcasting' },
    { id: 'autodj', label: 'AutoDJ' },
    { id: 'hls', label: 'HLS' },
    { id: 'song-requests', label: 'Song Requests' },
    { id: 'streamers', label: 'Streamers/DJs' },
    { id: 'administration', label: 'Administration' },
];

const timezones = [
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'America/New_York' },
    { value: 'America/Los_Angeles', label: 'America/Los_Angeles' },
    { value: 'Europe/London', label: 'Europe/London' },
    { value: 'Europe/Paris', label: 'Europe/Paris' },
    { value: 'Asia/Tokyo', label: 'Asia/Tokyo' },
    { value: 'Asia/Ho_Chi_Minh', label: 'Asia/Ho_Chi_Minh' },
    { value: 'Australia/Sydney', label: 'Australia/Sydney' },
];

const AddStationModal: React.FC<AddStationModalProps> = ({
    isOpen,
    onClose,
    onSave,
    isLoading = false,
    initialData,
    title = 'Add Station',
}) => {
    const [activeTab, setActiveTab] = useState<TabId>('profile');
    const [formData, setFormData] = useState<StationFormData>({ ...defaultFormData });

    // Reset form when modal opens/closes or initial data changes
    useEffect(() => {
        if (isOpen) {
            setFormData({
                ...defaultFormData,
                ...initialData,
            });
            setActiveTab('profile');
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleInputChange = (field: keyof StationFormData, value: string | number | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = () => {
        onSave(formData);
    };

    const renderProfileTab = () => (
        <div className="modal-tab-content">
            {/* Name */}
            <div className="form-group">
                <label className="form-label">
                    Name<span className="required">*</span>
                </label>
                <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                />
            </div>

            {/* Description */}
            <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                    className="form-textarea"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                />
            </div>

            {/* Genre & Website URL */}
            <div className="form-row">
                <div className="form-group">
                    <label className="form-label">Genre</label>
                    <input
                        type="text"
                        className="form-input"
                        value={formData.genre}
                        onChange={(e) => handleInputChange('genre', e.target.value)}
                    />
                    <span className="form-hint">
                        The primary genre this station plays, such as "rock", "electronic", or "talk".
                    </span>
                </div>
                <div className="form-group">
                    <label className="form-label">Web Site URL</label>
                    <input
                        type="url"
                        className="form-input"
                        value={formData.websiteUrl}
                        onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                    />
                    <span className="form-hint">
                        Note: This should be the public-facing homepage of the radio station, not the AzuraCast URL. It will be included in broadcast details.
                    </span>
                </div>
            </div>

            {/* Time Zone & Visible Recent Songs */}
            <div className="form-row">
                <div className="form-group">
                    <label className="form-label">Time Zone</label>
                    <select
                        className="form-select"
                        value={formData.timezone}
                        onChange={(e) => handleInputChange('timezone', e.target.value)}
                    >
                        {timezones.map(tz => (
                            <option key={tz.value} value={tz.value}>{tz.label}</option>
                        ))}
                    </select>
                    <span className="form-hint">
                        Scheduled playlists and other timed items will be controlled by this time zone.
                    </span>
                </div>
                <div className="form-group">
                    <label className="form-label">
                        Number of Visible Recent Songs
                        <span className="badge-advanced">Advanced</span>
                    </label>
                    <div className="radio-group">
                        <label className="radio-label">
                            <input
                                type="radio"
                                name="visibleRecentSongs"
                                checked={formData.visibleRecentSongs === 'disabled'}
                                onChange={() => handleInputChange('visibleRecentSongs', 'disabled')}
                            />
                            Disabled
                        </label>
                        <label className="radio-label">
                            <input
                                type="radio"
                                name="visibleRecentSongs"
                                checked={formData.visibleRecentSongs === 1}
                                onChange={() => handleInputChange('visibleRecentSongs', 1)}
                            />
                            1
                        </label>
                        <label className="radio-label">
                            <input
                                type="radio"
                                name="visibleRecentSongs"
                                checked={formData.visibleRecentSongs === 5}
                                onChange={() => handleInputChange('visibleRecentSongs', 5)}
                            />
                            5
                        </label>
                        <label className="radio-label">
                            <input
                                type="radio"
                                name="visibleRecentSongs"
                                checked={formData.visibleRecentSongs === 10}
                                onChange={() => handleInputChange('visibleRecentSongs', 10)}
                            />
                            10
                        </label>
                        <label className="radio-label">
                            <input
                                type="radio"
                                name="visibleRecentSongs"
                                checked={formData.visibleRecentSongs === 15}
                                onChange={() => handleInputChange('visibleRecentSongs', 15)}
                            />
                            15
                        </label>
                        <label className="radio-label custom-radio">
                            <input
                                type="radio"
                                name="visibleRecentSongs"
                                checked={formData.visibleRecentSongs === 'custom'}
                                onChange={() => handleInputChange('visibleRecentSongs', 'custom')}
                            />
                            Custom
                            {formData.visibleRecentSongs === 'custom' && (
                                <input
                                    type="number"
                                    className="form-input-small"
                                    value={formData.customRecentSongs}
                                    onChange={(e) => handleInputChange('customRecentSongs', parseInt(e.target.value) || 0)}
                                    min={0}
                                />
                            )}
                        </label>
                    </div>
                    <span className="form-hint">
                        Customize the number of songs that will appear in the "Song History" section for this station and in all public APIs.
                    </span>
                </div>
            </div>

            {/* URL Stub */}
            <div className="form-group">
                <label className="form-label">
                    URL Stub
                    <span className="badge-advanced">Advanced</span>
                </label>
                <input
                    type="text"
                    className="form-input form-input-medium"
                    value={formData.urlStub}
                    onChange={(e) => handleInputChange('urlStub', e.target.value)}
                />
                <span className="form-hint">
                    Optionally specify a short URL-friendly name, such as "my_station_name", that will be used in this station's URLs. Leave this field blank to automatically create one based on the station name.
                </span>
            </div>

            {/* Public Pages */}
            <div className="form-section">
                <h3 className="section-title">Public Pages</h3>
                <div className="toggle-group">
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={formData.enablePublicPages}
                            onChange={(e) => handleInputChange('enablePublicPages', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                    <div className="toggle-label-group">
                        <span className="toggle-text">Enable Public Pages</span>
                        <span className="form-hint">
                            Show the station in public pages and general API results.
                        </span>
                    </div>
                </div>
            </div>

            {/* On-Demand Streaming */}
            <div className="form-section">
                <h3 className="section-title">On-Demand Streaming</h3>
                <div className="toggle-group">
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={formData.enableOnDemandStreaming}
                            onChange={(e) => handleInputChange('enableOnDemandStreaming', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                    <div className="toggle-label-group">
                        <span className="toggle-text">Enable On-Demand Streaming</span>
                        <span className="form-hint">
                            If enabled, music from playlists with on-demand streaming enabled will be available to stream via a specialized public page.
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderBroadcastingTab = () => (
        <div className="modal-tab-content">
            <div className="form-section">
                <h3 className="section-title">Broadcasting Settings</h3>
                <div className="toggle-group">
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={formData.enableBroadcasting}
                            onChange={(e) => handleInputChange('enableBroadcasting', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                    <div className="toggle-label-group">
                        <span className="toggle-text">Enable Broadcasting</span>
                        <span className="form-hint">
                            If disabled, the station will not broadcast and listeners will not be able to connect.
                        </span>
                    </div>
                </div>
            </div>
            <p className="tab-placeholder">Additional broadcasting settings will appear here.</p>
        </div>
    );

    const renderAutoDJTab = () => (
        <div className="modal-tab-content">
            <div className="form-section">
                <h3 className="section-title">AutoDJ Settings</h3>
                <div className="toggle-group">
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={formData.enableAutoDJ}
                            onChange={(e) => handleInputChange('enableAutoDJ', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                    <div className="toggle-label-group">
                        <span className="toggle-text">Enable AutoDJ</span>
                        <span className="form-hint">
                            If enabled, the AutoDJ will automatically play music from your playlists when no live DJ is connected.
                        </span>
                    </div>
                </div>
            </div>
            <p className="tab-placeholder">Additional AutoDJ settings will appear here.</p>
        </div>
    );

    const renderHLSTab = () => (
        <div className="modal-tab-content">
            <div className="form-section">
                <h3 className="section-title">HLS (HTTP Live Streaming)</h3>
                <div className="toggle-group">
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={formData.enableHLS}
                            onChange={(e) => handleInputChange('enableHLS', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                    <div className="toggle-label-group">
                        <span className="toggle-text">Enable HLS Streaming</span>
                        <span className="form-hint">
                            HLS is a streaming protocol that allows listeners to play audio in their web browser.
                        </span>
                    </div>
                </div>
            </div>
            <p className="tab-placeholder">Additional HLS settings will appear here.</p>
        </div>
    );

    const renderSongRequestsTab = () => (
        <div className="modal-tab-content">
            <div className="form-section">
                <h3 className="section-title">Song Requests</h3>
                <div className="toggle-group">
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={formData.enableSongRequests}
                            onChange={(e) => handleInputChange('enableSongRequests', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                    <div className="toggle-label-group">
                        <span className="toggle-text">Enable Song Requests</span>
                        <span className="form-hint">
                            Allow listeners to request songs from the station's media library.
                        </span>
                    </div>
                </div>
            </div>
            <p className="tab-placeholder">Additional song request settings will appear here.</p>
        </div>
    );

    const renderStreamersTab = () => (
        <div className="modal-tab-content">
            <div className="form-section">
                <h3 className="section-title">Streamers/DJs</h3>
                <div className="toggle-group">
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={formData.enableStreamers}
                            onChange={(e) => handleInputChange('enableStreamers', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                    </label>
                    <div className="toggle-label-group">
                        <span className="toggle-text">Enable Streamers/DJs</span>
                        <span className="form-hint">
                            Allow live DJs to connect and stream to this station.
                        </span>
                    </div>
                </div>
            </div>
            <p className="tab-placeholder">Additional streamer settings will appear here.</p>
        </div>
    );

    const renderAdministrationTab = () => (
        <div className="modal-tab-content">
            <div className="form-section">
                <h3 className="section-title">Administration</h3>
                <p className="tab-placeholder">
                    Administrative settings for managing this station.
                </p>
            </div>
        </div>
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case 'profile':
                return renderProfileTab();
            case 'broadcasting':
                return renderBroadcastingTab();
            case 'autodj':
                return renderAutoDJTab();
            case 'hls':
                return renderHLSTab();
            case 'song-requests':
                return renderSongRequestsTab();
            case 'streamers':
                return renderStreamersTab();
            case 'administration':
                return renderAdministrationTab();
            default:
                return renderProfileTab();
        }
    };

    return createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <h2 className="modal-title">{title}</h2>
                    <button className="modal-close-btn" onClick={onClose} disabled={isLoading}>
                        <Icon name="close" size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="modal-tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`modal-tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                            disabled={isLoading}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="modal-body">
                    {renderTabContent()}
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <button
                        className="btn-close"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        CLOSE
                    </button>
                    <button
                        className="btn-save"
                        onClick={handleSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <span className="spinner-sm" style={{ marginRight: '8px', borderTopColor: 'currentColor' }}></span>
                                SAVING...
                            </>
                        ) : (
                            'SAVE CHANGES'
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default AddStationModal;
export type { StationFormData };
