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
} from "lucide-react";
import podcastService from "../../services/podcastService";
import type { PodcastItem } from "../../types/podcast";
import "./PodcastScreen.css";

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
};

/* ── Equalizer bars dùng cho hero + card hover ── */
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

/* ══════════════════════════════════════════════
   PodcastScreen
   ══════════════════════════════════════════════ */

export default function PodcastScreen() {
  const [podcasts, setPodcasts] = useState<PodcastItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState("all");
  const [searchFocused, setSearchFocused] = useState(false);
  const navigate = useNavigate();
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await podcastService.getPublishedPodcasts();
        setPodcasts(data);
      } catch {
        setError("Không thể tải danh sách podcast. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };
    void load();
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
      list = list.filter((p) => p.type?.toLowerCase() === activeType);
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

  /* tách featured (bài đầu) và phần còn lại */
  const featured = filtered.length > 0 ? filtered[0] : null;
  const rest = filtered.length > 1 ? filtered.slice(1) : [];

  return (
    <div className="pds">
      {/* ── Hero ── */}
      <section className="pds-hero">
        {/* ambient orbs */}
        <div className="pds-orb pds-orb--1" />
        <div className="pds-orb pds-orb--2" />
        <div className="pds-orb pds-orb--3" />

        {/* grid pattern overlay */}
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

            {/* Search */}
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

          {/* Sound-wave visual */}
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

      {/* ── Filters ── */}
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

      {/* ── Content ── */}
      <section className="pds-content">
        {/* loading */}
        {loading && (
          <div className="pds-state">
            <div className="pds-state-loader">
              <Loader2 size={28} className="pds-spin" />
            </div>
            <p>Đang tải podcast...</p>
          </div>
        )}

        {/* error */}
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

        {/* empty */}
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

        {/* has data */}
        {!loading && !error && filtered.length > 0 && (
          <>
            {/* Featured */}
            {featured && !search && activeType === "all" && (
              <FeaturedCard
                podcast={featured}
                onClick={() => navigate(`/podcast/${featured.id}`)}
              />
            )}

            {/* Count */}
            <div className="pds-section-header">
              <h2 className="pds-section-title">
                {search || activeType !== "all" ? "Kết quả" : "Tất cả Podcast"}
              </h2>
              <span className="pds-section-count">{filtered.length}</span>
            </div>

            {/* Grid */}
            <div className="pds-grid" ref={gridRef}>
              {(search || activeType !== "all"
                ? filtered
                : rest.length > 0
                  ? rest
                  : filtered
              ).map((podcast, i) => (
                <PodcastCard
                  key={podcast.id}
                  podcast={podcast}
                  index={i}
                  onClick={() => navigate(`/podcast/${podcast.id}`)}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

/* ────────────────────────────────────────────
   Featured Card — podcast nổi bật
   ──────────────────────────────────────────── */

function FeaturedCard({
  podcast,
  onClick,
}: {
  podcast: PodcastItem;
  onClick: () => void;
}) {
  const [imgErr, setImgErr] = useState(false);
  const typeLabel =
    TYPE_LABELS[podcast.type?.toLowerCase()] ?? podcast.type ?? "Podcast";

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
      </div>

      <div className="pds-featured-body">
        <div className="pds-featured-meta">
          <span className="pds-featured-badge">Nổi bật</span>
          <span className="pds-featured-type">{typeLabel}</span>
        </div>
        <h2 className="pds-featured-title">{podcast.title}</h2>
        <p className="pds-featured-author">{podcast.author}</p>
        {podcast.description && (
          <p className="pds-featured-desc">{podcast.description}</p>
        )}
        <button className="pds-featured-cta" type="button">
          <Play size={16} fill="currentColor" />
          Nghe ngay
          <ChevronRight size={16} />
        </button>
      </div>
    </article>
  );
}

/* ────────────────────────────────────────────
   PodcastCard — card trong grid
   ──────────────────────────────────────────── */

function PodcastCard({
  podcast,
  index,
  onClick,
}: {
  podcast: PodcastItem;
  index: number;
  onClick: () => void;
}) {
  const [imgErr, setImgErr] = useState(false);
  const typeLabel =
    TYPE_LABELS[podcast.type?.toLowerCase()] ?? podcast.type ?? "Podcast";

  return (
    <article
      className="pds-card"
      onClick={onClick}
      style={{ animationDelay: `${Math.min(index * 0.06, 0.6)}s` }}
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
        <span className="pds-card-type">{typeLabel}</span>

        <div className="pds-card-play-wrap">
          <div className="pds-card-play">
            <Play size={18} fill="#fff" />
          </div>
        </div>

        {/* hover equalizer */}
        <EqBars count={5} className="pds-card-eq" />
      </div>

      <div className="pds-card-body">
        <h3 className="pds-card-title">{podcast.title}</h3>
        <p className="pds-card-author">{podcast.author}</p>
        {podcast.description && (
          <p className="pds-card-desc">{podcast.description}</p>
        )}
      </div>
    </article>
  );
}
