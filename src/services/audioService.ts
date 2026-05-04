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
  private extractFileNameFromDisposition(contentDisposition?: string): string | null {
    if (!contentDisposition) {
      return null;
    }

    const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
    if (utf8Match?.[1]) {
      try {
        return decodeURIComponent(utf8Match[1]);
      } catch {
        return utf8Match[1];
      }
    }

    const standardMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
    return standardMatch?.[1] ?? null;
  }

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
        {
          voiceCode: params.voiceCode || params.voiceId,
          voiceId: params.voiceId || params.voiceCode,
          speed: params.speed,
          pitch: params.pitch,
          bgmUrl: params.bgmUrl
        }
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
   * Download audio file with authenticated request
   * @param audioId Audio ID (UUID)
   * @param preferredFileName Optional preferred file name
   */
  async downloadAudioFile(audioId: string, preferredFileName?: string): Promise<void> {
    try {
      const response = await api.get(`/audios/${audioId}/download`, {
        responseType: 'blob'
      });

      const contentDisposition = response.headers['content-disposition'] as string | undefined;
      const resolvedFileName =
        preferredFileName ||
        this.extractFileNameFromDisposition(contentDisposition) ||
        `${audioId}.wav`;

      const blobUrl = window.URL.createObjectURL(response.data);
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = resolvedFileName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error: any) {
      console.error('Error downloading audio:', error);
      throw new Error(
        error.response?.data?.message ||
        error.message ||
        'Lỗi khi tải file audio'
      );
    }
  }

  /**
   * Get all audios for the current user
   */
  async getAllAudios(): Promise<ScriptAudio[]> {
    try {
      const response = await api.get<ApiResponse<{ audios: ScriptAudio[] }>>('/audios');
      if (!response.data.success || !response.data.data?.audios) {
        throw new Error(response.data.message || 'Không thể tải danh sách audio');
      }
      return response.data.data.audios;
    } catch (error: any) {
      console.error('Error fetching all audios:', error);
      throw new Error(
        error.response?.data?.message ||
        error.message ||
        'Lỗi khi tải danh sách audio'
      );
    }
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

      return response.data.data.voices.map(v => {
        let displayName = v.displayName;
        if (displayName) {
          displayName = displayName.replace('VieNeu Fast (Q4)', 'SoundMates Fast (Q4)')
                                 .replace('VieNeu High Quality (Q8)', 'SoundMates High Quality (Q8)');
        }
        return {
          ...v,
          displayName,
          // Prefer voiceId (from VieNeu TTS) over id
          id: v.voiceId || v.id
        };
      });
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
