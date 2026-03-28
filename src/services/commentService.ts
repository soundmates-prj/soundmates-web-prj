/* ============================================================
   services/commentService.ts
   Tất cả API liên quan đến Comment
   ============================================================ */

import api from "./axios";
import type {
  Comment,
  CommentResponse,
  CommentsListResponse,
} from "../types/comment";

export const commentService = {
  /* POST /api/v1/posts/{postId}/comments — Thêm bình luận */
  addComment: async (postId: string, content: string): Promise<Comment> => {
    const res = await api.post<CommentResponse>(`/posts/${postId}/comments`, {
      content,
    });
    return res.data.data;
  },

  /* GET /api/v1/posts/{postId}/comments — Lấy danh sách bình luận */
  getComments: async (
    postId: string,
    page = 1,
    pageSize = 20,
  ): Promise<CommentsListResponse["data"]> => {
    const res = await api.get<CommentsListResponse>(
      `/posts/${postId}/comments`,
      {
        params: { page, pageSize },
      },
    );
    return res.data.data;
  },

  /* PUT /api/v1/comments/{commentId} — Chỉnh sửa bình luận */
  updateComment: async (
    commentId: string,
    content: string,
  ): Promise<Comment> => {
    const res = await api.put<CommentResponse>(`/comments/${commentId}`, {
      content,
    });
    return res.data.data;
  },

  /* DELETE /api/v1/comments/{commentId} — Xoá bình luận */
  deleteComment: async (commentId: string): Promise<void> => {
    await api.delete(`/comments/${commentId}`);
  },

  /* POST /api/v1/comments/{commentId}/reply — Trả lời bình luận */
  replyComment: async (
    commentId: string,
    content: string,
  ): Promise<Comment> => {
    const res = await api.post<CommentResponse>(
      `/comments/${commentId}/reply`,
      { content },
    );
    return res.data.data;
  },
};

export default commentService;
