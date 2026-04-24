import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Loader2,
  Mic2,
  Plus,
  Play,
  Clock,
  CheckCircle,
  XCircle,
  Clock3,
} from "lucide-react";
import podcastService from "../../../services/podcastService";
import type { PodcastItem, PodcastEpisode } from "../../../types/podcast";
import { showSuccess, showError } from "../../../components/common/toastUtils";
import CreateEpisodeRequestModal from "./CreateEpisodeRequestModal";

interface Props {
  podcast: PodcastItem;
  onBack: () => void;
}

export default function MyPodcastDetail({ podcast, onBack }: Props) {
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch current episodes
      const eps = await podcastService.getEpisodes(podcast.id);
      setEpisodes(eps);

      // Fetch pending requests
      const reqs = await podcastService.getMyEpisodeRequests();
      // Filter for this podcast
      setRequests(reqs.filter((r: any) => r.podcastId === podcast.id));
    } catch (error: any) {
      showError("Lỗi", "Không thể tải danh sách tập");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [podcast.id]);

  const getStatusBadge = (status?: string) => {
    const s = (status || "draft").toLowerCase();
    if (s === "published") {
      return <span className="post-status published">Đã xuất bản</span>;
    }
    if (s === "pending") {
      return (
        <span
          className="post-status pending"
          style={{ backgroundColor: "#f59e0b", color: "#fff" }}
        >
          Đang chờ duyệt
        </span>
      );
    }
    if (s === "rejected") {
      return (
        <span
          className="post-status rejected"
          style={{ backgroundColor: "#ef4444", color: "#fff" }}
        >
          Bị từ chối
        </span>
      );
    }
    return <span className="post-status draft">Bản nháp</span>;
  };

  const getRequestStatusIcon = (status: string) => {
    const s = status.toLowerCase();
    if (s === "approved") return <CheckCircle size={16} color="#10b981" />;
    if (s === "rejected") return <XCircle size={16} color="#ef4444" />;
    return <Clock3 size={16} color="#f59e0b" />;
  };

  const getRequestStatusText = (status: string) => {
    const s = status.toLowerCase();
    if (s === "approved") return "Đã duyệt";
    if (s === "rejected") return "Từ chối";
    return "Đang chờ duyệt";
  };

  return (
    <div className="posts-settings my-podcasts-settings my-podcast-detail">
      <div className="settings-section-header" style={{ marginBottom: 0 }}>
        <button
          className="mps-btn mps-btn--cancel"
          onClick={onBack}
          style={{ marginBottom: "16px", alignSelf: "flex-start", width: "fit-content" }}
        >
          <ArrowLeft size={16} />
          Quay lại
        </button>
      </div>

      <div className="mpd-header">
        <div className="mpd-banner">
          {podcast.banner ? (
            <img src={podcast.banner} alt={podcast.title} style={{ width: "100%", height: "100%", borderRadius: 12, objectFit: "cover" }} />
          ) : (
            <Mic2 size={48} />
          )}
        </div>
        <div className="mpd-info">
          <h2>{podcast.title}</h2>
          <p>{podcast.description}</p>
          <div className="mpd-meta-row">
            {getStatusBadge(podcast.status)}
            {podcast.isPaid ? (
              <span style={{ color: "#10b981", fontWeight: 600 }}>
                {podcast.price?.toLocaleString()}đ
              </span>
            ) : (
              <span style={{ color: "#6366f1" }}>Miễn phí</span>
            )}
            <span style={{ color: "var(--neutral-400)" }}>
              {episodes.length} tập
            </span>
          </div>
        </div>
      </div>

      <div className="mpd-episodes-section">
        <div className="mpd-episodes-header">
          <h3>Danh sách tập</h3>
          <button
            className="mps-btn mps-btn--save"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={16} />
            Yêu cầu thêm tập
          </button>
        </div>

        {loading ? (
          <div className="posts-loading">
            <Loader2 size={32} className="posts-spinner" />
          </div>
        ) : (
          <div className="mpd-episode-list">
            {episodes.map((ep, idx) => (
              <div key={ep.id} className="mpd-episode-card">
                <div className="mpd-episode-thumb">
                  {ep.thumbnailUrl || podcast.banner ? (
                    <img
                      src={ep.thumbnailUrl || podcast.banner}
                      alt={ep.title}
                      style={{ width: "100%", height: "100%", borderRadius: 8, objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Play size={20} color="var(--neutral-500)" />
                    </div>
                  )}
                </div>
                <div className="mpd-episode-info">
                  <h4>
                    Tập {idx + 1}: {ep.title}
                  </h4>
                  <p>{ep.description}</p>
                  <div className="mpd-episode-meta">
                    {ep.duration && (
                      <span>
                        <Clock size={14} />
                        {Math.floor(ep.duration / 60)}:
                        {String(ep.duration % 60).padStart(2, "0")}
                      </span>
                    )}
                    <span>
                      {new Date(ep.createdAt || Date.now()).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                </div>
                <div className="mpd-episode-status">
                  <span className="post-status published">Đã xuất bản</span>
                </div>
              </div>
            ))}

            {requests.map((req) => {
              if (req.status?.toLowerCase() === "approved") return null; // Approved requests become actual episodes
              return (
                <div key={req.id} className="mpd-episode-card" style={{ opacity: 0.8, borderStyle: "dashed" }}>
                  <div className="mpd-episode-thumb">
                    {req.thumbnailUrl ? (
                      <img
                        src={req.thumbnailUrl}
                        alt={req.title}
                        style={{ width: "100%", height: "100%", borderRadius: 8, objectFit: "cover" }}
                      />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Play size={20} color="var(--neutral-500)" />
                      </div>
                    )}
                  </div>
                  <div className="mpd-episode-info">
                    <h4>[Yêu cầu mới] {req.title}</h4>
                    <p>{req.description}</p>
                    <div className="mpd-episode-meta">
                      {req.duration && (
                        <span>
                          <Clock size={14} />
                          {Math.floor(req.duration / 60)}:
                          {String(req.duration % 60).padStart(2, "0")}
                        </span>
                      )}
                      <span>
                        {new Date(req.createdAt || Date.now()).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                    {req.status?.toLowerCase() === "rejected" && req.rejectReason && (
                      <p style={{ color: "#ef4444", marginTop: 4, fontSize: 13 }}>Lý do từ chối: {req.rejectReason}</p>
                    )}
                  </div>
                  <div className="mpd-episode-status" style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--neutral-400)", fontSize: 13, fontWeight: 500 }}>
                    {getRequestStatusIcon(req.status || "pending")}
                    {getRequestStatusText(req.status || "pending")}
                  </div>
                </div>
              );
            })}

            {episodes.length === 0 && requests.length === 0 && (
              <div className="posts-empty" style={{ minHeight: 200 }}>
                <Mic2 size={32} />
                <p>Chưa có tập nào. Hãy yêu cầu thêm tập mới.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <CreateEpisodeRequestModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        podcastId={podcast.id}
        onSuccess={() => {
          setShowAddModal(false);
          showSuccess("Thành công", "Đã gửi yêu cầu thêm tập mới");
          fetchData(); // Refresh list
        }}
      />
    </div>
  );
}
