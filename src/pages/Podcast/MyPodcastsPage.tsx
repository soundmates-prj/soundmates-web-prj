import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock,
  Eye,
  Edit,
  FileAudio,
  Lightbulb,
  ListMusic,
  Loader2,
  Mic2,
  Music,
  Music2,
  Pause,
  Play,
  Plus,
  PlusCircle,
  Radio,
  RefreshCw,
  Search,
  Tag,
  Trash2,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import podcastService from "../../services/podcastService";
import type { PodcastItem, PodcastEpisode } from "../../types/podcast";
import { showError } from "../../components/common/toastUtils";
import { showToast } from "../../utils/toast";
import { uploadAudio, uploadImage } from "../../utils/cloudinaryUpload";
import "./MyPodcastsPage.css";

/* ────────────────────────────────────────────
   Constants (form tạo podcast)
   ──────────────────────────────────────────── */

const TYPE_LABELS: Record<string, string> = {
  technology: "Công nghệ",
  music: "Âm nhạc",
  education: "Giáo dục",
  entertainment: "Giải trí",
  business: "Kinh doanh",
  health: "Sức khỏe",
  sports: "Thể thao",
  news: "Tin tức",
  society: "Xã hội",
  comedy: "Hài kịch",
  love: "Tình yêu",
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB upload banner
const MAX_PRICE = 10_000_000;
const MIN_PRICE = 1000;
const TITLE_MAX = 120;
const DESC_MAX = 1000;

const PRICE_SUGGESTIONS = [
  { label: "Podcast ngắn (1–3 tập):", range: "10k – 30k" },
  { label: "Podcast trung bình (5–10 tập):", range: "30k – 80k" },
  { label: "Podcast dài (10+ tập):", range: "80k – 150k" },
];

// Episode form constants
const MAX_AUDIO_SIZE = 100 * 1024 * 1024; // 100MB
const EP_TITLE_MAX = 120;
const EP_DESC_MAX = 1000;

const formatDuration = (seconds: number): string => {
  if (!seconds || Number.isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const formatVnd = (value: number): string =>
  !value || Number.isNaN(value) ? "" : value.toLocaleString("vi-VN");

// Close modal on Esc — skip khi busy để không làm mất dữ liệu user đang nhập/upload
function useEscapeClose(onClose: () => void, disabled: boolean) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !disabled) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, disabled]);
}

/* ────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────── */

const fmtDateTime = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const normalizeStatus = (status?: string | null) =>
  (status || "").trim().toLowerCase();

/* ══════════════════════════════════════════════
   MyPodcastsPage
   ══════════════════════════════════════════════ */

