import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Search,
  Eye,
  Trash2,
  EyeOff,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Globe,
  Archive,
  X,
} from "lucide-react";
import { showSuccess, showError } from "../../../components/common/toastUtils";
import postService from "../../../services/postService";
import type { Post } from "../../../types/post";
import { getMoodLabel } from "../../../types/forum";
import "./UserPostsManagementScreen.css";

// ── Status helpers ─────────────────────────────────────────
const STATUS_LABELS: Record<string, string> = {
  Published: "Đã đăng",
  Draft: "Bản nháp",
  Archived: "Đã lưu trữ",
};

const STATUS_BADGE: Record<string, string> = {
  Published: "published",
  Draft: "draft",
  Archived: "archived",
};

const STATUS_FILTERS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "Published", label: "Đã đăng" },
  { value: "Draft", label: "Bản nháp" },
  { value: "Archived", label: "Đã lưu trữ" },
] as const;

export function UserPostsManagementScreen() {
  // ── State ────────────────────────────────────────────────
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Detail modal
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // ── Fetch ────────────────────────────────────────────────
  const fetchPosts = useCallback(
    async (pageNum = 1) => {
      setLoading(true);
      try {
        const res = await postService.getAllPosts({
          page: pageNum,
          pageSize: 20,
          search: searchQuery.trim() || undefined,
          status: statusFilter || undefined,
        });
        setPosts(res.items);
        setTotalPages(res.meta.totalPages);
        setTotalCount(res.meta.totalCount);
        setPage(pageNum);
      } catch (err: any) {
        showError(
          "Lỗi tải dữ liệu",
          err?.response?.data?.message ?? "Không thể tải danh sách bài viết",
        );
        setPosts([]);
      } finally {
        setLoading(false);
      }
    },
    [searchQuery, statusFilter],
  );

  // Reload on filter change
  useEffect(() => {
    const timer = setTimeout(() => fetchPosts(1), searchQuery ? 350 : 0);
    return () => clearTimeout(timer);
  }, [fetchPosts]);

  // ── Actions ─────────────────────────────────────────────
  const handleHide = async (postId: string) => {
    if (!window.confirm("Ẩn bài viết này khỏi người dùng?")) return;
    setActionLoading(postId);
    try {
      await postService.archivePost(postId);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, status: "Archived" } : p)),
      );
      showSuccess("Đã ẩn", "Bài viết đã được ẩn khỏi người dùng");
    } catch {
      showError("Lỗi", "Không thể ẩn bài viết");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnhide = async (postId: string) => {
    if (!window.confirm("Khôi phục bài viết này?")) return;
    setActionLoading(postId);
    try {
      await postService.publishPost(postId);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, status: "Published" } : p)),
      );
      showSuccess("Đã khôi phục", "Bài viết đã được khôi phục");
    } catch {
      showError("Lỗi", "Không thể khôi phục bài viết");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!window.confirm("Xoá bài viết này? Hành động không thể hoàn tác."))
      return;
    setActionLoading(postId);
    try {
      await postService.deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setTotalCount((prev) => prev - 1);
      showSuccess("Đã xoá", "Bài viết đã được xoá");
    } catch {
      showError("Lỗi", "Không thể xoá bài viết");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePublish = async (postId: string) => {
    setActionLoading(postId);
    try {
      await postService.publishPost(postId);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, status: "Published" } : p)),
      );
      showSuccess("Đã đăng", "Bài viết đã được xuất bản");
    } catch {
      showError("Lỗi", "Không thể xuất bản bài viết");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDraft = async (postId: string) => {
    setActionLoading(postId);
    try {
      await postService.revertToDraft(postId);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, status: "Draft" } : p)),
      );
      showSuccess("Đã chuyển", "Bài viết đã được chuyển về bản nháp");
    } catch {
      showError("Lỗi", "Không thể chuyển bài viết về bản nháp");
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewDetail = async (post: Post) => {
    try {
      const [fullPost, stats] = await Promise.all([
        postService.getPostById(post.id),
        postService.getPostStats(post.id).catch(() => null),
      ]);
      setSelectedPost({
        ...fullPost,
        reactionCount: stats?.reactionCount,
        commentCount: stats?.commentCount,
        viewCount: stats?.viewCount,
      });
    } catch {
      setSelectedPost(post);
    }
  };

  // ── Helpers ─────────────────────────────────────────────
  const getStatusLabel = (s: string) => STATUS_LABELS[s] ?? s;
  const getStatusBadge = (s: string) => STATUS_BADGE[s] ?? "published";

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const fmtDt = (iso: string) =>
    new Date(iso).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="posts-mgmt-page">
      {/* ── Header ── */}
      <div className="posts-mgmt-header">
        <div>
          <h1 className="posts-mgmt-title">
            <FileText size={24} />
            Bài viết người dùng
          </h1>
          <p className="posts-mgmt-subtitle">
            Quản lý, kiểm duyệt và xem thống kê bài viết trên nền tảng
          </p>
        </div>
        <button
          className="posts-refresh-btn"
          onClick={() => fetchPosts(page)}
          disabled={loading}
          title="Làm mới"
        >
          <RefreshCw size={16} className={loading ? "posts-spin" : ""} />
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="posts-mgmt-filters">
        <div className="posts-search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Tìm bài viết theo tiêu đề hoặc tác giả..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
          />
          {searchQuery && (
            <button
              className="posts-search-clear"
              onClick={() => {
                setSearchQuery("");
                setPage(1);
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <select
          className="posts-status-filter"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {/* ── Table ── */}
      <div className="posts-mgmt-table-card">
        {loading ? (
          <div className="posts-loading">
            <Loader2 size={32} className="posts-spin" />
            <span>Đang tải dữ liệu...</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="posts-empty">
            <FileText size={40} />
            <p>Không có bài viết nào</p>
            <p className="posts-empty-sub">
              Thử thay đổi bộ lọc hoặc tìm kiếm khác
            </p>
          </div>
        ) : (
          <table className="posts-mgmt-table">
            <thead>
              <tr>
                <th>Tiêu đề</th>
                <th>Tác giả</th>
                <th>Ngày tạo</th>
                <th>Trạng thái</th>
                <th>Tương tác</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr
                  key={post.id}
                  className={
                    actionLoading === post.id ? "posts-row-loading" : ""
                  }
                >
                  {/* Title */}
                  <td>
                    <div className="post-title-cell">
                      <FileText size={14} className="post-icon" />
                      <div className="post-title-wrap">
                        <span className="post-title" title={post.title}>
                          {post.title || <em>(Không có tiêu đề)</em>}
                        </span>
                        {post.moodTag && (
                          <span className="post-mood-tag">
                            #{getMoodLabel(post.moodTag)}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Author */}
                  <td className="post-author">
                    @{post.userFullName ?? post.userId}
                  </td>

                  {/* Date */}
                  <td className="post-date">{fmt(post.createdAt)}</td>

                  {/* Status */}
                  <td>
                    <span
                      className={`post-status-badge ${getStatusBadge(post.status)}`}
                    >
                      {getStatusLabel(post.status)}
                    </span>
                  </td>

                  {/* Engagement */}
                  <td>
                    <div className="post-engagement">
                      <span className="post-eng-item" title="Reactions">
                        ❤️ {post.reactionCount ?? 0}
                      </span>
                      <span className="post-eng-item" title="Comments">
                        💬 {post.commentCount ?? 0}
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td>
                    <div className="post-actions">
                      <button
                        className="post-action-btn"
                        onClick={() => handleViewDetail(post)}
                        title="Xem chi tiết"
                      >
                        <Eye size={14} />
                      </button>

                      {post.status === "Published" && (
                        <>
                          <button
                            className="post-action-btn post-action-btn--hide"
                            onClick={() => handleHide(post.id)}
                            title="Ẩn bài viết"
                            disabled={!!actionLoading}
                          >
                            <EyeOff size={14} />
                          </button>
                          <button
                            className="post-action-btn post-action-btn--draft"
                            onClick={() => handleDraft(post.id)}
                            title="Chuyển về nháp"
                            disabled={!!actionLoading}
                          >
                            <Archive size={14} />
                          </button>
                        </>
                      )}

                      {(post.status === "Archived" ||
                        post.status === "Draft") && (
                        <button
                          className="post-action-btn post-action-btn--publish"
                          onClick={() => handlePublish(post.id)}
                          title="Xuất bản"
                          disabled={!!actionLoading}
                        >
                          <Globe size={14} />
                        </button>
                      )}

                      {post.status === "Archived" && (
                        <button
                          className="post-action-btn post-action-btn--restore"
                          onClick={() => handleUnhide(post.id)}
                          title="Khôi phục"
                          disabled={!!actionLoading}
                        >
                          <Globe size={14} />
                        </button>
                      )}

                      <button
                        className="post-action-btn post-action-btn--delete"
                        onClick={() => handleDelete(post.id)}
                        title="Xoá bài viết"
                        disabled={!!actionLoading}
                      >
                        {actionLoading === post.id ? (
                          <Loader2 size={14} className="posts-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination ── */}
      {!loading && totalPages > 1 && (
        <div className="posts-pagination">
          <span className="posts-pagination-info">
            Hiển thị{" "}
            <strong>
              {(page - 1) * 20 + 1}–{Math.min(page * 20, totalCount)}
            </strong>{" "}
            trong <strong>{totalCount}</strong> bài viết · Trang{" "}
            <strong>{page}</strong>/<strong>{totalPages}</strong>
          </span>
          <div className="posts-pagination-controls">
            <button
              className="posts-pagination-btn"
              onClick={() => fetchPosts(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft size={16} />
              Trước
            </button>

            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  className={`posts-pagination-btn ${page === pageNum ? "active" : ""}`}
                  onClick={() => fetchPosts(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              className="posts-pagination-btn"
              onClick={() => fetchPosts(page + 1)}
              disabled={page >= totalPages}
            >
              Sau
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── Detail Modal ── */}
      {selectedPost && (
        <div
          className="posts-modal-overlay"
          onClick={() => setSelectedPost(null)}
        >
          <div className="posts-modal" onClick={(e) => e.stopPropagation()}>
            <div className="posts-modal-header">
              <h3>{selectedPost.title || "(Không có tiêu đề)"}</h3>
              <button onClick={() => setSelectedPost(null)}>×</button>
            </div>
            <div className="posts-modal-body">
              <div className="posts-detail-row">
                <span>Tác giả:</span>
                <strong>
                  @{selectedPost.userFullName ?? selectedPost.userId}
                </strong>
              </div>

              <div className="posts-detail-row">
                <span>Trạng thái:</span>
                <span
                  className={`post-status-badge ${getStatusBadge(selectedPost.status)}`}
                >
                  {getStatusLabel(selectedPost.status)}
                </span>
              </div>

              {selectedPost.moodTag && (
                <div className="posts-detail-row">
                  <span>Mood:</span>
                  <strong>#{getMoodLabel(selectedPost.moodTag)}</strong>
                </div>
              )}

              <div className="posts-detail-row">
                <span>Quyền riêng tư:</span>
                <strong>{selectedPost.privacyScope ?? "—"}</strong>
              </div>

              <div className="posts-detail-row">
                <span>Ngày tạo:</span>
                <strong>{fmtDt(selectedPost.createdAt)}</strong>
              </div>

              {selectedPost.publishedAt && (
                <div className="posts-detail-row">
                  <span>Ngày đăng:</span>
                  <strong>{fmtDt(selectedPost.publishedAt)}</strong>
                </div>
              )}

              <div className="posts-detail-row">
                <span>Tương tác:</span>
                <strong>
                  ❤️ {selectedPost.reactionCount ?? 0} &nbsp; 💬{" "}
                  {selectedPost.commentCount ?? 0} &nbsp; 👁{" "}
                  {selectedPost.viewCount ?? 0}
                </strong>
              </div>

              {selectedPost.postType === "share-music" &&
                selectedPost.shareMusic && (
                  <div className="posts-detail-row">
                    <span>Loại:</span>
                    <strong>
                      🎵 Chia sẻ nhạc — {selectedPost.shareMusic.title}
                    </strong>
                  </div>
                )}

              <div className="posts-content-preview">
                <span>Nội dung:</span>
                <p>{selectedPost.contentText || "(Không có nội dung)"}</p>
              </div>
            </div>

            <div className="posts-modal-footer">
              {selectedPost.status === "Published" && (
                <>
                  <button
                    className="post-action-btn post-action-btn--hide"
                    onClick={() => {
                      handleHide(selectedPost.id);
                      setSelectedPost(null);
                    }}
                  >
                    <EyeOff size={14} />
                    Ẩn bài viết
                  </button>
                  <button
                    className="post-action-btn post-action-btn--draft"
                    onClick={() => {
                      handleDraft(selectedPost.id);
                      setSelectedPost(null);
                    }}
                  >
                    <Archive size={14} />
                    Chuyển nháp
                  </button>
                </>
              )}

              {(selectedPost.status === "Archived" ||
                selectedPost.status === "Draft") && (
                <button
                  className="post-action-btn post-action-btn--publish"
                  onClick={() => {
                    handlePublish(selectedPost.id);
                    setSelectedPost(null);
                  }}
                >
                  <Globe size={14} />
                  Xuất bản
                </button>
              )}

              <button
                className="post-action-btn post-action-btn--delete"
                onClick={() => {
                  handleDelete(selectedPost.id);
                  setSelectedPost(null);
                }}
              >
                <Trash2 size={14} />
                Xoá bài viết
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
