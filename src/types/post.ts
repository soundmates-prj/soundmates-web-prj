export interface Post {
  id: string;
  userId: string;
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
