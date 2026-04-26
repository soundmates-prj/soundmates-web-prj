import { useEffect, useState, useMemo } from "react";
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

// ══════════════════════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════════════════════

const formatVnd = (value: number): string =>
  !value || Number.isNaN(value) ? "" : value.toLocaleString("vi-VN");

const getTypeLabel = (type?: string): string =>
  TYPE_LABELS[type?.toLowerCase() ?? ""] ?? type ?? "Podcast";

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
          resolveAuthor(p.author).toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [podcasts, activeType, search]);

  const featured = filtered.length > 0 ? filtered[0] : null;
  const rest = filtered.slice(1);

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
