import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Headphones,
  Mic2,
  Music,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  liveSessionApiService,
  type PodcastResult,
  type EpisodeResult,
} from "../../../services/liveSessionApiService";
import { showError, showSuccess } from "../../../components/common/toastUtils";
import "./LiveOps.css";

/* ── helpers ── */

const fmtDate = (d: string | null) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const fmtDuration = (s: number) => {
  if (!s) return "—";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

/* ══════════════════════════════════════════════
   PodcastPage
   ══════════════════════════════════════════════ */

export default function PodcastPage() {
  const navigate = useNavigate();
  const [podcasts, setPodcasts] = useState<PodcastResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreateEp, setShowCreateEp] = useState<string | null>(null); // podcastId

  const loadPodcasts = async () => {
    setLoading(true);
    try {
      const data = await liveSessionApiService.getPodcasts();
      setPodcasts(data);
    } catch {
      showError("Lỗi", "Không thể tải danh sách podcast");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPodcasts();
  }, []);

  const deletePodcast = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa podcast này?")) return;
    try {
      await liveSessionApiService.deletePodcast(id);
      setPodcasts((prev) => prev.filter((item) => item.id !== id));
      if (expandedId === id) setExpandedId(null);
      showSuccess("Đã xóa podcast");
    } catch {
      showError("Xóa podcast thất bại");
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="ops-page">
      <div className="ops-header">
        <div>
          <h1 className="ops-title">
            <Mic2
              size={26}
              style={{ display: "inline", verticalAlign: "middle" }}
            />{" "}
            Trang Podcast
          </h1>
          <p className="ops-subtitle">Quản lý podcast và các tập phát sóng</p>
        </div>
        <div className="ops-actions">
          <button className="ops-btn ops-btn--ghost" onClick={loadPodcasts}>
            <RefreshCw size={15} />
            Làm mới
          </button>
          <button
            className="ops-btn ops-btn--primary"
            onClick={() => navigate("/admin/podcasts/new")}
          >
            <Plus size={15} />
            Tạo podcast
          </button>
        </div>
      </div>

      <div className="ops-card">
        {loading ? (
          <div className="ops-stack">
            <div className="ops-skeleton" />
            <div className="ops-skeleton" />
            <div className="ops-skeleton" />
          </div>
        ) : podcasts.length === 0 ? (
          <div className="ops-empty">Chưa có podcast nào</div>
        ) : (
          <div className="ops-stack" style={{ gap: 0 }}>
            {podcasts.map((podcast) => (
              <PodcastRow
                key={podcast.id}
                podcast={podcast}
                expanded={expandedId === podcast.id}
                onToggle={() => toggleExpand(podcast.id)}
                onEdit={() => navigate(`/admin/podcasts/${podcast.id}`)}
                onDelete={() => void deletePodcast(podcast.id)}
                onCreateEpisode={() => setShowCreateEp(podcast.id)}
                onEpisodeChange={loadPodcasts}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Episode Modal */}
      {showCreateEp && (
        <CreateEpisodeModal
          podcastId={showCreateEp}
          onClose={() => setShowCreateEp(null)}
          onCreated={() => {
            setShowCreateEp(null);
            void loadPodcasts();
            // force re-expand to refresh episodes
            setExpandedId((prev) => {
              if (prev === showCreateEp) {
                setTimeout(() => setExpandedId(showCreateEp), 50);
                return null;
              }
              return showCreateEp;
            });
          }}
        />
      )}
    </div>
  );
}

/* ────────────────────────────────────────────
   PodcastRow — expandable with episodes
   ──────────────────────────────────────────── */

function PodcastRow({
  podcast,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  onCreateEpisode,
  onEpisodeChange,
}: {
  podcast: PodcastResult;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCreateEpisode: () => void;
  onEpisodeChange: () => void;
}) {
  const [episodes, setEpisodes] = useState<EpisodeResult[]>([]);
  const [loadingEps, setLoadingEps] = useState(false);

  useEffect(() => {
    if (!expanded) return;

    const load = async () => {
      setLoadingEps(true);
      try {
        const data = await liveSessionApiService.getEpisodes(podcast.id);
        setEpisodes(data);
      } catch {
        // silent
      } finally {
        setLoadingEps(false);
      }
    };

    void load();
  }, [expanded, podcast.id]);

  const deleteEpisode = async (epId: string) => {
    if (!confirm("Xóa tập này?")) return;
    try {
      await liveSessionApiService.deleteEpisode(podcast.id, epId);
      setEpisodes((prev) => prev.filter((e) => e.id !== epId));
      onEpisodeChange();
      showSuccess("Đã xóa tập");
    } catch {
      showError("Xóa tập thất bại");
    }
  };

  const statusBadge = () => {
    switch (podcast.status?.toLowerCase()) {
      case "published":
        return <span className="ops-badge ops-badge--good">Xuất bản</span>;
      case "archived":
        return <span className="ops-badge ops-badge--warn">Lưu trữ</span>;
      default:
        return <span className="ops-badge">Bản nháp</span>;
    }
  };

  return (
    <div className={`pe-podcast-row${expanded ? " expanded" : ""}`}>
      {/* Main row */}
      <div className="pe-podcast-main" onClick={onToggle}>
        <div className="pe-podcast-expand">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>

        <div className="pe-podcast-info">
          <span className="pe-podcast-name">{podcast.title}</span>
          <span className="pe-podcast-author">{podcast.author || "—"}</span>
        </div>

        <div className="pe-podcast-meta">
          {statusBadge()}
          <span className="pe-podcast-ep-count">
            <Headphones size={13} />
            {podcast.episodeCount} tập
          </span>
        </div>

        <div
          className="pe-podcast-actions"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="ops-btn ops-btn--ghost"
            onClick={onCreateEpisode}
            title="Tạo tập mới"
          >
            <Plus size={14} />
            Tạo tập
          </button>
          <button
            className="ops-btn ops-btn--ghost"
            onClick={onEdit}
            title="Sửa podcast"
          >
            <Pencil size={14} />
          </button>
          <button
            className="ops-btn ops-btn--ghost"
            onClick={onDelete}
            title="Xóa podcast"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Expanded — Episodes */}
      {expanded && (
        <div className="pe-episodes">
          {loadingEps ? (
            <div className="ops-stack" style={{ padding: 16 }}>
              <div className="ops-skeleton" />
              <div className="ops-skeleton" />
            </div>
          ) : episodes.length === 0 ? (
            <div className="pe-episodes-empty">
              <Music size={20} />
              <span>Chưa có tập nào</span>
              <button
                className="ops-btn ops-btn--primary"
                onClick={onCreateEpisode}
                style={{ height: 32, fontSize: 12 }}
              >
                <Plus size={13} />
                Tạo tập đầu tiên
              </button>
            </div>
          ) : (
            <div className="pe-episodes-list">
              <div className="pe-episodes-header">
                <span>#</span>
                <span>Tiêu đề</span>
                <span>Thời lượng</span>
                <span>Ngày phát</span>
                <span />
              </div>
              {episodes.map((ep) => (
                <div key={ep.id} className="pe-episode-item">
                  <span className="pe-ep-number">
                    {ep.episodeNumber || "—"}
                  </span>
                  <div className="pe-ep-info">
                    <span className="pe-ep-title">{ep.title}</span>
                    {ep.description && (
                      <span className="pe-ep-desc">{ep.description}</span>
                    )}
                  </div>
                  <span className="pe-ep-duration">
                    {fmtDuration(ep.duration)}
                  </span>
                  <span className="pe-ep-date">{fmtDate(ep.publishDate)}</span>
                  <div className="pe-ep-actions">
                    {ep.audioUrl && (
                      <a
                        href={ep.audioUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="ops-btn ops-btn--ghost"
                        style={{ height: 30, fontSize: 11 }}
                        title="Nghe"
                      >
                        <Play size={13} />
                      </a>
                    )}
                    <button
                      className="ops-btn ops-btn--ghost"
                      style={{ height: 30, fontSize: 11 }}
                      onClick={() => void deleteEpisode(ep.id)}
                      title="Xóa tập"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────
   CreateEpisodeModal
   ──────────────────────────────────────────── */

function CreateEpisodeModal({
  podcastId,
  onClose,
  onCreated,
}: {
  podcastId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [episodeNumber, setEpisodeNumber] = useState<number | "">("");
  const [publishDate, setPublishDate] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const audioRef = useRef<HTMLInputElement>(null);
  const thumbRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!title.trim()) {
      showError("Vui lòng nhập tiêu đề tập");
      return;
    }

    const formData = new FormData();
    formData.append("Title", title);
    if (description) formData.append("Description", description);
    if (episodeNumber) formData.append("EpisodeNumber", String(episodeNumber));
    if (publishDate)
      formData.append("PublishDate", new Date(publishDate).toISOString());
    if (audioFile) formData.append("AudioFile", audioFile);
    if (thumbnailFile) formData.append("ThumbnailFile", thumbnailFile);

    setSaving(true);
    try {
      await liveSessionApiService.createEpisode(podcastId, formData);
      showSuccess("Tạo tập thành công");
      onCreated();
    } catch {
      showError("Tạo tập thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ops-modal-overlay" onClick={onClose}>
      <div
        className="ops-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 560 }}
      >
        <div
          className="ops-modal-head"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
            <Mic2
              size={16}
              style={{
                marginRight: 8,
                verticalAlign: "middle",
                color: "#55c5f1",
              }}
            />
            Tạo tập mới
          </h3>
          <button
            className="ops-btn ops-btn--ghost"
            onClick={onClose}
            style={{ height: 30, padding: "0 6px" }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="ops-modal-body">
          <div className="ops-stack" style={{ gap: 14 }}>
            {/* Title */}
            <div className="pe-field">
              <label className="pe-label">
                Tiêu đề <span className="pe-required">*</span>
              </label>
              <input
                className="ops-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Tên tập phát sóng..."
              />
            </div>

            {/* Episode number + Publish date */}
            <div className="pe-row">
              <div className="pe-field pe-field--half">
                <label className="pe-label">Số tập</label>
                <input
                  className="ops-input"
                  type="number"
                  min={1}
                  value={episodeNumber}
                  onChange={(e) =>
                    setEpisodeNumber(
                      e.target.value ? Number(e.target.value) : "",
                    )
                  }
                  placeholder="1"
                />
              </div>
              <div className="pe-field pe-field--half">
                <label className="pe-label">Ngày phát sóng</label>
                <input
                  className="ops-input"
                  type="datetime-local"
                  value={publishDate}
                  onChange={(e) => setPublishDate(e.target.value)}
                />
              </div>
            </div>

            {/* Description */}
            <div className="pe-field">
              <label className="pe-label">Mô tả</label>
              <textarea
                className="ops-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả ngắn về tập này..."
                rows={3}
              />
            </div>

            {/* Audio file */}
            <div className="pe-field">
              <label className="pe-label">
                <Music size={13} />
                File âm thanh
              </label>
              <div
                className="pe-file-pick"
                onClick={() => audioRef.current?.click()}
              >
                <Upload size={16} />
                {audioFile ? (
                  <span>
                    {audioFile.name} (
                    {(audioFile.size / 1024 / 1024).toFixed(1)} MB)
                  </span>
                ) : (
                  <span>Chọn file MP3, WAV, OGG...</span>
                )}
              </div>
              <input
                ref={audioRef}
                type="file"
                accept="audio/*"
                style={{ display: "none" }}
                onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
              />
            </div>

            {/* Thumbnail */}
            <div className="pe-field">
              <label className="pe-label">Ảnh thumbnail</label>
              <div
                className="pe-file-pick"
                onClick={() => thumbRef.current?.click()}
              >
                <Upload size={16} />
                {thumbnailFile ? (
                  <span>{thumbnailFile.name}</span>
                ) : (
                  <span>Chọn ảnh PNG, JPG...</span>
                )}
              </div>
              <input
                ref={thumbRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>
        </div>

        <div className="ops-modal-foot">
          <button className="ops-btn ops-btn--ghost" onClick={onClose}>
            Hủy
          </button>
          <button
            className="ops-btn ops-btn--primary"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? "Đang tạo..." : "Tạo tập"}
          </button>
        </div>
      </div>
    </div>
  );
}
