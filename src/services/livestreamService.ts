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

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errorCode: string | null;
}

export interface SongRequestItem {
  song_id: string;
  title: string;
  artist: string;
  album: string;
  art: string;
}

// AzuraCast direct API base — no more hardcoded station IDs
const AZURACAST_BASE = "http://localhost:5000/api";

export const livestreamService = {
  /**
   * Get now-playing data from the backend API
   * @param stationUuid - The station UUID (from the Station entity)
   */
  async getNowPlaying(stationUuid: string): Promise<NowPlayingData> {
    const response = await api.get<ApiResponse<NowPlayingData>>(
      `station/${stationUuid}/now-playing`,
    );
    return response.data.data;
  },

  /**
   * Get requestable songs from AzuraCast
   * @param externalStationId - The AzuraCast external station ID (number)
   */
  async getRequestableSongs(externalStationId: number): Promise<SongRequestItem[]> {
    try {
      const response = await fetch(
        `${AZURACAST_BASE}/station/${externalStationId}/requests`,
      );
      const data = await response.json();
      return data || [];
    } catch {
      return [];
    }
  },

  /**
   * Submit a song request to AzuraCast
   * @param externalStationId - The AzuraCast external station ID (number)
   * @param requestId - The song request ID
   */
  async requestSong(externalStationId: number, requestId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${AZURACAST_BASE}/station/${externalStationId}/request/${requestId}`,
        {
          method: "POST",
        },
      );
      return response.ok;
    } catch {
      return false;
    }
  },

  /**
   * Get the listen URL for the stream.
   * If a listenUrl is provided it is preferred;
   * otherwise falls back to a default path.
   * Returns a root-relative path so the Vite dev-server proxy
   * can forward the request to AzuraCast without CORS issues.
   */
  getListenUrl(listenUrl?: string): string {
    if (!listenUrl) return "";
    return listenUrl.replace(/^https?:\/\/[^\/]+/, "");
  },
};

export default livestreamService;
