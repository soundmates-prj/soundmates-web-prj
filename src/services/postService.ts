import api from "./axios";
import type { Post } from "../types/post";

// ============================================================
// API Response shapes
// ============================================================
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: string | null;
}

interface PaginationMeta {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// Admin: get all posts (with optional filters)
interface GetPostsParams {
  page?: number;
  pageSize?: number;
  status?: string;
  moodTag?: string;
  authorName?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
}

interface PostsApiResponse {
  items: Post[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// Stats for a single post
export interface PostStats {
  postId: string;
  reactionCount: number;
  commentCount: number;
  viewCount: number;
  publishedAt: string | null;
}

// Post stats list response (admin dashboard)
interface PostStatsResponse {
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

interface PostStatsApiResponse {
  items: PostStatsResponse[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

interface ReportedPostApiItem {
  postDto: Post;
  reportCount: number;
  createdAt: string;
}

export interface PostReport {
  id: string;
  blogPostId: string;
  reporterUserId: string;
  reporterUserName: string;
  reason: string;
  description: string;
  createdAt: string;
}

export interface ReportedPost extends Post {
  reportCount: number;
  latestReportAt: string;
}

// ============================================================
// Post Service
// ============================================================
class PostService {
  // ── Admin: Get ALL posts (all statuses) ──────────────────
  getAllPosts = async (
    params: GetPostsParams = {},
  ): Promise<{ items: Post[]; meta: PaginationMeta }> => {
    const res = await api.get<ApiResponse<PostsApiResponse>>("/posts", {
      params: {
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
        status: params.status,
        moodTag: params.moodTag,
        authorName: params.authorName,
        search: params.search,
        fromDate: params.fromDate,
        toDate: params.toDate,
      },
    });
    const d = res.data.data;
    return {
      items: d.items,
      meta: {
        page: d.page,
        pageSize: d.pageSize,
        totalCount: d.totalCount,
        totalPages: d.totalPages,
      },
    };
  };

  // ── Admin: Get posts stats (reaction/comment counts) ──────
  getPostsStats = async (
    params: GetPostsParams = {},
  ): Promise<{ items: PostStatsResponse[]; meta: PaginationMeta }> => {
    const res = await api.get<ApiResponse<PostStatsApiResponse>>(
      "/posts/stats",
      {
        params: {
          page: params.page ?? 1,
          pageSize: params.pageSize ?? 20,
          status: params.status,
          search: params.search,
          authorName: params.authorName,
        },
      },
    );
    const d = res.data.data;
    return {
      items: d.items,
      meta: {
        page: d.page,
        pageSize: d.pageSize,
        totalCount: d.totalCount,
        totalPages: d.totalPages,
      },
    };
  };

  // ── Admin: Get single post detail ───────────────────────
  getPostById = async (postId: string): Promise<Post> => {
    const res = await api.get<ApiResponse<Post>>(`/posts/${postId}`);
    return res.data.data;
  };

  // ── Admin: Delete post ───────────────────────────────────
  deletePost = async (postId: string): Promise<void> => {
    await api.delete(`/posts/${postId}`);
  };

  // ── Admin: Publish post (Draft → Published) ──────────────
  publishPost = async (postId: string): Promise<void> => {
    await api.patch(`/posts/${postId}/publish`);
  };

  // ── Admin: Archive post ──────────────────────────────────
  archivePost = async (postId: string): Promise<void> => {
    await api.patch(`/posts/${postId}/archive`);
  };

  // ── Admin: Revert to draft ───────────────────────────────
  revertToDraft = async (postId: string): Promise<void> => {
    await api.patch(`/posts/${postId}/draft`);
  };

  // ── Public: Get published posts ──────────────────────────
  getPublishedPosts = async (
    params: {
      page?: number;
      pageSize?: number;
      moodTag?: string;
      search?: string;
    } = {},
  ): Promise<{ items: Post[]; meta: PaginationMeta }> => {
    const res = await api.get<ApiResponse<PostsApiResponse>>(
      "/posts/published",
      {
        params: {
          page: params.page ?? 1,
          pageSize: params.pageSize ?? 20,
          moodTag: params.moodTag,
          search: params.search,
        },
      },
    );
    const d = res.data.data;
    return {
      items: d.items,
      meta: {
        page: d.page,
        pageSize: d.pageSize,
        totalCount: d.totalCount,
        totalPages: d.totalPages,
      },
    };
  };

  // ── Public: Get trending posts (7-day window) ────────────
  getTrendingPosts = async (
    params: {
      page?: number;
      pageSize?: number;
      moodTag?: string;
    } = {},
  ): Promise<{ items: Post[]; meta: PaginationMeta }> => {
    const res = await api.get<ApiResponse<PostsApiResponse>>(
      "/posts/trending",
      {
        params: {
          page: params.page ?? 1,
          pageSize: params.pageSize ?? 20,
          moodTag: params.moodTag,
        },
      },
    );
    const d = res.data.data;
    return {
      items: d.items,
      meta: {
        page: d.page,
        pageSize: d.pageSize,
        totalCount: d.totalCount,
        totalPages: d.totalPages,
      },
    };
  };

  // ── Public: Get popular posts (all-time) ─────────────────
  getPopularPosts = async (
    params: {
      page?: number;
      pageSize?: number;
      moodTag?: string;
    } = {},
  ): Promise<{ items: Post[]; meta: PaginationMeta }> => {
    const res = await api.get<ApiResponse<PostsApiResponse>>("/posts/popular", {
      params: {
        page: params.page ?? 1,
        pageSize: params.pageSize ?? 20,
        moodTag: params.moodTag,
      },
    });
    const d = res.data.data;
    return {
      items: d.items,
      meta: {
        page: d.page,
        pageSize: d.pageSize,
        totalCount: d.totalCount,
        totalPages: d.totalPages,
      },
    };
  };

  // ── Single post stats ────────────────────────────────────
  getPostStats = async (
    postId: string,
  ): Promise<{
    reactionCount: number;
    commentCount: number;
    viewCount: number;
  }> => {
    const res = await api.get<
      ApiResponse<{
        reactionCount: number;
        commentCount: number;
        viewCount: number;
      }>
    >(`/posts/${postId}/stats`);
    return res.data.data;
  };

  // ── Admin: Get reported posts ───────────────────────────
  getReportedPosts = async (): Promise<ReportedPost[]> => {
    const res =
      await api.get<ApiResponse<ReportedPostApiItem[]>>("/posts/reported");
    const items = res.data.data ?? [];
    return items.map((item) => ({
      ...item.postDto,
      reportCount: item.reportCount ?? 0,
      latestReportAt: item.createdAt,
    }));
  };

  // ── Admin: Get reports for a single post ───────────────────
  getPostReports = async (postId: string): Promise<PostReport[]> => {
    const res = await api.get<ApiResponse<PostReport[]>>(
      `/posts/${postId}/reports`,
    );
    return res.data.data ?? [];
  };
}

export default new PostService();
