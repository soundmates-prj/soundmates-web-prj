import api from './axios';
import type { PodcastGenerateRequest, PodcastGenerateResult } from '../types/podcast';

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
  async generateFullPodcast(params: PodcastGenerateRequest): Promise<PodcastGenerateResult> {
    try {
      const response = await api.post<ApiResponse<PodcastGenerateResult>>(
        '/podcasts/generate-full',
        params
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Không thể tạo podcast');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Error generating full podcast:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Lỗi khi tạo podcast'
      );
    }
  }
}

export default new PodcastService();
