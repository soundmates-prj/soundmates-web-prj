import { useState, useEffect, useCallback, useMemo } from "react";
import Icon from "../../../components/common/Icon";
import { showSuccess, showError } from "../../../components/common/toastUtils";
import postService from "../../../services/postService";
import commentService from "../../../services/commentService";
import type { Post } from "../../../types/post";
import type { Comment } from "../../../types/comment";
import { getMoodLabel } from "../../../types/forum";
import "./UserPostsManagementScreen.css";

// ── Status helpers ─────────────────────────────────────────
const STATUS_LABELS: Record<string, string> = {
  Published: "Đã đăng",
  Draft: "Bản nháp",
  Archived: "Đã lưu trữ",
  Edited: "Đã chỉnh sửa",
};

const STATUS_BADGE: Record<string, string> = {
  Published: "published",
  Draft: "draft",
  Archived: "archived",
  Edited: "edited",
};

const STATUS_FILTERS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "Published", label: "Đã đăng" },
  { value: "Draft", label: "Bản nháp" },
  { value: "Archived", label: "Đã lưu trữ" },
] as const;

type ModerationLevel = "safe" | "review" | "high";

interface ModerationAssessment {
  level: ModerationLevel;
  score: number;
  reasons: string[];
  recommendation: string;
  linkCount: number;
  textLength: number;
}

interface ModerationPatternRule {
  label: string;
  pattern: RegExp;
}

interface ProfanityRule extends ModerationPatternRule {
  severity: "high" | "review";
}

const PROFANITY_RULES: ProfanityRule[] = [
  { label: "con cac", pattern: /\bcon\s*cac\b/, severity: "high" },
  { label: "du ma", pattern: /\bdu\s*ma\b/, severity: "high" },
  { label: "dit me", pattern: /\bdit\s*me\b/, severity: "high" },
  { label: "dit con me", pattern: /\bdit\s*con\s*me\b/, severity: "high" },
  { label: "ccmm", pattern: /\bccmm\b/, severity: "high" },
  { label: "clmm", pattern: /\bclmm\b/, severity: "high" },
  { label: "fuck", pattern: /\bfuck\b/, severity: "high" },
  { label: "shit", pattern: /\bshit\b/, severity: "review" },
  { label: "bitch", pattern: /\bbitch\b/, severity: "review" },
  { label: "vcl", pattern: /\bvcl\b|\bvkl\b|\bvcc\b/, severity: "review" },
  { label: "dm", pattern: /\bdm+\b/, severity: "review" },
];

const COMPACT_PROFANITY_RULES: Array<{
  label: string;
  token: string;
  severity: "high" | "review";
}> = [
    { label: "con cac", token: "concac", severity: "high" },
    { label: "du ma", token: "duma", severity: "high" },
    { label: "du ma", token: "dume", severity: "high" },
    { label: "dit me", token: "ditme", severity: "high" },
    { label: "dit con me", token: "ditconme", severity: "high" },
    { label: "ccmm", token: "ccmm", severity: "high" },
    { label: "clmm", token: "clmm", severity: "high" },
    { label: "vcl", token: "vcl", severity: "review" },
    { label: "vcl", token: "vkl", severity: "review" },
    { label: "vcl", token: "vcc", severity: "review" },
  ];

const HIGH_RISK_PATTERNS: ModerationPatternRule[] = [
  { label: "lua dao", pattern: /\blua\s*dao\b/ },
  { label: "danh bac", pattern: /\bdanh\s*bac\b|\bcasino\b/ },
  { label: "ma tuy", pattern: /\bma\s*tuy\b/ },
  { label: "noi dung nguoi lon", pattern: /\bsex\b|\bnude\b|\bxxx\b|\b18\+?\b/ },
];

const REVIEW_PATTERNS: ModerationPatternRule[] = [
  { label: "ib/inbox", pattern: /\bib\b|\binbox\b/ },
  { label: "telegram/zalo", pattern: /\btelegram\b|\bzalo\b/ },
  { label: "chuyen khoan", pattern: /\bchuyen\s*khoan\b/ },
  { label: "link bio", pattern: /\blink\s*bio\b/ },
  { label: "promo/sale", pattern: /\bpromo\b|\bsale\b/ },
];

