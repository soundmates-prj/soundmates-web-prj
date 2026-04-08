// Podcast Creator Types

export interface Script {
  id: string;
  userId: string;
  topic: string;
  title?: string;
  content: string;
  contextType?: string;
  status: "draft" | "completed" | "failed";
  modelName?: string;
  temperature?: number;
  maxTokens?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface ScriptAudio {
  id: string;
  scriptId: string;
  voiceId: string;
  speed: number;
  pitch: number;
  duration?: number;
  audioPath: string;
  publicUrl: string;
  downloadUrl: string;
  fileName: string;
  contentType: string;
  contentLength: number;
  createdAt: string;
  updatedAt?: string;
}

export interface TtsVoice {
  id: string;
  voiceType: "BuiltIn" | "User";
  provider: string;
  voiceCode: string;
  displayName: string;
  region?: string;
  gender?: "Male" | "Female" | "Neutral";
  model?: string;
  isActive: boolean;
}

export interface PodcastGenerateRequest {
  topic: string;
  style?: string;
  duration?: string;
  voice: string;
  language?: string;
  modelName?: string;
  includeAudioBytes: boolean;
}

export interface PodcastGenerateResult {
  script: Script;
  audio: ScriptAudio;
  audioUrl?: string;
}

export interface GenerateScriptRequest {
  topic: string;
  title?: string;
  contextType?: string;
  modelName?: string;
  temperature?: number;
  maxTokens?: number;
  editorInstruction?: string;
  useAutoContext: boolean;
  strictFactMode: boolean;
}

export interface GenerateAudioRequest {
  voiceId: string;
  speed: number;
  pitch: number;
}

export interface CreateVoiceRequest {
  voiceType: "BuiltIn" | "User";
  provider: string;
  voiceCode: string;
  displayName: string;
  region?: string;
  gender?: "Male" | "Female" | "Neutral";
  model?: string;
  isActive: boolean;
}

// Validation helpers
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export const isValidSpeed = (speed: number): boolean => {
  return speed >= 0.5 && speed <= 2.0;
};

export const isValidPitch = (pitch: number): boolean => {
  return pitch >= 0.5 && pitch <= 2.0;
};

export const isValidURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// ─── Podcast Management Types (CRUD API) ───

export interface PodcastItem {
  id: string;
  title: string;
  description: string;
  author: string;
  type: string;
  banner: string;
  status: string;
  createdBy: string;
  createdAt: string;
  episodeCount?: number;
  allEpisodes?: PodcastEpisode[];
}

export interface PodcastEpisode {
  id: string;
  podcastId: string;
  title: string;
  description?: string;
  audioUrl?: string;
  thumbnailUrl?: string;
  episodeNumber?: number;
  publishDate?: string;
  createdAt?: string;
}
