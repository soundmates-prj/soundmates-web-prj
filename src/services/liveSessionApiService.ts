import api from "./axios";

/* ============================================
   Types — mirroring live-session-service models
   ============================================ */

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

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

export interface DailyHostStatResult {
  date: string;
  sessionsCount: number;
  listenersCount: number;
}

export interface LiveSessionChatResult {
  id: string;
  liveSessionId: string;
  userId?: string;
  userName: string;
  message: string;
  avatarUrl?: string;
  isSystem: boolean;
  isDeleted: boolean;
  createdAt: string;
}

export interface EndedSessionAnalysisResult {
  sessionId: string;
  sessionName: string;
  endedAt: string | null;
  totalDurationMinutes: number;
  totalListeners: number;
  musicRequestsCount: number;
}

export interface HostDashboardOverviewResult {
  totalSessions: number;
  totalListeners: number;
  pendingMusicRequests: number;
  chartData: DailyHostStatResult[];
  upcomingSchedules: SessionScheduleResult[];
  endedSessionsAnalysis: EndedSessionAnalysisResult[];
  recentMusicRequests: SongRequestResult[];
}

export interface DailyHostAnalyticsResult {
  date: string;
  listenersCount: number;
  requestsCount: number;
  chatCount: number;
}

export interface TopSongRequestResult {
  rank: number;
  title: string;
  artist?: string;
  count: number;
}

export interface HostAnalyticsOverviewResult {
  totalListeners: number;
  totalSessions: number;
  peakListeners: number;
  totalMusicRequests: number;
  chartData: DailyHostAnalyticsResult[];
  topRequestedSongs: TopSongRequestResult[];
  endedSessionsAnalysis: EndedSessionAnalysisResult[];
}

export interface DailyContentGrowthResult {
  date: string;
  newMusicCount: number;
}

export interface DailyModerationResult {
  date: string;
  pendingCount: number;
  resolvedCount: number;
}

export interface PendingRequestResult {
  requestId: string;
  title: string;
  type: string;
  requestedBy: string;
  requestedAt: string;
}

export interface StaffAnalyticsOverview {
  totalSystemMusic: number;
  totalStorageBytes: number;
  totalStations: number;
  pendingSongRequests: number;
  contentGrowthChart: { date: string; dateFormatted: string; count: number }[];
  moderationChart: { date: string; dateFormatted: string; pendingCount: number; resolvedCount: number }[];
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
  includeInRequests?: boolean;
  includeInOnDemand?: boolean;
  isEnabled?: boolean;
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
  sourceType: "system" | "station";
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
  lyrics?: string;
  /** AzuraCast unique_id — only set for station-sourced media. */
  azuraCastMediaId?: string | null;
}

export interface SyncMediaFilesResult {
  created: number;
  updated: number;
  failed: number;
  skipped: number;
  errors: string[];
}

export interface ImportedSystemMediaItemResult {
  mediaFileId: string;
  title: string;
  stationMediaUniqueId: string; // AzuraCast unique_id sau khi import
}

export interface ImportSystemMediaBatchResult {
  stationId: string;
  stationName: string;
  requestedCount: number;
  importedCount: number;
  skippedCount: number;
  failedCount: number;
  importedItems: ImportedSystemMediaItemResult[];
  errors: string[];
}

export interface StationNowPlayingResult {
  externalStationId: number;
  stationName: string;
  stationShortcode: string | null;
  listenUrl: string | null;
  publicPlayerUrl: string | null;
  currentTrack: any;
  playingNext: any;
  upcomingQueue: any[];
  songHistory: any[];
  totalListeners: number;
  uniqueListeners: number;
}

export interface NowPlayingTrackResult {
  shId: number;
  text?: string;
  title?: string;
  artist?: string;
  album?: string;
  genre?: string;
  artUrl?: string;
  lyrics?: string;
  playedAt: number;
  duration?: number;
  elapsed: number;
  remaining: number;
  isRequest: boolean;
}

