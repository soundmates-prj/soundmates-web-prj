import api from './axios';
import type { ScriptAudio, GenerateAudioRequest } from '../types/podcast';

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
 * Audio Service - handles audio generation and retrieval
 */
class AudioService {
  /**
   * Generate audio from an existing script
   * @param scriptId Script ID (UUID)
   * @param params Audio generation parameters (voiceId, speed, pitch)
   * @returns Generated audio metadata
   */
  async generateAudio(scriptId: string, params: GenerateAudioRequest): Promise<ScriptAudio> {
    try {
      const response = await api.post<ApiResponse<{ audio: ScriptAudio }>>(
        `/scripts/${scriptId}/audio:generate`,
        params
      );

      if (!response.data.success || !response.data.data?.audio) {
        throw new Error(response.data.message || 'Không thể tạo audio');
      }

      return response.data.data.audio;
    } catch (error: any) {
      console.error('Error generating audio:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Lỗi khi tạo audio'
      );
    }
  }

  /**
   * Get audio metadata by ID
   * @param audioId Audio ID (UUID)
   * @returns Audio metadata
   */
  async getAudioById(audioId: string): Promise<ScriptAudio> {
    try {
      const response = await api.get<ApiResponse<{ audio: ScriptAudio }>>(
        `/audios/${audioId}`
      );

      if (!response.data.success || !response.data.data?.audio) {
        throw new Error(response.data.message || 'Không tìm thấy audio');
      }

      return response.data.data.audio;
    } catch (error: any) {
      console.error('Error fetching audio:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Lỗi khi tải audio'
      );
    }
  }

  /**
   * Get audio file streaming URL
   * @param audioId Audio ID (UUID)
   * @returns Streaming URL
   */
  getAudioFileUrl(audioId: string): string {
    return `${api.defaults.baseURL}audios/${audioId}/file`;
  }

  /**
   * Get audio file download URL
   * @param audioId Audio ID (UUID)
   * @returns Download URL
   */
  getAudioDownloadUrl(audioId: string): string {
    return `${api.defaults.baseURL}audios/${audioId}/download`;
  }
  /**
   * Get available TTS voices
   * @returns List of available voices
   */
  async getVoices(): Promise<any[]> {
    try {
      const response = await api.get<ApiResponse<{ voices: any[] }>>('/voices');

      if (!response.data.success || !response.data.data?.voices) {
        throw new Error(response.data.message || 'Không thể tải danh sách giọng đọc');
      }

      return response.data.data.voices.map(v => ({
        ...v,
        id: v.voiceId || v.id // Map voiceId to id if needed
      }));
    } catch (error: any) {
      console.error('Error fetching voices:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Lỗi khi tải danh sách giọng đọc'
      );
    }
  }
}

export default new AudioService();
