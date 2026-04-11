import api from "./axios";
import type {
  PodcastGenerateRequest,
  PodcastGenerateResult,
  PodcastItem,
  PodcastEpisode,
} from "../types/podcast";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errorCode?: number;
}

class PodcastService {
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

  // ─── Saved Podcasts ───

  async getSavedPodcasts(): Promise<PodcastItem[]> {
    try {
      const response =
        await api.get<ApiResponse<PodcastItem[]>>("/me/saved-podcasts");
      return response.data.data ?? [];
    } catch (error: any) {
      console.error("Error fetching saved podcasts:", error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Không thể tải podcast đã lưu",
      );
    }
  }

  async savePodcast(podcastId: string): Promise<void> {
    try {
      await api.post(`/me/saved-podcasts/${podcastId}`);
    } catch (error: any) {
      console.error("Error saving podcast:", error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Không thể lưu podcast",
      );
    }
  }

  async unsavePodcast(podcastId: string): Promise<void> {
    try {
      await api.delete(`/me/saved-podcasts/${podcastId}`);
    } catch (error: any) {
      console.error("Error unsaving podcast:", error);
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Không thể bỏ lưu podcast",
      );
    }
  }
}

export default new PodcastService();
