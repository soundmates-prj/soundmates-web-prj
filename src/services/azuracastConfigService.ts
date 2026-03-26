import api from "./axios";
import type { ApiResponse } from "./livestreamService";

/* ============================================
   AzuraCast Config Service
   Calls account-content-service via API Gateway
   ============================================ */

export interface AzuraCastConfigResponse {
  baseUrl: string;
  maskedApiKey: string;
  isConfigured: boolean;
  isActive: boolean;
  updatedAt: string | null;
}

export interface UpsertAzuraCastConfigRequest {
  baseUrl: string;
  apiKey: string;
  isActive: boolean;
}

/** Get current AzuraCast configuration (masked API key) */
export async function getAzuraCastConfig(): Promise<AzuraCastConfigResponse> {
  const res = await api.get<ApiResponse<AzuraCastConfigResponse>>("/azuracast-config");
  return res.data.data;
}

/** Upsert (save/update) AzuraCast configuration */
export async function upsertAzuraCastConfig(
  payload: UpsertAzuraCastConfigRequest
): Promise<AzuraCastConfigResponse> {
  const res = await api.post<ApiResponse<AzuraCastConfigResponse>>(
    "/azuracast-config",
    payload
  );
  return res.data.data;
}

/** Delete AzuraCast configuration */
export async function deleteAzuraCastConfig(): Promise<void> {
  await api.delete<ApiResponse<boolean>>("/azuracast-config");
}