const normalizeForModeration = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/đ/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[0]/g, "o")
    .replace(/[1!|]/g, "i")
    .replace(/[3]/g, "e")
    .replace(/[4@]/g, "a")
    .replace(/[5]/g, "a")
    .replace(/[$]/g, "s")
    .replace(/[7]/g, "t")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
};

const countRegexMatches = (text: string, regex: RegExp): number => {
  const matches = text.match(regex);
  return matches ? matches.length : 0;
};

const collectPatternMatches = (
  text: string,
  rules: ModerationPatternRule[],
): string[] => {
  return rules
    .filter((rule) => rule.pattern.test(text))
    .map((rule) => rule.label);
};

const collectProfanityMatches = (
  normalizedText: string,
): { high: string[]; review: string[] } => {
  const compactText = normalizedText.replace(/\s+/g, "");
  const high = new Set<string>();
  const review = new Set<string>();

  PROFANITY_RULES.forEach((rule) => {
    if (!rule.pattern.test(normalizedText)) return;
    if (rule.severity === "high") {
      high.add(rule.label);
    } else {
      review.add(rule.label);
    }
  });

  COMPACT_PROFANITY_RULES.forEach((rule) => {
    if (!compactText.includes(rule.token)) return;
    if (rule.severity === "high") {
      high.add(rule.label);
    } else {
      review.add(rule.label);
    }
  });

  return {
    high: Array.from(high),
    review: Array.from(review).filter((item) => !high.has(item)),
  };
};

const assessPostModeration = (post: Post): ModerationAssessment => {
  const title = post.title?.trim() || "";
  const content = post.contentText?.trim() || "";
  const rawText = `${title} ${content}`.trim();
  const normalizedText = normalizeForModeration(rawText);

  const reasons: string[] = [];
  let score = 0;

  const profanityMatches = collectProfanityMatches(normalizedText);
  if (profanityMatches.high.length > 0) {
    score += 72;
    reasons.push(
      `Phát hiện ngôn từ thô tục/công kích: ${profanityMatches.high.slice(0, 3).join(", ")}.`,
    );
  } else if (profanityMatches.review.length > 0) {
    score += 34;
    reasons.push(
      `Phát hiện từ lóng/viết tắt tục tĩu: ${profanityMatches.review.slice(0, 3).join(", ")}.`,
    );
  }

  const matchedHighRiskKeyword = collectPatternMatches(
    normalizedText,
    HIGH_RISK_PATTERNS,
  );
  if (matchedHighRiskKeyword.length > 0) {
    score += Math.min(24, matchedHighRiskKeyword.length * 12);
    reasons.push(
      `Có dấu hiệu nội dung nhạy cảm: ${matchedHighRiskKeyword.slice(0, 3).join(", ")}.`,
    );
  }

  const matchedReviewKeywords = collectPatternMatches(
    normalizedText,
    REVIEW_PATTERNS,
  );
  if (matchedReviewKeywords.length > 0) {
    score += Math.min(24, matchedReviewKeywords.length * 8);
    reasons.push(
      `Có dấu hiệu điều hướng/rao bán: ${matchedReviewKeywords.slice(0, 3).join(", ")}.`,
    );
  }

  const linkCount = countRegexMatches(rawText, /(https?:\/\/|www\.)/gi);
  if (linkCount >= 2) {
    score += 20;
    reasons.push(`Chứa nhiều liên kết ngoài (${linkCount} link).`);
  }

  const phoneCount = countRegexMatches(rawText, /\b\d{9,11}\b/g);
  if (phoneCount > 0 && (normalizedText.includes("zalo") || normalizedText.includes("telegram"))) {
    score += 16;
    reasons.push("Có số liên hệ kèm kênh liên lạc ngoài nền tảng.");
  }

  const lettersOnly = rawText.replace(/[^a-zA-Z]/g, "");
  const upperCaseCount = rawText.replace(/[^A-Z]/g, "").length;
  if (lettersOnly.length >= 20 && upperCaseCount / lettersOnly.length > 0.6) {
    score += 10;
    reasons.push("Tỉ lệ chữ in hoa cao, có thể mang tính giật gân/spam.");
  }

  if (/(.)\1{5,}/.test(rawText)) {
    score += 8;
    reasons.push("Có ký tự lặp bất thường (dấu hiệu spam). ");
  }

  if (!title) {
    score += 4;
    reasons.push("Thiếu tiêu đề rõ ràng.");
  }

  const textLength = content.length;
  if (textLength > 0 && textLength < 20) {
    score += 6;
    reasons.push("Nội dung quá ngắn, thiếu ngữ cảnh để kiểm duyệt.");
  }

  score = Math.min(100, score);

  let level: ModerationLevel = "safe";
  if (score >= 55) level = "high";
  else if (score >= 25) level = "review";

  if (reasons.length === 0) {
    reasons.push("Chưa thấy dấu hiệu vi phạm rõ ràng theo bộ quy tắc tự động.");
  }

  const recommendation =
    level === "high"
      ? "Đề xuất Ẩn ngay và chuyển Nháp; chỉ Xóa khi xác nhận vi phạm nghiêm trọng."
      : level === "review"
        ? "Đề xuất rà soát thủ công và chuyển Nháp nếu nội dung chưa đạt chuẩn cộng đồng."
        : "Nội dung tạm đạt chuẩn; tiếp tục theo dõi báo cáo và tương tác bất thường.";

  return {
    level,
    score,
    reasons,
    recommendation,
    linkCount,
    textLength,
  };
};

