import { useState, useEffect } from "react";
import { Mic2, Eye, Loader2, RefreshCw } from "lucide-react";
import podcastService from "../../../services/podcastService";
import type { PodcastItem } from "../../../types/podcast";
import { showError } from "../../../components/common/toastUtils";
import MyPodcastDetail from "./MyPodcastDetail";
import "./MyPostsSettings.css"; // Reuse styling where possible
import "./MyPodcastsSettings.css";

export default function MyPodcastsSettings() {
  const [podcasts, setPodcasts] = useState<PodcastItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPodcast, setSelectedPodcast] = useState<PodcastItem | null>(
    null
  );

  const fetchMyPodcasts = async () => {
    try {
      setLoading(true);
      const data = await podcastService.getMyPodcasts();
      setPodcasts(data);
    } catch (error: any) {
      showError("Lỗi", error.message || "Không thể tải danh sách podcast");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyPodcasts();
  }, []);

  const getStatusBadge = (status?: string) => {
    const s = (status || "draft").toLowerCase();
    if (s === "published") {
      return <span className="post-status published">Đã xuất bản</span>;
    }
    if (s === "pending") {
      return <span className="post-status pending" style={{ backgroundColor: "#f59e0b", color: "#fff" }}>Đang chờ duyệt</span>;
    }
    return <span className="post-status draft">Bản nháp</span>;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (selectedPodcast) {
    return (
      <MyPodcastDetail
        podcast={selectedPodcast}
        onBack={() => {
          setSelectedPodcast(null);
          fetchMyPodcasts(); // Refresh list when returning just in case
        }}
      />
    );
  }

  return (
    <div className="posts-settings my-podcasts-settings">
      <div className="settings-section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Podcast của tôi</h1>
          <p>Quản lý các podcast do bạn tạo</p>
        </div>
        <button className="mps-btn" onClick={fetchMyPodcasts} disabled={loading}>
          <RefreshCw size={16} className={loading ? "spin" : ""} />
          Làm mới
        </button>
      </div>

      {loading ? (
        <div className="posts-loading">
          <Loader2 size={32} className="posts-spinner" />
          <p>Đang tải danh sách podcast...</p>
        </div>
      ) : podcasts.length === 0 ? (
        <div className="posts-empty">
          <Mic2 size={48} />
          <h3>Chưa có podcast nào</h3>
          <p>Bạn chưa tạo podcast nào hoặc chưa có podcast được duyệt.</p>
        </div>
      ) : (
        <div className="posts-list">
          {podcasts.map((podcast) => (
            <div key={podcast.id} className="post-card" style={{ cursor: "pointer" }} onClick={() => setSelectedPodcast(podcast)}>
              <div className="post-card-header">
                <div className="post-card-icon" style={{ padding: 0, overflow: "hidden" }}>
                  {podcast.banner ? (
                    <img src={podcast.banner} alt={podcast.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <Mic2 size={20} />
                  )}
                </div>
                <div className="post-card-title">
                  <h3>{podcast.title}</h3>
                  <div className="post-card-meta">
                    {getStatusBadge(podcast.status)}
                    <span className="post-date">
                      Tạo {formatDate(podcast.createdAt)}
                    </span>
                    {podcast.isPaid ? (
                      <span className="post-date" style={{ color: "#10b981", fontWeight: 600 }}>
                        {podcast.price?.toLocaleString()}đ
                      </span>
                    ) : (
                      <span className="post-date" style={{ color: "#6366f1" }}>
                        Miễn phí
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="post-card-actions">
                <button
                  className="post-action-btn view"
                  title="Xem chi tiết"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPodcast(podcast);
                  }}
                >
                  <Eye size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
