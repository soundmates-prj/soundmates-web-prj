import api from './axios';

/* ─── Types ─────────────────────────────────────────────────────────────── */

export interface ClonedVoice {
  id: string;
  voiceCode: string;
  displayName: string;
  provider: string;
  gender?: string;
  model?: string;
  isActive: boolean;
  createdAt: string;
}

export interface SubscriptionPlan {
  id: string;
  planName: string;
  voiceModelLimit: number;
  ttsMinuteLimit: number;
  podcastRequestLimit: number;
  price: number;
}

/* ─── Service ──────────────────────────────────────────────────────────── */

class VoiceCloneService {
  /**
   * List all cloned voices for the current user
   */
  async getMyVoices(): Promise<ClonedVoice[]> {
    const res = await api.get<{ success: boolean; data: { voices: ClonedVoice[] } }>(
      '/voice-clone/my-voices',
    );
    return res.data.data?.voices ?? [];
  }

  /**
   * Clone a new voice from an audio sample + reference text
   */
  async cloneVoice(params: {
    displayName: string;
    refText: string;
    gender: string;
    audioFile: File;
  }): Promise<ClonedVoice> {
    const formData = new FormData();
    formData.append('displayName', params.displayName.trim());
    formData.append('refText', params.refText.trim());
    formData.append('gender', params.gender);
    formData.append('file', params.audioFile);

    const res = await api.post<{ success: boolean; message?: string; data: ClonedVoice }>(
      '/voice-clone/clone',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120_000 },
    );

    if (!res.data.success) {
      throw new Error(res.data.message ?? 'Clone thất bại');
    }
    if (!res.data.data) {
      throw new Error('Không nhận được dữ liệu từ server');
    }
    return res.data.data;
  }

  /**
   * Delete a cloned voice
   */
  async deleteVoice(voiceId: string): Promise<void> {
    const res = await api.delete<{ success: boolean; message?: string }>(
      `/voice-clone/${voiceId}`,
    );
    if (!res.data.success) {
      throw new Error(res.data.message ?? 'Xóa thất bại');
    }
  }

  /**
   * Get current user's subscription plan (for voice model limits)
   */
  async getMySubscriptionPlan(): Promise<SubscriptionPlan | null> {
    try {
      const subRes = await api.get<{ success: boolean; data: { planId: string } }>(
        '/me/subscriptions',
      );
      const planId = subRes.data.data?.planId;
      if (!planId) return null;

      const planRes = await api.get<{ success: boolean; data: SubscriptionPlan }>(
        `/subscription-plans/${planId}`,
      );
      return planRes.data.success ? planRes.data.data : null;
    } catch {
      return null;
    }
  }
}

export const voiceCloneService = new VoiceCloneService();
export default voiceCloneService;