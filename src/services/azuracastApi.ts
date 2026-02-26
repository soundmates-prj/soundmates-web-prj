// AzuraCast Music Catalog API Service
import axios from 'axios';

// Base AzuraCast API configuration
const AZURACAST_BASE_URL = 'http://localhost:5000/api'; // Thay đổi URL theo cấu hình của bạn
const AZURACAST_TOKEN = 'f1785167c121b500:e43ea60801a9af0e111a78a8d7c76762';

// Create axios instance for AzuraCast
const azuracastApi = axios.create({
  baseURL: AZURACAST_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AZURACAST_TOKEN}`,
  },
  timeout: 30000,
});

// Request interceptor for logging
azuracastApi.interceptors.request.use(
  (config) => {
    console.log(`AzuraCast API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
azuracastApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('AzuraCast API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// TypeScript interfaces for AzuraCast API responses
export interface AzuraCastStation {
  id: number;
  name: string;
  shortcode: string;
  description: string;
  frontend: string;
  backend: string;
  listen_url: string;
  url: string;
  public_player_url: string;
  playlist_pls_url: string;
  playlist_m3u_url: string;
  is_public: boolean;
  mounts: AzuraCastMount[];
  remotes: any[];
  hls_enabled: boolean;
  hls_url: string | null;
}

export interface AzuraCastMount {
  id: number;
  name: string;
  url: string;
  bitrate: number;
  format: string;
  listeners: {
    current: number;
    unique: number;
    total: number;
  };
  path: string;
  is_default: boolean;
}

export interface AzuraCastMedia {
  id: number;
  unique_id: string;
  song_id: string;
  text: string;
  artist: string;
  title: string;
  album: string;
  genre: string;
  lyrics: string;
  art: string;
  custom_fields: Record<string, any>;
  length: number;
  length_text: string;
  path: string;
  mtime: number;
  fade_overlap: number;
  fade_in: number;
  fade_out: number;
  cue_in: number;
  cue_out: number;
  media: {
    path: string;
    size: number;
    mime_type: string;
    modified_time: number;
  };
  playlists: AzuraCastMediaPlaylist[];
}

export interface AzuraCastMediaPlaylist {
  id: number;
  name: string;
}

export interface AzuraCastPlaylist {
  id: number;
  name: string;
  description: string;
  source: string;
  order: string;
  remote_url: string | null;
  remote_type: string | null;
  include_in_automation: boolean;
  include_in_requests: boolean;
  is_enabled: boolean;
  is_jingle?: boolean;
  weight: number;
  schedule_items: AzuraCastScheduleItem[];
  num_songs: number;
}

export interface AzuraCastScheduleItem {
  id: number;
  start_time: number;
  end_time: number;
  start_date: string | null;
  end_date: string | null;
  days: number[];
}

export interface AzuraCastUploadFile {
  title?: string;
  artist?: string;
  album?: string;
  genre?: string;
  lyrics?: string;
  path: string;
}

export interface MediaFilterOptions {
  searchPhrase?: string;
  playlists?: string;
  sort?: 'song_id' | 'title' | 'artist' | 'album' | 'genre' | 'length' | 'mtime';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PlaylistFilterOptions {
  searchPhrase?: string;
  sort?: 'name' | 'type';
  sortOrder?: 'asc' | 'desc';
}

// Music Catalog API functions
export const musicCatalogApi = {
  // Station Management
  async getStations(): Promise<AzuraCastStation[]> {
    const response = await azuracastApi.get('/stations');
    return response.data;
  },

  async getStation(stationId: number): Promise<AzuraCastStation> {
    const response = await azuracastApi.get(`/station/${stationId}`);
    return response.data;
  },

  // Media/Files Management
  async getMediaFiles(stationId: number, options: MediaFilterOptions = {}): Promise<{
    data: AzuraCastMedia[],
    links: any,
    meta: any
  }> {
    const params = new URLSearchParams();
    
    if (options.searchPhrase) params.append('searchPhrase', options.searchPhrase);
    if (options.playlists) params.append('playlists', options.playlists);
    if (options.sort) params.append('sort', options.sort);
    if (options.sortOrder) params.append('sortOrder', options.sortOrder);
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());

    const response = await azuracastApi.get(`/station/${stationId}/files?${params.toString()}`);
    return response.data;
  },

  async getMediaFile(stationId: number, mediaId: number): Promise<AzuraCastMedia> {
    const response = await azuracastApi.get(`/station/${stationId}/file/${mediaId}`);
    return response.data;
  },

  async updateMediaFile(stationId: number, mediaId: number, data: Partial<AzuraCastMedia>): Promise<void> {
    await azuracastApi.put(`/station/${stationId}/file/${mediaId}`, data);
  },

  async deleteMediaFile(stationId: number, mediaId: number): Promise<void> {
    await azuracastApi.delete(`/station/${stationId}/file/${mediaId}`);
  },

  async uploadMediaFile(stationId: number, formData: FormData): Promise<AzuraCastMedia> {
    // Try the single file upload endpoint first
    try {
      const response = await azuracastApi.post(`/station/${stationId}/files/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // Increase timeout for large files
      });
      
      console.log('Upload response from /files/upload:', response.data);
      
      if (response.data) {
        return Array.isArray(response.data) ? response.data[0] : response.data;
      }
    } catch (error) {
      console.warn('Upload endpoint failed, trying bulk endpoint:', error);
    }
    
    // Fallback to bulk files endpoint
    const response = await azuracastApi.post(`/station/${stationId}/files`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // Increase timeout for large files
    });
    
    console.log('Upload response from /files:', response.data);
    
    // AzuraCast returns an array of uploaded files, take the first one
    if (Array.isArray(response.data) && response.data.length > 0) {
      console.log('Returning first item from array:', response.data[0]);
      return response.data[0];
    } else if (response.data && !Array.isArray(response.data)) {
      console.log('Returning single response object:', response.data);
      return response.data;
    } else {
      console.error('Invalid upload response format:', response.data);
      // If response doesn't contain media data, create a basic structure
      if (response.data && response.data.success) {
        // Some APIs return just success message, create basic media object
        return {
            id: undefined, // Will be handled by musicCatalogService
            title: 'Uploaded Track',
            artist: 'Unknown Artist',
            album: 'Unknown Album',
            length_text: '0:00',
            genre: 'Unknown',
            unique_id: `temp_${Date.now()}`,
            song_id: `temp_${Date.now()}`,
            text: 'Uploaded Track',
            lyrics: '',
            length: 0,
            path: '/uploaded',
            custom_fields: [],
            media: {
                modified_time: Math.floor(Date.now() / 1000)
            }
        } as unknown as AzuraCastMedia;
      }
      throw new Error('No file uploaded or invalid response format');
    }
  },

  async batchDeleteMedia(stationId: number, mediaIds: number[]): Promise<void> {
    await azuracastApi.delete(`/station/${stationId}/files`, {
      data: { files: mediaIds }
    });
  },

  // Playlist Management
  async getPlaylists(stationId: number, options: PlaylistFilterOptions = {}): Promise<AzuraCastPlaylist[]> {
    const params = new URLSearchParams();
    
    if (options.searchPhrase) params.append('searchPhrase', options.searchPhrase);
    if (options.sort) params.append('sort', options.sort);
    if (options.sortOrder) params.append('sortOrder', options.sortOrder);

    const response = await azuracastApi.get(`/station/${stationId}/playlists?${params.toString()}`);
    return response.data;
  },

  async getPlaylist(stationId: number, playlistId: number): Promise<AzuraCastPlaylist> {
    const response = await azuracastApi.get(`/station/${stationId}/playlist/${playlistId}`);
    return response.data;
  },

  async createPlaylist(stationId: number, data: Partial<AzuraCastPlaylist>): Promise<AzuraCastPlaylist> {
    const response = await azuracastApi.post(`/station/${stationId}/playlists`, data);
    return response.data;
  },

  async updatePlaylist(stationId: number, playlistId: number, data: Partial<AzuraCastPlaylist>): Promise<void> {
    await azuracastApi.put(`/station/${stationId}/playlist/${playlistId}`, data);
  },

  async deletePlaylist(stationId: number, playlistId: number): Promise<void> {
    await azuracastApi.delete(`/station/${stationId}/playlist/${playlistId}`);
  },

  // Playlist Media Management
  async getPlaylistMedia(stationId: number, playlistId: number): Promise<AzuraCastMedia[]> {
    const response = await azuracastApi.get(`/station/${stationId}/playlist/${playlistId}/files`);
    return response.data;
  },

  async addMediaToPlaylist(stationId: number, playlistId: number, mediaIds: number[]): Promise<void> {
    await azuracastApi.put(`/station/${stationId}/playlist/${playlistId}/files`, {
      files: mediaIds.map(id => ({ media_id: id }))
    });
  },

  async removeMediaFromPlaylist(stationId: number, playlistId: number, mediaIds: number[]): Promise<void> {
    await azuracastApi.delete(`/station/${stationId}/playlist/${playlistId}/files`, {
      data: { files: mediaIds.map(id => ({ media_id: id })) }
    });
  },

  // Statistics and Reports
  async getMediaStatistics(stationId: number): Promise<{
    total_files: number;
    total_size: string;
    total_length: string;
    by_genre: Record<string, number>;
    by_artist: Record<string, number>;
  }> {
    const response = await azuracastApi.get(`/station/${stationId}/files/stats`);
    return response.data;
  },

  // Now Playing
  async getNowPlaying(stationId: number): Promise<{
    station: AzuraCastStation;
    now_playing: any;
    song_history: any[];
    playing_next: any;
  }> {
    const response = await azuracastApi.get(`/nowplaying/${stationId}`);
    return response.data;
  },

  // Search and Filter utilities
  async searchMedia(stationId: number, query: string, limit = 50): Promise<AzuraCastMedia[]> {
    const response = await this.getMediaFiles(stationId, {
      searchPhrase: query,
      limit,
      sort: 'title',
      sortOrder: 'asc'
    });
    return response.data;
  },

  async getMediaByGenre(stationId: number, genre: string, limit = 50): Promise<AzuraCastMedia[]> {
    const response = await this.getMediaFiles(stationId, {
      searchPhrase: `genre:${genre}`,
      limit,
      sort: 'title',
      sortOrder: 'asc'
    });
    return response.data;
  },

  async getMediaByArtist(stationId: number, artist: string, limit = 50): Promise<AzuraCastMedia[]> {
    const response = await this.getMediaFiles(stationId, {
      searchPhrase: `artist:${artist}`,
      limit,
      sort: 'title',
      sortOrder: 'asc'
    });
    return response.data;
  },

  // Bulk operations
  async bulkUpdateMedia(stationId: number, updates: Array<{
    id: number;
    data: Partial<AzuraCastMedia>;
  }>): Promise<void> {
    // Process updates sequentially to avoid overwhelming the server
    for (const update of updates) {
      await this.updateMediaFile(stationId, update.id, update.data);
    }
  },

  // File management
  async renameMediaFile(stationId: number, mediaId: number, newPath: string): Promise<void> {
    await azuracastApi.post(`/station/${stationId}/file/${mediaId}/rename`, {
      path: newPath
    });
  },

  // Custom helper functions for common operations
  async getPopularTracks(stationId: number, limit = 20): Promise<AzuraCastMedia[]> {
    const response = await this.getMediaFiles(stationId, {
      limit,
      sort: 'song_id',
      sortOrder: 'desc'
    });
    return response.data;
  },

  async getRecentlyAdded(stationId: number, limit = 20): Promise<AzuraCastMedia[]> {
    const response = await this.getMediaFiles(stationId, {
      limit,
      sort: 'mtime',
      sortOrder: 'desc'
    });
    return response.data;
  },
};

// Export default instance
export default musicCatalogApi;