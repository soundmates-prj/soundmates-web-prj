import { useState, useEffect } from "react";
import { FileText, Edit, Trash2, Eye, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../../../services/axios";
import { showSuccess, showError } from "../../../components/common/toastUtils";
import "./MyPostsSettings.css";

interface Post {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  publishedAt?: string;
}

export default function MyPostsSettings() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

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

  const handleDelete = async (postId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài viết này?")) return;

    try {
      await api.delete(`/posts/${postId}`);
      showSuccess("Đã xóa", "Xóa bài viết thành công");
      fetchPosts(page);
    } catch (error: any) {
      const msg = error.response?.data?.message || "Không thể xóa bài viết";
      showError("Lỗi", msg);
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
              <button className="post-action-btn view" title="Xem">
                <Eye size={16} />
              </button>
              <button className="post-action-btn edit" title="Chỉnh sửa">
                <Edit size={16} />
              </button>
              <button
                className="post-action-btn delete"
                title="Xóa"
                onClick={() => handleDelete(post.id)}
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
    </div>
  );
}