const MODERATION_LABEL: Record<ModerationLevel, string> = {
  safe: "An toàn",
  review: "Cần rà soát",
  high: "Nguy cơ cao",
};

export function UserPostsManagementScreen() {
  // ── State ────────────────────────────────────────────────
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Detail modal
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [commentsPreview, setCommentsPreview] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [commentsTotal, setCommentsTotal] = useState(0);

  const moderationByPost = useMemo(() => {
    const entries = posts.map((post) => [post.id, assessPostModeration(post)] as const);
    return Object.fromEntries(entries) as Record<string, ModerationAssessment>;
  }, [posts]);

  const moderationStats = useMemo(() => {
    return posts.reduce(
      (acc, post) => {
        const level = moderationByPost[post.id]?.level ?? "safe";
        acc[level] += 1;
        return acc;
      },
      { safe: 0, review: 0, high: 0 } as Record<ModerationLevel, number>,
    );
  }, [moderationByPost, posts]);

  const selectedAssessment = useMemo(
    () => (selectedPost ? assessPostModeration(selectedPost) : null),
    [selectedPost],
  );

  const closeDetailModal = useCallback(() => {
    setSelectedPost(null);
    setCommentsPreview([]);
    setCommentsLoading(false);
    setCommentsError(null);
    setCommentsTotal(0);
  }, []);

  const loadCommentsPreview = useCallback(async (postId: string) => {
    setCommentsLoading(true);
    setCommentsError(null);

    try {
      const data = await commentService.getComments(postId, 1, 5);
      setCommentsPreview(data.items);
      setCommentsTotal(data.totalCount);
    } catch {
      setCommentsPreview([]);
      setCommentsTotal(0);
      setCommentsError("Không thể tải bình luận.");
    } finally {
      setCommentsLoading(false);
    }
  }, []);

  // ── Fetch ────────────────────────────────────────────────
  const fetchPosts = useCallback(
    async (pageNum = 1) => {
      setLoading(true);
      try {
        const res = await postService.getAllPosts({
          page: pageNum,
          pageSize: 20,
          search: searchQuery.trim() || undefined,
          status: statusFilter || undefined,
        });
        setPosts(res.items);
        setTotalPages(res.meta.totalPages);
        setTotalCount(res.meta.totalCount);
        setPage(pageNum);
      } catch (err: any) {
        showError(
          "Lỗi tải dữ liệu",
          err?.response?.data?.message ?? "Không thể tải danh sách bài viết",
        );
        setPosts([]);
      } finally {
        setLoading(false);
      }
    },
    [searchQuery, statusFilter],
  );

  // Reload on filter change
  useEffect(() => {
    const timer = setTimeout(() => fetchPosts(1), searchQuery ? 350 : 0);
    return () => clearTimeout(timer);
  }, [fetchPosts]);

  // ── Actions ─────────────────────────────────────────────
  const handleHide = async (postId: string) => {
    if (!window.confirm("Ẩn bài viết này khỏi người dùng?")) return;
    setActionLoading(postId);
    try {
      await postService.archivePost(postId);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, status: "Archived" } : p)),
      );
      showSuccess("Đã ẩn", "Bài viết đã được ẩn khỏi người dùng");
    } catch {
      showError("Lỗi", "Không thể ẩn bài viết");
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnhide = async (postId: string) => {
    if (!window.confirm("Khôi phục bài viết này?")) return;
    setActionLoading(postId);
    try {
      await postService.publishPost(postId);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, status: "Published" } : p)),
      );
      showSuccess("Đã khôi phục", "Bài viết đã được khôi phục");
    } catch {
      showError("Lỗi", "Không thể khôi phục bài viết");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!window.confirm("Xoá bài viết này? Hành động không thể hoàn tác."))
      return;
    setActionLoading(postId);
    try {
      await postService.deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setTotalCount((prev) => prev - 1);
      showSuccess("Đã xoá", "Bài viết đã được xoá");
    } catch {
      showError("Lỗi", "Không thể xoá bài viết");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePublish = async (postId: string) => {
    setActionLoading(postId);
    try {
      await postService.publishPost(postId);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, status: "Published" } : p)),
      );
      showSuccess("Đã đăng", "Bài viết đã được xuất bản");
    } catch {
      showError("Lỗi", "Không thể xuất bản bài viết");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDraft = async (postId: string) => {
    setActionLoading(postId);
    try {
      await postService.revertToDraft(postId);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, status: "Draft" } : p)),
      );
      showSuccess("Đã chuyển", "Bài viết đã được chuyển về bản nháp");
    } catch {
      showError("Lỗi", "Không thể chuyển bài viết về bản nháp");
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewDetail = async (post: Post) => {
    setSelectedPost(post);
    void loadCommentsPreview(post.id);

    try {
      const [fullPost, stats] = await Promise.all([
        postService.getPostById(post.id),
        postService.getPostStats(post.id).catch(() => null),
      ]);
      setSelectedPost((prev) => {
        if (!prev || prev.id !== post.id) return prev;
        return {
          ...fullPost,
          reactionCount: stats?.reactionCount,
          commentCount: stats?.commentCount,
          viewCount: stats?.viewCount,
        };
      });
    } catch {
      // Keep current fallback detail if full post fetch fails.
    }
  };

  // ── Helpers ─────────────────────────────────────────────
  const getStatusLabel = (s: string) => STATUS_LABELS[s] ?? s;
  const getStatusBadge = (s: string) => STATUS_BADGE[s] ?? "published";

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const fmtDt = (iso: string) =>
    new Date(iso).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="posts-mgmt-page">
      {/* ── Header ── */}
      <div className="posts-mgmt-header">
        <div className="posts-mgmt-header-left">
          <h1 className="posts-mgmt-title">Bài viết người dùng</h1>
          <p className="posts-mgmt-subtitle">
            Quản lý và kiểm duyệt nội dung theo mức độ rủi ro cộng đồng
          </p>
        </div>
        <div className="posts-mgmt-header-actions">
          <button
            className="posts-refresh-btn"
            onClick={() => fetchPosts(page)}
            disabled={loading}
            title="Làm mới"
          >
            <Icon name="refresh" size={16} className={loading ? "posts-spin" : ""} />
            Làm mới
          </button>
        </div>
      </div>

      <div className="posts-mgmt-toolbar">
        {/* ── Filters ── */}
        <div className="posts-mgmt-filters">
          <div className="posts-search-box">
            <Icon name="search" size={16} />
            <input
              type="text"
              placeholder="Tìm bài viết theo tiêu đề hoặc tác giả..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
            {searchQuery && (
              <button
                className="posts-search-clear"
                onClick={() => {
                  setSearchQuery("");
                  setPage(1);
                }}
              >
                <Icon name="close" size={14} />
              </button>
            )}
          </div>

          <select
            className="posts-status-filter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <div className="posts-moderation-overview">
          <div className="posts-mod-card safe">
            <span className="posts-mod-card-label">An toàn</span>
            <strong>{moderationStats.safe}</strong>
            <small>Bài viết ít rủi ro</small>
          </div>
          <div className="posts-mod-card review">
            <span className="posts-mod-card-label">Cần rà soát</span>
            <strong>{moderationStats.review}</strong>
            <small>Nên kiểm tra thủ công</small>
          </div>
          <div className="posts-mod-card high">
            <span className="posts-mod-card-label">Nguy cơ cao</span>
            <strong>{moderationStats.high}</strong>
            <small>Ưu tiên xử lý trước</small>
          </div>
        </div>

        <div className="posts-moderation-guide">
          <Icon name="shield" size={15} />
          <span>
            Điểm rủi ro được tính từ ngôn từ thô tục/vi phạm, dấu hiệu spam liên kết - liên hệ ngoài nền tảng và bất thường nội dung.
          </span>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="posts-mgmt-table-card">
        {loading ? (
          <div className="posts-loading">
            <Icon name="refresh" size={32} className="posts-spin" />
            <span>Đang tải dữ liệu...</span>
          </div>
        ) : posts.length === 0 ? (
          <div className="posts-empty">
            <Icon name="file-text" size={40} />
            <p>Không có bài viết nào</p>
            <p className="posts-empty-sub">
              Thử thay đổi bộ lọc hoặc tìm kiếm khác
            </p>
          </div>
        ) : (
          <table className="posts-mgmt-table">
            <thead>
              <tr>
                <th>Tiêu đề</th>
                <th>Tác giả</th>
                <th>Ngày tạo</th>
                <th>Trạng thái</th>
                <th>Lượt xem</th>
                <th>Đánh giá</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => {
                const assessment = moderationByPost[post.id] ?? assessPostModeration(post);
                const rowClassName = [
                  actionLoading === post.id ? "posts-row-loading" : "",
                  assessment.level === "high" ? "post-row-high-risk" : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <tr key={post.id} className={rowClassName}>
                    {/* Title */}
                    <td>
                      <div className="post-title-cell">
                        <Icon name="file-text" size={14} className="post-icon" />
                        <div className="post-title-wrap">
                          <span className="post-title" title={post.title}>
                            {post.title || <em>(Không có tiêu đề)</em>}
                          </span>
                          {post.moodTag && (
                            <span className="post-mood-tag">
                              #{getMoodLabel(post.moodTag)}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Author */}
                    <td className="post-author">
                      @{post.userFullName ?? post.userId}
                    </td>

                    {/* Date */}
                    <td className="post-date">{fmt(post.createdAt)}</td>

                    {/* Status */}
                    <td>
                      <span
                        className={`post-status-badge ${getStatusBadge(post.status)}`}
                      >
                        {getStatusLabel(post.status)}
                      </span>
                    </td>

                    {/* Engagement */}
                    <td>
                      <span className="post-view-count">{post.viewCount ?? 0}</span>
                    </td>

                    <td>
                      <div className="post-moderation-cell">
                        <span className={`post-moderation-badge ${assessment.level}`}>
                          {MODERATION_LABEL[assessment.level]}
                        </span>
                        <span
                          className="post-moderation-reason"
                          title={assessment.reasons.join(" • ")}
                        >
                          {assessment.reasons[0]}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="post-actions">
                        <button
                          className="post-action-btn"
                          onClick={() => handleViewDetail(post)}
                          title="Xem chi tiết"
                        >
                          <Icon name="eye" size={14} />
                        </button>

                        {post.status === "Published" && (
                          <>
                            <button
                              className="post-action-btn post-action-btn--hide"
                              onClick={() => handleHide(post.id)}
                              title="Ẩn bài viết"
                              disabled={!!actionLoading}
                            >
                              <Icon name="eye-off" size={14} />
                            </button>
                            <button
                              className="post-action-btn post-action-btn--draft"
                              onClick={() => handleDraft(post.id)}
                              title="Chuyển về nháp"
                              disabled={!!actionLoading}
                            >
                              <Icon name="folder" size={14} />
                            </button>
                          </>
                        )}

                        {(post.status === "Archived" ||
                          post.status === "Draft") && (
                            <button
                              className="post-action-btn post-action-btn--publish"
                              onClick={() => handlePublish(post.id)}
                              title="Xuất bản"
                              disabled={!!actionLoading}
                            >
                              <Icon name="globe" size={14} />
                            </button>
                          )}

                        {post.status === "Archived" && (
                          <button
                            className="post-action-btn post-action-btn--restore"
                            onClick={() => handleUnhide(post.id)}
                            title="Khôi phục"
                            disabled={!!actionLoading}
                          >
                            <Icon name="globe" size={14} />
                          </button>
                        )}

                        <button
                          className="post-action-btn post-action-btn--delete"
                          onClick={() => handleDelete(post.id)}
                          title="Xoá bài viết"
                          disabled={!!actionLoading}
                        >
                          {actionLoading === post.id ? (
                            <Icon name="refresh" size={14} className="posts-spin" />
                          ) : (
                            <Icon name="trash" size={14} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination ── */}
      {!loading && totalPages > 1 && (
        <div className="posts-pagination">
          <span className="posts-pagination-info">
            Hiển thị{" "}
            <strong>
              {(page - 1) * 20 + 1}–{Math.min(page * 20, totalCount)}
            </strong>{" "}
            trong <strong>{totalCount}</strong> bài viết · Trang{" "}
            <strong>{page}</strong>/<strong>{totalPages}</strong>
          </span>
          <div className="posts-pagination-controls">
            <button
              className="posts-pagination-btn"
              onClick={() => fetchPosts(page - 1)}
              disabled={page <= 1}
            >
              <Icon name="chevron-left" size={16} />
              Trước
            </button>

            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  className={`posts-pagination-btn ${page === pageNum ? "active" : ""}`}
                  onClick={() => fetchPosts(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              className="posts-pagination-btn"
              onClick={() => fetchPosts(page + 1)}
              disabled={page >= totalPages}
            >
              Sau
              <Icon name="chevron-right" size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── Detail Modal ── */}
      {selectedPost && (
        <div
          className="posts-modal-overlay"
          onClick={closeDetailModal}
        >
          <div className="posts-modal" onClick={(e) => e.stopPropagation()}>
            <div className="posts-modal-header">
              <h3>{selectedPost.title || "(Không có tiêu đề)"}</h3>
              <button onClick={closeDetailModal}>×</button>
            </div>
            <div className="posts-modal-body">
              <div className="posts-detail-row">
                <span>Tác giả:</span>
                <strong>
                  @{selectedPost.userFullName ?? selectedPost.userId}
                </strong>
              </div>

              <div className="posts-detail-row">
                <span>Trạng thái:</span>
                <span
                  className={`post-status-badge ${getStatusBadge(selectedPost.status)}`}
                >
                  {getStatusLabel(selectedPost.status)}
                </span>
              </div>

              {selectedPost.moodTag && (
                <div className="posts-detail-row">
                  <span>Mood:</span>
                  <strong>#{getMoodLabel(selectedPost.moodTag)}</strong>
                </div>
              )}

              <div className="posts-detail-row">
                <span>Quyền riêng tư:</span>
                <strong>{selectedPost.privacyScope ?? "—"}</strong>
              </div>

              <div className="posts-detail-row">
                <span>Ngày tạo:</span>
                <strong>{fmtDt(selectedPost.createdAt)}</strong>
              </div>

              {selectedPost.publishedAt && (
                <div className="posts-detail-row">
                  <span>Ngày đăng:</span>
                  <strong>{fmtDt(selectedPost.publishedAt)}</strong>
                </div>
              )}

              <div className="posts-detail-row">
                <span>Lượt xem:</span>
                <strong>{selectedPost.viewCount ?? 0}</strong>
              </div>

              {selectedAssessment && (
                <>
                  <div className="posts-detail-row">
                    <span>Chỉ số rủi ro:</span>
                    <strong>
                      {MODERATION_LABEL[selectedAssessment.level]} ({selectedAssessment.score} điểm)
                    </strong>
                  </div>

                  <div className="posts-detail-row">
                    <span>Phân tích nhanh:</span>
                    <strong>
                      {selectedAssessment.textLength} ký tự nội dung • {selectedAssessment.linkCount} liên kết
                    </strong>
                  </div>

                  <div className={`posts-moderation-panel ${selectedAssessment.level}`}>
                    <div className="posts-moderation-panel-head">
                      {selectedAssessment.level === "safe" ? (
                        <Icon name="shield" size={15} />
                      ) : (
                        <Icon name="warning" size={15} />
                      )}
                      <strong>Gợi ý kiểm duyệt</strong>
                    </div>
                    <p>{selectedAssessment.recommendation}</p>
                    <ul className="posts-moderation-list">
                      {selectedAssessment.reasons.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              {selectedPost.postType === "share-music" &&
                selectedPost.shareMusic && (
                  <div className="posts-detail-row">
                    <span>Loại:</span>
                    <strong>
                      Chia sẻ nhạc — {selectedPost.shareMusic.title}
                    </strong>
                  </div>
                )}

              <div className="posts-content-preview">
                <span>Nội dung:</span>
                <p>{selectedPost.contentText || "(Không có nội dung)"}</p>
              </div>

              {selectedPost.imageUrl?.trim() && (
                <div className="posts-media-preview">
                  <span>Hình ảnh:</span>
                  <img
                    className="posts-media-image"
                    src={selectedPost.imageUrl}
                    alt={selectedPost.title || "Hình bài viết"}
                    loading="lazy"
                  />
                </div>
              )}

              {selectedPost.audioUrl?.trim() && (
                <div className="posts-media-preview">
                  <span>Âm thanh:</span>
                  <audio className="posts-media-audio" controls preload="none" src={selectedPost.audioUrl} />
                </div>
              )}

              <div className="posts-comments-preview">
                <div className="posts-comments-header">
                  <span>Bình luận</span>
                  <strong>{commentsTotal || selectedPost.commentCount || 0}</strong>
                </div>

                {commentsLoading ? (
                  <p className="posts-comments-state">Đang tải bình luận...</p>
                ) : commentsError ? (
                  <p className="posts-comments-state posts-comments-state--error">{commentsError}</p>
                ) : commentsPreview.length === 0 ? (
                  <p className="posts-comments-state">Chưa có bình luận nào.</p>
                ) : (
                  <ul className="posts-comments-list">
                    {commentsPreview.map((comment) => (
                      <li key={comment.id} className="posts-comment-item">
                        <div className="posts-comment-head">
                          <strong>{comment.userFullName || "Ẩn danh"}</strong>
                          <span>{fmtDt(comment.createdAt)}</span>
                        </div>
                        <p>{comment.content}</p>
                        {!!comment.replies?.length && (
                          <small>{comment.replies.length} phản hồi</small>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="posts-modal-footer">
              {selectedPost.status === "Published" && (
                <>
                  <button
                    className="post-action-btn post-action-btn--hide"
                    onClick={() => {
                      handleHide(selectedPost.id);
                      closeDetailModal();
                    }}
                  >
                    <Icon name="eye-off" size={14} />
                    Ẩn bài viết
                  </button>
                  <button
                    className="post-action-btn post-action-btn--draft"
                    onClick={() => {
                      handleDraft(selectedPost.id);
                      closeDetailModal();
                    }}
                  >
                    <Icon name="folder" size={14} />
                    Chuyển nháp
                  </button>
                </>
              )}

              {(selectedPost.status === "Archived" ||
                selectedPost.status === "Draft") && (
                  <button
                    className="post-action-btn post-action-btn--publish"
                    onClick={() => {
                      handlePublish(selectedPost.id);
                      closeDetailModal();
                    }}
                  >
                    <Icon name="globe" size={14} />
                    Xuất bản
                  </button>
                )}

              <button
                className="post-action-btn post-action-btn--delete"
                onClick={() => {
                  handleDelete(selectedPost.id);
                  closeDetailModal();
                }}
              >
                <Icon name="trash" size={14} />
                Xoá bài viết
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
