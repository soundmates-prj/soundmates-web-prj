/**
 * API Service for AzuraCast Backend Integration
 * Based on analysis of AzuraCast PHP backend
 */

// API Configuration
// In development, Vite proxy handles requests to localhost
// In production, set VITE_API_URL to the AzuraCast backend URL
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

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
        return this.request('/api/admin/stations');
    }

    async getStation(id: number): Promise<any> {
        return this.request(`/api/admin/station/${id}`);
    }

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
