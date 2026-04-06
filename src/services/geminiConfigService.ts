import api from "./axios";

/* ============================================
   Gemini Config Service
   Calls account-content-service via API Gateway
   ============================================ */

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errorCode: string | null;
}

export interface GeminiConfigResponse {
  provider: string;
  maskedApiKey: string;
  isConfigured: boolean;
  isActive: boolean;
  updatedAt: string | null;
}

export interface UpsertGeminiConfigRequest {
  provider: string;
  apiKey: string;
  isActive: boolean;
}

/** Get current Gemini configuration (masked API key) */
export async function getGeminiConfig(): Promise<GeminiConfigResponse | null> {
  const res = await api.get<ApiResponse<GeminiConfigResponse | null>>("/gemini");
  return res.data.data ?? null;
}

/** Upsert (save/update) Gemini configuration */
export async function upsertGeminiConfig(
  payload: UpsertGeminiConfigRequest
): Promise<void> {
  await api.post("/gemini", payload);
}

/** Delete Gemini configuration */
export async function deleteGeminiConfig(): Promise<void> {
  await api.delete("/gemini");
}
