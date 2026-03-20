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

// The station UUID from the backend
const STATION_UUID = "98fa2e44-e332-4325-836a-91e18025d62c";

// AzuraCast direct API for requests
const AZURACAST_BASE = "http://localhost:8081/api";
const STATION_ID = 1;

export const livestreamService = {
  /**
   * Get now-playing data from the backend API
   */
  async getNowPlaying(): Promise<NowPlayingData> {
    const response = await api.get<ApiResponse<NowPlayingData>>(
      `station/${STATION_UUID}/now-playing`,
    );
    return response.data.data;
  },

  /**
   * Get requestable songs from AzuraCast
   */
  async getRequestableSongs(): Promise<SongRequestItem[]> {
    try {
      const response = await fetch(
        `${AZURACAST_BASE}/station/${STATION_ID}/requests`,
      );
      const data = await response.json();
      return data || [];
    } catch {
      return [];
    }
  },

  /**
   * Submit a song request to AzuraCast
   */
  async requestSong(requestId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${AZURACAST_BASE}/station/${STATION_ID}/request/${requestId}`,
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
   * If a nowPlaying listenUrl is provided it is preferred;
   * otherwise falls back to the default station shortcode.
   * Returns a root-relative path so the Vite dev-server proxy
   * can forward the request to AzuraCast without CORS issues.
   */
  getListenUrl(listenUrl?: string): string {
    const raw = listenUrl || "http://localhost/listen/my_fav_station/radio.mp3";
    // Strip the host part so the URL is root-relative (proxied by Vite)
    return raw.replace(/^https?:\/\/[^\/]+/, "");
  },
};

export default livestreamService;
