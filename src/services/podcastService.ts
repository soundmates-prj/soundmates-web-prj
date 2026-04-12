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

  /**
   * Generate podcast script only (step 1: create script)
   */
  async generateScript(params: {
    topic: string;
    title?: string;
    editorInstruction?: string;
  }): Promise<{ scriptId: string; scriptText: string; title: string }> {
    try {
      const response = await api.post<ApiResponse<{ script: any }>>(
        "/scripts/podcast:generate",
        {
          topic: params.topic,
          title: params.title,
          contextType: "podcast",
          editorInstruction: params.editorInstruction,
        },
      );
      if (!response.data.success || !response.data.data?.script) {
        throw new Error(response.data.message || "Không thể tạo script");
      }
      const s = response.data.data.script;
      return {
        scriptId: s.scriptId ?? s.id,
        scriptText: s.content ?? s.scriptText ?? s.text ?? "",
        title: s.title ?? "",
      };
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || error.message || "Lỗi khi tạo script",
      );
    }
  }

  /**
   * Generate audio from a script (step 2: pick script → generate audio)
   */
  async generateAudioFromScript(params: {
    scriptId: string;
    voiceCode: string;
  }): Promise<{ audioId: string; audioUrl: string }> {
    try {
      const response = await api.post<ApiResponse<{ audio: any }>>(
        `/scripts/${params.scriptId}/audio:generate`,
        { voiceCode: params.voiceCode },
      );
      if (!response.data.success || !response.data.data?.audio) {
        throw new Error(response.data.message || "Không thể tạo audio");
      }
      const a = response.data.data.audio;
      return {
        audioId: a.id ?? a.audioId,
        audioUrl: a.publicUrl ?? a.url ?? "",
      };
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || error.message || "Lỗi khi tạo audio",
      );
    }
  }

  /**
   * Get user's scripts list
   */
  async getMyScripts(): Promise<any[]> {
    try {
      const response = await api.get<ApiResponse<{ scripts: any[] }>>(
        "/scripts",
      );
      return response.data.data?.scripts ?? [];
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || error.message || "Lỗi khi tải danh sách script",
      );
    }
  }

  /**
   * Delete a script by ID
   */
  async deleteScript(scriptId: string): Promise<void> {
    try {
      const response = await api.delete<ApiResponse<any>>(
        `/scripts/${scriptId}`,
      );
      if (!response.data.success) {
        throw new Error(response.data.message || "Xóa script thất bại");
      }
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || error.message || "Xóa script thất bại",
      );
    }
  }

  /**
   * Update a script's title and/or content
   */
  async updateScript(scriptId: string, params: { title?: string; contentText?: string }): Promise<void> {
    try {
      const response = await api.put<ApiResponse<any>>(
        `/scripts/${scriptId}`,
        params,
      );
      if (!response.data.success) {
        throw new Error(response.data.message || "Cập nhật script thất bại");
      }
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || error.message || "Cập nhật script thất bại",
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
