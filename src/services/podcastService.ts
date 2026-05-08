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

// Body cho POST /api/v1/podcast-requests
export interface CreatePodcastRequestPayload {
  title: string;
  episodeTitle?: string;
  type?: string;
  description: string;
  bannerUrl: string;
  price: number;
  isPaid: boolean;
  targetPodcastId?: string;
}

// Body cho POST /api/v1/podcast-episode-requests
export interface CreatePodcastEpisodeRequestPayload {
  podcastId: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  audioUrl: string;
  duration: number;
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
      const status = error.response?.status;
      const serverMsg: string =
        error.response?.data?.message ?? error.message ?? "";
      const isGeminiDown =
        status === 503 ||
        serverMsg.toLowerCase().includes("503") ||
        serverMsg.toLowerCase().includes("circuit") ||
        serverMsg.toLowerCase().includes("unavailable") ||
        serverMsg.toLowerCase().includes("high demand");
      if (isGeminiDown) {
        throw new Error(
          "AI đang tải cao, không thể tạo script lúc này. " +
          'Vui lòng thử lại sau hoặc chọn "Tự viết Script" để không cần AI.',
        );
      }
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
      const response =
        await api.get<ApiResponse<{ scripts: any[] }>>("/scripts");
      return response.data.data?.scripts ?? [];
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
        error.message ||
        "Lỗi khi tải danh sách script",
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
  async updateScript(
    scriptId: string,
    params: { title?: string; contentText?: string },
  ): Promise<void> {
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
        error.response?.data?.message ||
        error.message ||
        "Cập nhật script thất bại",
      );
    }
  }

  /**
   * Create a manual script — POST /api/scripts (no AI involved)
   */
  async createScript(params: {
    topic: string;
    title?: string;
    contentText: string;
  }): Promise<{ scriptId: string; scriptText: string; title: string }> {
    try {
      const response = await api.post<ApiResponse<{ script: any }>>(
        "/scripts",
        {
          contentText: params.contentText,
          title: params.title || params.topic || undefined,
          topic: params.topic || undefined,
        },
      );
      if (!response.data.success || !response.data.data?.script) {
        throw new Error(response.data.message || "Không thể tạo script");
      }
      const s = response.data.data.script;
      return {
        scriptId: s.scriptId ?? s.id,
        scriptText: s.contentText ?? s.content ?? params.contentText,
        title: s.title ?? params.title ?? "",
      };
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || error.message || "Lỗi khi tạo script",
      );
    }
  }

  /**
   * Get all audios generated by the current user — GET /me/audios (fallback /audios)
   */
  async getMyAudios(): Promise<any[]> {
    try {
      const response =
        await api.get<ApiResponse<{ audios: any[] }>>("/me/audios");
      return response.data.data?.audios ?? [];
    } catch {
      // Fallback to /audios if /me/audios not available
      try {
        const response =
          await api.get<ApiResponse<{ audios: any[] }>>("/audios");
        return response.data.data?.audios ?? [];
      } catch (error: any) {
        throw new Error(
          error.response?.data?.message || error.message || "Lỗi khi tải audio",
        );
      }
    }
  }

  /**
   * Delete an audio by ID — DELETE /audios/{id}
   */
  async deleteAudio(audioId: string): Promise<void> {
    try {
      const response = await api.delete<ApiResponse<any>>(`/audios/${audioId}`);
      if (!response.data.success) {
        throw new Error(response.data.message || "Xóa audio thất bại");
      }
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || error.message || "Xóa audio thất bại",
      );
    }
  }

  // ─── Podcast Management (CRUD) ───

  /**
   * User gửi podcast request mới.
   * POST /api/v1/podcast-requests
   *
   * Request sẽ ở trạng thái chờ admin/staff duyệt.
   * Admin duyệt xong sẽ chuyển sang trạng thái xuất bản.
   * Nếu bị từ chối, backend gửi kèm lý do về user.
   */
  async createPodcastRequest(
    payload: CreatePodcastRequestPayload,
  ): Promise<unknown> {
    try {
      const response = await api.post<ApiResponse<unknown>>(
        "/podcast-requests",
        payload,
      );
      if (response.data.success === false) {
        throw new Error(response.data.message || "Không thể tạo podcast");
      }
      return response.data.data ?? null;
    } catch (error: any) {
      console.error("Error creating podcast request:", error);
      throw new Error(
        error.response?.data?.message || error.message || "Lỗi khi tạo podcast",
      );
    }
  }

  /**
   * User gửi request tạo tập mới cho podcast đã publish.
   * POST /api/v1/podcast-episode-requests
   *
   * Request ở trạng thái chờ admin duyệt. Khi duyệt xong, tập sẽ xuất hiện ở
   * trang podcast tổng. Nếu bị từ chối sẽ kèm lý do.
   */
  async createPodcastEpisodeRequest(
    payload: CreatePodcastEpisodeRequestPayload,
  ): Promise<unknown> {
    try {
      const response = await api.post<ApiResponse<unknown>>(
        "/podcast-episode-requests",
        payload,
      );
      if (response.data.success === false) {
        throw new Error(response.data.message || "Không thể tạo tập");
      }
      return response.data.data ?? null;
    } catch (error: any) {
      console.error("Error creating podcast episode request:", error);
      throw new Error(
        error.response?.data?.message || error.message || "Lỗi khi tạo tập",
      );
    }
  }

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
   * Lấy các podcast do user tạo (My Podcasts)
   */
  async getMyPodcasts(status?: string): Promise<PodcastItem[]> {
    try {
      const url = status ? `/podcast/my?status=${status}` : "/podcast/my";
      const response = await api.get<ApiResponse<PodcastItem[]>>(url);
      return response.data.data ?? [];
    } catch (error: any) {
      console.error("Error fetching my podcasts:", error);
      throw new Error(
        error.response?.data?.message ||
        error.message ||
        "Không thể tải danh sách podcast của bạn",
      );
    }
  }

  async getMyPodcastsRequest(status?: string): Promise<PodcastItem[]> {
    try {
      const url = status ? `/podcast-requests/my?status=${status}` : "/podcast-requests/my";
      const response = await api.get<ApiResponse<any[]>>(url);
      const items = response.data.data ?? [];
      return items.map((item) => ({
        ...item,
        author: item.author ?? item.authorInfo,
        banner: item.banner ?? item.bannerUrl,
      })) as PodcastItem[];
    } catch (error: any) {
      console.error("Error fetching my podcasts:", error);
      throw new Error(
        error.response?.data?.message ||
        error.message ||
        "Không thể tải danh sách podcast của bạn",
      );
    }
  }

  /**
   * Lấy danh sách các yêu cầu thêm tập (Episode Requests) của user
   */
  async getMyEpisodeRequests(status?: string): Promise<any[]> {
    try {
      const url = status
        ? `/podcast-episode-requests/my?status=${status}`
        : "/podcast-episode-requests/my";
      const response = await api.get<ApiResponse<any[]>>(url);
      return response.data.data ?? [];
    } catch (error: any) {
      console.error("Error fetching my episode requests:", error);
      throw new Error(
        error.response?.data?.message ||
        error.message ||
        "Không thể tải danh sách yêu cầu tập",
      );
    }
  }

  async getPodcastRequestById(id: string): Promise<PodcastItem> {
    try {
      const response = await api.get<ApiResponse<any>>(
        `/podcast-requests/${id}`,
      );
      if (!response.data.data) {
        throw new Error("Không tìm thấy podcast request");
      }
      const item = response.data.data;
      return {
        ...item,
        author: item.author ?? item.authorInfo,
        banner: item.banner ?? item.bannerUrl,
      } as PodcastItem;
    } catch (error: any) {
      console.error("Error fetching podcast request:", error);
      throw new Error(
        error.response?.data?.message ||
        error.message ||
        "Không thể tải podcast request",
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
      return (response.data.data ?? []).map((ep) => ({
        ...ep,
        podcastId: ep.podcastId ?? podcastId,
      }));
    } catch (error: any) {
      // Fallback for backends that return episodes in GET /podcast/{id} as allEpisodes.
      try {
        const podcast = await this.getPodcastById(podcastId);
        return (podcast.allEpisodes ?? []).map((ep) => ({
          ...ep,
          podcastId: ep.podcastId ?? podcastId,
        }));
      } catch {
        console.error("Error fetching episodes:", error);
        throw new Error(
          error.response?.data?.message ||
          error.message ||
          "Không thể tải danh sách tập",
        );
      }
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

  async getSavedPodcastsByUserId(userId: string): Promise<PodcastItem[]> {
    try {
      const response = await api.get<ApiResponse<PodcastItem[]>>(
        `/users/${userId}/saved-podcasts`,
      );
      return response.data.data ?? [];
    } catch (error: any) {
      console.error("Error fetching user saved podcasts:", error);
      throw new Error(
        error.response?.data?.message ||
        error.message ||
        "Không thể tải podcast đã lưu của người dùng",
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

  // ─── Purchased Podcasts ───

  /**
   * Tạo payment link (PayOS) để mua podcast.
   * POST /payments (account-content-service)
   * Trả về paymentUrl để redirect.
   */
  async createPaymentForPodcast(
    podcastId: string,
    amount: number,
    returnUrl?: string,
  ): Promise<string> {
    try {
      const response = await api.post<{ paymentUrl?: string; data?: { paymentUrl?: string } }>(
        "/payments",
        {
          targetId: podcastId,
          targetType: "podcast",
          totalAmount: amount,
          method: "vnpay",
          returnUrl: returnUrl ?? undefined,
        },
      );
      const url =
        (response.data as any).paymentUrl ??
        (response.data as any).data?.paymentUrl;
      if (!url) throw new Error("Không nhận được link thanh toán");
      return url;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
        error.message ||
        "Không thể tạo link thanh toán",
      );
    }
  }

  /**
   * Kiểm tra người dùng đã mua podcast chưa.
   * isPurchased được trả về trực tiếp từ GET /podcast/:id khi có JWT.
   */
  async checkPurchased(podcastId: string): Promise<boolean> {
    try {
      const podcast = await this.getPodcastById(podcastId);
      return !!podcast.isPurchased;
    } catch {
      return false;
    }
  }
}

export default new PodcastService();
