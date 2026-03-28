/* ============================================================
   types/comment.ts
   Types cho Comment APIs — khớp với response thực tế
   ============================================================ */

export interface Comment {
  id: string;
  postId: string;
  parentCommentId: string | null;
  userId: string;
  userFullName: string;
  userAvatarUrl: string | null;
  content: string;
  /** Trạng thái bình luận, VD: "Active" */
  status: string;
  createdAt: string;
  updatedAt: string | null;
  replies: Comment[];
}

export interface CommentPagedResult {
  items: Comment[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface CommentResponse {
  success: boolean;
  message: string;
  data: Comment;
  errors: string | null;
}

export interface CommentsListResponse {
  success: boolean;
  message: string;
  data: CommentPagedResult;
  errors: string | null;
}
