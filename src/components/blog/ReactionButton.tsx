import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Angry,
  Frown,
  Heart,
  Laugh,
  Sparkles,
  ThumbsUp,
  UserRound,
  X,
} from "lucide-react";
import reactionService, {
  type ReactionType,
  type ReactionUser,
} from "../../services/reactionService";
import "./ReactionButton.css";

type ReactionFilter = ReactionType | "all";

interface ReactionMeta {
  type: ReactionType;
  label: string;
  color: string;
  softBg: string;
  strongBg: string;
  Icon: LucideIcon;
}

export const REACTIONS: ReactionMeta[] = [
  {
    type: "like",
    label: "Thích",
    color: "#1877F2",
    softBg: "rgba(24, 119, 242, 0.12)",
    strongBg: "linear-gradient(135deg, #1877F2 0%, #3b93ff 100%)",
    Icon: ThumbsUp,
  },
  {
    type: "love",
    label: "Yêu thích",
    color: "#F33E58",
    softBg: "rgba(243, 62, 88, 0.12)",
    strongBg: "linear-gradient(135deg, #F33E58 0%, #ff667d 100%)",
    Icon: Heart,
  },
  {
    type: "haha",
    label: "Haha",
    color: "#F5B301",
    softBg: "rgba(245, 179, 1, 0.14)",
    strongBg: "linear-gradient(135deg, #F7C948 0%, #F5B301 100%)",
    Icon: Laugh,
  },
  {
    type: "wow",
    label: "Wow",
    color: "#7C3AED",
    softBg: "rgba(124, 58, 237, 0.12)",
    strongBg: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
    Icon: Sparkles,
  },
  {
    type: "sad",
    label: "Buồn",
    color: "#0EA5E9",
    softBg: "rgba(14, 165, 233, 0.12)",
    strongBg: "linear-gradient(135deg, #38BDF8 0%, #0EA5E9 100%)",
    Icon: Frown,
  },
  {
    type: "angry",
    label: "Phẫn nộ",
    color: "#F97316",
    softBg: "rgba(249, 115, 22, 0.12)",
    strongBg: "linear-gradient(135deg, #FB923C 0%, #F97316 100%)",
    Icon: Angry,
  },
];

const getCfg = (type: ReactionType | null) =>
  REACTIONS.find((r) => r.type === type) ?? null;

const getInitials = (name?: string | null) => {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

const formatCount = (n: number) => {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
};

const tallyTopTypes = (data: ReactionUser[]): ReactionType[] => {
  const tally: Record<string, number> = {};
  data.forEach((r) => {
    tally[r.reactionType] = (tally[r.reactionType] ?? 0) + 1;
  });

  return Object.entries(tally)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type]) => type as ReactionType);
};

const countByType = (data: ReactionUser[]) => {
  const tally: Partial<Record<ReactionType, number>> = {};
  for (const item of data) {
    tally[item.reactionType as ReactionType] =
      (tally[item.reactionType as ReactionType] ?? 0) + 1;
  }
  return tally;
};

/* ─────────────────────────────────────────────
   ReactionButton — chỉ lo việc react
   Click = quick like/unlike
   Hover = mở picker chọn loại cảm xúc
   ───────────────────────────────────────────── */

interface ReactionButtonProps {
  postId: string;
  initialCount?: number;
  initialReaction?: ReactionType | null;
  initialReactionId?: string | null;
  onRequireAuth?: () => void;
}

