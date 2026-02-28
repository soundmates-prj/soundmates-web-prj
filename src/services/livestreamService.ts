import api from './axios';

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
const STATION_UUID = '161e5ad5-2fd7-434f-b8bd-90350263fb72';

// AzuraCast direct API for requests
const AZURACAST_BASE = 'http://localhost:5000/api';
const STATION_ID = 1;

export const livestreamService = {
  /**
   * Get now-playing data from the backend API
   */
  async getNowPlaying(): Promise<NowPlayingData> {
    const response = await api.get<ApiResponse<NowPlayingData>>(
      `station/${STATION_UUID}/now-playing`
    );
    return response.data.data;
  },

  /**
   * Get requestable songs from AzuraCast
   */
  async getRequestableSongs(): Promise<SongRequestItem[]> {
    try {
      const response = await fetch(`${AZURACAST_BASE}/station/${STATION_ID}/requests`);
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
      const response = await fetch(`${AZURACAST_BASE}/station/${STATION_ID}/request/${requestId}`, {
        method: 'POST',
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  /**
   * Get the listen URL for the stream
   */
  getListenUrl(): string {
    return `http://localhost:5000/listen/mainstream_live/radio.mp3`;
  },
};

export default livestreamService;
