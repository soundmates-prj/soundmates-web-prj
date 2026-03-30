export interface Post {
  // ── Identity ────────────────────────────────────────────
  id: string;
  userId: string;
  userFullName?: string;
  userAvatarUrl?: string;

  // ── Content ─────────────────────────────────────────────
  title: string;
  contentText: string;
  audioUrl: string | null;
  imageUrl: string | null;
  isActive: boolean;
  privacyScope: "public" | "friends" | "private";
  moodTag: string | null;

  // ── Status ──────────────────────────────────────────────
  status: "Published" | "Draft" | "Archived" | string;
  isGenerated: boolean;

  // ── Timestamps ─────────────────────────────────────────
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;

  // ── Engagement ──────────────────────────────────────────
  reactionCount?: number;
  commentCount?: number;
  viewCount?: number;

  // ── Music card ──────────────────────────────────────────
  postType?: "share-music" | string | null;
  shareMusic?: {
    trackId: string;
    title: string;
    artist: string;
    albumImage: string;
    previewUrl?: string | null;
    template: "dark" | "light" | "gradient" | "minimal";
  } | null;
}

// Admin post list item (richer than base Post)
export interface AdminPostItem {
  postId: string;
  title: string;
  authorName: string;
  status: string;
  reactionCount: number;
  commentCount: number;
  viewCount: number;
  publishedAt: string | null;
  createdAt: string;
}

// Paginated posts response
export interface PostsResponse {
  success: boolean;
  message: string;
  data: {
    items: Post[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}
