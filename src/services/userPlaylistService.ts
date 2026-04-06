import api from "./axios";

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
}

export interface PlaylistTrack {
  id: string;
  playlistId: string;
  mediaId: string;
  title: string;
  artist: string;
  album?: string | null;
  artworkUrl?: string | null;
  fileUrl?: string | null;
  duration?: number;
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

const userPlaylistService = {
  /** GET /api/v1/userplaylist */
  getAll: async (): Promise<UserPlaylist[]> => {
    const res = await api.get<ApiResponse<UserPlaylist[]>>("/userplaylist");
    return res.data.data ?? [];
  },

  /** GET /api/v1/userplaylist/{id} */
  getById: async (id: string): Promise<UserPlaylist> => {
    const res = await api.get<ApiResponse<UserPlaylist>>(`/userplaylist/${id}`);
    return res.data.data;
  },

  /** GET /api/v1/userplaylist/{id}/tracks — Lấy tracks trong playlist */
  getTracks: async (id: string): Promise<PlaylistTrack[]> => {
    const res = await api.get<ApiResponse<PlaylistTrack[]>>(
      `/userplaylist/${id}/tracks`,
    );
    return res.data.data ?? [];
  },

  /** POST /api/v1/userplaylist/{id}/tracks — Thêm nhạc vào playlist */
  addTracks: async (id: string, mediaIds: string[]): Promise<void> => {
    await api.post(`/userplaylist/${id}/tracks`, { mediaIds });
  },

  /** DELETE /api/v1/userplaylist/{id}/tracks/{trackId} — Xoá track khỏi playlist */
  removeTrack: async (playlistId: string, mediaId: string): Promise<void> => {
    await api.delete(`/userplaylist/${playlistId}/tracks/${mediaId}`);
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
