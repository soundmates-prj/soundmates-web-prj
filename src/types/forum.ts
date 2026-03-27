/* ============================================================
   types/forum.ts
   Types dành riêng cho trang Forum — dựa trên
   GET /api/v1/posts/published
   ============================================================ */

export interface ShareMusicData {
  trackId: string;
  title: string;
  artist: string;
  albumImage: string;
  previewUrl?: string | null;
  template: "dark" | "light" | "gradient" | "minimal";
}

/** Item trả về từ GET /api/v1/posts/published */
export interface PublishedPost {
  reactionCount: number;
  id: string;
  userId: string;
  /** Tên đầy đủ của tác giả — đã có sẵn trong response */
  userFullName: string;
  /** Avatar URL của tác giả — đã có sẵn trong response */
  userAvatarUrl: string | null;
  title: string;
  contentText: string;
  audioUrl: string | null;
  imageUrl: string | null;
  isActive: boolean;
  privacyScope: "public" | "friends" | "private";
  moodTag: string | null;
  status: "Published" | "Draft" | "Archived";
  isGenerated: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  postType: "share-music" | string | null;
  shareMusic: ShareMusicData | null;
}

/** Wrapper phân trang */
export interface PublishedPostPage {
  items: PublishedPost[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

/** API response wrapper */
export interface PublishedPostsResponse {
  success: boolean;
  message: string;
  data: PublishedPostPage;
}

/** Query params cho GET /api/v1/posts/published */
export interface PublishedPostsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  moodTag?: string;
  authorName?: string;
}

export type MoodTag =
  | "happy"
  | "sad"
  | "chill"
  | "hype"
  | "energetic"
  | "romantic"
  | "focus";

export const MOOD_OPTIONS: { value: MoodTag | "all"; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "happy", label: "Vui vẻ" },
  { value: "sad", label: "Buồn" },
  { value: "chill", label: "Chill" },
  { value: "hype", label: "Hype" },
  { value: "energetic", label: "Năng động" },
  { value: "romantic", label: "Lãng mạn" },
  { value: "focus", label: "Tập trung" },
];

export const MOOD_COLOR_MAP: Record<string, string> = {
  happy: "#f59e0b",
  sad: "#3b82f6",
  chill: "#10b981",
  hype: "#ef4444",
  energetic: "#f97316",
  romantic: "#ec4899",
  focus: "#8b5cf6",
};

export const getMoodColor = (tag: string | null): string =>
  tag ? (MOOD_COLOR_MAP[tag.toLowerCase()] ?? "#64748b") : "#64748b";