export interface LiveSessionResult {
  id: string;
  userId: string;
  stationId: string | null;
  stationName: string | null;
  sessionName: string;
  description: string | null;
  status: string;
  scheduledStartAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  totalListeners: number;
  peakListeners: number;
  totalDuration: number;
  createdAt: string;
  streamUrl: string | null;
  stationShortcode: string | null;
  publicPlayerUrl: string | null;
  thumbnailUrl: string | null;
  genre: string | null;
  listenersCount?: number;
  nowPlaying?: any;
}

export interface LiveSessionQueueResult {
  sessionId: string;
  externalStationId: number;
  queue: NowPlayingTrackResult[];
}

export interface ListenerStatsResult {
  sessionId: string;
  currentListeners: number;
  peakListeners: number;
  totalListeners: number;
}

export interface SessionScheduleResult {
  id: string;
  liveSessionId: string;
  title: string | null;
  startTime: string; // TimeOnly "HH:mm:ss"
  endTime: string; // TimeOnly "HH:mm:ss"
  status: string | null;
  isRecurring: boolean;
  daysOfWeek: number; // DaysOfWeek flags enum
  startDate: string; // DateOnly "yyyy-MM-dd"
  endDate: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  // Nested live session + station data
  liveSession: LiveSessionScheduleData | null;
}

export interface LiveSessionScheduleData {
  id: string;
  sessionName: string;
  description: string | null;
  status: string;
  hostUserId: string;
  startedAt: string | null;
  endedAt: string | null;
  genre: string | null;
  thumbnailUrl: string | null;
  station: StationScheduleData | null;
}

export interface StationScheduleData {
  id: string;
  externalStationId: number;
  stationName: string;
  stationShortcode: string | null;
  description: string | null;
  streamUrl: string | null;
  publicPlayerUrl: string | null;
}

export interface AzuraCastHealthResult {
  isHealthy: boolean;
  baseUrl: string;
  stationCount: number;
  responseTimeMs: number;
  message: string;
  timestamp: string;
}

export interface ApiKeyTestResult {
  isValid: boolean;
  apiKey: string;
  baseUrl: string;
  stationCount: number;
  message: string;
  timestamp: string;
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

export interface EpisodeResult {
  id: string;
  title: string;
  description: string | null;
  audioUrl: string | null;
  thumbnailUrl: string | null;
  episodeNumber: number;
  publishDate: string | null;
  duration: number;
}

export interface PodcastRequestResult {
  id: string;
  liveSessionId: string;
  requestedByUserId: string;
  title: string;
  description: string | null;
  scriptText: string;
  audioUrl: string;
  durationSeconds: number;
  voiceCode: string;
  voiceDisplayName: string | null;
  azuraCastMediaId: string | null;
  status: string;
  reviewedByUserId: string | null;
  reviewedAt: string | null;
  rejectReason: string | null;
  requestedAt: string;
  sessionName: string | null;
  requestedByUsername?: string;
  reviewedByUsername?: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface BulkUploadFailedItem {
  fileName: string;
  errorMessage: string;
  fileIndex: number;
}

export interface BulkUploadMusicResult {
  totalFiles: number;
  successCount: number;
  failedCount: number;
  isSuccess: boolean;
  message: string;
  uploadedFiles: MusicResult[];
  failedFiles: BulkUploadFailedItem[];
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
    const res =
      await api.post<ApiResponse<SyncStationsResult>>("/station/sync");
    return res.data.data;
  }

  async createStation(data: {
    stationName: string;
    description?: string;
    shortCode?: string;
  }): Promise<StationResult> {
    const res = await api.post<ApiResponse<StationResult>>("/station", data);
    return res.data.data;
  }

  async getStationNowPlaying(stationId: string) {
    const res = await api.get<ApiResponse<any>>(
      `/station/${stationId}/now-playing`,
    );
    return res.data.data;
  }

  /* ── Playlists ── */

  async getStationPlaylists(stationId: string): Promise<PlaylistResult[]> {
    const res = await api.get<ApiResponse<PlaylistResult[]>>(
      `/playlist/station/${stationId}`,
    );
    return res.data.data;
  }

