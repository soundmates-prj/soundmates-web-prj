/**
 * API Service for AzuraCast Backend Integration
 * Based on analysis of AzuraCast PHP backend
 */

// API Configuration
// In development, Vite proxy handles requests to localhost
// In production, set VITE_API_URL to the AzuraCast backend URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Types
export interface ApiError {
    message: string;
    code?: number;
    type?: string;
}

export interface SetupRegisterRequest {
    username: string;  // email
    password: string;
    csrf?: string;
}

export interface SetupRegisterResponse {
    success: boolean;
    message?: string;
    redirect?: string;
    user?: {
        id: number;
        email: string;
        name?: string;
    };
}

export interface LoginRequest {
    username: string;
    password: string;
    remember?: boolean;
}

export interface LoginResponse {
    success: boolean;
    message?: string;
    user?: {
        id: number;
        email: string;
        name?: string;
    };
    requires2FA?: boolean;
}

export interface SystemStatusResponse {
    setupComplete: boolean;
    numUsers: number;
    currentStep: 'register' | 'station' | 'settings' | 'complete';
}

// Station Profile Types (based on AzuraCast Api\StationProfile)
export interface StationProfileData {
    id: number;
    name: string;
    shortcode: string;
    short_name?: string;
    description?: string;
    url?: string;
    genre?: string;
    timezone?: string;
    is_enabled?: boolean;
    is_public?: boolean;
    enable_requests?: boolean;
    requests_enabled?: boolean;
    enable_streamers?: boolean;
    enable_public_page?: boolean;
    enable_on_demand?: boolean;
    frontend?: string;
    frontend_type?: string;
    backend?: string;
    backend_type?: string;
    listen_url?: string;
    public_player_url?: string;
    hls_enabled?: boolean;
    hls_url?: string;
    mounts?: StationMount[];
}

export interface StationMount {
    id: number;
    name: string;
    url: string;
    bitrate: number;
    format: string;
    listeners: {
        total: number;
        unique: number;
        current: number;
    };
    is_default: boolean;
}

export interface StationServiceStatus {
    backendRunning: boolean;
    frontendRunning: boolean;
}

export interface StationScheduleItem {
    id: number;
    type: string;
    name: string;
    title?: string;
    description?: string;
    start_timestamp: number;
    start: string;
    end_timestamp: number;
    end: string;
    is_now: boolean;
}

// Station Dashboard Types (based on AzuraCast Vue/StationGlobals)
export interface StationDashboardData {
    id: number;
    name: string;
    shortName: string;
    description?: string;
    isEnabled: boolean;
    hasStarted: boolean;
    needsRestart: boolean;
    timezone: string;
    offlineText?: string;
    maxBitrate: number;
    maxMounts: number;
    maxHlsStreams: number;
    enablePublicPages: boolean;
    publicPageUrl: string;
    enableOnDemand: boolean;
    onDemandUrl: string;
    enableStreamers: boolean;
    webDjUrl: string;
    publicPodcastsUrl: string;
    publicScheduleUrl: string;
    enableRequests: boolean;
    features: StationFeatures;
    backendType: string;
    frontendType: string;
    canReload: boolean;
    useManualAutoDj: boolean;
}

export interface StationFeatures {
    media: boolean;
    sftp: boolean;
    podcasts: boolean;
    streamers: boolean;
    webhooks: boolean;
    requests: boolean;
    mountPoints: boolean;
    hlsStreams: boolean;
    remoteRelays: boolean;
    customLiquidsoapConfig: boolean;
    autoDjQueue: boolean;
}

// Now Playing Types (based on AzuraCast Api\NowPlaying)
export interface NowPlayingData {
    station: StationProfileData;
    listeners: {
        total: number;
        unique: number;
        current: number;
    };
    live: {
        is_live: boolean;
        streamer_name?: string;
        broadcast_start?: number;
        art?: string;
    };
    now_playing: {
        sh_id: number;
        played_at: number;
        duration: number;
        playlist: string;
        streamer: string;
        is_request: boolean;
        song: {
            id: string;
            text: string;
            artist: string;
            title: string;
            album: string;
            genre: string;
            isrc: string;
            lyrics: string;
            art: string;
            custom_fields: Record<string, string>;
        };
        elapsed: number;
        remaining: number;
    };
    playing_next?: {
        cued_at: number;
        played_at: number;
        duration: number;
        playlist: string;
        is_request: boolean;
        song: {
            id: string;
            text: string;
            artist: string;
            title: string;
            album: string;
            art: string;
        };
    };
    song_history: Array<{
        sh_id: number;
        played_at: number;
        duration: number;
        playlist: string;
        streamer: string;
        is_request: boolean;
        song: {
            id: string;
            text: string;
            artist: string;
            title: string;
            album: string;
            art: string;
        };
    }>;
    is_online: boolean;
    cache: string;
}