export default function ReactionButton({
  postId,
  initialCount = 0,
  initialReaction = null,
  onRequireAuth,
}: ReactionButtonProps) {
  const [count, setCount] = useState(initialCount);
  const [myReaction, setMyReaction] = useState<ReactionType | null>(
    initialReaction,
  );
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const isLoggedIn = !!localStorage.getItem("accessToken");

  const loadReactions = useCallback(async () => {
    setFetching(true);
    try {
      const data = await reactionService.getReactions(postId);
      setCount(data.length);

      if (isLoggedIn) {
        let uid = userId;
        if (!uid) {
          const res = await import("../../services/axios").then((m) =>
            m.default.get("/users/me/profile/full"),
          );
          uid = res.data?.data?.id ?? null;
          setUserId(uid);
        }

        if (uid) {
          const mine = data.find((r) => r.userId === uid);
          setMyReaction(mine ? (mine.reactionType as ReactionType) : null);
        }
      }
    } catch {
      // silent
    } finally {
      setFetching(false);
    }
  }, [postId, isLoggedIn, userId]);

  useEffect(() => {
    void loadReactions();
  }, [loadReactions]);

  /* outside click — đóng picker */
  useEffect(() => {
    if (!showPicker) return;

    const handleOutside = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node)) return;
      if (pickerRef.current?.contains(e.target as Node)) return;
      setShowPicker(false);
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [showPicker]);

  const onMouseEnter = () => {
    if (!isLoggedIn) return;
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    hoverTimer.current = setTimeout(() => setShowPicker(true), 420);
  };

  const onMouseLeave = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    leaveTimer.current = setTimeout(() => {
      if (!pickerRef.current?.matches(":hover")) setShowPicker(false);
    }, 220);
  };

  /* Click = quick toggle like/unlike */
  const onMainClick = () => {
    if (!isLoggedIn) {
      if (onRequireAuth) onRequireAuth();
      return;
    }
    if (loading) return;

    if (showPicker) {
      setShowPicker(false);
      return;
    }

    void onPickReaction(myReaction ?? "like");
  };

  const onPickReaction = async (type: ReactionType) => {
    if (!isLoggedIn || loading) return;

    setShowPicker(false);
    setLoading(true);

    try {
      if (!myReaction) {
        await reactionService.addReaction(postId, type);
      } else if (type !== myReaction) {
        await reactionService.removeReaction(postId);
        await reactionService.addReaction(postId, type);
      } else {
        await reactionService.removeReaction(postId);
      }

      await loadReactions();
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const cfg = getCfg(myReaction);

  return (
    <div className="rb-wrap">
      <div className="rb-main">
        <button
          ref={btnRef}
          className={`rb-btn${myReaction ? " rb-btn--active" : ""}${fetching ? " rb-btn--fetching" : ""}`}
          style={
            cfg
              ? {
                  color: cfg.color,
                  background: cfg.softBg,
                  borderColor: `${cfg.color}26`,
                }
              : undefined
          }
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onClick={onMainClick}
          disabled={loading || fetching}
          type="button"
        >
          <span
            className={`rb-icon${myReaction ? " is-active" : ""}`}
            style={
              cfg ? { background: cfg.strongBg, color: "#fff" } : undefined
            }
          >
            {cfg ? <cfg.Icon size={16} /> : <ThumbsUp size={16} />}
          </span>

          <span className="rb-label">{cfg ? cfg.label : "Thích"}</span>

          {count > 0 && <span className="rb-count">{formatCount(count)}</span>}
        </button>

        {showPicker && (
          <div
            ref={pickerRef}
            className="rb-popup"
            onMouseEnter={() => {
              if (leaveTimer.current) clearTimeout(leaveTimer.current);
            }}
            onMouseLeave={onMouseLeave}
          >
            {REACTIONS.map((reaction, index) => {
              const Icon = reaction.Icon;
              const active = myReaction === reaction.type;

              return (
                <button
                  key={reaction.type}
                  className={`rb-emoji-btn${active ? " rb-emoji-btn--active" : ""}`}
                  style={{ animationDelay: `${index * 28}ms` }}
                  onClick={() => void onPickReaction(reaction.type)}
                  title={reaction.label}
                  type="button"
                >
                  <span
                    className="rb-emoji-bubble"
                    style={{
                      background: reaction.strongBg,
                      boxShadow: active
                        ? `0 10px 20px ${reaction.color}45`
                        : undefined,
                    }}
                  >
                    <Icon size={20} />
                  </span>
                  <span
                    className="rb-emoji-label"
                    style={{ color: reaction.color }}
                  >
                    {reaction.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ReactionSummary — hiển thị tóm tắt cảm xúc
   Click vào = mở tooltip xem ai đã reaction
   ───────────────────────────────────────────── */

export function ReactionSummary({ postId }: { postId: string }) {
  const [count, setCount] = useState(0);
  const [topTypes, setTopTypes] = useState<ReactionType[]>([]);
  const [avatars, setAvatars] = useState<Array<string | null>>([]);
  const [names, setNames] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [reactions, setReactions] = useState<ReactionUser[]>([]);

  const [showTooltip, setShowTooltip] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ReactionFilter>("all");
  const [userId, setUserId] = useState<string | null>(null);

  const summaryRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const isLoggedIn = !!localStorage.getItem("accessToken");

  useEffect(() => {
    reactionService
      .getReactions(postId)
      .then(async (data: ReactionUser[]) => {
        setReactions(data);
        setCount(data.length);
        setTopTypes(tallyTopTypes(data));

        const seen = new Set<string>();
        const nextAvatars: Array<string | null> = [];
        const nextNames: string[] = [];

        for (const item of data) {
          if (!seen.has(item.userId)) {
            seen.add(item.userId);
            nextAvatars.push(item.userAvatarUrl);
            nextNames.push(item.userFullName);
            if (nextAvatars.length >= 3) break;
          }
        }

        setAvatars(nextAvatars);
        setNames(nextNames);

        /* lấy userId để hiển thị badge "Bạn" */
        if (isLoggedIn) {
          try {
            const res = await import("../../services/axios").then((m) =>
              m.default.get("/users/me/profile/full"),
            );
            setUserId(res.data?.data?.id ?? null);
          } catch {
            // silent
          }
        }

        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [postId, isLoggedIn]);

  /* outside click — đóng tooltip */
  useEffect(() => {
    if (!showTooltip) return;

    const handleOutside = (e: MouseEvent) => {
      if (summaryRef.current?.contains(e.target as Node)) return;
      if (tooltipRef.current?.contains(e.target as Node)) return;
      setShowTooltip(false);
    };

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [showTooltip]);

  /* reset filter khi đóng tooltip */
  useEffect(() => {
    if (!showTooltip) setActiveFilter("all");
  }, [showTooltip]);

  const groupedCounts = useMemo(() => countByType(reactions), [reactions]);

  const filteredReactions = useMemo(() => {
    if (activeFilter === "all") return reactions;
    return reactions.filter((item) => item.reactionType === activeFilter);
  }, [reactions, activeFilter]);

  const onSummaryClick = () => {
    setShowTooltip((v) => !v);
  };

  if (!loaded || count === 0) return null;

  return (
    <div className="rb-summary-wrap" ref={summaryRef}>
      {/* Tooltip — danh sách người đã reaction */}
      {showTooltip && reactions.length > 0 && (
        <div ref={tooltipRef} className="rb-tooltip">
          <div className="rb-tooltip-header">
            <div>
              <div className="rb-tooltip-eyebrow">Tương tác bài viết</div>
              <div className="rb-tooltip-title">
                {formatCount(reactions.length)} cảm xúc
              </div>
            </div>

            <button
              className="rb-tooltip-close"
              onClick={() => setShowTooltip(false)}
              type="button"
              aria-label="Đóng"
            >
              <X size={16} />
            </button>
          </div>

          <div className="rb-tooltip-filters">
            <button
              type="button"
              className={`rb-filter-chip${activeFilter === "all" ? " is-active" : ""}`}
              onClick={() => setActiveFilter("all")}
            >
              Tất cả
              <span>{reactions.length}</span>
            </button>

            {REACTIONS.map((reaction) => {
              const total = groupedCounts[reaction.type] ?? 0;
              if (!total) return null;
              const Icon = reaction.Icon;

              return (
                <button
                  key={reaction.type}
                  type="button"
                  className={`rb-filter-chip${activeFilter === reaction.type ? " is-active" : ""}`}
                  style={
                    activeFilter === reaction.type
                      ? {
                          color: reaction.color,
                          background: reaction.softBg,
                          borderColor: `${reaction.color}33`,
                        }
                      : undefined
                  }
                  onClick={() => setActiveFilter(reaction.type)}
                >
                  <span
                    className="rb-filter-chip-icon"
                    style={{ color: reaction.color }}
                  >
                    <Icon size={14} />
                  </span>
                  {reaction.label}
                  <span>{total}</span>
                </button>
              );
            })}
          </div>

          <div className="rb-tooltip-list">
            {filteredReactions.length === 0 ? (
              <div className="rb-tooltip-empty">
                <div className="rb-tooltip-empty-icon">
                  <UserRound size={18} />
                </div>
                <div className="rb-tooltip-empty-title">Chưa có dữ liệu</div>
                <div className="rb-tooltip-empty-text">
                  Không có người dùng nào trong nhóm cảm xúc này.
                </div>
              </div>
            ) : (
              filteredReactions.slice(0, 30).map((r, i) => {
                const reactionCfg = getCfg(r.reactionType as ReactionType);
                const Icon = reactionCfg?.Icon;
                const isMine = userId && r.userId === userId;

                return (
                  <div key={`${r.userId}-${i}`} className="rb-tooltip-item">
                    <div className="rb-tooltip-avatar">
                      {r.userAvatarUrl ? (
                        <img src={r.userAvatarUrl} alt={r.userFullName} />
                      ) : (
                        <span>{getInitials(r.userFullName)}</span>
                      )}
                    </div>

                    <div className="rb-tooltip-user">
                      <div className="rb-tooltip-user-top">
                        <span className="rb-tooltip-name">
                          {isMine ? "Bạn" : r.userFullName}
                        </span>
                        {isMine && (
                          <span className="rb-tooltip-badge">Bạn</span>
                        )}
                      </div>
                      <div className="rb-tooltip-sub">
                        {reactionCfg?.label ?? "Cảm xúc"}
                      </div>
                    </div>

                    {reactionCfg && Icon && (
                      <div
                        className="rb-tooltip-reaction"
                        style={{
                          color: reactionCfg.color,
                          background: reactionCfg.softBg,
                        }}
                        title={reactionCfg.label}
                      >
                        <Icon size={16} />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {filteredReactions.length > 30 && (
            <div className="rb-tooltip-more">
              Còn {filteredReactions.length - 30} người khác
            </div>
          )}
        </div>
      )}

      {/* Summary — click để mở tooltip */}
      <div
        className={`rb-summary${showTooltip ? " rb-summary--active" : ""}`}
        onClick={onSummaryClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onSummaryClick();
        }}
      >
        <div className="rb-summary-avatars">
          {avatars.map((url, i) =>
            url ? (
              <img
                key={i}
                src={url}
                alt={names[i] ?? ""}
                className="rb-summary-avatar-img"
                title={names[i] ?? ""}
              />
            ) : (
              <div
                key={i}
                className="rb-summary-avatar-fallback"
                title={names[i] ?? ""}
              >
                {getInitials(names[i])}
              </div>
            ),
          )}
        </div>

        <div className="rb-summary-icons">
          {topTypes.map((type, i) => {
            const typeCfg = getCfg(type);
            if (!typeCfg) return null;
            const Icon = typeCfg.Icon;

            return (
              <div
                key={i}
                className="rb-summary-icon-wrap"
                style={{ background: typeCfg.strongBg }}
                title={typeCfg.label}
              >
                <Icon size={12} />
              </div>
            );
          })}
        </div>

        <span className="rb-summary-count">{formatCount(count)}</span>
        <span className="rb-summary-label">cảm xúc</span>
      </div>
    </div>
  );
}
