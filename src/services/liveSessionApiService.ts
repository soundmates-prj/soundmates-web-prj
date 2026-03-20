import api from "./axios";

/* ============================================
   Types — mirroring live-session-service models
   ============================================ */

export interface MountResult {
  externalMountId: number;
  mountName: string;
  mountPath: string;
  mountUrl: string | null;
  isDefault: boolean;
  bitrate: number | null;
  format: string | null;
  currentListeners: number | null;
}

export interface StationResult {
  id: string;
  externalStationId: number;
  stationName: string;
  stationShortcode: string | null;
  description: string | null;
  streamUrl: string;
  publicPlayerUrl: string | null;
  isEnabled: boolean;
  createdAt: string;
  lastSyncedAt: string | null;
  syncStatus: string;
  mounts: MountResult[];
}

export interface DailyListenerPointResult {
  date: string;
  listenerCount: number;
}

export interface StaffDashboardOverviewResult {
  totalStations: number;
  stationsCreatedToday: number;
  totalSessions: number;
  liveSessions: number;
  listenersToday: number;
  dailyListeners: DailyListenerPointResult[];
}

export interface SyncStationsResult {
  createdStations: number;
  updatedStations: number;
  failedStations: number;
  errors: string[];
}

export interface PlaylistResult {
  id: string;
  stationId: string;
  playlistName: string;
  description: string | null;
  isAutoPlay: boolean;
  totalTracks: number;
  totalDuration: number;
  createdAt: string;
}

export interface SyncPlaylistsResult {
  synced: number;
  created: number;
  updated: number;
  failed: number;
}

export interface PlaylistMediaResult {
  id: string;
  playlistId: string;
  mediaFileId: string;
  title: string;
  artist: string | null;
  album: string | null;
  durationSeconds: number;
  addedAt: string;
}

export interface MusicResult {
  id: string;
  stationId: string;
  title: string;
  artist: string;
  album: string | null;
  artworkUrl: string | null;
  duration: number;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
}

export interface SyncMediaFilesResult {
  synced: number;
  created: number;
  updated: number;
  failed: number;
}

export interface LiveSessionResult {
  id: string;
  userId: string;
  stationId: string;
  stationName: string | null;
  sessionName: string;
  description: string | null;
  status: string;
  startedAt: string | null;
  endedAt: string | null;
  totalListeners: number;
  peakListeners: number;
  totalDuration: number;
  createdAt: string;
  streamUrl: string | null;
  thumbnailUrl: string | null;
  genre: string | null;
  listenersCount: number;
}

export interface ListenerStatsResult {
  sessionId: string;
  currentListeners: number;
  peakListeners: number;
  totalListeners: number;
}

export interface SongRequestResult {
  id: string;
  liveSessionId: string;
  mediaFileId: string;
  requestedByUserId: string;
  status: string;
  reviewedByUserId: string | null;
  requestedAt: string;
  reviewedAt: string | null;
  message: string | null;
  rejectReason: string | null;
  songTitle: string;
  songArtist: string | null;
  songAlbum: string | null;
}

export interface PodcastResult {
  id: string;
  title: string;
  description: string | null;
  author: string | null;
  status: string;
  type: string | null;
  banner: string | null;
  createdAt: string;
  updatedAt: string | null;
  createdBy: string;
  episodeCount: number;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errorCode: string | null;
}

/* ============================================
   Service
   ============================================ */

class LiveSessionApiService {
  /* ── Stations ── */

  async getStations(): Promise<StationResult[]> {
    const res = await api.get<ApiResponse<StationResult[]>>("/station");
    return res.data.data;
  }

  async syncStations(): Promise<SyncStationsResult> {
    const res = await api.post<ApiResponse<SyncStationsResult>>("/station/sync");
    return res.data.data;
  }

  async getStationNowPlaying(stationId: string) {
    const res = await api.get<ApiResponse<any>>(`/station/${stationId}/now-playing`);
    return res.data.data;
  }

  /* ── Playlists ── */

  async getStationPlaylists(stationId: string): Promise<PlaylistResult[]> {
    const res = await api.get<ApiResponse<PlaylistResult[]>>(`/playlist/station/${stationId}`);
    return res.data.data;
  }

  async syncStationPlaylists(stationId: string): Promise<SyncPlaylistsResult> {
    const res = await api.post<ApiResponse<SyncPlaylistsResult>>(`/playlist/station/${stationId}/sync`);
    return res.data.data;
  }

  async createPlaylist(data: {
    stationId: string;
    playlistName: string;
    description?: string;
    isAutoPlay?: boolean;
  }): Promise<PlaylistResult> {
    const res = await api.post<ApiResponse<PlaylistResult>>("/playlist", data);
    return res.data.data;
  }

  async getPlaylistTracks(playlistId: string): Promise<PlaylistMediaResult[]> {
    const res = await api.get<ApiResponse<PlaylistMediaResult[]>>(`/playlist/${playlistId}/tracks`);
    return res.data.data;
  }

  async addTracksToPlaylist(playlistId: string, musicIds: string[]): Promise<PlaylistMediaResult[]> {
    const res = await api.post<ApiResponse<PlaylistMediaResult[]>>(`/playlist/${playlistId}/tracks`, { musicIds });
    return res.data.data;
  }

