import api from './axios';
import type { Script, GenerateScriptRequest } from '../types/podcast';

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
 * Script Service - handles script generation and management
 */
class ScriptService {
  /**
   * Generate a podcast script from topic and parameters
   * @param params Script generation parameters
   * @returns Generated script
   */
  async generateScript(params: GenerateScriptRequest): Promise<Script> {
    try {
      const response = await api.post<ApiResponse<{ script: Script }>>(
        '/scripts/podcast:generate',
        params
      );

      if (!response.data.success || !response.data.data?.script) {
        throw new Error(response.data.message || 'Không thể tạo script');
      }

      return response.data.data.script;
    } catch (error: any) {
      console.error('Error generating script:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Lỗi khi tạo script'
      );
    }
  }

  /**
   * Get scripts created by the current user
   * @param filter Optional filters (contextType, status)
   * @returns List of scripts
   */
  async getMyScripts(filter?: { contextType?: string; status?: string }): Promise<Script[]> {
    try {
      const response = await api.get<ApiResponse<{ scripts: Script[] }>>(
        '/scripts',
        { params: filter }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Không thể tải danh sách scripts');
      }

      return response.data.data?.scripts || [];
    } catch (error: any) {
      console.error('Error fetching scripts:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Lỗi khi tải danh sách scripts'
      );
    }
  }

  /**
   * Get a script by its ID
   * @param scriptId Script ID (UUID)
   * @returns Script details
   */
  async getScriptById(scriptId: string): Promise<Script> {
    try {
      const response = await api.get<ApiResponse<{ script: Script }>>(
        `/scripts/${scriptId}`
      );

      if (!response.data.success || !response.data.data?.script) {
        throw new Error(response.data.message || 'Không tìm thấy script');
      }

      return response.data.data.script;
    } catch (error: any) {
      console.error('Error fetching script:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Lỗi khi tải script'
      );
    }
  }

  /**
   * Split an existing script into smaller parts for audio processing
   * @param scriptId Script ID (UUID)
   * @param maxCharsPerPart Maximum characters per part
   * @returns List of script parts
   */
  async splitScript(scriptId: string, maxCharsPerPart: number): Promise<Script[]> {
    try {
      const response = await api.post<ApiResponse<{ parts: Script[] }>>(
        `/scripts/${scriptId}/split`,
        { maxCharsPerPart }
      );

      if (!response.data.success || !response.data.data?.parts) {
        throw new Error(response.data.message || 'Không thể chia script');
      }

      return response.data.data.parts;
    } catch (error: any) {
      console.error('Error splitting script:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Lỗi khi chia script'
      );
    }
  }
}

export default new ScriptService();
