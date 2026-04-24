import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Headphones,
  Mic2,
  Search,
  Radio,
  Music2,
  Loader2,
  Play,
  ChevronRight,
  X,
  Bookmark,
  Plus,
  Upload,
  Trash2,
  Lightbulb,
  Lock,
} from "lucide-react";
import podcastService from "../../services/podcastService";
import { resolveAuthor, type PodcastItem } from "../../types/podcast";
import { showToast } from "../../utils/toast";
import { uploadImage } from "../../utils/cloudinaryUpload";
import "./PodcastScreen.css";

// ══════════════════════════════════════════════════════════════
// Constants
// ══════════════════════════════════════════════════════════════

const TYPE_LABELS: Record<string, string> = {
  all: "Tất cả",
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
const MAX_PRICE = 10_000_000; // Cap 10 triệu VND tránh user gõ nhầm
const MIN_PRICE = 1000;
const TITLE_MIN = 3;
const TITLE_MAX = 120;
const DESC_MIN = 10;
const DESC_MAX = 1000;

const PRICE_SUGGESTIONS = [
  { label: "Podcast ngắn (1–3 tập):", range: "10k – 30k" },
  { label: "Podcast trung bình (5–10 tập):", range: "30k – 80k" },
  { label: "Podcast dài (10+ tập):", range: "80k – 150k" },
];

// ══════════════════════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════════════════════

const formatVnd = (value: number): string =>
  !value || Number.isNaN(value) ? "" : value.toLocaleString("vi-VN");

const getTypeLabel = (type?: string): string =>
  TYPE_LABELS[type?.toLowerCase() ?? ""] ?? type ?? "Podcast";

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

// ══════════════════════════════════════════════════════════════
// EqBars — equalizer animation dùng cho hero & card hover
// ══════════════════════════════════════════════════════════════

function EqBars({
  count = 5,
  className = "",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={`eq-bars ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="eq-bar"
          style={{ animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// PodcastScreen — page chính
// ══════════════════════════════════════════════════════════════

export default function PodcastScreen() {
  const [podcasts, setPodcasts] = useState<PodcastItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState("all");
  const [searchFocused, setSearchFocused] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const navigate = useNavigate();

  // getSavedPodcasts có thể fail với guest → fallback empty để không block UI
  useEffect(() => {
    (async () => {
      try {
        const [data, saved] = await Promise.all([
          podcastService.getPublishedPodcasts(),
          podcastService.getSavedPodcasts().catch(() => [] as PodcastItem[]),
        ]);
        setPodcasts(data);
        setSavedIds(new Set(saved.map((p) => p.id)));
      } catch {
        setError("Không thể tải danh sách podcast. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const availableTypes = useMemo(() => {
    const types = new Set(
      podcasts.map((p) => p.type?.toLowerCase()).filter(Boolean),
    );
    return ["all", ...Array.from(types)];
  }, [podcasts]);

  const filtered = useMemo(() => {
    let list = podcasts;
    if (activeType !== "all") {
      list = list.filter(
        (p) => p.type?.toLowerCase() === activeType.toLowerCase(),
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.author?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [podcasts, activeType, search]);

  const featured = filtered.length > 0 ? filtered[0] : null;
  const rest = filtered.slice(1);

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
  };

  // Optimistic update: đổi UI trước, revert nếu API fail
  const toggleSave = async (podcastId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isSaved = savedIds.has(podcastId);
    const updateSet = (add: boolean) =>
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (add) next.add(podcastId);
        else next.delete(podcastId);
        return next;
      });

    updateSet(!isSaved);
    try {
      if (isSaved) await podcastService.unsavePodcast(podcastId);
      else await podcastService.savePodcast(podcastId);
    } catch {
      updateSet(isSaved); // revert
    }
  };

  return (
    <div className="pds">
      <section className="pds-hero">
        <div className="pds-orb pds-orb--1" />
        <div className="pds-orb pds-orb--2" />
        <div className="pds-orb pds-orb--3" />
        <div className="pds-hero-grid" />

        <div className="pds-hero-inner">
          <div className="pds-hero-left">
            <div className="pds-badge">
              <span className="pds-badge-dot" />
              Podcast
            </div>

            <h1 className="pds-title">
              Lắng nghe.
              <br />
              <span>Cảm nhận.</span>
              <br />
              Kết nối.
            </h1>

            <p className="pds-subtitle">
              Khám phá những câu chuyện truyền cảm hứng, kiến thức chuyên sâu và
              góc nhìn mới từ cộng đồng SoundMates.
            </p>

            <div className={`pds-search${searchFocused ? " focused" : ""}`}>
              <Search size={18} className="pds-search-icon" />
              <input
                type="text"
                placeholder="Tìm podcast, tác giả, chủ đề..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
              {search && (
                <button
                  className="pds-search-clear"
                  onClick={() => setSearch("")}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              type="button"
              className="pds-create-btn"
              onClick={handleOpenCreate}
            >
              <Plus size={18} />
              <span>Tạo Podcast</span>
            </button>
          </div>

          <div className="pds-hero-visual">
            <div className="pds-vinyl">
              <div className="pds-vinyl-inner">
                <Headphones size={28} />
              </div>
              <div className="pds-vinyl-ring pds-vinyl-ring--1" />
              <div className="pds-vinyl-ring pds-vinyl-ring--2" />
              <div className="pds-vinyl-ring pds-vinyl-ring--3" />
            </div>
            <EqBars count={12} className="pds-hero-eq" />
          </div>
        </div>
      </section>

      <section className="pds-filters">
        <div className="pds-filters-track">
          {availableTypes.map((type) => (
            <button
              key={type}
              className={`pds-chip${activeType === type ? " active" : ""}`}
              onClick={() => setActiveType(type)}
            >
              {activeType === type && <span className="pds-chip-dot" />}
              {TYPE_LABELS[type] ?? type}
            </button>
          ))}
        </div>
      </section>

      <section className="pds-content">
        {loading && (
          <div className="pds-state">
            <div className="pds-state-loader">
              <Loader2 size={28} className="pds-spin" />
            </div>
            <p>Đang tải podcast...</p>
          </div>
        )}

        {error && !loading && (
          <div className="pds-state pds-state--error">
            <div className="pds-state-icon">
              <Radio size={24} />
            </div>
            <p>{error}</p>
            <button
              className="pds-retry"
              onClick={() => window.location.reload()}
            >
              Thử lại
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="pds-state">
            <div className="pds-state-icon">
              <Music2 size={24} />
            </div>
            <p>
              {search || activeType !== "all"
                ? "Không tìm thấy podcast phù hợp."
                : "Chưa có podcast nào được xuất bản."}
            </p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <>
            {/* Ẩn Featured khi đang search — tránh phần "Nổi bật" lệ thuộc kết quả tìm */}
            {featured && !search && (
              <FeaturedCard
                podcast={featured}
                onClick={() => navigate(`/podcast/${featured.id}`)}
                isSaved={savedIds.has(featured.id)}
                onToggleSave={toggleSave}
              />
            )}

            {rest.length > 0 && (
              <>
                <div className="pds-section-header">
                  <h2 className="pds-section-title">
                    {search || activeType !== "all"
                      ? "Kết quả"
                      : "Tất cả Podcast"}
                  </h2>
                  <span className="pds-section-count">{rest.length}</span>
                </div>
                <div className="pds-grid">
                  {rest.map((podcast, i) => (
                    <PodcastCard
                      key={podcast.id}
                      podcast={podcast}
                      index={i}
                      onClick={() => navigate(`/podcast/${podcast.id}`)}
                      isSaved={savedIds.has(podcast.id)}
                      onToggleSave={toggleSave}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </section>

      {createOpen && (
        <CreatePodcastRequestModal
          onClose={() => setCreateOpen(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// Cards
// ══════════════════════════════════════════════════════════════

interface CardProps {
  podcast: PodcastItem;
  onClick: () => void;
  isSaved: boolean;
  onToggleSave: (id: string, e: React.MouseEvent) => void;
}

function FeaturedCard({ podcast, onClick, isSaved, onToggleSave }: CardProps) {
  const [imgErr, setImgErr] = useState(false);

  return (
    <article className="pds-featured" onClick={onClick}>
      <div className="pds-featured-glow" />

      <div className="pds-featured-banner">
        {podcast.banner && !imgErr ? (
          <img
            src={podcast.banner}
            alt={podcast.title}
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="pds-featured-fallback">
            <Mic2 size={48} />
            <EqBars count={7} className="pds-featured-eq" />
          </div>
        )}
        <div className="pds-featured-overlay" />

        {typeof podcast.price === "number" && podcast.price > 0 && (
          <span className="pds-featured-price">
            {podcast.isPaid && !podcast.isPurchased && (
              <Lock size={12} style={{ marginRight: 4 }} />
            )}
            <span className="pds-featured-price-amount">
              {formatVnd(podcast.price)}
            </span>
            <span className="pds-featured-price-currency">₫</span>
          </span>
        )}
      </div>

      <div className="pds-featured-body">
        <div className="pds-featured-meta">
          <span className="pds-featured-badge">Nổi bật</span>
          <span className="pds-featured-type">
            {getTypeLabel(podcast.type)}
          </span>
        </div>
        <h2 className="pds-featured-title">{podcast.title}</h2>
        <p className="pds-featured-author">
          {resolveAuthor(podcast.author) || "SoundMates"}
        </p>
        {podcast.description && (
          <p className="pds-featured-desc">{podcast.description}</p>
        )}
        <div className="pds-featured-actions">
          <button className="pds-featured-cta" type="button">
            <Play size={16} fill="currentColor" />
            Nghe ngay
            <ChevronRight size={16} />
          </button>
          <button
            className={`pds-save-btn${isSaved ? " saved" : ""}`}
            type="button"
            title={isSaved ? "Bỏ lưu" : "Lưu podcast"}
            onClick={(e) => onToggleSave(podcast.id, e)}
          >
            <Bookmark size={18} fill={isSaved ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
    </article>
  );
}

function PodcastCard({
  podcast,
  index,
  onClick,
  isSaved,
  onToggleSave,
}: CardProps & { index: number }) {
  const [imgErr, setImgErr] = useState(false);
  // Stagger animation — cap 0.6s để card thứ 10+ không delay quá lâu
  const animDelay = `${Math.min(index * 0.06, 0.6)}s`;

  return (
    <article
      className="pds-card"
      onClick={onClick}
      style={{ animationDelay: animDelay }}
    >
      <div className="pds-card-banner">
        {podcast.banner && !imgErr ? (
          <img
            src={podcast.banner}
            alt={podcast.title}
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="pds-card-fallback">
            <Mic2 size={32} />
          </div>
        )}
        <div className="pds-card-overlay" />
        <span className="pds-card-type">{getTypeLabel(podcast.type)}</span>

        <div className="pds-card-play-wrap">
          <div className="pds-card-play">
            <Play size={18} fill="#fff" />
          </div>
        </div>

        <button
          className={`pds-card-save${isSaved ? " saved" : ""}`}
          type="button"
          title={isSaved ? "Bỏ lưu" : "Lưu podcast"}
          onClick={(e) => onToggleSave(podcast.id, e)}
        >
          <Bookmark size={16} fill={isSaved ? "currentColor" : "none"} />
        </button>

        <EqBars count={5} className="pds-card-eq" />

        {typeof podcast.price === "number" && podcast.price > 0 && (
          <span className="pds-card-price">
            {podcast.isPaid && !podcast.isPurchased && (
              <Lock size={10} style={{ marginRight: 3 }} />
            )}
            {formatVnd(podcast.price)}₫
          </span>
        )}
      </div>

      <div className="pds-card-body">
        <h3 className="pds-card-title">{podcast.title}</h3>
        <p className="pds-card-author">
          {resolveAuthor(podcast.author) || "SoundMates"}
        </p>
        {podcast.description && (
          <p className="pds-card-desc">{podcast.description}</p>
        )}
      </div>
    </article>
  );
}

// ══════════════════════════════════════════════════════════════
// CreatePodcastRequestModal
// POST /api/v1/podcast-requests — submit ở trạng thái Draft.
// Admin duyệt → Published | reject → kèm lý do gửi về user.
// ══════════════════════════════════════════════════════════════

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
      const url = await uploadImage(file);
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
    title.trim().length >= TITLE_MIN &&
    description.trim().length >= DESC_MIN &&
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
        bannerUrl,
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
                className={`pds-form-banner pds-form-banner--empty pds-form-banner--clickable${uploadingBanner ? " uploading" : ""
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

          {/* Type (optional) — div wrap là bắt buộc để CSS ::after chevron hoạt động */}
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
                  {Object.keys(TYPE_LABELS)
                    .filter((k) => k !== "all")
                    .map((k) => (
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
                {title.length}/{TITLE_MAX} ký tự (tối thiểu {TITLE_MIN})
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
                {description.length}/{DESC_MAX} ký tự (tối thiểu {DESC_MIN})
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

          {/* Price input + gợi ý — chỉ hiển thị khi isPaid bật */}
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