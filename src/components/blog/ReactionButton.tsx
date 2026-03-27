import { useState, useRef, useEffect, useCallback } from "react";
import reactionService from "../../services/reactionService";
import type { ReactionType } from "../../services/reactionService";
import "./ReactionButton.css";
import { ThumbsUp } from "lucide-react";

/* ── Reaction config ── */
// eslint-disable-next-line react-refresh/only-export-components
export const REACTIONS: {
  type: ReactionType;
  emoji: string;
  label: string;
  color: string;
}[] = [
  { type: "like", emoji: "👍", label: "Thích", color: "#1877f2" },
  { type: "love", emoji: "❤️", label: "Yêu thích", color: "#f33e58" },
  { type: "haha", emoji: "😆", label: "Haha", color: "#f7b125" },
  { type: "wow", emoji: "😮", label: "Wow", color: "#f7b125" },
  { type: "sad", emoji: "😢", label: "Buồn", color: "#f7b125" },
  { type: "angry", emoji: "😡", label: "Phẫn nộ", color: "#e9710f" },
];

const getReaction = (type: ReactionType | null) =>
  REACTIONS.find((r) => r.type === type) ?? null;

interface ReactionButtonProps {
  postId: string;
  /** Số lượng reaction hiện tại */
  initialCount?: number;
  /** Reaction hiện tại của user (null = chưa react) */
  initialReaction?: ReactionType | null;
  /** reactionId để PUT đổi loại (nếu backend trả về) */
  initialReactionId?: string | null;
}

