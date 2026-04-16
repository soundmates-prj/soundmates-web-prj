import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
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
import { uploadAudio, uploadImage } from "../../../utils/cloudinaryUpload";
import "./LiveOps.css";

/* ── helpers ── */

/** Đọc duration (giây) từ File audio bằng HTML5 Audio API */
const getAudioDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.preload = "metadata";
    const url = URL.createObjectURL(file);
    audio.src = url;
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Math.round(audio.duration));
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Không thể đọc metadata audio"));
    };
  });
};

const fmtDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

const fmtDate = (d: string | null) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

/* ══════════════════════════════════════════════
   PodcastPage
   ══════════════════════════════════════════════ */

export default function PodcastPage() {
  const navigate = useNavigate();
  const [podcasts, setPodcasts] = useState<PodcastResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreateEp, setShowCreateEp] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

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
    try {
      await liveSessionApiService.deletePodcast(id);
      setPodcasts((prev) => prev.filter((item) => item.id !== id));
      if (expandedId === id) setExpandedId(null);
      showSuccess("Đã xóa podcast");
    } catch {
      showError("Xóa podcast thất bại");
    }
  };

  const askDeletePodcast = (id: string, title: string) => {
    setConfirmDialog({
      title: "Xóa podcast",
      message: `Bạn có chắc muốn xóa "${title}"? Tất cả các tập trong podcast này cũng sẽ bị xóa.`,
      onConfirm: () => {
        setConfirmDialog(null);
        void deletePodcast(id);
      },
    });
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
                onDelete={() => askDeletePodcast(podcast.id, podcast.title)}
                onCreateEpisode={() => setShowCreateEp(podcast.id)}
                onEpisodeChange={loadPodcasts}
                onAskConfirm={setConfirmDialog}
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

      {/* Confirm Dialog */}
      {confirmDialog && (
        <div
          className="ops-modal-overlay"
          onClick={() => setConfirmDialog(null)}
        >
          <div
            className="ops-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 420 }}
          >
            <div
              className="ops-modal-body"
              style={{ padding: "28px 24px", textAlign: "center" }}
            >
              <div className="pe-confirm-icon">
                <AlertTriangle size={28} />
              </div>
              <h3 className="pe-confirm-title">{confirmDialog.title}</h3>
              <p className="pe-confirm-message">{confirmDialog.message}</p>
              <div className="pe-confirm-actions">
                <button
                  className="ops-btn ops-btn--ghost"
                  onClick={() => setConfirmDialog(null)}
                >
                  Hủy
                </button>
                <button
                  className="pe-confirm-delete"
                  onClick={confirmDialog.onConfirm}
                >
                  <Trash2 size={14} />
                  Xóa
                </button>
              </div>
            </div>
          </div>
        </div>
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
  onAskConfirm,
}: {
  podcast: PodcastResult;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCreateEpisode: () => void;
  onEpisodeChange: () => void;
  onAskConfirm: (
    dialog: { title: string; message: string; onConfirm: () => void } | null,
  ) => void;
}) {
  const [episodes, setEpisodes] = useState<EpisodeResult[]>([]);
  const [loadingEps, setLoadingEps] = useState(false);
  const [editingEp, setEditingEp] = useState<EpisodeResult | null>(null);

  const loadEpisodes = async () => {
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

  useEffect(() => {
    if (!expanded) return;
    void loadEpisodes();
  }, [expanded, podcast.id]);

  const doDeleteEpisode = async (epId: string) => {
    try {
      await liveSessionApiService.deleteEpisode(podcast.id, epId);
      setEpisodes((prev) => prev.filter((e) => e.id !== epId));
      onEpisodeChange();
      showSuccess("Đã xóa tập");
    } catch {
      showError("Xóa tập thất bại");
    }
  };

  const askDeleteEpisode = (ep: EpisodeResult) => {
    onAskConfirm({
      title: "Xóa tập podcast",
      message: `Bạn có chắc muốn xóa tập "${ep.title}"?`,
      onConfirm: () => {
        onAskConfirm(null);
        void doDeleteEpisode(ep.id);
      },
    });
  };

  const statusBadge = () => {
    switch (podcast.status?.toLowerCase()) {
      case "published":
        return <span className="ops-badge ops-badge--good">Published</span>;
      case "archived":
        return <span className="ops-badge ops-badge--warn">Archived</span>;
      default:
        return <span className="ops-badge">Draft</span>;
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
                    {ep.duration > 0 ? fmtDuration(ep.duration) : "—"}
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
                      onClick={() => setEditingEp(ep)}
                      title="Sửa tập"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      className="ops-btn ops-btn--ghost"
                      style={{ height: 30, fontSize: 11 }}
                      onClick={() => askDeleteEpisode(ep)}
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

      {/* Edit Episode Modal */}
      {editingEp && (
        <EditEpisodeModal
          podcastId={podcast.id}
          episode={editingEp}
          onClose={() => setEditingEp(null)}
          onUpdated={() => {
            setEditingEp(null);
            void loadEpisodes();
            onEpisodeChange();
          }}
        />
      )}
    </div>
  );
}

/* ────────────────────────────────────────────
   EditEpisodeModal
   ──────────────────────────────────────────── */

function EditEpisodeModal({
  podcastId,
  episode,
  onClose,
  onUpdated,
}: {
  podcastId: string;
  episode: EpisodeResult;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [title, setTitle] = useState(episode.title);
  const [description, setDescription] = useState(episode.description || "");
  const [episodeNumber, setEpisodeNumber] = useState<number | "">(
    episode.episodeNumber || "",
  );
  const [publishDate, setPublishDate] = useState(() => {
    if (!episode.publishDate) return "";
    return episode.publishDate.slice(0, 16); // yyyy-MM-ddTHH:mm
  });
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [duration, setDuration] = useState<number | null>(null);

  const audioRef = useRef<HTMLInputElement>(null);
  const thumbRef = useRef<HTMLInputElement>(null);

  const handleAudioChange = async (file: File | null) => {
    setAudioFile(file);
    if (file) {
      try {
        const dur = await getAudioDuration(file);
        setDuration(dur);
      } catch {
        setDuration(null);
      }
    } else {
      setDuration(null);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      showError("Vui lòng nhập tiêu đề tập");
      return;
    }

    setSaving(true);
    try {
      let audioUrl = "";
      let thumbnailUrl = "";

      if (audioFile) {
        setUploadStatus("Đang upload audio...");
        try {
          const result = await uploadAudio(audioFile);
          audioUrl = result.url;
        } catch (e) {
          console.warn(
            "Cloudinary audio upload failed, sẽ gửi file trực tiếp:",
            e,
          );
        }
      }

      if (thumbnailFile) {
        setUploadStatus("Đang upload ảnh...");
        try {
          thumbnailUrl = await uploadImage(thumbnailFile);
        } catch (e) {
          console.warn(
            "Cloudinary image upload failed, sẽ gửi file trực tiếp:",
            e,
          );
        }
      }

      setUploadStatus("Đang cập nhật...");
      const formData = new FormData();
      formData.append("Title", title);
      formData.append("Description", description);
      if (episodeNumber)
        formData.append("EpisodeNumber", String(episodeNumber));
      if (publishDate)
        formData.append("PublishDate", new Date(publishDate).toISOString());
      if (duration !== null) formData.append("Duration", String(duration));

      if (audioUrl) {
        formData.append("AudioUrl", audioUrl);
      } else if (audioFile) {
        formData.append("AudioFile", audioFile);
      }

      if (thumbnailUrl) {
        formData.append("ThumbnailUrl", thumbnailUrl);
      } else if (thumbnailFile) {
        formData.append("ThumbnailFile", thumbnailFile);
      }

      await liveSessionApiService.updateEpisode(
        podcastId,
        episode.id,
        formData,
      );
      showSuccess("Cập nhật tập thành công");
      onUpdated();
    } catch (err: any) {
      showError("Cập nhật thất bại", err?.message || "");
    } finally {
      setSaving(false);
      setUploadStatus("");
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
            <Pencil
              size={16}
              style={{
                marginRight: 8,
                verticalAlign: "middle",
                color: "#55c5f1",
              }}
            />
            Chỉnh sửa tập
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
            <div className="pe-field">
              <label className="pe-label">
                Tiêu đề <span className="pe-required">*</span>
              </label>
              <input
                className="ops-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Tên tập..."
              />
            </div>

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

            <div className="pe-field">
              <label className="pe-label">Mô tả</label>
              <textarea
                className="ops-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="pe-field">
              <label className="pe-label">
                <Music size={13} /> Đổi file âm thanh
              </label>
              {episode.audioUrl && !audioFile && (
                <div className="pe-current-file">
                  Audio hiện tại:{" "}
                  <a href={episode.audioUrl} target="_blank" rel="noreferrer">
                    Nghe thử
                  </a>
                  {episode.duration > 0 && (
                    <span> • {fmtDuration(episode.duration)}</span>
                  )}
                </div>
              )}
              <div
                className="pe-file-pick"
                onClick={() => audioRef.current?.click()}
              >
                <Upload size={16} />
                {audioFile ? (
                  <span>
                    {audioFile.name} (
                    {(audioFile.size / 1024 / 1024).toFixed(1)} MB)
                    {duration !== null && ` • ${fmtDuration(duration)}`}
                  </span>
                ) : (
                  <span>Chọn file mới (bỏ trống = giữ nguyên)</span>
                )}
              </div>
              <input
                ref={audioRef}
                type="file"
                accept="audio/*"
                style={{ display: "none" }}
                onChange={(e) => handleAudioChange(e.target.files?.[0] || null)}
              />
            </div>

            <div className="pe-field">
              <label className="pe-label">Đổi thumbnail</label>
              <div
                className="pe-file-pick"
                onClick={() => thumbRef.current?.click()}
              >
                <Upload size={16} />
                {thumbnailFile ? (
                  <span>{thumbnailFile.name}</span>
                ) : (
                  <span>Chọn ảnh mới (bỏ trống = giữ nguyên)</span>
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

            {uploadStatus && (
              <div className="pe-upload-status">
                <RefreshCw size={14} className="pe-spin" />
                {uploadStatus}
              </div>
            )}
          </div>
        </div>

        <div className="ops-modal-foot">
          <button
            className="ops-btn ops-btn--ghost"
            onClick={onClose}
            disabled={saving}
          >
            Hủy
          </button>
          <button
            className="ops-btn ops-btn--primary"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? "Đang xử lý..." : "Cập nhật"}
          </button>
        </div>
      </div>
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
  const [duration, setDuration] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  const audioRef = useRef<HTMLInputElement>(null);
  const thumbRef = useRef<HTMLInputElement>(null);

  const handleAudioChange = async (file: File | null) => {
    setAudioFile(file);
    if (file) {
      try {
        const dur = await getAudioDuration(file);
        setDuration(dur);
      } catch {
        setDuration(null);
      }
    } else {
      setDuration(null);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      showError("Vui lòng nhập tiêu đề tập");
      return;
    }

    setSaving(true);
    try {
      let audioUrl = "";
      let thumbnailUrl = "";

      // 1. Thử upload Cloudinary, nếu fail → gửi file trực tiếp
      if (audioFile) {
        setUploadStatus("Đang upload audio...");
        try {
          const result = await uploadAudio(audioFile);
          audioUrl = result.url;
        } catch (e) {
          console.warn(
            "Cloudinary audio upload failed, sẽ gửi file trực tiếp:",
            e,
          );
        }
      }

      if (thumbnailFile) {
        setUploadStatus("Đang upload ảnh...");
        try {
          thumbnailUrl = await uploadImage(thumbnailFile);
        } catch (e) {
          console.warn(
            "Cloudinary image upload failed, sẽ gửi file trực tiếp:",
            e,
          );
        }
      }

      // 2. Tạo FormData
      setUploadStatus("Đang tạo tập...");
      const formData = new FormData();
      formData.append("Title", title);
      if (description) formData.append("Description", description);
      if (episodeNumber)
        formData.append("EpisodeNumber", String(episodeNumber));
      if (publishDate)
        formData.append("PublishDate", new Date(publishDate).toISOString());
      if (duration !== null) formData.append("Duration", String(duration));

      // Audio: ưu tiên URL từ Cloudinary, fallback gửi file trực tiếp
      if (audioUrl) {
        formData.append("AudioUrl", audioUrl);
      } else if (audioFile) {
        formData.append("AudioFile", audioFile);
      }

      // Thumbnail: tương tự
      if (thumbnailUrl) {
        formData.append("ThumbnailUrl", thumbnailUrl);
      } else if (thumbnailFile) {
        formData.append("ThumbnailFile", thumbnailFile);
      }

      await liveSessionApiService.createEpisode(podcastId, formData);
      showSuccess("Tạo tập thành công");
      onCreated();
    } catch (err: any) {
      showError("Tạo tập thất bại", err?.message || "");
    } finally {
      setSaving(false);
      setUploadStatus("");
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
                    {duration !== null && ` • ${fmtDuration(duration)}`}
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
                onChange={(e) => handleAudioChange(e.target.files?.[0] || null)}
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

            {/* Upload status */}
            {uploadStatus && (
              <div className="pe-upload-status">
                <RefreshCw size={14} className="pe-spin" />
                {uploadStatus}
              </div>
            )}
          </div>
        </div>

        <div className="ops-modal-foot">
          <button
            className="ops-btn ops-btn--ghost"
            onClick={onClose}
            disabled={saving}
          >
            Hủy
          </button>
          <button
            className="ops-btn ops-btn--primary"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? "Đang xử lý..." : "Tạo tập"}
          </button>
        </div>
      </div>
    </div>
  );
}