  async syncStationPlaylists(stationId: string): Promise<SyncPlaylistsResult> {
    const res = await api.post<ApiResponse<SyncPlaylistsResult>>(
      `/playlist/station/${stationId}/sync`,
    );
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

  async updatePlaylist(
    playlistId: string,
    data: {
      playlistName?: string;
      isAutoPlay?: boolean;
      includeInRequests?: boolean;
      includeInOnDemand?: boolean;
      isEnabled?: boolean;
    },
  ): Promise<PlaylistResult> {
    const res = await api.put<ApiResponse<PlaylistResult>>(
      `/playlist/${playlistId}`,
      data,
    );
    return res.data.data;
  }

  async deletePlaylist(playlistId: string): Promise<void> {
    await api.delete(`/playlist/${playlistId}`);
  }

  async getPlaylistTracks(playlistId: string): Promise<PlaylistMediaResult[]> {
    const res = await api.get<ApiResponse<PlaylistMediaResult[]>>(
      `/playlist/${playlistId}/tracks`,
    );
    return res.data.data;
  }

  async addTracksToPlaylist(
    playlistId: string,
    musicIds: string[],
  ): Promise<PlaylistMediaResult[]> {
    const res = await api.post<ApiResponse<PlaylistMediaResult[]>>(
      `/playlist/${playlistId}/tracks`,
      { musicIds },
    );
    return res.data.data;
  }

  async removeTracksFromPlaylist(
    playlistId: string,
    musicIds: string[],
  ): Promise<void> {
    await api.delete(`/playlist/${playlistId}/tracks`, { data: { musicIds } });
  }

  /* ── Music Catalog ── */

  async getAllMusic(): Promise<MusicResult[]> {
    const res = await api.get<ApiResponse<MusicResult[]>>("/musiccatalog");
    return res.data.data;
  }

  async getStationMusic(stationId: string): Promise<MusicResult[]> {
    const res = await api.get<ApiResponse<MusicResult[]>>(
      `/musiccatalog/station/${stationId}`,
    );
    return res.data.data;
  }

  async syncStationMusic(stationId: string): Promise<SyncMediaFilesResult> {
    const res = await api.post<ApiResponse<SyncMediaFilesResult>>(
      `/musiccatalog/station/${stationId}/sync`,
    );
    return res.data.data;
  }

  async importSystemMediaBatch(
    stationId: string,
    mediaFileIds: string[],
  ): Promise<ImportSystemMediaBatchResult> {
    const res = await api.post<ApiResponse<ImportSystemMediaBatchResult>>(
      `/musiccatalog/station/${stationId}/import-system-media`,
      { mediaFileIds },
    );
    return res.data.data;
  }

  async updateStationMusicMetadata(
    stationId: string,
    musicId: string,
    data: {
      title?: string | null;
      artist?: string | null;
      album?: string | null;
      lyrics?: string | null;
    },
  ): Promise<MusicResult> {
    const res = await api.put<ApiResponse<MusicResult>>(
      `/musiccatalog/station/${stationId}/media/${musicId}/metadata`,
      data,
    );
    return res.data.data;
  }

  async uploadMusic(
    stationId: string | undefined,
    file: File,
    metadata?: {
      title?: string;
      artist?: string;
      album?: string;
      lyrics?: string;
    },
    onUploadProgress?: (percent: number) => void,
  ): Promise<MusicResult> {
    const formData = new FormData();
    formData.append("File", file);
    if (metadata?.title) formData.append("Title", metadata.title);
    if (metadata?.artist) formData.append("Artist", metadata.artist);
    if (metadata?.album) formData.append("Album", metadata.album);
    if (metadata?.lyrics) formData.append("Lyrics", metadata.lyrics);

    const endpoint = stationId
      ? `/musiccatalog/station/${stationId}/upload`
      : `/musiccatalog/system/upload`;

    const res = await api.post<ApiResponse<MusicResult>>(endpoint, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 300_000,
      onUploadProgress: (evt) => {
        if (!onUploadProgress || !evt.total) {
          return;
        }
        const percent = Math.round((evt.loaded * 100) / evt.total);
        onUploadProgress(percent);
      },
    });
    return res.data.data;
  }

