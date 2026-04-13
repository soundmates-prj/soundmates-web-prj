import api from "./axios";
import axios from "axios";

// Public API instance without authentication
const publicApi = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/v1/`,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface UserPlaylist {
  id: string;
  userId: string;
  playlistName: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  visibility: number;
  isEnabled: boolean;
  totalTracks?: number;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface MusicCatalogItem {
  id: string;
  title: string;
  artist: string;
  album?: string | null;
  artworkUrl?: string | null;
  fileUrl?: string | null;
  fileType?: string;
  fileSize?: number;
  duration?: number;
  sourceType?: string;
  uploadedAt?: string;
  lyrics?: string | null;
}

export interface PlaylistTrack {
  id: string;
  playlistId: string;
  mediaId?: string;
  mediaFileId?: string;
  title: string;
  artist: string;
  album?: string | null;
  artworkUrl?: string | null;
  fileUrl?: string | null;
  fileType?: string;
  durationSeconds?: number;
  addedAt?: string;
}

export interface CreateUserPlaylistDto {
  playlistName: string;
  description?: string;
  thumbnailUrl?: string;
  visibility?: number;
  isEnabled?: boolean;
}

export interface UpdateUserPlaylistDto {
  playlistName?: string;
  description?: string;
  thumbnailUrl?: string;
  visibility?: number;
  isEnabled?: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  data: T;
  errorCode: string | null;
}

const normalizePlaylistTracks = (tracks: PlaylistTrack[] | null | undefined): PlaylistTrack[] => {
  return (tracks ?? []).map((track) => ({
    ...track,
    // Backend may return either mediaId or mediaFileId depending on service version.
    mediaId: track.mediaId ?? track.mediaFileId,
    mediaFileId: track.mediaFileId ?? track.mediaId,
  }));
};

const userPlaylistService = {
  /** GET /api/v1/userplaylist */
  getAll: async (): Promise<UserPlaylist[]> => {
    const res = await api.get<ApiResponse<UserPlaylist[]>>("/userplaylist");
    return res.data.data ?? [];
  },

  /** GET /api/v1/userplaylist/public — Get all public user playlists */
  getPublic: async (): Promise<UserPlaylist[]> => {
    const res = await api.get<ApiResponse<UserPlaylist[]>>("/userplaylist/public");
    return res.data.data ?? [];
  },

  /** GET /api/v1/userplaylist/{id} */
  getById: async (id: string): Promise<UserPlaylist> => {
    const res = await api.get<ApiResponse<UserPlaylist>>(`/userplaylist/${id}`);
    return res.data.data;
  },

  /** GET /api/v1/userplaylist/{id}/tracks — Lấy tracks trong playlist (public access) */
  getTracks: async (id: string): Promise<PlaylistTrack[]> => {
    try {
      // Try authenticated request first
      const res = await api.get<ApiResponse<PlaylistTrack[]>>(
        `/userplaylist/${id}/tracks`,
      );
      return normalizePlaylistTracks(res.data.data);
    } catch (error) {
      // If authenticated request fails, try public API for public playlists
      const res = await publicApi.get<ApiResponse<PlaylistTrack[]>>(
        `/userplaylist/${id}/tracks`,
      );
      return normalizePlaylistTracks(res.data.data);
    }
  },

  /** POST /api/v1/userplaylist/{id}/tracks — Thêm nhạc vào playlist */
  addTracks: async (id: string, mediaIds: string[]): Promise<void> => {
    await api.post(`/userplaylist/${id}/tracks`, { mediaIds });
  },

  /** DELETE /api/v1/userplaylist/{id}/tracks — Xoá track khỏi playlist */
  removeTrack: async (playlistId: string, mediaId: string): Promise<void> => {
    await api.delete(`/userplaylist/${playlistId}/tracks`, {
      data: { mediaIds: [mediaId] },
    });
  },

  /** GET /api/v1/musiccatalog — Lấy danh sách nhạc hệ thống */
  getMusicCatalog: async (): Promise<MusicCatalogItem[]> => {
    const res = await api.get<ApiResponse<MusicCatalogItem[]>>("/musiccatalog");
    return res.data.data ?? [];
  },

  /** POST /api/v1/userplaylist */
  create: async (data: CreateUserPlaylistDto): Promise<UserPlaylist> => {
    const res = await api.post<ApiResponse<UserPlaylist>>("/userplaylist", {
      playlistName: data.playlistName,
      description: data.description ?? "",
      thumbnailUrl: data.thumbnailUrl ?? "",
      visibility: data.visibility ?? 0,
      isEnabled: data.isEnabled ?? true,
    });
    return res.data.data;
  },

  /** PUT /api/v1/userplaylist/{id} */
  update: async (
    id: string,
    data: UpdateUserPlaylistDto,
  ): Promise<UserPlaylist> => {
    const res = await api.put<ApiResponse<UserPlaylist>>(
      `/userplaylist/${id}`,
      data,
    );
    return res.data.data;
  },

  /** DELETE /api/v1/userplaylist/{id} */
  remove: async (id: string): Promise<void> => {
    await api.delete(`/userplaylist/${id}`);
  },
};

export default userPlaylistService;
