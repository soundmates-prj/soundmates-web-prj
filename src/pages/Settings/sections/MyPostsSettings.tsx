import { useState, useEffect } from "react";
import {
  FileText,
  Edit,
  Trash2,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  Save,
} from "lucide-react";
import api from "../../../services/axios";
import { showSuccess, showError } from "../../../components/common/toastUtils";
import type { Post } from "../../../types/post";
import "./MyPostsSettings.css";

export default function MyPostsSettings() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  // Modal states
  const [viewPost, setViewPost] = useState<Post | null>(null);
  const [editPost, setEditPost] = useState<Post | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPosts = async (currentPage: number) => {
    try {
      setLoading(true);
      const res = await api.get("/me/posts", {
        params: { page: currentPage, pageSize },
      });
      if (res.data.success && res.data.data) {
        setPosts(res.data.data.items || []);
        setTotalPages(res.data.data.totalPages || 1);
      }
    } catch (error) {
      console.error("Failed to fetch posts", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(page);
  }, [page]);

  // ─── Fetch full post for view/edit ───
  const fetchFullPost = async (postId: string): Promise<Post | null> => {
    try {
      const res = await api.get(`/posts/${postId}`);
      return res.data.data ?? null;
    } catch {
      showError("Lỗi", "Không thể tải bài viết");
      return null;
    }
  };

  const handleView = async (post: Post) => {
    const full = await fetchFullPost(post.id);
    if (full) setViewPost(full);
  };

  const handleEditOpen = async (post: Post) => {
    const full = await fetchFullPost(post.id);
    if (full) {
      setEditPost(full);
      setEditTitle(full.title);
      setEditContent(full.contentText ?? "");
    }
  };

  const handleEditSave = async () => {
    if (!editPost) return;
    setEditSaving(true);
    try {
      const payload = {
        title: editTitle,
        contentText: editContent,
      };
      await api.put(`posts/${editPost.id}`, payload);
      showSuccess("Thành công", "Đã cập nhật bài viết");
      setEditPost(null);
      fetchPosts(page);
    } catch (error: any) {
      const msg =
        error.response?.data?.message || "Không thể cập nhật bài viết";
      showError("Lỗi", msg);
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/posts/${deleteTarget.id}`);
      showSuccess("Đã xóa", "Xóa bài viết thành công");
      setDeleteTarget(null);
      fetchPosts(page);
    } catch (error: any) {
      const msg = error.response?.data?.message || "Không thể xóa bài viết";
      showError("Lỗi", msg);
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === "published") {
      return <span className="post-status published">Đã xuất bản</span>;
    }
    if (s === "draft") {
      return <span className="post-status draft">Bản nháp</span>;
    }
    return <span className="post-status archived">Đã lưu trữ</span>;
  };

  if (loading && posts.length === 0) {
    return (
      <div className="posts-settings">
        <div className="settings-section-header">
          <h1>Bài viết của tôi</h1>
          <p>Quản lý bài viết của bạn</p>
        </div>
        <div className="posts-loading">
          <Loader2 size={32} className="posts-spinner" />
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!loading && posts.length === 0) {
    return (
      <div className="posts-settings">
        <div className="settings-section-header">
          <h1>Bài viết của tôi</h1>
          <p>Quản lý bài viết của bạn</p>
        </div>
        <div className="posts-empty">
          <FileText size={48} />
          <h3>Chưa có bài viết</h3>
          <p>Bắt đầu viết bài viết đầu tiên của bạn</p>
        </div>
      </div>
    );
  }

  return (
    <div className="posts-settings">
      <div className="settings-section-header">
        <h1>Bài viết của tôi</h1>
        <p>Quản lý bài viết của bạn</p>
      </div>

      <div className="posts-list">
        {posts.map((post) => (
          <div key={post.id} className="post-card">
            <div className="post-card-header">
              <div className="post-card-icon">
                <FileText size={20} />
              </div>
              <div className="post-card-title">
                <h3>{post.title}</h3>
                <div className="post-card-meta">
                  {getStatusBadge(post.status)}
                  <span className="post-date">
                    {post.publishedAt
                      ? `Xuất bản ${formatDate(post.publishedAt)}`
                      : `Tạo ${formatDate(post.createdAt)}`}
                  </span>
                </div>
              </div>
            </div>

            <div className="post-card-actions">
              <button
                className="post-action-btn view"
                title="Xem"
                onClick={() => handleView(post)}
              >
                <Eye size={16} />
              </button>
              <button
                className="post-action-btn edit"
                title="Chỉnh sửa"
                onClick={() => handleEditOpen(post)}
              >
                <Edit size={16} />
              </button>
              <button
                className="post-action-btn delete"
                title="Xóa"
                onClick={() => setDeleteTarget(post)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="posts-pagination">
          <button
            className="pagination-btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft size={18} />
            Trước
          </button>
          <span className="pagination-info">
            Trang {page} / {totalPages}
          </span>
          <button
            className="pagination-btn"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Sau
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* ── View Modal ── */}
      {viewPost && (
        <div className="mps-overlay" onClick={() => setViewPost(null)}>
          <div className="mps-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mps-modal-header">
              <h2>Chi tiết bài viết</h2>
              <button className="mps-close" onClick={() => setViewPost(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="mps-modal-body">
              <h3 className="mps-view-title">{viewPost.title}</h3>
              <div className="mps-view-meta">
                {getStatusBadge(viewPost.status)}
                <span className="post-date">
                  {viewPost.publishedAt
                    ? `Xuất bản ${formatDate(viewPost.publishedAt)}`
                    : `Tạo ${formatDate(viewPost.createdAt)}`}
                </span>
              </div>
              {viewPost.imageUrl && (
                <img
                  className="mps-view-image"
                  src={viewPost.imageUrl}
                  alt=""
                />
              )}
              <p className="mps-view-content">
                {viewPost.contentText || "Không có nội dung."}
              </p>
              {viewPost.audioUrl && (
                <audio
                  className="mps-view-audio"
                  controls
                  src={viewPost.audioUrl}
                />
              )}
              <div className="mps-view-stats">
                {viewPost.viewCount != null && (
                  <span>{viewPost.viewCount} lượt xem</span>
                )}
                {viewPost.reactionCount != null && (
                  <span>{viewPost.reactionCount} phản ứng</span>
                )}
                {viewPost.commentCount != null && (
                  <span>{viewPost.commentCount} bình luận</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editPost && (
        <div className="mps-overlay" onClick={() => setEditPost(null)}>
          <div className="mps-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mps-modal-header">
              <h2>Chỉnh sửa bài viết</h2>
              <button className="mps-close" onClick={() => setEditPost(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="mps-modal-body">
              <label className="mps-label">Tiêu đề</label>
              <input
                className="mps-input"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Tiêu đề bài viết"
              />
              <label className="mps-label">Nội dung</label>
              <textarea
                className="mps-textarea"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Nội dung bài viết..."
                rows={8}
              />
            </div>
            <div className="mps-modal-footer">
              <button
                className="mps-btn mps-btn--cancel"
                onClick={() => setEditPost(null)}
              >
                Hủy
              </button>
              <button
                className="mps-btn mps-btn--save"
                onClick={handleEditSave}
                disabled={editSaving || !editTitle.trim()}
              >
                {editSaving ? (
                  <Loader2 size={16} className="posts-spinner" />
                ) : (
                  <Save size={16} />
                )}
                {editSaving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteTarget && (
        <div className="mps-overlay" onClick={() => setDeleteTarget(null)}>
          <div
            className="mps-modal mps-modal--sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mps-delete-body">
              <div className="mps-delete-icon">
                <AlertTriangle size={32} />
              </div>
              <h3>Xóa bài viết?</h3>
              <p>
                Bạn có chắc chắn muốn xóa bài viết "
                <strong>{deleteTarget.title}</strong>"? Hành động này không thể
                hoàn tác.
              </p>
              <div className="mps-delete-actions">
                <button
                  className="mps-btn mps-btn--cancel"
                  onClick={() => setDeleteTarget(null)}
                >
                  Hủy
                </button>
                <button
                  className="mps-btn mps-btn--delete"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <Loader2 size={16} className="posts-spinner" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  {deleting ? "Đang xóa..." : "Xóa"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