  /* ── Bulk Upload ── */

  async bulkUploadMusic(
    stationId: string | undefined,
    files: File[],
    onFileProgress?: (fileName: string, progress: number) => void,
  ): Promise<BulkUploadMusicResult> {
    if (files.length === 1) {
      const [singleFile] = files;
      const uploaded = await this.uploadMusic(
        stationId,
        singleFile,
        undefined,
        (percent) => onFileProgress?.(singleFile.name, percent),
      );

      onFileProgress?.(singleFile.name, 100);

      return {
        totalFiles: 1,
        successCount: 1,
        failedCount: 0,
        isSuccess: true,
        message: "Successfully uploaded 1 file(s).",
        uploadedFiles: [uploaded],
        failedFiles: [],
      };
    }

    const formData = new FormData();
    for (const file of files) {
      formData.append("Files", file);
    }

    const endpoint = stationId
      ? `/musiccatalog/station/${stationId}/bulk`
      : `/musiccatalog/system/bulk`;

    // Simulate per-file progress by polling a mock progress
    // (Real per-file progress requires custom axios interceptors)
    const progressInterval = setInterval(() => {
      if (onFileProgress) {
        const fakeProgress = Math.floor(Math.random() * 40) + 60;
        for (const file of files) {
          onFileProgress(file.name, fakeProgress);
        }
      }
    }, 500);

    try {
      const res = await api.post<ApiResponse<BulkUploadMusicResult>>(
        endpoint,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 600_000, // 10 minutes for large uploads
        },
      );
      return res.data.data;
    } finally {
      clearInterval(progressInterval);
    }
  }

  async deleteMusic(id: string): Promise<void> {
    await api.delete(`/musiccatalog/${id}`);
  }

  /* ── Live Sessions ── */

  async getStaffAnalyticsOverview(days: number = 7): Promise<ApiResponse<StaffAnalyticsOverview>> {
    const res = await api.get<ApiResponse<StaffAnalyticsOverview>>('/livesession/analytics/staff', {
      params: { days }
    });
    return res.data;
  }

  // GET /api/v1/livesession/dashboard/overview
  async getStaffDashboardOverview(days: number = 7): Promise<StaffDashboardOverviewResult> {
    const res = await api.get<ApiResponse<StaffDashboardOverviewResult>>('/livesession/dashboard/overview', {
      params: { days }
    });
    return res.data.data as StaffDashboardOverviewResult;
  }

  // GET /api/v1/livesession/analytics/staff

  // GET /api/v1/livesession/song-requests/all
  async getAllSongRequests(status?: string, page: number = 1, pageSize: number = 10): Promise<ApiResponse<PageResponse<SongRequestResult>>> {
    const res = await api.get<ApiResponse<PageResponse<SongRequestResult>>>('/livesession/song-requests/all', {
      params: { status, page, pageSize }
    });
    return res.data;
  }


  async getLiveSessions(params?: {
    userId?: string;
    status?: string;
    pageNumber?: number;
    pageSize?: number;
  }): Promise<PagedResult<LiveSessionResult>> {
    const res = await api.get<ApiResponse<PagedResult<LiveSessionResult>>>(
      "/livesession",
      { params },
    );
    return res.data.data;
  }

  async getActiveSessions(): Promise<LiveSessionResult[]> {
    const res = await api.get<ApiResponse<LiveSessionResult[]>>(
      "/livesession/active",
    );
    return res.data.data;
  }

  async getLiveSession(id: string): Promise<LiveSessionResult> {
    const res = await api.get<ApiResponse<LiveSessionResult>>(
      `/livesession/${id}`,
    );
    return res.data.data;
  }

