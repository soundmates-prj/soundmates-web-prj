import api from './axios';
import type { TtsVoice, CreateVoiceRequest } from '../types/podcast';

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
 * Voice Service - handles voice listing and management
 */
class VoiceService {
  // In-memory cache for voices list
  private voicesCache: TtsVoice[] | null = null;
  private cacheTimestamp: number | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get list of active voices (with caching)
   * @param forceRefresh Force refresh cache
   * @returns List of active voices
   */
  async getActiveVoices(forceRefresh: boolean = false): Promise<TtsVoice[]> {
    // Check if cache is valid
    const now = Date.now();
    if (
      !forceRefresh &&
      this.voicesCache &&
      this.cacheTimestamp &&
      now - this.cacheTimestamp < this.CACHE_DURATION
    ) {
      return this.voicesCache;
    }

    try {
      const response = await api.get<ApiResponse<{ voices: TtsVoice[] }>>(
        '/voices'
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Không thể tải danh sách giọng đọc');
      }

      let voices = response.data.data?.voices || [];
      voices = voices.map(v => {
        let displayName = v.displayName;
        if (displayName) {
          displayName = displayName.replace('VieNeu Fast (Q4)', 'SoundMates Fast (Q4)')
                                 .replace('VieNeu High Quality (Q8)', 'SoundMates High Quality (Q8)');
        }
        return { ...v, displayName };
      });
      
      // Update cache
      this.voicesCache = voices;
      this.cacheTimestamp = now;

      return voices;
    } catch (error: any) {
      console.error('Error fetching voices:', error);
      
      // Return cached data if available, even if expired
      if (this.voicesCache) {
        console.warn('Using expired cache due to API error');
        return this.voicesCache;
      }

      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Lỗi khi tải danh sách giọng đọc'
      );
    }
  }

  /**
   * Create a new voice (admin or user voice)
   * @param params Voice creation parameters
   * @returns Created voice
   */
  async createVoice(params: CreateVoiceRequest): Promise<TtsVoice> {
    try {
      const response = await api.post<ApiResponse<{ voice: TtsVoice }>>(
        '/voices',
        params
      );

      if (!response.data.success || !response.data.data?.voice) {
        throw new Error(response.data.message || 'Không thể tạo giọng đọc');
      }

      // Invalidate cache after creating new voice
      this.voicesCache = null;
      this.cacheTimestamp = null;

      return response.data.data.voice;
    } catch (error: any) {
      console.error('Error creating voice:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Lỗi khi tạo giọng đọc'
      );
    }
  }

  /**
   * Clear the voices cache
   */
  clearCache(): void {
    this.voicesCache = null;
    this.cacheTimestamp = null;
  }
}

export default new VoiceService();
