import api from './axios';

// ── Spotify Search Types ──────────────────────────────────────────────

export interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  external_urls: { spotify: string };
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  images: SpotifyImage[];
  release_date: string;
  external_urls: { spotify: string };
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  duration_ms: number;
  preview_url: string | null;
  explicit: boolean;
  popularity: number;
  external_urls: { spotify: string };
  uri: string;
}

export interface SpotifySearchResponse {
  success: boolean;
  message: string;
  data: {
    tracks: {
      items: SpotifyTrack[];
      total: number;
      limit: number;
      offset: number;
      next: string | null;
      previous: string | null;
    } | null;
    artists: unknown | null;
    albums: unknown | null;
  };
  errorCode: string | null;
}

// ── Favorite Types ────────────────────────────────────────────────────

export interface FavoriteItem {
  id: string;
  userId: string;
  itemType: string;
  itemId: string;
  source: string;
  name: string;
  artistName: string;
  albumName: string;
  imgUrl: string;
  previewUrl: string | null;
  durationMs: number;
  externalUrl: string;
  createdAt: string;
}

export interface FavoritesResponse {
  success: boolean;
  message: string;
  data: FavoriteItem[];
  errorCode: string | null;
}

export interface AddFavoriteRequest {
  itemType: string;
  itemId: string;
  source: string;
  name?: string;
  artistName?: string;
  albumName?: string;
  imgUrl?: string;
  previewUrl?: string;
  rawJson?: string;
}

export interface RemoveFavoriteRequest {
  itemType: string;
  itemId: string;
  source: string;
}

// ── Service ───────────────────────────────────────────────────────────

class FavoriteService {
  /**
   * Search Spotify for tracks
   */
  async searchSpotify(
    q: string,
    type: string = 'track',
    limit: number = 20,
    offset: number = 0,
  ): Promise<SpotifySearchResponse> {
    const response = await api.get<SpotifySearchResponse>('/spotify/search', {
      params: { q, type, limit, offset },
    });
    return response.data;
  }

  /**
   * Get the authenticated user's favourites
   */
  async getFavorites(
    itemType?: string,
    source?: string,
  ): Promise<FavoritesResponse> {
    const response = await api.get<FavoritesResponse>('/me/favorites', {
      params: {
        ...(itemType ? { itemType } : {}),
        ...(source ? { source } : {}),
      },
    });
    return response.data;
  }

  /**
   * Add an item to the current user's favourites
   */
  async addFavorite(data: AddFavoriteRequest): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/me/favorites', data);
    return response.data;
  }

  /**
   * Remove an item from the current user's favourites
   */
  async removeFavorite(data: RemoveFavoriteRequest): Promise<{ success: boolean; message: string }> {
    const response = await api.delete('/me/favorites', { data });
    return response.data;
  }
}

export const favoriteService = new FavoriteService();
export default favoriteService;
