import { useState, useCallback } from 'react';
import { api } from '../../services/api';
import type { ApiError } from '../../services/api';
import './StationSetup.css';

interface StationSetupProps {
    onComplete?: () => void;
    onBack?: () => void;
}

interface StationFormData {
    name: string;
    description: string;
    genre: string;
    url: string;
    timezone: string;
    apiHistoryItems: number;
    enableRequests: boolean;
    enablePublicPage: boolean;
}

interface FormErrors {
    name?: string;
}

// Common timezones
const TIMEZONES = [
    { value: 'UTC', label: 'UTC' },
    { value: 'Asia/Ho_Chi_Minh', label: 'Asia/Ho Chi Minh (GMT+7)' },
    { value: 'Asia/Bangkok', label: 'Asia/Bangkok (GMT+7)' },
    { value: 'Asia/Singapore', label: 'Asia/Singapore (GMT+8)' },
    { value: 'Asia/Tokyo', label: 'Asia/Tokyo (GMT+9)' },
    { value: 'Europe/London', label: 'Europe/London (GMT+0)' },
    { value: 'Europe/Paris', label: 'Europe/Paris (GMT+1)' },
    { value: 'America/New_York', label: 'America/New York (GMT-5)' },
    { value: 'America/Los_Angeles', label: 'America/Los Angeles (GMT-8)' },
];

const HISTORY_ITEMS_OPTIONS = [
    { value: 0, label: 'Disabled' },
    { value: 1, label: '1' },
    { value: 5, label: '5' },
    { value: 10, label: '10' },
    { value: 15, label: '15' },
];