// Music Files Types (based on AzuraCast Api\FileList and Api\StationMedia)
export interface FileListItem {
    path: string;
    path_short: string;
    text: string;
    type: 'file' | 'directory';
    timestamp: number;
    size: number | null;
    media: StationMediaItem | null;
    dir: FileListDir | null;
    links: Record<string, string>;
}

export interface FileListDir {
    playlists: StationMediaPlaylist[];
}

export interface StationMediaItem {
    id: number;
    unique_id: string;
    song_id: string;
    art: string;
    path: string;
    mtime: number;
    uploaded_at: number;
    art_updated_at: number;
    length: number;
    length_text: string;
    title?: string;
    artist?: string;
    album?: string;
    genre?: string;
    isrc?: string;
    lyrics?: string;
    text: string;
    custom_fields: Record<string, string>;
    extra_metadata: Record<string, string>;
    playlists: StationMediaPlaylist[];
    links: Record<string, string>;
}

export interface StationMediaPlaylist {
    id: number;
    name: string;
}

export interface FileListResponse {
    rows: FileListItem[];
    searchPhrase: string | null;
    flattened: boolean;
    total?: number;
    current?: number;
    rowCount?: number;
}

export interface StationQuota {
    used: number;
    used_bytes: string;
    used_percent: number;
    available: number;
    available_bytes: string;
    quota: number;
    quota_bytes: string;
    is_full: boolean;
    num_files: number;
}

// API Client Class
class ApiClient {
    private baseUrl: string;
    private token: string | null = null;

    public setToken(token: string | null) {
        this.token = token;
        if (token) {
            localStorage.setItem('azuracast_api_token', token);
        } else {
            localStorage.removeItem('azuracast_api_token');
        }
    }

    constructor(baseUrl: string = API_BASE_URL) {
        this.baseUrl = baseUrl;
        this.token = localStorage.getItem('azuracast_api_token');
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;

        const defaultHeaders: HeadersInit = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };

        const config: RequestInit = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {}),
                ...options.headers,
            },
            credentials: 'include', // For session cookies
        };

        try {
            const response = await fetch(url, config);

            // Handle different response types
            const contentType = response.headers.get('content-type');
            let data: T;

            if (contentType?.includes('application/json')) {
                data = await response.json();
            } else {
                // For non-JSON responses, wrap in object
                const text = await response.text();
                data = { success: response.ok, message: text } as T;
            }

            if (!response.ok) {
                throw {
                    message: (data as ApiError).message || `HTTP error ${response.status}`,
                    code: response.status,
                } as ApiError;
            }

            return data;
        } catch (error) {
            if (error instanceof TypeError) {
                // Network error
                throw {
                    message: 'Network error. Please check your connection.',
                    type: 'network',
                } as ApiError;
            }
            throw error;
        }
    }

    // Setup APIs
    async getSystemStatus(): Promise<SystemStatusResponse> {
        try {
            return await this.request<SystemStatusResponse>('/api/internal/status');
        } catch (error) {
            // If API is not available, assume first-time setup
            return {
                setupComplete: false,
                numUsers: 0,
                currentStep: 'register',
            };
        }
    }

    async checkSetupStep(): Promise<{ step: string }> {
        return this.request<{ step: string }>('/setup');
    }

    /**
     * Register the first Super Administrator account
     * This mirrors the PHP SetupController::registerAction
     * AzuraCast only supports form-based registration, not JSON API
     */
    async registerSuperAdmin(data: SetupRegisterRequest): Promise<SetupRegisterResponse> {
        return this.registerViaForm(data);
    }

    /**
     * Form-based registration (matches AzuraCast's native approach)
     * AzuraCast returns 302 redirect on successful registration
     */
    private async registerViaForm(data: SetupRegisterRequest): Promise<SetupRegisterResponse> {
        const formData = new FormData();
        formData.append('username', data.username);
        formData.append('password', data.password);
        if (data.csrf) {
            formData.append('csrf', data.csrf);
        }

        try {
            const response = await fetch(`${this.baseUrl}/setup/register`, {
                method: 'POST',
                body: formData,
                credentials: 'include',
                redirect: 'manual', // Don't auto-follow redirects
            });

            // 302 Found = Success! AzuraCast redirects to next step after successful registration
            if (response.status === 302 || response.type === 'opaqueredirect') {
                const redirectUrl = response.headers.get('Location');
                return {
                    success: true,
                    redirect: redirectUrl || '/setup/station',
                    message: 'Account created successfully!',
                };
            }

            // For fetch with redirect: 'manual', redirected responses may appear as 200
            if (response.redirected || response.ok) {
                return {
                    success: true,
                    redirect: response.url,
                };
            }

            // Handle error responses
            const contentType = response.headers.get('content-type');
            let errorMessage = 'Registration failed';

            if (contentType?.includes('text/html')) {
                // Parse error from HTML response if possible
                const html = await response.text();
                const errorMatch = html.match(/class="alert[^"]*"[^>]*>([^<]+)/);
                if (errorMatch) {
                    errorMessage = errorMatch[1].trim();
                }
            } else {
                const text = await response.text();
                if (text) errorMessage = text;
            }

            throw {
                message: errorMessage,
                code: response.status,
            } as ApiError;
        } catch (error) {
            // If it's already an ApiError, re-throw
            if ((error as ApiError).message) {
                throw error;
            }
            // Network or CORS error - but 302 might appear as TypeError in some browsers
            // Check if actually successful by attempting to fetch the next page
            try {
                const checkResponse = await fetch(`${this.baseUrl}/setup`, {
                    method: 'GET',
                    credentials: 'include',
                });
                // If we can access setup and it redirects to station, registration was successful
                if (checkResponse.url.includes('station') || checkResponse.url.includes('settings')) {
                    return {
                        success: true,
                        redirect: checkResponse.url,
                        message: 'Account created successfully!',
                    };
                }
            } catch {
                // Ignore check errors
            }

            throw {
                message: 'Unable to connect to server. Please check if AzuraCast is running.',
                type: 'network',
            } as ApiError;
        }
    }

    // Authentication APIs
    async login(data: LoginRequest): Promise<LoginResponse> {
        const formData = new FormData();
        formData.append('username', data.username);
        formData.append('password', data.password);
        if (data.remember) {
            formData.append('remember', '1');
        }

        const response = await fetch(`${this.baseUrl}/login`, {
            method: 'POST',
            body: formData,
            credentials: 'include',
        });

        if (response.redirected) {
            // Check if redirected to 2FA
            if (response.url.includes('2fa')) {
                return {
                    success: true,
                    requires2FA: true,
                };
            }
            return {
                success: true,
            };
        }

        if (!response.ok) {
            throw {
                message: 'Login failed. Please check your credentials.',
                code: response.status,
            } as ApiError;
        }

        return {
            success: true,
        };
    }

    async logout(): Promise<void> {
        await fetch(`${this.baseUrl}/logout`, {
            method: 'GET',
            credentials: 'include',
        });
    }

    // User Management APIs (Admin)
    async createUser(userData: {
        email: string;
        name?: string;
        password?: string;
        roles?: number[];
    }): Promise<{ id: number; email: string }> {
        return this.request('/api/admin/users', {
            method: 'POST',
            body: JSON.stringify({
                email: userData.email,
                name: userData.name,
                new_password: userData.password,
                roles: userData.roles || [],
            }),
        });
    }

    async getUsers(): Promise<Array<{ id: number; email: string; name?: string }>> {
        return this.request('/api/admin/users');
    }

    async getUser(id: number): Promise<{ id: number; email: string; name?: string }> {
        return this.request(`/api/admin/user/${id}`);
    }

    // Station Management APIs
    async createStation(stationData: {
        name: string;
        description?: string;
        genre?: string;
        url?: string;
        timezone?: string;
        short_name?: string; // urlStub
        api_history_items?: number; // visibleRecentSongs
        enable_public_page?: boolean;
        enable_on_demand?: boolean;
        is_enabled?: boolean; // enableBroadcasting
        enable_streamers?: boolean;
        enable_requests?: boolean;
        backend_config?: {
            enable_autodj?: boolean;
            enable_hls?: boolean;
        }
    }): Promise<{ id: number; name: string; short_name: string }> {
        // Map frontend camelCase to backend snake_case expected by AzuraCast
        // particular structure might vary by version, this is a best-effort mapping
        // based on common AzuraCast API patterns.
        return this.request('/api/admin/stations', {
            method: 'POST',
            body: JSON.stringify({
                name: stationData.name,
                description: stationData.description || '',
                genre: stationData.genre || '',
                url: stationData.url || '',
                timezone: stationData.timezone || 'UTC',
                short_name: stationData.short_name || '',
                api_history_items: stationData.api_history_items ?? 5,
                enable_public_page: stationData.enable_public_page ?? true,
                enable_on_demand: stationData.enable_on_demand ?? false,
                is_enabled: stationData.is_enabled ?? true, // Main broadcasting switch
                enable_streamers: stationData.enable_streamers ?? false,
                enable_requests: stationData.enable_requests ?? false,
                // Some settings might be nested or separate in actual AzuraCast API
                // but passing them here for completeness if the backend supports flat or specific structure
                backend_type: stationData.backend_config?.enable_autodj ? 'liquidsoap' : 'none',
                enable_hls: stationData.backend_config?.enable_hls ?? false,
            }),
        });
    }

    async getStations(): Promise<Array<{ id: number; name: string; short_name: string; is_enabled: boolean }>> {
        return this.request('/api/stations');
    }

    async getStation(id: number): Promise<any> {
        return this.request(`/api/admin/station/${id}`);
    }

    /**
     * Update an existing station
     * Based on AzuraCast's StationsController PUT /api/admin/station/{id}
     */
    async updateStation(id: number, stationData: {
        name?: string;
        description?: string;
        genre?: string;
        url?: string;
        timezone?: string;
        short_name?: string;
        api_history_items?: number;
        enable_public_page?: boolean;
        enable_on_demand?: boolean;
        is_enabled?: boolean;
        enable_streamers?: boolean;
        enable_requests?: boolean;
        backend_config?: {
            enable_autodj?: boolean;
            enable_hls?: boolean;
        }
    }): Promise<void> {
        return this.request(`/api/admin/station/${id}`, {
            method: 'PUT',
            body: JSON.stringify({
                name: stationData.name,
                description: stationData.description || '',
                genre: stationData.genre || '',
                url: stationData.url || '',
                timezone: stationData.timezone || 'UTC',
                short_name: stationData.short_name || '',
                api_history_items: stationData.api_history_items ?? 5,
                enable_public_page: stationData.enable_public_page ?? true,
                enable_on_demand: stationData.enable_on_demand ?? false,
                is_enabled: stationData.is_enabled ?? true,
                enable_streamers: stationData.enable_streamers ?? false,
                enable_requests: stationData.enable_requests ?? false,
                enable_hls: stationData.backend_config?.enable_hls ?? false,
            }),
        });
    }

    /**
     * Delete a station
     * Based on AzuraCast's StationsController DELETE /api/admin/station/{id}
     */
    async deleteStation(id: number): Promise<void> {
        return this.request(`/api/admin/station/${id}`, {
            method: 'DELETE',
        });
    }

    /**
     * Get station profile with service status
     * Based on AzuraCast's ProfileAction GET /api/station/{station_id}/profile
     */
    async getStationProfile(stationId: number): Promise<{
        station: StationProfileData;
        services: StationServiceStatus;
        schedule?: StationScheduleItem[];
    }> {
        return this.request(`/api/station/${stationId}/profile`);
    }

    /**
     * Get station dashboard data with features
     * Based on AzuraCast's GetDashboardAction GET /api/station/{station_id}/dashboard
     */
    async getStationDashboard(stationId: number): Promise<StationDashboardData> {
        return this.request(`/api/station/${stationId}/dashboard`);
    }

    /**
     * Get now playing information for a station
     * GET /api/nowplaying/{station_id} or /api/nowplaying/{shortcode}
     * Supports both numeric station ID and string shortcode
     */
    async getNowPlaying(stationIdOrShortcode: number | string): Promise<NowPlayingData> {
        return this.request(`/api/nowplaying/${stationIdOrShortcode}`);
    }

    /**
     * Get now playing for all stations
     * GET /api/nowplaying
     */
    async getAllNowPlaying(): Promise<NowPlayingData[]> {
        return this.request('/api/nowplaying');
    }

    /**
     * Toggle station feature (requests, streamers, public pages, on-demand)
     * PUT /api/station/{station_id}/profile/edit
     */
    async toggleStationFeature(stationId: number, feature: 'enable_requests' | 'enable_streamers' | 'enable_public_page' | 'enable_on_demand', enabled: boolean): Promise<void> {
        return this.request(`/api/station/${stationId}/profile/edit`, {
            method: 'PUT',
            body: JSON.stringify({
                [feature]: enabled,
            }),
        });
    }

    /**
     * Start/Stop/Restart station services
     * Based on AzuraCast backend actions
     */
    async controlStationService(stationId: number, action: 'start' | 'stop' | 'restart'): Promise<void> {
        // Different endpoints based on action
        const endpoint = action === 'restart'
            ? `/api/station/${stationId}/restart`
            : `/api/station/${stationId}/${action}`;

        return this.request(endpoint, {
            method: 'POST',
        });
    }

    /**
     * Reload station configuration (soft-reload, keeps broadcast running)
     * POST /api/station/{station_id}/reload
     */
    async reloadStationConfiguration(stationId: number): Promise<{ success: boolean; message: string }> {
        return this.request(`/api/station/${stationId}/reload`, {
            method: 'POST',
        });
    }

    /**
     * Restart all station broadcasting services
     * POST /api/station/{station_id}/restart
     */
    async restartBroadcasting(stationId: number): Promise<{ success: boolean; message: string }> {
        return this.request(`/api/station/${stationId}/restart`, {
            method: 'POST',
        });
    }

    /**
     * Control frontend service (Icecast, Shoutcast)
     * POST /api/station/{station_id}/frontend/{action}
     */
    async controlFrontend(stationId: number, action: 'start' | 'stop' | 'reload' | 'restart'): Promise<{ success: boolean; message: string }> {
        return this.request(`/api/station/${stationId}/frontend/${action}`, {
            method: 'POST',
        });
    }

    /**
     * Control backend service (Liquidsoap)
     * POST /api/station/{station_id}/backend/{action}
     */
    async controlBackend(stationId: number, action: 'start' | 'stop' | 'reload' | 'restart' | 'skip' | 'disconnect'): Promise<{ success: boolean; message: string }> {
        return this.request(`/api/station/${stationId}/backend/${action}`, {
            method: 'POST',
        });
    }

    /**
     * Get station service status
     * GET /api/station/{station_id}/status
     */
    async getStationServiceStatus(stationId: number): Promise<{ backendRunning: boolean; frontendRunning: boolean }> {
        return this.request(`/api/station/${stationId}/status`);
    }

    // ==================== Files/Media API ====================

    /**
     * Get Vue files page data (initial config)
     * GET /api/station/{station_id}/vue/files
     */
    async getVueFilesConfig(stationId: number): Promise<{
        customFields: Array<{ id: number; name: string; short_name: string }>;
        playlists: Array<{ id: number; name: string }>;
        validDirectories: string[];
    }> {
        return this.request(`/api/station/${stationId}/vue/files`);
    }

    /**
     * Get station storage quota for media
     * GET /api/station/{station_id}/quota/station_media
     */
    async getStationQuota(stationId: number): Promise<StationQuota> {
        return this.request(`/api/station/${stationId}/quota/station_media`);
    }

    /**
     * Get files list for a station with pagination
     * GET /api/station/{station_id}/files/list?internal=true&rowCount=10&current=1&currentDirectory=
     */
    async getFiles(stationId: number, options: {
        currentDirectory?: string;
        searchPhrase?: string;
        rowCount?: number;
        current?: number;
    } = {}): Promise<FileListResponse> {
        const params = new URLSearchParams();
        params.append('internal', 'true');
        params.append('rowCount', String(options.rowCount || 10));
        params.append('current', String(options.current || 1));
        params.append('currentDirectory', options.currentDirectory || '');
        if (options.searchPhrase) {
            params.append('searchPhrase', options.searchPhrase);
        }

        return this.request(`/api/station/${stationId}/files/list?${params.toString()}`);
    }

    /**
     * Create a new folder
     * POST /api/station/{station_id}/files/mkdir
     */
    async createFolder(stationId: number, path: string, name: string): Promise<void> {
        return this.request(`/api/station/${stationId}/files/mkdir`, {
            method: 'POST',
            body: JSON.stringify({
                currentDirectory: path,
                name: name,
            }),
        });
    }

    /**
     * Rename a file or folder
     * PUT /api/station/{station_id}/files/rename
     */
    async renameFile(stationId: number, from: string, to: string): Promise<void> {
        return this.request(`/api/station/${stationId}/files/rename`, {
            method: 'PUT',
            body: JSON.stringify({
                from: from,
                to: to,
            }),
        });
    }

    /**
     * Batch operations on files (move, delete, add to playlist, etc.)
     * PUT /api/station/{station_id}/files/batch
     */
    async batchFilesOperation(stationId: number, operation: 'delete' | 'move' | 'queue' | 'immediate' | 'reprocess', files: string[], options?: {
        directory?: string;
        playlists?: number[];
    }): Promise<void> {
        return this.request(`/api/station/${stationId}/files/batch`, {
            method: 'PUT',
            body: JSON.stringify({
                do: operation,
                files: files,
                ...options,
            }),
        });
    }

    /**
     * Upload a file
     * POST /api/station/{station_id}/files/upload
     */
    async uploadFile(stationId: number, file: File, path: string = '', onProgress?: (percent: number) => void): Promise<void> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('path', path);

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', `${this.baseUrl}/api/station/${stationId}/files/upload`);

            if (this.token) {
                xhr.setRequestHeader('Authorization', `Bearer ${this.token}`);
            }
            xhr.withCredentials = true;

            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable && onProgress) {
                    const percent = Math.round((e.loaded / e.total) * 100);
                    onProgress(percent);
                }
            };

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve();
                } else {
                    reject(new Error(xhr.responseText || 'Upload failed'));
                }
            };

            xhr.onerror = () => reject(new Error('Network error'));
            xhr.send(formData);
        });
    }

    /**
     * Get file/media details
     * GET /api/station/{station_id}/file/{id}
     */
    async getFileDetails(stationId: number, mediaId: number): Promise<StationMediaItem> {
        return this.request(`/api/station/${stationId}/file/${mediaId}`);
    }

    /**
     * Update file/media metadata
     * PUT /api/station/{station_id}/file/{id}
     */
    async updateFileMetadata(stationId: number, mediaId: number, data: Partial<{
        title: string;
        artist: string;
        album: string;
        genre: string;
        isrc: string;
        lyrics: string;
        playlists: number[];
    }>): Promise<StationMediaItem> {
        return this.request(`/api/station/${stationId}/file/${mediaId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    /**
     * Delete a file
     * DELETE /api/station/{station_id}/file/{id}
     */
    async deleteFile(stationId: number, mediaId: number): Promise<void> {
        return this.request(`/api/station/${stationId}/file/${mediaId}`, {
            method: 'DELETE',
        });
    }

    /**
     * Get station playlists (for file management)
     * GET /api/station/{station_id}/playlists
     */
    async getPlaylists(stationId: number): Promise<Array<{ id: number; name: string; type: string; is_enabled: boolean }>> {
        return this.request(`/api/station/${stationId}/playlists`);
    }

    /**
     * Get single playlist details
     * GET /api/station/{station_id}/playlist/{id}
     */
    async getPlaylist(stationId: number, playlistId: number): Promise<unknown> {
        return this.request(`/api/station/${stationId}/playlist/${playlistId}`);
    }

    /**
     * Toggle playlist enabled/disabled
     * PUT /api/station/{station_id}/playlist/{id}/toggle
     */
    async togglePlaylist(stationId: number, playlistId: number): Promise<void> {
        return this.request(`/api/station/${stationId}/playlist/${playlistId}/toggle`, {
            method: 'PUT',
        });
    }

    /**
     * Delete a playlist
     * DELETE /api/station/{station_id}/playlist/{id}
     */
    async deletePlaylist(stationId: number, playlistId: number): Promise<void> {
        return this.request(`/api/station/${stationId}/playlist/${playlistId}`, {
            method: 'DELETE',
        });
    }

    /**
     * Create a new playlist
     * POST /api/station/{station_id}/playlists
     */
    async createPlaylist(stationId: number, data: {
        name: string;
        type?: string;
        source?: string;
        order?: string;
        is_enabled?: boolean;
        weight?: number;
    }): Promise<unknown> {
        return this.request(`/api/station/${stationId}/playlists`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // ==================== End Files/Media API ====================

    /**
     * Alternative: Redirect to AzuraCast's native station setup
     * Use this if the JSON API fails due to session/CORS issues
     */
    redirectToNativeStationSetup(): void {
        // Redirect to AzuraCast's native station setup page
        window.location.href = '/setup/station';
    }

    /**
     * Check if we have a valid session by trying to access a protected endpoint
     */
    async checkSession(): Promise<boolean> {
        try {
            // Try to fetch current user info
            const response = await fetch(`${this.baseUrl}/api/internal/account`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                },
            });
            return response.ok;
        } catch {
            return false;
        }
    }
}

// Export singleton instance
export const api = new ApiClient();

// Export class for custom instances
export { ApiClient };
