import api from "./axios";
import type {
  PodcastGenerateRequest,
  PodcastGenerateResult,
  PodcastItem,
  PodcastEpisode,
} from "../types/podcast";

/**
 * API Response wrapper
 */
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errorCode?: number;
}

/**
 * Podcast Service - handles full podcast generation (script + audio)
 */
class PodcastService {
  /**
   * Generate full podcast (script + audio) in one step
   * @param params Podcast generation parameters
   * @returns Generated podcast with script and audio
   */
  async generateFullPodcast(
    params: PodcastGenerateRequest,
  ): Promise<PodcastGenerateResult> {
    try {
      const response = await api.post<ApiResponse<PodcastGenerateResult>>(
        "/podcasts/generate-full",
        params,
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || "Không thể tạo podcast");
      }

      return response.data.data;
    } catch (error: any) {
      console.error("Error generating full podcast:", error);
      throw new Error(
        error.response?.data?.message || error.message || "Lỗi khi tạo podcast",
      );
    }
  }

  // ─── Podcast Management (CRUD) ───

  /**
   * Lấy tất cả podcast đã xuất bản
   */
  async getPublishedPodcasts(): Promise<PodcastItem[]> {
    try {
      const response = await api.get<ApiResponse<PodcastItem[]>>("/podcast");
      const all = response.data.data ?? [];
      return all.filter((p) => p.status?.toLowerCase() === "published");
    } catch (error: any) {
      console.error("Error fetching podcasts:", error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Không thể tải danh sách podcast",
      );
    }
  }

  /**
   * Lấy chi tiết một podcast
   */
  async getPodcastById(id: string): Promise<PodcastItem> {
    try {
      const response = await api.get<ApiResponse<PodcastItem>>(
        `/podcast/${id}`,
      );
      if (!response.data.data) {
        throw new Error("Không tìm thấy podcast");
      }
      return response.data.data;
    } catch (error: any) {
      console.error("Error fetching podcast:", error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Không thể tải podcast",
      );
    }
  }

  /**
   * Lấy danh sách episode của một podcast
   */
  async getEpisodes(podcastId: string): Promise<PodcastEpisode[]> {
    try {
      const response = await api.get<ApiResponse<PodcastEpisode[]>>(
        `/podcast/${podcastId}/episodes`,
      );
      return response.data.data ?? [];
    } catch (error: any) {
      console.error("Error fetching episodes:", error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Không thể tải danh sách tập",
      );
    }
  }
}

export default new PodcastService();
