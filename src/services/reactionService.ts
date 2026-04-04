/* ============================================================
   services/reactionService.ts
   ============================================================ */
import api from "./axios";

export type ReactionType = "like" | "love" | "haha" | "wow" | "sad" | "angry";

export interface ReactionUser {
  userId: string;
  userFullName: string;
  userAvatarUrl: string | null;
  reactionType: ReactionType;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: string | null;
}

const reactionService = {
  /* POST /posts/{postId}/reactions — thêm reaction */
  addReaction: async (
    postId: string,
    reactionType: ReactionType,
  ): Promise<void> => {
    await api.post(`/posts/${postId}/reactions`, { reactionType });
  },

  /* DELETE /posts/{postId}/reactions — xoá reaction */
  removeReaction: async (postId: string): Promise<void> => {
    await api.delete(`/posts/${postId}/reactions`);
  },

  /* PUT /reactions/{reactionId} — đổi loại reaction */
  changeReaction: async (
    reactionId: string,
    reactionType: ReactionType,
  ): Promise<void> => {
    await api.put(`/reactions/${reactionId}`, { reactionType });
  },

  /* GET /posts/{postId}/reactions/users — lấy danh sách người react */
  getReactions: async (postId: string): Promise<ReactionUser[]> => {
    const res = await api.get<ApiResponse<ReactionUser[]>>(
      `/posts/${postId}/reactions/users`,
    );
    return res.data.data ?? [];
  },
};

export default reactionService;