export default function MyPodcastsPage() {
  const navigate = useNavigate();

  const [podcasts, setPodcasts] = useState<PodcastItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [detailPodcast, setDetailPodcast] = useState<PodcastItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createEpisodeFor, setCreateEpisodeFor] = useState<PodcastItem | null>(
    null,
  );
  const [editPodcastFor, setEditPodcastFor] = useState<PodcastItem | null>(
    null,
  );

  const loadPodcasts = async () => {
    setLoading(true);
    try {
      const data = await podcastService.getMyPodcasts();
      setPodcasts(data);
    } catch {
      showError("Không thể tải danh sách podcast của bạn");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    if (!localStorage.getItem("accessToken")) {
      showToast.warning("Vui lòng đăng nhập để tạo podcast");
      navigate("/login");
      return;
    }
    setCreateOpen(true);
  };

  const handleCreated = () => {
    setCreateOpen(false);
    showToast.success(
      "Podcast đã được gửi! Đang chờ admin kiểm duyệt trước khi xuất bản.",
    );
    void loadPodcasts();
  };

  useEffect(() => {
    void loadPodcasts();
  }, []);

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    if (!kw) return podcasts;
    return podcasts.filter(
      (p) =>
        p.title?.toLowerCase().includes(kw) ||
        p.description?.toLowerCase().includes(kw) ||
        p.type?.toLowerCase().includes(kw),
    );
  }, [podcasts, search]);

  const openDetail = async (podcast: PodcastItem) => {
    setDetailPodcast(podcast);
    setDetailLoading(true);
    try {
      const fresh = await podcastService.getPodcastById(podcast.id);
      setDetailPodcast(fresh);
    } catch {
      showError("Không thể tải chi tiết");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailPodcast(null);
    setDetailLoading(false);
  };

  return (
    <div className="mypod-page">
      <div className="mypod-container">
        {/* Header */}
        <div className="mypod-header">
          <div>
            <h1 className="mypod-title">
              <Mic2 size={28} />
              Podcast của tôi
            </h1>
            <p className="mypod-subtitle">
              Quản lý các podcast bạn đã xuất bản — xem và thêm tập mới
            </p>
          </div>
          <div className="mypod-header-actions">
            <button
              className="mypod-btn mypod-btn--ghost"
              onClick={() => void loadPodcasts()}
              disabled={loading}
            >
              {loading ? (
                <Loader2 size={16} className="mypod-spin" />
              ) : (
                <RefreshCw size={16} />
              )}
              Làm mới
            </button>
            <button
              className="mypod-btn mypod-btn--primary"
              onClick={handleOpenCreate}
            >
              <Plus size={16} />
              Tạo Podcast
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mypod-search-wrap">
          <Search size={16} className="mypod-search-icon" />
          <input
            type="text"
            className="mypod-search"
            placeholder="Tìm theo tên podcast, mô tả, thể loại..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* List */}
        {loading ? (
          <div className="mypod-list">
            {[1, 2, 3].map((i) => (
              <div key={i} className="mypod-card mypod-card--skeleton">
                <div className="mypod-skeleton-cover" />
                <div className="mypod-skeleton-body">
                  <div className="mypod-skeleton-line" />
                  <div className="mypod-skeleton-line mypod-skeleton-line--short" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mypod-empty">
            <Mic2 size={48} />
            <h3>Chưa có podcast nào</h3>
            <p>
              {podcasts.length === 0
                ? "Bạn chưa có podcast nào được xuất bản. Hãy tạo podcast đầu tiên của bạn!"
                : "Không có podcast nào khớp với từ khóa tìm kiếm."}
            </p>
            {podcasts.length === 0 && (
              <button
                className="mypod-btn mypod-btn--primary"
                onClick={handleOpenCreate}
              >
                <Plus size={16} />
                Tạo podcast đầu tiên
              </button>
            )}
          </div>
        ) : (
          <div className="mypod-list">
            {filtered.map((podcast) => (
              <MyPodcastCard
                key={podcast.id}
                podcast={podcast}
                onView={() => void openDetail(podcast)}
                onEdit={(p) => setEditPodcastFor(p)}
                onCreateEpisode={(p) => setCreateEpisodeFor(p)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {detailPodcast && (
        <MyPodcastDetailModal
          podcast={detailPodcast}
          loading={detailLoading}
          onClose={closeDetail}
        />
      )}

      {/* Create modal */}
      {createOpen && (
        <CreatePodcastRequestModal
          onClose={() => setCreateOpen(false)}
          onCreated={handleCreated}
        />
      )}

      {/* Edit podcast modal */}
      {editPodcastFor && (
        <EditPodcastModal
          podcast={editPodcastFor}
          onClose={() => setEditPodcastFor(null)}
          onEdited={() => {
            setEditPodcastFor(null);
            showToast.success(
              "Đã gửi yêu cầu cập nhật hoặc cập nhật thành công.",
            );
            handleCreated(); // reload list
          }}
        />
      )}

      {/* Edit podcast modal */}
      {editPodcastFor && (
        <EditPodcastModal
          podcast={editPodcastFor}
          onClose={() => setEditPodcastFor(null)}
          onEdited={() => {
            setEditPodcastFor(null);
            showToast.success(
              "Đã gửi yêu cầu cập nhật hoặc cập nhật thành công.",
            );
            handleCreated(); // reload list
          }}
        />
      )}

      {/* Create episode modal */}
      {createEpisodeFor && (
        <CreateEpisodeRequestModal
          podcast={createEpisodeFor}
          onClose={() => setCreateEpisodeFor(null)}
          onCreated={() => {
            setCreateEpisodeFor(null);
            showToast.success(
              "Tập đã được gửi! Đang chờ admin kiểm duyệt trước khi xuất bản.",
            );
          }}
        />
      )}
    </div>
  );
}

/* ────────────────────────────────────────────
   MyPodcastCard
   ──────────────────────────────────────────── */

function MyPodcastCard({
  podcast,
  onView,
  onEdit,
  onCreateEpisode,
}: {
  podcast: PodcastItem;
  onView: () => void;
  onEdit: (podcast: PodcastItem) => void;
  onCreateEpisode: (podcast: PodcastItem) => void;
}) {
  const episodeCount = podcast.episodeCount ?? podcast.allEpisodes?.length ?? 0;

  return (
    <div className="mypod-card" onClick={onView}>
      <div className="mypod-card-cover">
        {podcast.banner ? (
          <img src={podcast.banner} alt={podcast.title} />
        ) : (
          <div className="mypod-card-cover-placeholder">
            <Mic2 size={28} />
          </div>
        )}
        {podcast.isPaid && (podcast.price ?? 0) > 0 && (
          <span className="mypod-card-price">
            {(podcast.price ?? 0).toLocaleString("vi-VN")}₫
          </span>
        )}
      </div>

      <div className="mypod-card-body">
        <div className="mypod-card-top">
          <h3 className="mypod-card-title">{podcast.title}</h3>
          <span className="mypod-badge mypod-badge--good">
            <CheckCircle2 size={12} />
            Đã xuất bản
          </span>
        </div>

        <p className="mypod-card-desc">
          {typeof podcast.description === "string" && podcast.description.trim()
            ? podcast.description
            : "Chưa có mô tả."}
        </p>

        <div className="mypod-card-meta">
          {podcast.type && (
            <div className="mypod-card-meta-item">
              <Tag size={13} />
              <span>{podcast.type}</span>
            </div>
          )}
          <div className="mypod-card-meta-item">
            <Music2 size={13} />
            <span>{episodeCount} tập</span>
          </div>
          {podcast.createdAt && (
            <div className="mypod-card-meta-item">
              <Clock size={13} />
              <span>Tạo: {fmtDateTime(podcast.createdAt)}</span>
            </div>
          )}
        </div>

        <div className="mypod-card-actions">
          <button
            className="mypod-card-view"
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
          >
            <Eye size={14} />
            Xem chi tiết
          </button>

          <button
            className="mypod-card-edit"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(podcast);
            }}
            title="Cập nhật thông tin podcast"
          >
            <Edit size={14} />
            Chỉnh sửa
          </button>

          <button
            className="mypod-card-episode"
            onClick={(e) => {
              e.stopPropagation();
              onCreateEpisode(podcast);
            }}
            title="Tạo tập mới cho podcast này"
          >
            <PlusCircle size={14} />
            Tạo tập mới
          </button>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   MyPodcastDetailModal
   ──────────────────────────────────────────── */

function MyPodcastDetailModal({
  podcast,
  loading,
  onClose,
}: {
  podcast: PodcastItem;
  loading: boolean;
  onClose: () => void;
}) {
  const episodes: PodcastEpisode[] = podcast.allEpisodes ?? [];
  const [showEpisodes, setShowEpisodes] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlayPause = (ep: PodcastEpisode) => {
    if (!ep.audioUrl) return;

    // Same episode → toggle play/pause
    if (playingId === ep.id) {
      if (audioRef.current?.paused) {
        void audioRef.current.play();
      } else {
        audioRef.current?.pause();
        setPlayingId(null);
      }
      return;
    }

    // Different episode → swap source
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(ep.audioUrl);
    audioRef.current = audio;
    audio.onended = () => setPlayingId(null);
    void audio.play();
    setPlayingId(ep.id ?? null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  return (
    <div className="mypod-modal-overlay" onClick={onClose}>
      <div className="mypod-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mypod-modal-head">
          <h3>
            <Eye size={18} />
            Chi tiết podcast
          </h3>
          <button className="mypod-modal-close" onClick={onClose}>
            <XCircle size={18} />
          </button>
        </div>

        <div className="mypod-modal-body">
          {loading && (
            <div className="mypod-modal-loading">
              <Loader2 size={16} className="mypod-spin" />
              Đang cập nhật...
            </div>
          )}

          {podcast.banner && (
            <div className="mypod-modal-banner">
              <img src={podcast.banner} alt={podcast.title} />
            </div>
          )}

          <div className="mypod-modal-badges">
            <span className="mypod-badge mypod-badge--good">
              <CheckCircle2 size={12} />
              Đã xuất bản
            </span>
            {podcast.isPaid ? (
              <span className="mypod-badge mypod-badge--gold">
                Có phí • {(podcast.price ?? 0).toLocaleString("vi-VN")}₫
              </span>
            ) : (
              <span className="mypod-badge">Miễn phí</span>
            )}
          </div>

          <h2 className="mypod-modal-title">{podcast.title}</h2>
          <p className="mypod-modal-desc">
            {typeof podcast.description === "string" &&
            podcast.description.trim()
              ? podcast.description
              : "Chưa có mô tả."}
          </p>

          <div className="mypod-modal-grid">
            <DetailField label="Thể loại" value={podcast.type ?? "—"} />
            <DetailField
              label="Giá"
              value={
                podcast.isPaid
                  ? `${(podcast.price ?? 0).toLocaleString("vi-VN")}₫`
                  : "Miễn phí"
              }
            />
            <DetailField
              label="Số tập"
              value={String(
                podcast.episodeCount ?? podcast.allEpisodes?.length ?? 0,
              )}
            />
            <DetailField
              label="Ngày tạo"
              value={fmtDateTime(podcast.createdAt)}
            />
          </div>

          {/* Episode toggle button */}
          <button
            className={`mypod-episodes-toggle${showEpisodes ? " open" : ""}`}
            onClick={() => setShowEpisodes((v) => !v)}
          >
            <ListMusic size={16} />
            Danh sách tập ({episodes.length})
            <ChevronDown size={16} className="mypod-episodes-toggle-chevron" />
          </button>

          {/* Episode panel */}
          {showEpisodes && (
            <div className="mypod-modal-episode-list">
              {episodes.length === 0 ? (
                <div className="mypod-modal-no-episodes">
                  <FileAudio size={28} />
                  <p>Chưa có tập nào. Hãy thêm tập đầu tiên!</p>
                </div>
              ) : (
                episodes.map((ep, idx) => {
                  const isPlaying = playingId === ep.id;
                  return (
                    <div
                      key={ep.id ?? idx}
                      className={`mypod-modal-episode-item${isPlaying ? " playing" : ""}`}
                    >
                      <div className="mypod-modal-episode-num">
                        {ep.episodeNumber ?? idx + 1}
                      </div>

                      <div className="mypod-modal-episode-info">
                        <span className="mypod-modal-episode-title">
                          {ep.title}
                        </span>
                        {ep.description && (
                          <span className="mypod-modal-episode-desc">
                            {ep.description}
                          </span>
                        )}
                        <div className="mypod-modal-episode-meta">
                          {ep.duration != null && ep.duration > 0 && (
                            <span className="mypod-modal-episode-duration">
                              <Clock size={11} />
                              {formatDuration(ep.duration)}
                            </span>
                          )}
                          {ep.publishDate && (
                            <span className="mypod-modal-episode-date">
                              {fmtDateTime(ep.publishDate)}
                            </span>
                          )}
                        </div>
                      </div>

                      {ep.audioUrl && (
                        <button
                          className={`mypod-episode-play-btn${isPlaying ? " playing" : ""}`}
                          onClick={() => handlePlayPause(ep)}
                          title={isPlaying ? "Tạm dừng" : "Phát audio"}
                        >
                          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        <div className="mypod-modal-foot">
          <button className="mypod-btn mypod-btn--ghost" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="mypod-field">
      <div className="mypod-field-label">{label}</div>
      <div className="mypod-field-value">{value}</div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   CreatePodcastRequestModal
   Form cho phép user upload banner + metadata, gửi podcast-request
   lên admin kiểm duyệt.
   ════════════════════════════════════════════════════════════════ */

function CreatePodcastRequestModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [podcastType, setPodcastType] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState(0);

  const [bannerUrl, setBannerUrl] = useState("");
  const [bannerFileName, setBannerFileName] = useState("");
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);

  const isBusy = submitting || uploadingBanner;
  useEscapeClose(onClose, isBusy);

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset input value để user có thể chọn lại cùng 1 file nếu upload fail
    if (bannerInputRef.current) bannerInputRef.current.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast.error("Vui lòng chọn file ảnh (JPG, PNG, WEBP...)");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      const mb = (file.size / 1024 / 1024).toFixed(1);
      showToast.error(`Ảnh vượt quá 5MB (file của bạn ${mb}MB)`);
      return;
    }

    setUploadingBanner(true);
    try {
      const res = await uploadImage(file);
      const url = res;
      if (!url) throw new Error("Upload ảnh thất bại (không có URL)");
      setBannerUrl(url);
      setBannerFileName(file.name);
    } catch (err: any) {
      showToast.error(err?.message || "Upload ảnh thất bại, vui lòng thử lại");
    } finally {
      setUploadingBanner(false);
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    const num = raw ? parseInt(raw, 10) : 0;
    setPrice(Math.min(num, MAX_PRICE));
  };

  const handleTogglePaid = () => {
    setIsPaid((prev) => {
      const next = !prev;
      if (!next) setPrice(0); // tắt trả phí → reset giá
      return next;
    });
  };

  const canSubmit =
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    bannerUrl.length > 0 &&
    (!isPaid || price >= MIN_PRICE) &&
    !isBusy;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      // BE yêu cầu cả `title` + `episodeTitle` — reuse title làm episodeTitle default.
      // `type` chỉ gửi khi user chọn, tránh ghi đè default phía BE.
      const payload: any = {
        title: title.trim(),
        episodeTitle: title.trim(),
        description: description.trim(),
        banner: bannerUrl,
        price: isPaid ? price : 0,
        isPaid,
      };
      if (podcastType) payload.type = podcastType;

      await podcastService.createPodcastRequest(payload);
      onCreated();
    } catch (err: any) {
      showToast.error(err.message || "Không thể tạo podcast, vui lòng thử lại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="pds-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isBusy) onClose();
      }}
    >
      <div className="pds-modal" role="dialog" aria-modal="true">
        <div className="pds-modal-header">
          <div>
            <h2 className="pds-modal-title">Tạo Podcast mới</h2>
            <p className="pds-modal-subtitle">
              Podcast sẽ được gửi đến admin kiểm duyệt trước khi xuất bản.
            </p>
          </div>
          <button
            type="button"
            className="pds-modal-close"
            onClick={onClose}
            disabled={isBusy}
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <form className="pds-modal-form" onSubmit={handleSubmit}>
          {/* Banner upload (Cloudinary) */}
          <div className="pds-form-row">
            <span className="pds-form-label-text">
              Ảnh bìa podcast <span className="pds-form-req">*</span>
            </span>

            {bannerUrl ? (
              <div className="pds-form-banner-preview">
                <img
                  src={bannerUrl}
                  alt="Banner preview"
                  className="pds-form-banner"
                />
                <div className="pds-form-banner-info">
                  <span className="pds-form-banner-name" title={bannerFileName}>
                    {bannerFileName || "Banner đã tải lên"}
                  </span>
                  <button
                    type="button"
                    className="pds-form-banner-remove"
                    onClick={() => {
                      setBannerUrl("");
                      setBannerFileName("");
                    }}
                    disabled={submitting}
                  >
                    <Trash2 size={14} />
                    <span>Xóa</span>
                  </button>
                </div>
              </div>
            ) : (
              <label
                className={`pds-form-banner pds-form-banner--empty pds-form-banner--clickable${
                  uploadingBanner ? " uploading" : ""
                }`}
              >
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBannerChange}
                  disabled={isBusy}
                  style={{ display: "none" }}
                />
                {uploadingBanner ? (
                  <>
                    <Loader2 size={28} className="pds-spin" />
                    <span>Đang tải lên...</span>
                  </>
                ) : (
                  <>
                    <Upload size={28} />
                    <span>Nhấn để chọn ảnh banner</span>
                    <span className="pds-form-banner-hint">
                      JPG, PNG, WEBP · tối đa 5MB
                    </span>
                  </>
                )}
              </label>
            )}
          </div>

          {/* Type (optional) */}
          <div className="pds-form-row">
            <label className="pds-form-label">
              <span>Chủ đề</span>
              <div className="pds-form-select-wrap">
                <select
                  className="pds-form-input"
                  value={podcastType}
                  onChange={(e) => setPodcastType(e.target.value)}
                  disabled={submitting}
                >
                  <option value="">Chọn chủ đề (tùy chọn)</option>
                  {Object.keys(TYPE_LABELS).map((k) => (
                    <option key={k} value={k}>
                      {TYPE_LABELS[k]}
                    </option>
                  ))}
                </select>
              </div>
            </label>
          </div>

          <div className="pds-form-row">
            <label className="pds-form-label">
              <span>
                Tiêu đề Podcast <span className="pds-form-req">*</span>
              </span>
              <input
                type="text"
                className="pds-form-input"
                placeholder="VD: Chuyện công nghệ tuần này"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={TITLE_MAX}
                disabled={submitting}
                required
              />
              <span className="pds-form-hint">
                {title.length}/{TITLE_MAX} ký tự
              </span>
            </label>
          </div>

          <div className="pds-form-row">
            <label className="pds-form-label">
              <span>
                Mô tả <span className="pds-form-req">*</span>
              </span>
              <textarea
                className="pds-form-input pds-form-textarea"
                placeholder="Podcast này nói về điều gì? Đối tượng người nghe là ai?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={DESC_MAX}
                rows={4}
                disabled={submitting}
                required
              />
              <span className="pds-form-hint">
                {description.length}/{DESC_MAX} ký tự
              </span>
            </label>
          </div>

          {/* Paid toggle */}
          <div className="pds-form-row">
            <div className="pds-paid-toggle">
              <div>
                <p className="pds-paid-toggle-title">Podcast trả phí</p>
                <p className="pds-paid-toggle-desc">
                  Bật để đặt giá cho podcast của bạn. Tắt = miễn phí cho mọi
                  người.
                </p>
              </div>
              <button
                type="button"
                className={`pds-switch${isPaid ? " on" : ""}`}
                onClick={handleTogglePaid}
                disabled={submitting}
                role="switch"
                aria-checked={isPaid}
              >
                <span className="pds-switch-thumb" />
              </button>
            </div>
          </div>

          {/* Price input + gợi ý */}
          {isPaid && (
            <>
              <div className="pds-form-row">
                <label className="pds-form-label">
                  <span>
                    Giá bán (VND) <span className="pds-form-req">*</span>
                  </span>
                  <div className="pds-price-input-wrap">
                    <input
                      type="text"
                      inputMode="numeric"
                      className="pds-form-input pds-price-input"
                      placeholder="VD: 50000"
                      value={formatVnd(price)}
                      onChange={handlePriceChange}
                      disabled={submitting}
                      required
                    />
                    <span className="pds-price-suffix">₫</span>
                  </div>
                  <span className="pds-form-hint">Giá tối thiểu 1,000₫</span>
                </label>
              </div>

              <div className="pds-price-suggest">
                <div className="pds-price-suggest-head">
                  <Lightbulb size={14} />
                  <span>Gợi ý:</span>
                </div>
                <ul className="pds-price-suggest-list">
                  {PRICE_SUGGESTIONS.map((s) => (
                    <li key={s.label}>
                      <span>{s.label}</span>
                      <strong>{s.range}</strong>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pds-price-split-notice">
                <AlertCircle size={14} className="pds-split-icon" />
                <span>
                  <strong>Lưu ý:</strong> Khi có người mua, bạn sẽ nhận được{" "}
                  <strong>80%</strong> doanh thu, hệ thống sẽ giữ lại{" "}
                  <strong>20%</strong> phí nền tảng.
                </span>
              </div>
            </>
          )}

          <div className="pds-form-notice">
            <Radio size={14} />
            <span>
              Sau khi gửi, bạn sẽ nhận thông báo khi admin duyệt hoặc từ chối
              (kèm lý do).
            </span>
          </div>

          <div className="pds-modal-actions">
            <button
              type="button"
              className="pds-btn pds-btn--ghost"
              onClick={onClose}
              disabled={isBusy}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="pds-btn pds-btn--primary"
              disabled={!canSubmit}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="pds-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Gửi kiểm duyệt
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   CreateEpisodeRequestModal
   Form upload tập mới (audio + metadata) cho 1 podcast đã publish.
   Gọi POST /api/v1/podcast-episode-requests.
   ════════════════════════════════════════════════════════════════ */

function CreateEpisodeRequestModal({
  podcast,
  onClose,
  onCreated,
}: {
  podcast: PodcastItem;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Thumbnail (optional)
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [thumbnailName, setThumbnailName] = useState("");
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  // Audio (required)
  const [audioUrl, setAudioUrl] = useState("");
  const [audioName, setAudioName] = useState("");
  const [duration, setDuration] = useState(0);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);

  const isBusy = submitting || uploadingThumb || uploadingAudio;
  useEscapeClose(onClose, isBusy);

  // Auto-detect duration từ file audio bằng HTML5 Audio API.
  // Xử lý Chrome bug: một số MP3 VBR trả về Infinity cho audio.duration
  // → dùng seek hack (set currentTime to very large number) để force browser
  // tính lại duration thật.
  const detectDuration = (file: File): Promise<number> =>
    new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const audio = new Audio(url);
      let settled = false;
      const done = (val: number) => {
        if (settled) return;
        settled = true;
        URL.revokeObjectURL(url);
        resolve(val);
      };

      // Timeout sau 8s nếu browser không fire event → fallback 0
      const timeout = setTimeout(() => done(0), 8000);

      audio.addEventListener("loadedmetadata", () => {
        const d = audio.duration;
        if (isFinite(d) && !Number.isNaN(d) && d > 0) {
          clearTimeout(timeout);
          done(Math.round(d));
          return;
        }
        // Chrome bug workaround: seek to end → duration recalculates
        audio.currentTime = 1e101;
        audio.addEventListener(
          "timeupdate",
          () => {
            clearTimeout(timeout);
            const finalD = audio.duration;
            done(isFinite(finalD) && finalD > 0 ? Math.round(finalD) : 0);
          },
          { once: true },
        );
      });

      audio.addEventListener("error", () => {
        clearTimeout(timeout);
        done(0);
      });
    });

  const handleThumbnailChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (thumbInputRef.current) thumbInputRef.current.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast.error("Vui lòng chọn file ảnh (JPG, PNG, WEBP...)");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      const mb = (file.size / 1024 / 1024).toFixed(1);
      showToast.error(`Ảnh vượt quá 5MB (file của bạn ${mb}MB)`);
      return;
    }

    setUploadingThumb(true);
    try {
      const res = await uploadImage(file);
      const imgUrl = res;
      if (!imgUrl) throw new Error("Upload ảnh thất bại (không có URL)");
      setThumbnailUrl(imgUrl);
      setThumbnailName(file.name);
      showToast.success("Đã upload ảnh thành công!");
    } catch (err: any) {
      showToast.error(err?.message || "Upload ảnh thất bại, vui lòng thử lại");
    } finally {
      setUploadingThumb(false);
    }
  };

  const handleAudioChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (audioInputRef.current) audioInputRef.current.value = "";
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      showToast.error("Vui lòng chọn file âm thanh (MP3, M4A, WAV, OGG...)");
      return;
    }
    if (file.size > MAX_AUDIO_SIZE) {
      const mb = (file.size / 1024 / 1024).toFixed(1);
      showToast.error(`Audio vượt quá 100MB (file của bạn ${mb}MB)`);
      return;
    }

    setUploadingAudio(true);
    try {
      // Detect duration trước (local, nhanh) — upload sau (network)
      const detectedDuration = await detectDuration(file);
      const res = await uploadAudio(file);
      setAudioUrl(res.url);
      setAudioName(file.name);
      setDuration(detectedDuration);
    } catch (err: any) {
      showToast.error(
        err?.message || "Upload audio thất bại, vui lòng thử lại",
      );
    } finally {
      setUploadingAudio(false);
    }
  };

  // Verbose validation — hiển thị rõ field nào thiếu để user biết tại sao button disabled.
  // Chỉ cần user điền thông tin là OK (không check độ dài tối thiểu).
  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (title.trim().length === 0) {
      errors.push("Vui lòng nhập tiêu đề tập");
    }
    if (audioUrl.length === 0) {
      errors.push("Vui lòng upload file audio");
    }
    return errors;
  }, [title, audioUrl]);

  const canSubmit = validationErrors.length === 0 && !isBusy;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      const payload = {
        podcastId: podcast.id,
        title: title.trim(),
        description: description.trim(),
        thumbnailUrl: thumbnailUrl || podcast.banner || "",
        audioUrl,
        duration,
      };

      const result = await podcastService.createPodcastEpisodeRequest(payload);
      onCreated();
    } catch (err: any) {
      showToast.error(err.message || "Không thể tạo tập, vui lòng thử lại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="pds-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isBusy) onClose();
      }}
    >
      <div className="pds-modal" role="dialog" aria-modal="true">
        <div className="pds-modal-header">
          <div>
            <h2 className="pds-modal-title">
              <PlusCircle
                size={20}
                style={{ verticalAlign: "-3px", marginRight: 8 }}
              />
              Tạo tập mới
            </h2>
            <p className="pds-modal-subtitle">
              Thêm tập cho <strong>{podcast.title}</strong>. Tập sẽ được gửi đến
              admin kiểm duyệt trước khi xuất bản.
            </p>
          </div>
          <button
            type="button"
            className="pds-modal-close"
            onClick={onClose}
            disabled={isBusy}
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <form className="pds-modal-form" onSubmit={handleSubmit}>
          {/* Audio upload — required */}
          <div className="pds-form-row">
            <span className="pds-form-label-text">
              File âm thanh <span className="pds-form-req">*</span>
            </span>

            {audioUrl ? (
              <div className="mypod-audio-preview">
                <div className="mypod-audio-icon">
                  <Music2 size={22} />
                </div>
                <div className="mypod-audio-info">
                  <span className="mypod-audio-name" title={audioName}>
                    {audioName || "Audio đã tải lên"}
                  </span>
                  <span className="mypod-audio-duration">
                    <Clock size={12} />
                    {formatDuration(duration)}
                  </span>
                </div>
                <button
                  type="button"
                  className="pds-form-banner-remove"
                  onClick={() => {
                    setAudioUrl("");
                    setAudioName("");
                    setDuration(0);
                  }}
                  disabled={submitting}
                >
                  <Trash2 size={14} />
                  <span>Xóa</span>
                </button>
              </div>
            ) : (
              <label
                className={`pds-form-banner pds-form-banner--empty pds-form-banner--clickable${
                  uploadingAudio ? " uploading" : ""
                }`}
              >
                <input
                  ref={audioInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioChange}
                  disabled={isBusy}
                  style={{ display: "none" }}
                />
                {uploadingAudio ? (
                  <>
                    <Loader2 size={28} className="pds-spin" />
                    <span>Đang tải lên...</span>
                  </>
                ) : (
                  <>
                    <FileAudio size={28} />
                    <span>Nhấn để chọn file audio</span>
                    <span className="pds-form-banner-hint">
                      MP3, M4A, WAV, OGG · tối đa 100MB
                    </span>
                  </>
                )}
              </label>
            )}
          </div>

          {/* Title */}
          <div className="pds-form-row">
            <label className="pds-form-label">
              <span>
                Tiêu đề tập <span className="pds-form-req">*</span>
              </span>
              <input
                type="text"
                className="pds-form-input"
                placeholder="VD: Tập 1 — Bắt đầu hành trình"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={EP_TITLE_MAX}
                disabled={submitting}
                required
              />
              <span className="pds-form-hint">
                {title.length}/{EP_TITLE_MAX} ký tự
              </span>
            </label>
          </div>

          {/* Description */}
          <div className="pds-form-row">
            <label className="pds-form-label">
              <span>Mô tả tập</span>
              <textarea
                className="pds-form-input pds-form-textarea"
                placeholder="Tập này nói về điều gì? (không bắt buộc)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={EP_DESC_MAX}
                rows={3}
                disabled={submitting}
              />
              <span className="pds-form-hint">
                {description.length}/{EP_DESC_MAX} ký tự
              </span>
            </label>
          </div>

          {/* Thumbnail — optional */}
          <div className="pds-form-row">
            <span className="pds-form-label-text">
              Ảnh thumbnail{" "}
              <span className="pds-form-hint-inline">
                (tùy chọn — mặc định dùng banner podcast)
              </span>
            </span>

            {thumbnailUrl ? (
              <div className="pds-form-banner-preview">
                <img
                  src={thumbnailUrl}
                  alt="Thumbnail preview"
                  className="pds-form-banner"
                />
                <div className="pds-form-banner-info">
                  <span className="pds-form-banner-name" title={thumbnailName}>
                    {thumbnailName || "Thumbnail đã tải lên"}
                  </span>
                  <button
                    type="button"
                    className="pds-form-banner-remove"
                    onClick={() => {
                      setThumbnailUrl("");
                      setThumbnailName("");
                    }}
                    disabled={submitting}
                  >
                    <Trash2 size={14} />
                    <span>Xóa</span>
                  </button>
                </div>
              </div>
            ) : (
              <label
                className={`pds-form-banner pds-form-banner--empty pds-form-banner--clickable${
                  uploadingThumb ? " uploading" : ""
                }`}
              >
                <input
                  ref={thumbInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  disabled={isBusy}
                  style={{ display: "none" }}
                />
                {uploadingThumb ? (
                  <>
                    <Loader2 size={28} className="pds-spin" />
                    <span>Đang tải lên...</span>
                  </>
                ) : (
                  <>
                    <Upload size={28} />
                    <span>Nhấn để chọn ảnh thumbnail</span>
                    <span className="pds-form-banner-hint">
                      JPG, PNG, WEBP · tối đa 5MB
                    </span>
                  </>
                )}
              </label>
            )}
          </div>

          <div className="pds-form-notice">
            <Radio size={14} />
            <span>
              Tập sẽ được admin kiểm duyệt trước khi hiển thị công khai.
            </span>
          </div>

          {/* Cảnh báo nếu duration không detect được — không block submit */}
          {audioUrl && duration === 0 && !uploadingAudio && (
            <div className="mypod-duration-warning">
              <AlertCircle size={14} />
              <span>
                Không tự động xác định được thời lượng audio (một số MP3 VBR gặp
                lỗi này trên Chrome). Bạn vẫn có thể gửi — admin sẽ cập nhật khi
                duyệt.
              </span>
            </div>
          )}

          {/* Hiển thị rõ field nào thiếu nếu button đang disabled */}
          {validationErrors.length > 0 && (
            <div className="mypod-validation-errors">
              <AlertCircle size={14} />
              <div>
                <strong>Chưa thể gửi:</strong>
                <ul>
                  {validationErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="pds-modal-actions">
            <button
              type="button"
              className="pds-btn pds-btn--ghost"
              onClick={onClose}
              disabled={isBusy}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="pds-btn pds-btn--primary"
              disabled={!canSubmit}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="pds-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <PlusCircle size={16} />
                  Gửi kiểm duyệt
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   EditPodcastModal
   Form cho phép user cập nhật podcast.
   - Nếu đổi isPaid/price -> update ngay lập tức.
   - Nếu đổi thông tin khác -> tạo request mới (chờ admin duyệt) để đè lên podcast cũ.
   ════════════════════════════════════════════════════════════════ */

function EditPodcastModal({
  podcast,
  onClose,
  onEdited,
}: {
  podcast: PodcastItem;
  onClose: () => void;
  onEdited: () => void;
}) {
  const [title, setTitle] = useState(podcast.title || "");
  const [description, setDescription] = useState(
    typeof podcast.description === "string" ? podcast.description : "",
  );
  const [podcastType, setPodcastType] = useState(podcast.type || "");
  const [isPaid, setIsPaid] = useState(podcast.isPaid || false);
  const [price, setPrice] = useState(podcast.price || 0);

  const [bannerUrl, setBannerUrl] = useState(podcast.banner || "");
  const [bannerFileName, setBannerFileName] = useState("");
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);

  // Xem có thay đổi metadata (cần duyệt) không?
  const hasMetadataChanges =
    title.trim() !== podcast.title ||
    description.trim() !== (podcast.description || "") ||
    podcastType !== (podcast.type || "") ||
    bannerUrl !== (podcast.banner || "");

  const isBusy = submitting || uploadingBanner;
  useEscapeClose(onClose, isBusy);

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (bannerInputRef.current) bannerInputRef.current.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast.error("Vui lòng chọn file ảnh (JPG, PNG, WEBP...)");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      const mb = (file.size / 1024 / 1024).toFixed(1);
      showToast.error(`Ảnh vượt quá 5MB (file của bạn ${mb}MB)`);
      return;
    }

    setUploadingBanner(true);
    try {
      const res = await uploadImage(file);
      const url = res;
      if (!url) throw new Error("Upload ảnh thất bại (không có URL)");
      setBannerUrl(url);
      setBannerFileName(file.name);
    } catch (err: any) {
      showToast.error(err?.message || "Upload ảnh thất bại, vui lòng thử lại");
    } finally {
      setUploadingBanner(false);
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    const num = raw ? parseInt(raw, 10) : 0;
    setPrice(Math.min(num, MAX_PRICE));
  };

  const handleTogglePaid = () => {
    setIsPaid((prev) => {
      const next = !prev;
      if (!next) setPrice(0);
      return next;
    });
  };

  const canSubmit =
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    bannerUrl.length > 0 &&
    (!isPaid || price >= MIN_PRICE) &&
    !isBusy;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      if (hasMetadataChanges) {
        // Có đổi metadata -> gửi request kiểm duyệt
        const payload: any = {
          title: title.trim(),
          episodeTitle: title.trim(),
          description: description.trim(),
          bannerUrl: bannerUrl,
          price: isPaid ? price : 0,
          isPaid,
          targetPodcastId: podcast.id,
        };
        if (podcastType) payload.type = podcastType;
        const { default: podcastSvc } =
          await import("../../services/podcastService");
        await podcastSvc.createPodcastRequest(payload);
        showToast.info(
          "Đã gửi yêu cầu cập nhật mô tả podcast cho Admin duyệt.",
        );
      } else {
        // Chỉ đổi giá/isPaid -> update trực tiếp qua liveSessionApiService.updatePodcast
        const { default: liveSvc } =
          await import("../../services/liveSessionApiService");
        const payload: any = {
          title: title.trim(),
          description: description.trim(),
          banner: bannerUrl,
          price: isPaid ? price : 0,
          isPaid,
          author: podcast.author, // giữ nguyên
        };
        if (podcastType) payload.type = podcastType;
        await liveSvc.updatePodcast(podcast.id, payload);
      }
      onEdited();
    } catch (err: any) {
      showToast.error(
        err.message || "Không thể cập nhật podcast, vui lòng thử lại",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="pds-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isBusy) onClose();
      }}
    >
      <div className="pds-modal" role="dialog" aria-modal="true">
        <div className="pds-modal-header">
          <div>
            <h2 className="pds-modal-title">Cập nhật Podcast</h2>
            <p className="pds-modal-subtitle">
              Sửa giá/trạng thái bán sẽ áp dụng ngay. Sửa nội dung (tiêu đề,
              ảnh, mô tả) cần Admin duyệt.
            </p>
          </div>
          <button
            type="button"
            className="pds-modal-close"
            onClick={onClose}
            disabled={isBusy}
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <form className="pds-modal-form" onSubmit={handleSubmit}>
          {/* Banner upload (Cloudinary) */}
          <div className="pds-form-row">
            <span className="pds-form-label-text">
              Ảnh bìa podcast <span className="pds-form-req">*</span>
            </span>

            {bannerUrl ? (
              <div className="pds-form-banner-preview">
                <img
                  src={bannerUrl}
                  alt="Banner preview"
                  className="pds-form-banner"
                />
                <div className="pds-form-banner-info">
                  <span className="pds-form-banner-name" title={bannerFileName}>
                    {bannerFileName || "Banner hiện tại"}
                  </span>
                  <button
                    type="button"
                    className="pds-form-banner-remove"
                    onClick={() => {
                      setBannerUrl("");
                      setBannerFileName("");
                    }}
                    disabled={submitting}
                  >
                    <Trash2 size={14} />
                    <span>Xóa</span>
                  </button>
                </div>
              </div>
            ) : (
              <label
                className={`pds-form-banner pds-form-banner--empty pds-form-banner--clickable${
                  uploadingBanner ? " uploading" : ""
                }`}
              >
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBannerChange}
                  disabled={isBusy}
                  style={{ display: "none" }}
                />
                {uploadingBanner ? (
                  <>
                    <Loader2 size={28} className="pds-spin" />
                    <span>Đang tải lên...</span>
                  </>
                ) : (
                  <>
                    <Upload size={28} />
                    <span>Nhấn để chọn ảnh banner</span>
                    <span className="pds-form-banner-hint">
                      JPG, PNG, WEBP · tối đa 5MB
                    </span>
                  </>
                )}
              </label>
            )}
          </div>

          {/* Type (optional) */}
          <div className="pds-form-row">
            <label className="pds-form-label">
              <span>Chủ đề</span>
              <div className="pds-form-select-wrap">
                <select
                  className="pds-form-input"
                  value={podcastType}
                  onChange={(e) => setPodcastType(e.target.value)}
                  disabled={submitting}
                >
                  <option value="">Chọn chủ đề (tùy chọn)</option>
                  {Object.keys(TYPE_LABELS).map((k) => (
                    <option key={k} value={k}>
                      {TYPE_LABELS[k]}
                    </option>
                  ))}
                </select>
              </div>
            </label>
          </div>

          <div className="pds-form-row">
            <label className="pds-form-label">
              <span>
                Tiêu đề Podcast <span className="pds-form-req">*</span>
              </span>
              <input
                type="text"
                className="pds-form-input"
                placeholder="VD: Chuyện công nghệ tuần này"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={TITLE_MAX}
                disabled={submitting}
                required
              />
              <span className="pds-form-hint">
                {title.length}/{TITLE_MAX} ký tự
              </span>
            </label>
          </div>

          <div className="pds-form-row">
            <label className="pds-form-label">
              <span>
                Mô tả <span className="pds-form-req">*</span>
              </span>
              <textarea
                className="pds-form-input pds-form-textarea"
                placeholder="Podcast này nói về điều gì?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={DESC_MAX}
                rows={4}
                disabled={submitting}
                required
              />
              <span className="pds-form-hint">
                {description.length}/{DESC_MAX} ký tự
              </span>
            </label>
          </div>

          {/* Paid toggle */}
          <div className="pds-form-row">
            <div className="pds-paid-toggle">
              <div>
                <p className="pds-paid-toggle-title">Podcast trả phí</p>
                <p className="pds-paid-toggle-desc">
                  Bật để đặt giá cho podcast của bạn.
                </p>
              </div>
              <button
                type="button"
                className={`pds-switch${isPaid ? " on" : ""}`}
                onClick={handleTogglePaid}
                disabled={submitting}
                role="switch"
                aria-checked={isPaid}
              >
                <span className="pds-switch-thumb" />
              </button>
            </div>
          </div>

          {/* Price input + gợi ý */}
          {isPaid && (
            <>
              <div className="pds-form-row">
                <label className="pds-form-label">
                  <span>
                    Giá bán (VND) <span className="pds-form-req">*</span>
                  </span>
                  <div className="pds-price-input-wrap">
                    <input
                      type="text"
                      inputMode="numeric"
                      className="pds-form-input pds-price-input"
                      placeholder="VD: 50000"
                      value={formatVnd(price)}
                      onChange={handlePriceChange}
                      disabled={submitting}
                      required
                    />
                    <span className="pds-price-suffix">₫</span>
                  </div>
                  <span className="pds-form-hint">Giá tối thiểu 1,000₫</span>
                </label>
              </div>

              <div className="pds-price-split-notice">
                <AlertCircle size={14} className="pds-split-icon" />
                <span>
                  <strong>Lưu ý:</strong> Khi có người mua, bạn sẽ nhận được{" "}
                  <strong>80%</strong> doanh thu, hệ thống sẽ giữ lại{" "}
                  <strong>20%</strong> phí nền tảng.
                </span>
              </div>
            </>
          )}

          {hasMetadataChanges && (
            <div className="pds-form-notice">
              <Radio size={14} />
              <span>
                Bạn đã thay đổi nội dung (tiêu đề, ảnh, mô tả). Yêu cầu cập nhật
                này cần được Admin kiểm duyệt.
              </span>
            </div>
          )}

          <div className="pds-modal-actions">
            <button
              type="button"
              className="pds-btn pds-btn--ghost"
              onClick={onClose}
              disabled={isBusy}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="pds-btn pds-btn--primary"
              disabled={!canSubmit}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="pds-spin" />
                  Đang xử lý...
                </>
              ) : hasMetadataChanges ? (
                "Gửi kiểm duyệt"
              ) : (
                "Lưu thay đổi"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