  async removeTracksFromPlaylist(playlistId: string, musicIds: string[]): Promise<void> {
    await api.delete(`/playlist/${playlistId}/tracks`, { data: { musicIds } });
  }

  /* ── Music Catalog ── */

  async getAllMusic(): Promise<MusicResult[]> {
    const res = await api.get<ApiResponse<MusicResult[]>>("/musiccatalog");
    return res.data.data;
  }

  async getStationMusic(stationId: string): Promise<MusicResult[]> {
    const res = await api.get<ApiResponse<MusicResult[]>>(`/musiccatalog/station/${stationId}`);
    return res.data.data;
  }

  async syncStationMusic(stationId: string): Promise<SyncMediaFilesResult> {
    const res = await api.post<ApiResponse<SyncMediaFilesResult>>(`/musiccatalog/station/${stationId}/sync`);
    return res.data.data;
  }

  async uploadMusic(stationId: string, file: File): Promise<MusicResult> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("stationId", stationId);
    const res = await api.post<ApiResponse<MusicResult>>("/musiccatalog/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data;
  }

  async deleteMusic(id: string): Promise<void> {
    await api.delete(`/musiccatalog/${id}`);
  }

  /* ── Live Sessions ── */

  async getLiveSessions(params?: {
    userId?: string;
    status?: string;
    pageNumber?: number;
    pageSize?: number;
  }): Promise<PagedResult<LiveSessionResult>> {
    const res = await api.get<ApiResponse<PagedResult<LiveSessionResult>>>("/livesession", { params });
    return res.data.data;
  }

  async getActiveSessions(): Promise<LiveSessionResult[]> {
    const res = await api.get<ApiResponse<LiveSessionResult[]>>("/livesession/active");
    return res.data.data;
  }

  async getLiveSession(id: string): Promise<LiveSessionResult> {
    const res = await api.get<ApiResponse<LiveSessionResult>>(`/livesession/${id}`);
    return res.data.data;
  }

  async createLiveSession(data: {
    stationId: string;
    hostUserId: string;
    sessionName: string;
    description?: string;
  }): Promise<LiveSessionResult> {
    const res = await api.post<ApiResponse<LiveSessionResult>>("/livesession", data);
    return res.data.data;
  }

  async startSession(id: string): Promise<LiveSessionResult> {
    const res = await api.post<ApiResponse<LiveSessionResult>>(`/livesession/${id}/start`);
    return res.data.data;
  }

  async stopSession(id: string): Promise<LiveSessionResult> {
    const res = await api.post<ApiResponse<LiveSessionResult>>(`/livesession/${id}/stop`);
    return res.data.data;
  }

  async getListenerStats(id: string): Promise<ListenerStatsResult> {
    const res = await api.get<ApiResponse<ListenerStatsResult>>(`/livesession/${id}/listeners`);
    return res.data.data;
  }

  async getStaffDashboardOverview(days = 7): Promise<StaffDashboardOverviewResult> {
    const res = await api.get<ApiResponse<StaffDashboardOverviewResult>>(`/livesession/dashboard/overview`, {
      params: { days },
    });
    return res.data.data;
  }

  /* ── Song Requests ── */

  async getSongRequests(sessionId: string, status?: string): Promise<SongRequestResult[]> {
    const res = await api.get<ApiResponse<SongRequestResult[]>>(`/livesession/${sessionId}/song-requests`, {
      params: status ? { status } : undefined,
    });
    return res.data.data;
  }

  async reviewSongRequest(
    songRequestId: string,
    data: { reviewedByUserId: string; action: "approve" | "reject"; rejectReason?: string }
  ): Promise<SongRequestResult> {
    const res = await api.post<ApiResponse<SongRequestResult>>(`/livesession/song-requests/${songRequestId}/review`, data);
    return res.data.data;
  }

  /* ── Podcasts ── */

  async getPodcasts(params?: { createdBy?: string; status?: string }): Promise<PodcastResult[]> {
    const res = await api.get<ApiResponse<PodcastResult[]>>("/podcast", { params });
    return res.data.data;
  }

  async getPodcast(id: string): Promise<PodcastResult> {
    const res = await api.get<ApiResponse<PodcastResult>>(`/podcast/${id}`);
    return res.data.data;
  }

  async createPodcast(data: {
    createdBy: string;
    title: string;
    description?: string;
    author?: string;
    type?: string;
    banner?: string;
  }): Promise<PodcastResult> {
    const res = await api.post<ApiResponse<PodcastResult>>("/podcast", data);
    return res.data.data;
  }

  async updatePodcast(
    id: string,
    data: { title?: string; description?: string; author?: string; type?: string; banner?: string; status?: string }
  ): Promise<PodcastResult> {
    const res = await api.put<ApiResponse<PodcastResult>>(`/podcast/${id}`, data);
    return res.data.data;
  }

  async deletePodcast(id: string): Promise<void> {
    await api.delete(`/podcast/${id}`);
  }
}

export const liveSessionApiService = new LiveSessionApiService();
export default liveSessionApiService;
