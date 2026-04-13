import api from './axios';

// ============================================
// Station APIs
// ============================================

export interface Station {
  id: string;
  stationName: string;
  description: string;
  shortcode: string;
  listenUrl: string;
  publicPlayerUrl: string;
  playlistCount: number;
  isPublic: boolean;
  syncStatus: 'Synced' | 'Pending' | 'Failed';
  lastSyncedAt: string;
}

export interface SyncStationsResult {
  createdStations: number;
  updatedStations: number;
  failedStations: number;
  errors: string[];
}

export const stationService = {
  // Get all stations
  getStations: async (): Promise<Station[]> => {
    const response = await api.get('/station');
    return response.data.data;
  },

  // Sync stations from AzuraCast
  syncStations: async (): Promise<SyncStationsResult> => {
    const response = await api.post('/station/sync');
    return response.data.data;
  },

  // Get station now playing
  getStationNowPlaying: async (stationId: string) => {
    const response = await api.get(`/station/${stationId}/now-playing`);
    return response.data.data;
  },
};

// ============================================
// Music Catalog APIs
// ============================================

export interface Music {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  fileUrl: string;
  artworkUrl?: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface SyncMusicResult {
  created: number;
  updated: number;
  failed: number;
  skipped: number;
  errors: string[];
}

export const musicCatalogService = {
  // Get all music
  getAllMusic: async (): Promise<Music[]> => {
    const response = await api.get('/musiccatalog');
    return response.data.data;
  },

  // Get music by station
  getStationMusic: async (stationId: string): Promise<Music[]> => {
    const response = await api.get(`/musiccatalog/station/${stationId}`);
    return response.data.data;
  },

  // Upload music
  uploadMusic: async (
    stationId: string | undefined,
    file: File,
    metadata?: { title?: string; artist?: string; album?: string; lyrics?: string }
  ): Promise<Music> => {
    const formData = new FormData();
    formData.append('File', file);
    
    if (metadata?.title) formData.append('Title', metadata.title);
    if (metadata?.artist) formData.append('Artist', metadata.artist);
    if (metadata?.album) formData.append('Album', metadata.album);
    if (metadata?.lyrics) formData.append('Lyrics', metadata.lyrics);

    const endpoint = stationId 
      ? `/musiccatalog/station/${stationId}/upload`
      : `/musiccatalog/system/upload`;

    const response = await api.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 300000,
    });
    return response.data.data;
  },

  // Sync music from AzuraCast
  syncStationMusic: async (stationId: string): Promise<SyncMusicResult> => {
    const response = await api.post(`/musiccatalog/station/${stationId}/sync`);
    return response.data.data;
  },

  // Delete music
  deleteMusic: async (musicId: string): Promise<void> => {
    await api.delete(`/musiccatalog/${musicId}`);
  },

  // Debug stats
  getDebugStats: async () => {
    const response = await api.get('/musiccatalog/debug/stats');
    return response.data.data;
  },
};

// ============================================
// Playlist APIs
// ============================================

export interface Playlist {
  id: string;
  stationId: string;
  playlistName: string;
  description?: string;
  isAutoPlay: boolean;
  includeInRequests: boolean;
  includeInOnDemand: boolean;
  isEnabled: boolean;
  trackCount: number;
  createdAt: string;
}

export interface PlaylistTrack {
  id: string;
  playlistId: string;
  mediaFileId: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  weight: number;
  addedAt: string;
}

export interface SyncPlaylistsResult {
  created: number;
  updated: number;
  failed: number;
}

export const playlistService = {
  // Get playlists by station
  getStationPlaylists: async (stationId: string): Promise<Playlist[]> => {
    const response = await api.get(`/playlist/station/${stationId}`);
    return response.data.data;
  },

  // Create playlist
  createPlaylist: async (data: {
    stationId: string;
    playlistName: string;
    description?: string;
    isAutoPlay: boolean;
    includeInRequests: boolean;
  }): Promise<Playlist> => {
    const response = await api.post('/playlist', data);
    return response.data.data;
  },

  // Update playlist
  updatePlaylist: async (
    playlistId: string,
    data: {
      playlistName: string;
      isAutoPlay: boolean;
      includeInRequests: boolean;
      includeInOnDemand: boolean;
      isEnabled: boolean;
    }
  ): Promise<Playlist> => {
    const response = await api.put(`/playlist/${playlistId}`, data);
    return response.data.data;
  },

  // Sync playlists from AzuraCast
  syncStationPlaylists: async (stationId: string): Promise<SyncPlaylistsResult> => {
    const response = await api.post(`/playlist/station/${stationId}/sync`);
    return response.data.data;
  },

  // Get playlist tracks
  getPlaylistTracks: async (playlistId: string): Promise<PlaylistTrack[]> => {
    const response = await api.get(`/playlist/${playlistId}/tracks`);
    return response.data.data;
  },

  // Add tracks to playlist
  addTracksToPlaylist: async (
    playlistId: string,
    musicIds: string[]
  ): Promise<void> => {
    await api.post(`/playlist/${playlistId}/tracks`, { musicIds });
  },

  // Remove tracks from playlist
  removeTracksFromPlaylist: async (
    playlistId: string,
    musicIds: string[]
  ): Promise<void> => {
    await api.delete(`/playlist/${playlistId}/tracks`, { data: { musicIds } });
  },

  // Delete playlist
  deletePlaylist: async (playlistId: string): Promise<void> => {
    await api.delete(`/playlist/${playlistId}`);
  },
};

// ============================================
// User APIs
// ============================================

export interface HostUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  roleName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HostUsersResponse {
  items: HostUser[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export const userService = {
  // Get users with HOST role (Admin/Staff only)
  getHosts: async (params?: { page?: number; pageSize?: number }): Promise<HostUsersResponse> => {
    const response = await api.get('/users/hosts', {
      params: {
        page: params?.page || 1,
        pageSize: params?.pageSize || 20,
      },
    });
    return response.data.data;
  },
};

// ============================================
// Export all services
// ============================================

export default {
  station: stationService,
  musicCatalog: musicCatalogService,
  playlist: playlistService,
  user: userService,
};