  async createLiveSession(data: {
    stationId: string;
    hostUserId: string;
    sessionName: string;
    description?: string;
  }): Promise<LiveSessionResult> {
    const res = await api.post<ApiResponse<LiveSessionResult>>(
      "/livesession",
      data,
    );
    return res.data.data;
  }

  async startSession(id: string): Promise<LiveSessionResult> {
    const res = await api.post<ApiResponse<LiveSessionResult>>(
      `/livesession/${id}/start`,
    );
    return res.data.data;
  }

  async pauseSession(id: string): Promise<LiveSessionResult> {
    const res = await api.post<ApiResponse<LiveSessionResult>>(
      `/livesession/${id}/pause`,
    );
    return res.data.data;
  }

  async resumeSession(id: string): Promise<LiveSessionResult> {
    const res = await api.post<ApiResponse<LiveSessionResult>>(
      `/livesession/${id}/resume`,
    );
    return res.data.data;
  }

  async stopSession(id: string): Promise<LiveSessionResult> {
    const res = await api.post<ApiResponse<LiveSessionResult>>(
      `/livesession/${id}/stop`,
    );
    return res.data.data;
  }

  async getListenerStats(id: string): Promise<ListenerStatsResult> {
    const res = await api.get<ApiResponse<ListenerStatsResult>>(
      `/livesession/${id}/listeners`,
    );
    return res.data.data;
  }

  async getNowPlaying(
    sessionId: string,
  ): Promise<StationNowPlayingResult | null> {
    const res = await api.get<ApiResponse<StationNowPlayingResult>>(
      `/livesession/${sessionId}/now-playing`,
    );
    return res.data.data;
  }

  async getQueue(sessionId: string): Promise<LiveSessionQueueResult | null> {
    const res = await api.get<ApiResponse<LiveSessionQueueResult>>(
      `/livesession/${sessionId}/queue`,
    );
    return res.data.data;
  }

  async skipTrack(id: string): Promise<void> {
    await api.post(`/livesession/${id}/skip`);
  }

  async getSessionChats(sessionId: string): Promise<LiveSessionChatResult[]> {
    const res = await api.get<ApiResponse<LiveSessionChatResult[]>>(`/livesession/${sessionId}/chats`);
    return res.data.data;
  }

  async createSchedule(
    id: string,
    data: {
      startDate: string; // "yyyy-MM-dd"
      endDate?: string; // "yyyy-MM-dd"
      startTime: string; // "HH:mm:ss"
      endTime: string; // "HH:mm:ss"
      title?: string;
      isRecurring?: boolean;
      daysOfWeek?: number; // DaysOfWeek flags
    },
  ): Promise<SessionScheduleResult> {
    // POST /api/v1/schedule/live-session/{liveSessionId}
    const res = await api.post<ApiResponse<SessionScheduleResult>>(
      `/schedule/live-session/${id}`,
      data,
    );
    return res.data.data;
  }

  async getAllSessionSchedules(): Promise<SessionScheduleResult[]> {
    const res = await api.get<ApiResponse<SessionScheduleResult[]>>("/schedule");
    return res.data.data;
  }

  async getSchedules(liveSessionId?: string): Promise<SessionScheduleResult[]> {
    // GET /api/v1/schedule — Get all session schedules
    const res = await api.get<ApiResponse<SessionScheduleResult[]>>(
      `/schedule`,
      {
        params: liveSessionId ? { liveSessionId } : undefined,
      },
    );
    return res.data.data;
  }

  async getScheduleById(scheduleId: string): Promise<SessionScheduleResult> {
    const res = await api.get<ApiResponse<SessionScheduleResult>>(
      `/schedule/${scheduleId}`,
    );
    return res.data.data;
  }

  async updateSchedule(
    scheduleId: string,
    data: {
      startDate: string;
      endDate?: string;
      startTime: string;
      endTime: string;
      title?: string;
      isRecurring?: boolean;
      daysOfWeek?: number;
    },
  ): Promise<SessionScheduleResult> {
    // PUT /api/v1/schedule/{scheduleId}
    const res = await api.put<ApiResponse<SessionScheduleResult>>(
      `/schedule/${scheduleId}`,
      data,
    );
    return res.data.data;
  }