export default function ReactionButton({
  postId,
  initialCount = 0,
  initialReaction = null,
  initialReactionId = null,
}: ReactionButtonProps) {
  const [count, setCount] = useState(initialCount);
  const [myReaction, setMyReaction] = useState<ReactionType | null>(
    initialReaction,
  );
  const [reactionId, setReactionId] = useState<string | null>(
    initialReactionId,
  );
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [topEmojis, setTopEmojis] = useState<string[]>([]);

  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const isLoggedIn = !!localStorage.getItem("accessToken");

  /* ── Helper: tính top 2 emoji từ danh sách reactions ── */
  const computeTopEmojis = (reactions: { reactionType: ReactionType }[]) => {
    const tally: Partial<Record<ReactionType, number>> = {};
    reactions.forEach((r) => {
      tally[r.reactionType] = (tally[r.reactionType] ?? 0) + 1;
    });
    return Object.entries(tally)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 2)
      .map(([type]) => getReaction(type as ReactionType)?.emoji ?? "");
  };

  /* ── Fetch reactions khi mount (cả khi chưa đăng nhập) ── */
  useEffect(() => {
    const fetchReactions = async () => {
      setFetching(true);
      try {
        const reactions = await reactionService.getReactions(postId);
        setCount(reactions.length);
        setTopEmojis(computeTopEmojis(reactions));

        // Nếu đã đăng nhập thì kiểm tra reaction của mình
        if (isLoggedIn) {
          const axiosModule = await import("../../services/axios");
          const res = await axiosModule.default.get("/users/me/profile/full");
          const currentUserId = res.data?.data?.id ?? null;
          if (currentUserId) {
            const mine = reactions.find((r) => r.userId === currentUserId);
            if (mine) {
              setMyReaction(mine.reactionType);
              setReactionId(mine.id);
            }
          }
        }
      } catch {
        /* silent */
      } finally {
        setFetching(false);
      }
    };

    fetchReactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);
  useEffect(() => {
    if (!showPopup) return;
    const handler = (e: MouseEvent) => {
      if (
        btnRef.current?.contains(e.target as Node) ||
        popupRef.current?.contains(e.target as Node)
      )
        return;
      setShowPopup(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPopup]);

  /* ── Hover: mở popup sau 400ms ── */
  const handleMouseEnter = () => {
    if (!isLoggedIn) return;
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    hoverTimer.current = setTimeout(() => setShowPopup(true), 400);
  };

  const handleMouseLeave = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    leaveTimer.current = setTimeout(() => setShowPopup(false), 300);
  };

  /* ── Click nút chính: toggle like hoặc bỏ react ── */
  const handleMainClick = async () => {
    if (!isLoggedIn || loading) return;
    setLoading(true);
    try {
      if (myReaction) {
        await reactionService.removeReaction(postId);
        setCount((c) => Math.max(0, c - 1));
        setMyReaction(null);
        setReactionId(null);
        setTopEmojis((prev) => {
          const likeEmoji = getReaction("like")?.emoji ?? "";
          // Nếu like là top emoji và không còn react nữa, cập nhật lại
          return prev.filter((e) => e !== likeEmoji || myReaction !== "like");
        });
      } else {
        await reactionService.addReaction(postId, "like");
        setCount((c) => c + 1);
        setMyReaction("like");
        setTopEmojis((prev) => {
          const likeEmoji = getReaction("like")?.emoji ?? "👍";
          return prev.includes(likeEmoji)
            ? prev
            : [likeEmoji, ...prev].slice(0, 2);
        });
      }
    } catch (err) {
      console.error("Reaction failed:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ── Chọn emoji từ popup ── */
  const handlePickReaction = useCallback(
    async (type: ReactionType) => {
      if (!isLoggedIn || loading) return;
      setShowPopup(false);
      setLoading(true);
      try {
        if (!myReaction) {
          // Chưa react → thêm mới
          await reactionService.addReaction(postId, type);
          setCount((c) => c + 1);
        } else if (type !== myReaction) {
          // Đang react khác loại → đổi
          if (reactionId) {
            await reactionService.changeReaction(reactionId, type);
          } else {
            await reactionService.removeReaction(postId);
            await reactionService.addReaction(postId, type);
          }
          // Count không đổi vì chỉ đổi loại
        } else {
          // Chọn lại cùng loại → bỏ
          await reactionService.removeReaction(postId);
          setCount((c) => Math.max(0, c - 1));
          setMyReaction(null);
          setReactionId(null);
          setLoading(false);
          return;
        }
        setMyReaction(type);
      } catch (err) {
        console.error("Pick reaction failed:", err);
      } finally {
        setLoading(false);
      }
    },
    [postId, myReaction, reactionId, isLoggedIn, loading],
  );

  const current = getReaction(myReaction);
  const formatCount = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n > 0 ? String(n) : "";

  return (
    <div className="rb-wrap">
      {/* ── Main button — không chứa summary ── */}
      <button
        ref={btnRef}
        className={`rb-btn ${myReaction ? "rb-btn--active" : ""} ${fetching ? "rb-btn--fetching" : ""}`}
        style={current ? { color: current.color } : undefined}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleMainClick}
        disabled={loading || fetching}
      >
        <span className="rb-icon">
          {current ? current.emoji : <ThumbsUp size={18} />}
        </span>
        <span className="rb-label">{current ? current.label : "Thích"}</span>
      </button>

      {/* ── Reaction popup ── */}
      {showPopup && (
        <div
          ref={popupRef}
          className="rb-popup"
          onMouseEnter={() => {
            if (leaveTimer.current) clearTimeout(leaveTimer.current);
          }}
          onMouseLeave={handleMouseLeave}
        >
          {REACTIONS.map((r, i) => (
            <button
              key={r.type}
              className={`rb-emoji-btn ${myReaction === r.type ? "rb-emoji-btn--active" : ""}`}
              style={{ animationDelay: `${i * 30}ms` }}
              onClick={() => handlePickReaction(r.type)}
              title={r.label}
            >
              <span className="rb-emoji">{r.emoji}</span>
              <span className="rb-emoji-label">{r.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   ReactionSummary — render NGOÀI action row, phía trên
   Dùng: <ReactionSummary postId={post.id} />
         <div className="post-actions"> ... </div>
   ============================================================ */
// eslint-disable-next-line react-refresh/only-export-components
export function ReactionSummary({ postId }: { postId: string }) {
  const [count, setCount] = useState(0);
  const [topEmojis, setTopEmojis] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    reactionService
      .getReactions(postId)
      .then((reactions) => {
        setCount(reactions.length);
        const tally: Partial<Record<ReactionType, number>> = {};
        reactions.forEach((r) => {
          tally[r.reactionType] = (tally[r.reactionType] ?? 0) + 1;
        });
        const top = Object.entries(tally)
          .sort((a, b) => (b[1] as number) - (a[1] as number))
          .slice(0, 2)
          .map(([type]) => getReaction(type as ReactionType)?.emoji ?? "");
        setTopEmojis(top);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [postId]);

  if (!loaded || count === 0) return null;

  const fmt = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  return (
    <div className="rb-summary">
      <span className="rb-summary-emojis">
        {topEmojis.map((emoji, i) => (
          <span key={i} className="rb-summary-emoji">
            {emoji}
          </span>
        ))}
      </span>
      <span className="rb-summary-count">{fmt(count)}</span>
      <span className="rb-summary-label">lượt cảm xúc</span>
    </div>
  );
}
