import api from "./axios";

// Types for the backend API response
export interface TrackInfo {
  shId: number;
  text: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  artUrl: string;
  lyrics: string | null;
  playedAt: number;
  duration: number;
  elapsed: number;
  remaining: number;
  isRequest: boolean;
}

export interface NowPlayingData {
  externalStationId: number;
  stationName: string;
  stationShortcode: string;
  listenUrl: string;
  publicPlayerUrl: string;
  isOnline: boolean;
  isLive: boolean;
  streamerName: string | null;
  totalListeners: number;
  uniqueListeners: number;
  currentTrack: TrackInfo;
  playingNext: TrackInfo;
  songHistory: TrackInfo[];
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errorCode: string | null;
}

interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
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

const FALLBACK_ART_URL = "https://placehold.co/600x600/111827/FFFFFF?text=LIVE";

const normalizeStreamUrl = (streamUrl?: string | null): string => {
  if (!streamUrl) return "";
  const browserHost = window.location.hostname;
  if (!browserHost) return streamUrl;
  return streamUrl.replace(/host\.docker\.internal/gi, browserHost);
};

const mapSessionToNowPlaying = (session: LiveSessionResult): NowPlayingData => {
  const listenUrl = normalizeStreamUrl(session.streamUrl);
  const currentTrack: TrackInfo = {
    shId: 0,
    text: session.description || session.sessionName,
    title: session.sessionName || "Live Session",
    artist: session.stationName || "SoundMates",
    album: session.description || "Live",
    genre: session.genre || "Live",
    artUrl: session.thumbnailUrl || FALLBACK_ART_URL,
    lyrics: null,
    playedAt: Date.now() / 1000,
    duration: 0,
    elapsed: 0,
    remaining: 0,
    isRequest: false,
  };

  return {
    externalStationId: 0,
    stationName: session.stationName || "Live",
    stationShortcode: "",
    listenUrl,
    publicPlayerUrl: listenUrl,
    isOnline: session.status?.toLowerCase() === "live",
    isLive: session.status?.toLowerCase() === "live",
    streamerName: null,
    totalListeners: session.listenersCount ?? session.totalListeners ?? 0,
    uniqueListeners: session.totalListeners ?? session.listenersCount ?? 0,
    currentTrack,
    playingNext: {
      ...currentTrack,
      shId: -1,
      title: "Đang chờ bài tiếp theo",
      text: "Đang chờ bài tiếp theo",
    },
    songHistory: [currentTrack],
  };
};

export const livestreamService = {
  async getLiveSessions(params?: {
    userId?: string;
    status?: string;
    pageNumber?: number;
    pageSize?: number;
  }): Promise<PagedResult<LiveSessionResult>> {
    const response = await api.get<ApiResponse<PagedResult<LiveSessionResult>>>(
      "/livesession",
      { params },
    );
    return response.data.data;
  },

  async getActiveSessions(): Promise<LiveSessionResult[]> {
    const response = await api.get<ApiResponse<LiveSessionResult[]>>(
      "/livesession/active",
    );
    return response.data.data;
  },

  async getLiveSession(id: string): Promise<LiveSessionResult> {
    const response = await api.get<ApiResponse<LiveSessionResult>>(
      `/livesession/${id}`,
    );
    return response.data.data;
  },

  async getNowPlaying(sessionId?: string): Promise<NowPlayingData> {
    if (sessionId) {
      const session = await this.getLiveSession(sessionId);
      return mapSessionToNowPlaying(session);
    }

    const activeSessions = await this.getActiveSessions();
    if (!activeSessions.length) {
      throw new Error("No active live session");
    }

    const session = await this.getLiveSession(activeSessions[0].id);
    return mapSessionToNowPlaying(session);
  },

  toNowPlaying(session: LiveSessionResult): NowPlayingData {
    return mapSessionToNowPlaying(session);
  },

  normalizeStreamUrl,

  getListenUrl(listenUrl?: string): string {
    return normalizeStreamUrl(listenUrl);
  },
};

export default livestreamService;
