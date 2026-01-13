import React, { useState } from 'react';
import { Icon } from '../../components/common';
import { api } from '../../services/api';
import './AddPlaylistModal.css';

interface AddPlaylistModalProps {
    stationId: number;
    onClose: () => void;
    onSuccess: () => void;
}

interface PlaylistFormData {
    name: string;
    description: string;
    is_enabled: boolean;
    source: 'songs' | 'remote_url';
    type: 'default' | 'once_per_x_songs' | 'once_per_x_minutes' | 'once_per_hour' | 'advanced';
    order: 'shuffle' | 'random' | 'sequential';
    weight: number;
    avoid_duplicates: boolean;
    include_in_on_demand: boolean;
    include_in_requests: boolean;
    is_jingle: boolean;
    play_per_songs: number;
    play_per_minutes: number;
    play_per_hour_minute: number;
}

const AddPlaylistModal: React.FC<AddPlaylistModalProps> = ({ stationId, onClose, onSuccess }) => {
    const [activeTab, setActiveTab] = useState<'basic' | 'schedule' | 'advanced'>('basic');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState<PlaylistFormData>({
        name: '',
        description: '',
        is_enabled: true,
        source: 'songs',
        type: 'default',
        order: 'shuffle',
        weight: 3,
        avoid_duplicates: true,
        include_in_on_demand: false,
        include_in_requests: true,
        is_jingle: false,
        play_per_songs: 0,
        play_per_minutes: 0,
        play_per_hour_minute: 0,
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value,
        }));
    };

    const handleToggleChange = (field: keyof PlaylistFormData) => {
        setFormData(prev => ({
            ...prev,
            [field]: !prev[field],
        }));
    };

    const handleRadioChange = (field: keyof PlaylistFormData, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            setError('Playlist name is required');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            await api.createPlaylist(stationId, {
                name: formData.name,
                type: formData.type,
                source: formData.source,
                order: formData.order,
                is_enabled: formData.is_enabled,
                weight: formData.weight,
            });
            onSuccess();
            onClose();
        } catch (err) {
            setError('Failed to create playlist. Please try again.');
            console.error('Failed to create playlist:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="add-playlist-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <h2>Add Playlist</h2>
                    <button className="btn-close" onClick={onClose}>
                        <Icon name="close" size={20} />
                    </button>
                </div>

                {/* Tabs */}
                {/* <div className="modal-tabs">
                    <button
                        className={`modal-tab ${activeTab === 'basic' ? 'active' : ''}`}
                        onClick={() => setActiveTab('basic')}
                    >
                        Basic Info
                    </button>
                    <button
                        className={`modal-tab ${activeTab === 'schedule' ? 'active' : ''}`}
                        onClick={() => setActiveTab('schedule')}
                    >
                        Schedule
                    </button>
                    <button
                        className={`modal-tab ${activeTab === 'advanced' ? 'active' : ''}`}
                        onClick={() => setActiveTab('advanced')}
                    >
                        Advanced
                    </button>
                </div> */}

                {/* Content */}
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {error && <div className="error-message">{error}</div>}

                        {activeTab === 'basic' && (
                            <div className="tab-content">
                                {/* Name and Enable */}
                                <div className="form-row">
                                    <div className="form-group flex-1">
                                        <label htmlFor="name">Playlist Name*</label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group enable-toggle">
                                        <label className="toggle-container">
                                            <input
                                                type="checkbox"
                                                checked={formData.is_enabled}
                                                onChange={() => handleToggleChange('is_enabled')}
                                            />
                                            <span className="toggle-slider"></span>
                                            <span className="toggle-label">Enable</span>
                                        </label>
                                        <p className="help-text">
                                            If disabled, the playlist will not be included in radio playback, but can still be managed.
                                        </p>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="form-group">
                                    <label htmlFor="description">Description</label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows={3}
                                    />
                                    <p className="help-text">An optional description to help identify this playlist.</p>
                                </div>

                                {/* Source */}
                                {/* <div className="form-group">
                                    <label>Source</label>
                                    <div className="radio-group">
                                        <label className="radio-option">
                                            <input
                                                type="radio"
                                                name="source"
                                                checked={formData.source === 'songs'}
                                                onChange={() => handleRadioChange('source', 'songs')}
                                            />
                                            <span className="radio-mark"></span>
                                            <div>
                                                <strong>Song-Based</strong>
                                                <p>A playlist containing media files hosted on this server.</p>
                                            </div>
                                        </label>
                                        <label className="radio-option">
                                            <input
                                                type="radio"
                                                name="source"
                                                checked={formData.source === 'remote_url'}
                                                onChange={() => handleRadioChange('source', 'remote_url')}
                                            />
                                            <span className="radio-mark"></span>
                                            <div>
                                                <strong>Remote URL</strong>
                                                <p>A playlist that instructs the station to play from a remote URL.</p>
                                            </div>
                                        </label>
                                    </div>
                                </div> */}

                                {/* Song-Based Playlist Options */}
                                {/* {formData.source === 'songs' && (
                                    <div className="section-box">
                                        <div className="section-header">Song-Based Playlist</div>
                                        <div className="section-content">
                                            <div className="toggle-grid">
                                                <div className="toggle-item">
                                                    <label className="toggle-container">
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.avoid_duplicates}
                                                            onChange={() => handleToggleChange('avoid_duplicates')}
                                                        />
                                                        <span className="toggle-slider"></span>
                                                        <span className="toggle-label">Avoid Duplicate Artists/Titles</span>
                                                    </label>
                                                    <p className="help-text">
                                                        Whether the AutoDJ should attempt to avoid duplicate artists and track titles when playing media from this playlist.
                                                    </p>
                                                </div>
                                                <div className="toggle-item">
                                                    <label className="toggle-container">
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.include_in_on_demand}
                                                            onChange={() => handleToggleChange('include_in_on_demand')}
                                                        />
                                                        <span className="toggle-slider"></span>
                                                        <span className="toggle-label">Include in On-Demand Player</span>
                                                    </label>
                                                    <p className="help-text">
                                                        If this station has on-demand streaming and downloading enabled, only songs that are in playlists with this setting enabled will be visible.
                                                    </p>
                                                </div>
                                                <div className="toggle-item">
                                                    <label className="toggle-container">
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.include_in_requests}
                                                            onChange={() => handleToggleChange('include_in_requests')}
                                                        />
                                                        <span className="toggle-slider"></span>
                                                        <span className="toggle-label">Allow Requests from This Playlist</span>
                                                    </label>
                                                    <p className="help-text">
                                                        If requests are enabled for your station, users will be able to request media that is on this playlist.
                                                    </p>
                                                </div>
                                                <div className="toggle-item">
                                                    <label className="toggle-container">
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.is_jingle}
                                                            onChange={() => handleToggleChange('is_jingle')}
                                                        />
                                                        <span className="toggle-slider"></span>
                                                        <span className="toggle-label">Hide Metadata from Listeners ("Jingle Mode")</span>
                                                    </label>
                                                    <p className="help-text">
                                                        Enable this setting to prevent metadata from being sent to the AutoDJ for files in this playlist. This is useful if the playlist contains jingles or bumpers.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )} */}

                                {/* Playlist Type */}
                                {/* <div className="form-row two-columns">
                                    <div className="form-group">
                                        <label>Playlist Type</label>
                                        <div className="radio-group vertical">
                                            <label className="radio-option compact">
                                                <input
                                                    type="radio"
                                                    name="type"
                                                    checked={formData.type === 'default'}
                                                    onChange={() => handleRadioChange('type', 'default')}
                                                />
                                                <span className="radio-mark"></span>
                                                <div>
                                                    <strong>General Rotation</strong>
                                                    <p>Standard playlist, shuffles with other standard playlists based on weight.</p>
                                                </div>
                                            </label>
                                            <label className="radio-option compact">
                                                <input
                                                    type="radio"
                                                    name="type"
                                                    checked={formData.type === 'once_per_x_songs'}
                                                    onChange={() => handleRadioChange('type', 'once_per_x_songs')}
                                                />
                                                <span className="radio-mark"></span>
                                                <div>
                                                    <strong>Once per x Songs</strong>
                                                    <p>Play once every 5x songs.</p>
                                                </div>
                                            </label>
                                            <label className="radio-option compact">
                                                <input
                                                    type="radio"
                                                    name="type"
                                                    checked={formData.type === 'once_per_x_minutes'}
                                                    onChange={() => handleRadioChange('type', 'once_per_x_minutes')}
                                                />
                                                <span className="radio-mark"></span>
                                                <div>
                                                    <strong>Once per x Minutes</strong>
                                                    <p>Play once every 5x minutes.</p>
                                                </div>
                                            </label>
                                            <label className="radio-option compact">
                                                <input
                                                    type="radio"
                                                    name="type"
                                                    checked={formData.type === 'once_per_hour'}
                                                    onChange={() => handleRadioChange('type', 'once_per_hour')}
                                                />
                                                <span className="radio-mark"></span>
                                                <div>
                                                    <strong>Once per Hour</strong>
                                                    <p>Play once per hour at the specified minute.</p>
                                                </div>
                                            </label>
                                            <label className="radio-option compact">
                                                <input
                                                    type="radio"
                                                    name="type"
                                                    checked={formData.type === 'advanced'}
                                                    onChange={() => handleRadioChange('type', 'advanced')}
                                                />
                                                <span className="radio-mark"></span>
                                                <div>
                                                    <strong>Advanced</strong>
                                                    <p>Manually define how this playlist is used in Liquidsoap configuration.</p>
                                                </div>
                                            </label>
                                        </div>
                                        <a href="#" className="learn-link">Learn about Advanced Playlists</a>
                                    </div>

                                    <div className="form-group">
                                        <label>Song Playback Order</label>
                                        <div className="radio-group vertical">
                                            <label className="radio-option compact">
                                                <input
                                                    type="radio"
                                                    name="order"
                                                    checked={formData.order === 'shuffle'}
                                                    onChange={() => handleRadioChange('order', 'shuffle')}
                                                />
                                                <span className="radio-mark"></span>
                                                <div>
                                                    <strong>Shuffled</strong>
                                                    <p>The full playlist is shuffled and then played through in the shuffled order.</p>
                                                </div>
                                            </label>
                                            <label className="radio-option compact">
                                                <input
                                                    type="radio"
                                                    name="order"
                                                    checked={formData.order === 'random'}
                                                    onChange={() => handleRadioChange('order', 'random')}
                                                />
                                                <span className="radio-mark"></span>
                                                <div>
                                                    <strong>Random</strong>
                                                    <p>A completely random track is picked for playback every time the queue is populated.</p>
                                                </div>
                                            </label>
                                            <label className="radio-option compact">
                                                <input
                                                    type="radio"
                                                    name="order"
                                                    checked={formData.order === 'sequential'}
                                                    onChange={() => handleRadioChange('order', 'sequential')}
                                                />
                                                <span className="radio-mark"></span>
                                                <div>
                                                    <strong>Sequential</strong>
                                                    <p>The order of the playlist is manually specified and followed by the AutoDJ.</p>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </div> */}

                                {/* General Rotation Weight */}
                                {/* {formData.type === 'default' && (
                                    <div className="section-box light">
                                        <div className="section-header-light">General Rotation</div>
                                        <div className="form-group">
                                            <label htmlFor="weight">Playlist Weight</label>
                                            <select
                                                id="weight"
                                                name="weight"
                                                value={formData.weight}
                                                onChange={handleInputChange}
                                            >
                                                {[...Array(25)].map((_, i) => (
                                                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                                                ))}
                                            </select>
                                            <p className="help-text">
                                                Playlists with larger number weights (i.e. 25) play more frequently than playlists with smaller number weights (i.e. 1).
                                            </p>
                                        </div>
                                    </div>
                                )} */}
                            </div>
                        )}

                        {activeTab === 'schedule' && (
                            <div className="tab-content">
                                <div className="placeholder-content">
                                    <Icon name="calendar" size={48} />
                                    <h3>Schedule Configuration</h3>
                                    <p>Configure when this playlist should play - Coming Soon</p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'advanced' && (
                            <div className="tab-content">
                                <div className="placeholder-content">
                                    <Icon name="settings" size={48} />
                                    <h3>Advanced Settings</h3>
                                    <p>Advanced playlist configuration options - Coming Soon</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="modal-footer">
                        <button type="button" className="btn-close-modal" onClick={onClose}>
                            CLOSE
                        </button>
                        <button type="submit" className="btn-save" disabled={isSubmitting}>
                            {isSubmitting ? 'SAVING...' : 'SAVE CHANGES'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddPlaylistModal;
