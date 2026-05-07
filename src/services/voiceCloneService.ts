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
      '/voices',
    );
    const voices = res.data.data?.voices ?? [];
    return voices.map(v => {
      let displayName = v.displayName;
      if (displayName) {
        displayName = displayName.replace('VieNeu Fast (Q4)', 'SoundMates Fast (Q4)')
                               .replace('VieNeu High Quality (Q8)', 'SoundMates High Quality (Q8)');
      }
      return { ...v, displayName };
    });
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
   * Delete a cloned voice by voiceCode
   */
  async deleteVoice(voiceCode: string): Promise<void> {
    if (!voiceCode) throw new Error('Voice code không hợp lệ');
    const res = await api.delete<{ success: boolean; message?: string }>(
      `/voices/code/${voiceCode}`,
    );
    if (!res.data.success) {
      throw new Error(res.data.message ?? 'Xóa thất bại');
    }
  }

  /**
   * Get current user's subscription plan WITH plan limits (VoiceModelLimit, TtsMinuteLimit, PodcastRequestLimit).
   * Calls /me/subscriptions/full to get plan limits directly from Subscription + Plan join.
   */
  async getMySubscriptionPlan(): Promise<SubscriptionPlan | null> {
    try {
      // Try the /full endpoint first — it returns VoiceModelLimit/TtsMinuteLimit/PodcastRequestLimit
      const fullRes = await api.get<{
        success: boolean;
        data: {
          planId: string;
          planName: string;
          voiceModelLimit: number;
          ttsMinuteLimit: number;
          podcastRequestLimit: number;
          price: number;
        } | null;
      }>('/me/subscriptions/full');

      // DEBUG: Log the raw response so we can diagnose why Voice Clone may not appear
      console.log('[VoiceClone] /me/subscriptions/full raw response:', fullRes.data);

      const data = fullRes.data.data;
      if (!data) {
        console.warn('[VoiceClone] No subscription data returned (data is null/undefined)');
        return null;
      }

      // planId may come back as "planId" or "id" depending on serialization
      const resolvedPlanId = data.planId ?? (data as any).id;
      if (!resolvedPlanId) {
        console.warn('[VoiceClone] Subscription data has no planId. Full data:', data);
      }

      return {
        id: resolvedPlanId ?? '',
        planName: data.planName ?? '',
        voiceModelLimit: data.voiceModelLimit ?? 0,
        ttsMinuteLimit: data.ttsMinuteLimit ?? 0,
        podcastRequestLimit: data.podcastRequestLimit ?? 0,
        price: data.price ?? 0,
      };
    } catch (err) {
      console.error('[VoiceClone] Failed to fetch subscription plan:', err);
      return null;
    }
  }
}

export const voiceCloneService = new VoiceCloneService();
export default voiceCloneService;