  async deleteSchedule(scheduleId: string): Promise<void> {
    // DELETE /api/v1/schedule/{scheduleId}
    await api.delete(`/schedule/${scheduleId}`);
  }

  async getHostDashboardOverview(
    days = 7,
  ): Promise<HostDashboardOverviewResult> {
    try {
      const response = await api.get<{ data: HostDashboardOverviewResult }>(`/livesession/dashboard/host?days=${days}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching host dashboard overview:', error);
      throw error;
    }
  }

  async getHostAnalyticsOverview(
    days = 7,
  ): Promise<HostAnalyticsOverviewResult> {
    try {
      const response = await api.get<{ data: HostAnalyticsOverviewResult }>(`/livesession/analytics/host?days=${days}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching host analytics overview:', error);
      throw error;
    }
  }

  /* ── Song Requests ── */

  async getSongRequests(
    sessionId?: string,
    status?: string,
  ): Promise<SongRequestResult[]> {
    // If no sessionId, fetch ALL requests (for Staff dashboard)
    const url = sessionId
      ? `/livesession/${sessionId}/song-requests`
      : `/livesession/song-requests`;
    const res = await api.get<ApiResponse<SongRequestResult[]>>(url, {
      params: status ? { status } : undefined,
    });
    return res.data.data;
  }

  async createSongRequest(
    sessionId: string,
    data: { mediaFileId: string; message?: string },
  ): Promise<SongRequestResult> {
    const res = await api.post<ApiResponse<SongRequestResult>>(
      `/livesession/${sessionId}/song-requests`,
      data,
    );
    return res.data.data;
  }

  async getMySongRequestLimits(): Promise<{ limit: number; usedToday: number; remaining: number }> {
    const res = await api.get<ApiResponse<{ limit: number; usedToday: number; remaining: number }>>(
      "/livesession/song-requests/my-limits"
    );
    return res.data.data;
  }


  async reviewSongRequest(
    songRequestId: string,
    data: {
      action: "approve" | "reject";
      rejectReason?: string;
    },
  ): Promise<SongRequestResult> {
    const res = await api.post<ApiResponse<SongRequestResult>>(
      `/livesession/song-requests/${songRequestId}/review`,
      data,
    );
    return res.data.data;
  }

  /* ── Station / LiveSession Controls ── */

  async restartStation(id: string): Promise<boolean> {
    const res = await api.post<ApiResponse<boolean>>(`/station/${id}/restart`);
    return res.data.data;
  }

  async reloadStation(id: string): Promise<boolean> {
    const res = await api.post<ApiResponse<boolean>>(`/station/${id}/reload`);
    return res.data.data;
  }

  async restartLiveSession(id: string): Promise<boolean> {
    const res = await api.post<ApiResponse<boolean>>(`/livesession/${id}/restart`);
    return res.data.data;
  }

  async reloadLiveSession(id: string): Promise<boolean> {
    const res = await api.post<ApiResponse<boolean>>(`/livesession/${id}/reload`);
    return res.data.data;
  }

  /* ── Podcasts ── */

  async getPodcasts(params?: {
    createdBy?: string;
    status?: string;
  }): Promise<PodcastResult[]> {
    const res = await api.get<ApiResponse<PodcastResult[]>>("/podcast", {
      params,
    });
    return res.data.data;
  }

  async getPodcast(id: string): Promise<PodcastResult> {
    const res = await api.get<ApiResponse<PodcastResult>>(`/podcast/${id}`);
    return res.data.data;
  }

  async createPodcast(data: {
    title: string;
    description?: string;
    author?: string;
    type?: string;
    banner?: string;
    status?: string;
  }): Promise<PodcastResult> {
    const res = await api.post<ApiResponse<PodcastResult>>("/podcast", data);
    return res.data.data;
  }

  async updatePodcast(
    id: string,
    data: {
      title?: string;
      description?: string;
      author?: string;
      type?: string;
      banner?: string;
      status?: string;
    },
  ): Promise<PodcastResult> {
    const res = await api.put<ApiResponse<PodcastResult>>(
      `/podcast/${id}`,
      data,
    );
    return res.data.data;
  }

  async deletePodcast(id: string): Promise<void> {
    await api.delete(`/podcast/${id}`);
  }

  /* ── Episodes ── */

  async getEpisodes(podcastId: string): Promise<EpisodeResult[]> {
    const res = await api.get<ApiResponse<EpisodeResult[]>>(
      `/podcast/${podcastId}/episodes`,
    );
    return res.data.data ?? [];
  }

  async createEpisode(
    podcastId: string,
    data: FormData,
  ): Promise<EpisodeResult> {
    const res = await api.post<ApiResponse<EpisodeResult>>(
      `/podcast/${podcastId}/episodes`,
      data,
      { headers: { "Content-Type": "multipart/form-data" }, timeout: 300_000 },
    );
    return res.data.data;
  }

  async deleteEpisode(podcastId: string, episodeId: string): Promise<void> {
    await api.delete(`/podcast/${podcastId}/episodes/${episodeId}`);
  }

  async updateEpisode(
    podcastId: string,
    episodeId: string,
    data: FormData,
  ): Promise<EpisodeResult> {
    const res = await api.put<ApiResponse<EpisodeResult>>(
      `/podcast/${podcastId}/episodes/${episodeId}`,
      data,
      { headers: { "Content-Type": "multipart/form-data" }, timeout: 300_000 },
    );
    return res.data.data;
  }

  /* ── Podcast Requests ── */

  async getPodcastRequests(params?: {
    sessionId?: string;
    status?: string;
    search?: string;
  }): Promise<PodcastRequestResult[]> {
    const res = await api.get<ApiResponse<PodcastRequestResult[]>>(
      "/podcast-requests",
      { params },
    );
    return res.data.data;
  }

  async getMyPodcastRequests(params?: {
    sessionId?: string;
    status?: string;
  }): Promise<PodcastRequestResult[]> {
    const res = await api.get<ApiResponse<PodcastRequestResult[]>>(
      "/podcast-requests/my",
      { params },
    );
    return res.data.data;
  }

  async getPodcastRequest(id: string): Promise<PodcastRequestResult> {
    const res = await api.get<ApiResponse<PodcastRequestResult>>(
      `/podcast-requests/${id}`,
    );
    return res.data.data;
  }

  async reviewPodcastRequest(
    id: string,
    data: { action: "approve" | "reject"; rejectReason?: string },
  ): Promise<PodcastRequestResult> {
    const res = await api.post<ApiResponse<PodcastRequestResult>>(
      `/podcast-requests/${id}/review`,
      data,
    );
    return res.data.data;
  }

  async cancelPodcastRequest(id: string): Promise<boolean> {
    const res = await api.delete<ApiResponse<boolean>>(
      `/podcast-requests/${id}`,
    );
    return res.data.data;
  }

  async createPodcastRequest(data: {
    liveSessionId: string;
    title: string;
    description?: string;
    scriptText: string;
    audioUrl: string;
    durationSeconds: number;
    voiceCode: string;
    voiceDisplayName?: string;
  }): Promise<PodcastRequestResult> {
    const res = await api.post<ApiResponse<PodcastRequestResult>>(
      "/podcast-requests",
      data,
    );
    return res.data.data;
  }

  /* ── AzuraCast ── */

  async getAzuraHealth(): Promise<AzuraCastHealthResult> {
    const res =
      await api.get<ApiResponse<AzuraCastHealthResult>>("/azuracast/health");
    return res.data.data;
  }

  async testAzuraApiKey(apiKey: string): Promise<ApiKeyTestResult> {
    const res = await api.post<ApiResponse<ApiKeyTestResult>>(
      "/azuracast/test-apikey",
      null,
      {
        params: { apiKey },
      },
    );
    return res.data.data;
  }
}

export const liveSessionApiService = new LiveSessionApiService();
export default liveSessionApiService;