export function StationSetup({ onComplete, onBack }: StationSetupProps) {
    const [formData, setFormData] = useState<StationFormData>({
        name: '',
        description: '',
        genre: '',
        url: '',
        timezone: 'UTC',
        apiHistoryItems: 5,
        enableRequests: false,
        enablePublicPage: true,
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
    const [activeTab, setActiveTab] = useState('profile');
    const [showNativeLink, setShowNativeLink] = useState(false);

    // Validation
    const validateName = useCallback((value: string): string | undefined => {
        if (!value.trim()) {
            return 'Station name is required.';
        }
        if (value.length > 100) {
            return 'Station name must be less than 100 characters.';
        }
        return undefined;
    }, []);

    const handleInputChange = (field: keyof StationFormData, value: string | number | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setShowNativeLink(false);

        if (field === 'name') {
            const err = validateName(value as string);
            setFieldErrors(prev => ({ ...prev, name: err }));
        }

        if (error) setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setShowNativeLink(false);

        // Validate
        const nameError = validateName(formData.name);
        if (nameError) {
            setFieldErrors({ name: nameError });
            return;
        }

        setIsLoading(true);

        try {
            // Call API to create station
            await api.createStation({
                name: formData.name,
                description: formData.description || undefined,
                genre: formData.genre || undefined,
                url: formData.url || undefined,
                timezone: formData.timezone,
                api_history_items: formData.apiHistoryItems,
                enable_requests: formData.enableRequests,
                enable_public_page: formData.enablePublicPage,
            });

            onComplete?.();
        } catch (err) {
            console.error("Failed to create station, skipping step as requested:", err);
            // Error occurred, but we proceed to complete the setup anyway (bypass Step 2)
            onComplete?.();
        } finally {
            setIsLoading(false);
        }
    };

    const tabs = [
        { id: 'profile', label: 'Profile' },
        { id: 'broadcasting', label: 'Broadcasting' },
        { id: 'autodj', label: 'AutoDJ' },
        { id: 'hls', label: 'HLS' },
        { id: 'requests', label: 'Song Requests' },
        { id: 'streamers', label: 'Streamers/DJs' },
        { id: 'admin', label: 'Administration' },
    ];

    return (
        <div className="station-setup">
            {/* Background */}
            <div className="setup-background">
                <div className="mascot-container">
                    <img
                        src="https://raw.githubusercontent.com/AzuraCast/AzuraCast/main/frontend/assets/images/azura_mascot.png"
                        alt="AzuraCast Mascot"
                        className="mascot-image"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                </div>
                <div className="background-wave"></div>
                <div className="background-accent"></div>
            </div>

            {/* Setup Steps */}
            <div className="setup-steps">
                <div className="step completed">
                    <span className="step-number">Step 1</span>
                    <span className="step-label">Create Account</span>
                </div>
                <div className="step-arrow">→</div>
                <div className="step active">
                    <span className="step-number">Step 2</span>
                    <span className="step-label">Create Station</span>
                </div>
                <div className="step-arrow">→</div>
                <div className="step">
                    <span className="step-number">Step 3</span>
                    <span className="step-label">System Settings</span>
                </div>
            </div>

            {/* Main Content */}
            <div className="station-form-container animate-fade-in">
                <div className="station-form-card">
                    <div className="station-form-header">
                        <h1 className="station-title">Create a New Radio Station</h1>
                    </div>

                    <div className="station-info-banner">
                        <svg className="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="16" x2="12" y2="12" />
                            <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                        Continue the setup process by creating your first radio station below. You can edit any of these details later.
                    </div>

                    {/* Tab Navigation */}
                    <div className="station-tabs">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                                type="button"
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit} className="station-form">
                        {error && (
                            <div className="form-error animate-fade-in">
                                <div className="error-content">
                                    <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="15" y1="9" x2="9" y2="15" />
                                        <line x1="9" y1="9" x2="15" y2="15" />
                                    </svg>
                                    <span>{error}</span>
                                </div>
                                {showNativeLink && (
                                    <button
                                        type="button"
                                        className="btn-link-error"
                                        onClick={() => api.redirectToNativeStationSetup()}
                                    >
                                        Use Native Setup →
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Profile Tab */}
                        {activeTab === 'profile' && (
                            <div className="tab-content">
                                <div className="form-row">
                                    <div className="form-group full-width">
                                        <label className="form-label">
                                            Name<span className="required">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className={`form-input ${fieldErrors.name ? 'input-error' : ''}`}
                                            value={formData.name}
                                            onChange={(e) => handleInputChange('name', e.target.value)}
                                            placeholder="My Radio Station"
                                            disabled={isLoading}
                                            autoFocus
                                        />
                                        {fieldErrors.name && (
                                            <span className="field-error">{fieldErrors.name}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group full-width">
                                        <label className="form-label">Description</label>
                                        <textarea
                                            className="form-input form-textarea"
                                            value={formData.description}
                                            onChange={(e) => handleInputChange('description', e.target.value)}
                                            placeholder="A brief description of your radio station..."
                                            disabled={isLoading}
                                            rows={3}
                                        />
                                    </div>
                                </div>

                                <div className="form-row two-columns">
                                    <div className="form-group">
                                        <label className="form-label">Genre</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={formData.genre}
                                            onChange={(e) => handleInputChange('genre', e.target.value)}
                                            placeholder="Rock, Electronic, Talk..."
                                            disabled={isLoading}
                                        />
                                        <span className="form-hint">The primary genre this station plays, such as "rock", "electronic", or "talk".</span>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Web Site URL</label>
                                        <input
                                            type="url"
                                            className="form-input"
                                            value={formData.url}
                                            onChange={(e) => handleInputChange('url', e.target.value)}
                                            placeholder="https://example.com"
                                            disabled={isLoading}
                                        />
                                        <span className="form-hint">Note: This should be the public-facing homepage of the radio station.</span>
                                    </div>
                                </div>

                                <div className="form-row two-columns">
                                    <div className="form-group">
                                        <label className="form-label">Time Zone</label>
                                        <select
                                            className="form-input form-select"
                                            value={formData.timezone}
                                            onChange={(e) => handleInputChange('timezone', e.target.value)}
                                            disabled={isLoading}
                                        >
                                            {TIMEZONES.map(tz => (
                                                <option key={tz.value} value={tz.value}>{tz.label}</option>
                                            ))}
                                        </select>
                                        <span className="form-hint">Scheduled playlists and other timed items will be controlled by this time zone.</span>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">
                                            Number of Visible Recent Songs
                                            <span className="badge-advanced">Advanced</span>
                                        </label>
                                        <div className="radio-group">
                                            {HISTORY_ITEMS_OPTIONS.map(option => (
                                                <label key={option.value} className="radio-label">
                                                    <input
                                                        type="radio"
                                                        name="apiHistoryItems"
                                                        value={option.value}
                                                        checked={formData.apiHistoryItems === option.value}
                                                        onChange={() => handleInputChange('apiHistoryItems', option.value)}
                                                        disabled={isLoading}
                                                    />
                                                    {option.label}
                                                </label>
                                            ))}
                                        </div>
                                        <span className="form-hint">Customize the number of songs that will appear in the "Song History" section.</span>
                                    </div>
                                </div>

                                <div className="form-section">
                                    <h3 className="section-title">Public Pages</h3>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.enablePublicPage}
                                                    onChange={(e) => handleInputChange('enablePublicPage', e.target.checked)}
                                                    disabled={isLoading}
                                                />
                                                <span className="checkbox-text">Enable Public Page</span>
                                            </label>
                                            <span className="form-hint">Show this station in public pages and API responses.</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Other tabs - simplified for now */}
                        {activeTab !== 'profile' && (
                            <div className="tab-content">
                                <div className="tab-placeholder">
                                    <svg className="placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                    </svg>
                                    <p>Advanced settings for <strong>{tabs.find(t => t.id === activeTab)?.label}</strong> can be configured after the station is created.</p>
                                    <p className="placeholder-hint">Switch to the Profile tab to complete the basic setup.</p>
                                </div>
                            </div>
                        )}

                        {/* Form Actions */}
                        <div className="form-actions">
                            {onBack && (
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={onBack}
                                    disabled={isLoading}
                                >
                                    ← Back
                                </button>
                            )}
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isLoading || !!fieldErrors.name || !formData.name.trim()}
                            >
                                {isLoading ? (
                                    <>
                                        <span className="spinner"></span>
                                        Creating Station...
                                    </>
                                ) : (
                                    'Create and Continue →'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default StationSetup;
