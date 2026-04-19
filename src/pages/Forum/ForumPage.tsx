import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  MessageCircle,
  Share2,
  Search,
  TrendingUp,
  Flame,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  User,
  Music2,
  Mic,
} from "lucide-react";
import api from "../../services/axios";
import ShareCard from "../../components/blog/ShareCard";
import {
  type PublishedPost,
  type PublishedPostsParams,
  type PublishedPostsResponse,
  MOOD_OPTIONS,
  getMoodColor,
  getMoodLabel,
} from "../../types/forum";
import { resolveUserDisplayNames } from "../../utils/userProfileNameResolver";
import "./ForumPage.css";
import CommentModal from "../../components/blog/CommentModal";
import type { CommentModalPost } from "../../components/blog/CommentModal";
import { parseShareMusic } from "../../components/blog/CommentModal";
import ReactionButton, {
  ReactionSummary,
} from "../../components/blog/ReactionButton";
import "./ForumPage.css";

const PAGE_SIZE = 10;

/* ─── Post card ─── */
function PostCard({
  post,
  authorName,
}: {
  post: PublishedPost;
  authorName?: string;
}) {
  const [showModal, setShowModal] = useState(false);

  const shareData =
    post.postType === "share-music" ? parseShareMusic(post.contentText) : null;
  const moodColor = getMoodColor(post.moodTag);
  const displayName =
    authorName?.trim() || post.userFullName?.trim() || "Ẩn danh";

  const formatDate = (iso: string | null) => {
    if (!iso) return "";
    return new Date(iso).toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Convert PublishedPost → CommentModalPost
  const modalPost: CommentModalPost = {
    id: post.id,
    userId: post.userId,
    title: post.title,
    contentText: post.contentText,
    imageUrl: post.imageUrl,
    postType: post.postType ?? null,
    shareMusic: post.shareMusic ?? null,
    moodTag: post.moodTag,
    publishedAt: post.publishedAt,
    createdAt: post.createdAt,
    authorName: displayName,
    authorAvatar: post.userAvatarUrl,
  };

  return (
    <>
      <article className="fp-card">
        <div className="fp-card-header">
          <div className="fp-avatar">
            {post.userAvatarUrl ? (
              <img src={post.userAvatarUrl} alt={displayName} />
            ) : (
              <User size={18} />
            )}
          </div>
          <div className="fp-card-meta">
            <span className="fp-card-name">{displayName}</span>
            <span className="fp-card-time">
              {formatDate(post.publishedAt ?? post.createdAt)}
            </span>
          </div>
          <div className="fp-card-badges">
            {post.isGenerated && (
              <span className="fp-badge fp-badge--ai">✦ AI</span>
            )}
            {post.moodTag && (
              <span
                className="fp-badge fp-badge--mood"
                style={{ background: `${moodColor}1a`, color: moodColor }}
              >
                {getMoodLabel(post.moodTag)}
              </span>
            )}
          </div>
        </div>

        {shareData ? (
          <div className="fp-share-wrap">
            <ShareCard data={shareData} compact />
          </div>
        ) : (
          <>
            <div className="fp-card-body">
              {post.title && <h3 className="fp-card-title">{post.title}</h3>}
              <p className="fp-card-text">{post.contentText}</p>
            </div>
            {post.imageUrl?.startsWith("http") && (
              <div className="fp-card-img-wrap">
                <img
                  src={post.imageUrl}
                  alt={post.title || "post"}
                  loading="lazy"
                />
              </div>
            )}
            {post.audioUrl?.startsWith("http") && (
              <div className="fp-card-audio-wrap">
                <Mic size={14} className="fp-audio-icon" />
                <audio controls src={post.audioUrl} preload="none" />
              </div>
            )}
          </>
        )}

        <ReactionSummary postId={post.id} />
        <div className="fp-card-actions">
          <ReactionButton
            postId={post.id}
            initialCount={post.reactionCount ?? 0}
          />
          <button className="fp-action-btn" onClick={() => setShowModal(true)}>
            <MessageCircle size={15} /> Bình luận
          </button>
          {/* <button className="fp-action-btn">
            <Share2 size={15} /> Chia sẻ
          </button> */}
        </div>
      </article>

      {/* Comment modal */}
      {showModal && (
        <CommentModal post={modalPost} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}

/* ─── Main page ─── */
export default function ForumPage() {
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const highlightRef = useRef<HTMLDivElement>(null);
  const [allPosts, setAllPosts] = useState<PublishedPost[]>([]);
  const [posts, setPosts] = useState<PublishedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [mood, setMood] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [authorNamesByUserId, setAuthorNamesByUserId] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    const q = search.trim().toLowerCase();
    setPosts(
      q
        ? allPosts.filter((p) => {
            const resolvedName =
              authorNamesByUserId[p.userId] ?? p.userFullName ?? "";
            return resolvedName.toLowerCase().includes(q);
          })
        : allPosts,
    );
  }, [search, allPosts, authorNamesByUserId]);

  const fetchPosts = useCallback(
    async (p: number) => {
      setLoading(true);
      try {
        const params: PublishedPostsParams = { page: p, pageSize: PAGE_SIZE };
        if (mood !== "all") params.moodTag = mood;
        const res = await api.get<PublishedPostsResponse>("/posts/published", {
          params,
        });
        if (res.data?.success) {
          const d = res.data.data;
          setAllPosts(d.items);
          setPage(d.page);
          setTotalPages(d.totalPages);
          setTotalCount(d.totalCount);

          const fallbackNamesByUserId = d.items.reduce<Record<string, string>>(
            (acc, item) => {
              acc[item.userId] = item.userFullName ?? "Ẩn danh";
              return acc;
            },
            {},
          );

          const resolvedNames = await resolveUserDisplayNames(
            d.items.map((item) => item.userId),
            fallbackNamesByUserId,
          );

          setAuthorNamesByUserId((prev) => ({ ...prev, ...resolvedNames }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [mood],
  );

  useEffect(() => {
    setPage(1);
    fetchPosts(1);
  }, [mood]); // eslint-disable-line

  // Scroll to highlighted post from search
  useEffect(() => {
    if (!highlightId || !highlightRef.current) return;
    setTimeout(() => {
      highlightRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      highlightRef.current?.classList.add("fp-post-highlight");
      const timer = setTimeout(() => {
        highlightRef.current?.classList.remove("fp-post-highlight");
      }, 3000);
      return () => clearTimeout(timer);
    }, 500);
  }, [highlightId, posts]);

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchPosts(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="fp-page">
      <div className="fp-hero">
        {/* ── Animated background ── */}
        <div className="fp-hero-bg" />
        <div className="fp-orb fp-orb--1" />
        <div className="fp-orb fp-orb--2" />
        <div className="fp-orb fp-orb--3" />

        {/* ── Floating mood tags (decorative) ── */}
        <div className="fp-tag-cloud" aria-hidden="true">
          <span
            className="fp-cloud-tag fp-cloud-tag--1"
            style={{
              color: "#fbbf24",
              borderColor: "rgba(251,191,36,0.35)",
              background: "rgba(251,191,36,0.12)",
            }}
          >
            #Vui vẻ
          </span>
          <span
            className="fp-cloud-tag fp-cloud-tag--2"
            style={{
              color: "#34d399",
              borderColor: "rgba(52,211,153,0.35)",
              background: "rgba(52,211,153,0.12)",
            }}
          >
            #Chill
          </span>
          <span
            className="fp-cloud-tag fp-cloud-tag--3"
            style={{
              color: "#f472b6",
              borderColor: "rgba(244,114,182,0.35)",
              background: "rgba(244,114,182,0.12)",
            }}
          >
            #Lãng mạn
          </span>
          <span
            className="fp-cloud-tag fp-cloud-tag--4"
            style={{
              color: "#fb923c",
              borderColor: "rgba(251,146,60,0.35)",
              background: "rgba(251,146,60,0.12)",
            }}
          >
            #Năng động
          </span>
          <span
            className="fp-cloud-tag fp-cloud-tag--5"
            style={{
              color: "#a78bfa",
              borderColor: "rgba(167,139,250,0.35)",
              background: "rgba(167,139,250,0.12)",
            }}
          >
            #Tập trung
          </span>
          <span
            className="fp-cloud-tag fp-cloud-tag--6"
            style={{
              color: "#60a5fa",
              borderColor: "rgba(96,165,250,0.35)",
              background: "rgba(96,165,250,0.12)",
            }}
          >
            #Buồn
          </span>
          <span
            className="fp-cloud-tag fp-cloud-tag--7"
            style={{
              color: "#f87171",
              borderColor: "rgba(248,113,113,0.35)",
              background: "rgba(248,113,113,0.12)",
            }}
          >
            #Hype
          </span>
        </div>

        {/* ── Content ── */}
        <div className="fp-hero-inner">
          <span className="fp-hero-badge">
            <span className="fp-badge-bars" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
              <i />
            </span>
            <TrendingUp size={13} /> Bài viết nổi bật
          </span>
          <h1 className="fp-hero-title">Diễn đàn cộng đồng</h1>
          <p className="fp-hero-sub">
            Khám phá những bài viết mới nhất từ cộng đồng SoundMates
          </p>
          <div className="fp-search-wrap">
            <Search size={16} className="fp-search-icon" />
            <input
              className="fp-search-input"
              type="text"
              placeholder="Tìm kiếm theo tên tác giả..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {totalCount > 0 && (
            <div className="fp-hero-stats">
              <Music2 size={12} />
              <span>{totalCount} bài viết</span>
              <span className="fp-hero-stats-dot" />
              <span>7 tâm trạng</span>
              <span className="fp-hero-stats-dot" />
              <span>Cộng đồng SoundMates</span>
            </div>
          )}
        </div>

        {/* ── Particles ── */}
        <div className="fp-particles" aria-hidden="true">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className={`fp-particle fp-particle--${i + 1}`} />
          ))}
        </div>
      </div>

      <div className="fp-layout">
        <aside className="fp-sidebar">
          <div className="fp-sidebar-block">
            <p className="fp-sidebar-heading">Trạng thái</p>
            <div className="fp-mood-list">
              {MOOD_OPTIONS.map((m) => (
                <button
                  key={m.value}
                  className={`fp-mood-btn ${mood === m.value ? "active" : ""}`}
                  onClick={() => setMood(m.value)}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <div className="fp-sidebar-block fp-sidebar-stat">
            <Flame size={20} className="fp-stat-icon" />
            <span className="fp-stat-num">{totalCount}</span>
            <span className="fp-stat-label">bài viết</span>
          </div>
        </aside>

        <main className="fp-feed">
          <div className="fp-toolbar">
            <span className="fp-toolbar-info">
              {loading
                ? "Đang tải..."
                : `${totalCount} bài viết${mood !== "all" ? ` · ${mood}` : ""}${search ? ` · "${search}"` : ""}`}
            </span>
            <button
              className="fp-refresh-btn"
              onClick={() => fetchPosts(page)}
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? "fp-spin" : ""} />
            </button>
          </div>

          {loading ? (
            <div className="fp-skeletons">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="fp-skeleton">
                  <div className="fp-sk-header">
                    <div className="fp-sk-av" />
                    <div className="fp-sk-lines">
                      <div className="fp-sk-line fp-sk-name" />
                      <div className="fp-sk-line fp-sk-time" />
                    </div>
                  </div>
                  <div className="fp-sk-body">
                    <div className="fp-sk-line fp-sk-title" />
                    <div className="fp-sk-line" />
                    <div className="fp-sk-line fp-sk-short" />
                  </div>
                  <div className="fp-sk-img" />
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="fp-empty">
              <Music2 size={40} />
              <h3>Không tìm thấy bài viết</h3>
              <p>Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm</p>
            </div>
          ) : (
            <>
              <div className="fp-posts">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    ref={post.id === highlightId ? highlightRef : undefined}
                  >
                    <PostCard
                      post={post}
                      authorName={authorNamesByUserId[post.userId]}
                    />
                  </div>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="fp-pagination">
                  <button
                    className="fp-page-btn"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (p) =>
                        p === 1 || p === totalPages || Math.abs(p - page) <= 1,
                    )
                    .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                      if (idx > 0 && p - (arr[idx - 1] as number) > 1)
                        acc.push("...");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      p === "..." ? (
                        <span key={`e-${i}`} className="fp-page-ellipsis">
                          …
                        </span>
                      ) : (
                        <button
                          key={p}
                          className={`fp-page-btn ${page === p ? "active" : ""}`}
                          onClick={() => handlePageChange(p as number)}
                        >
                          {p}
                        </button>
                      ),
                    )}
                  <button
                    className="fp-page-btn"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= totalPages}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
