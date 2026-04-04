import { useState, useRef, useEffect, useCallback } from "react";
import reactionService, { type ReactionType, type ReactionUser } from "../../services/reactionService";
import "./ReactionButton.css";
import { ThumbsUp } from "lucide-react";

export const REACTIONS: { type: ReactionType; emoji: string; label: string; color: string }[] = [
  { type: "like", emoji: "👍", label: "Thích", color: "#1877f2" },
  { type: "love", emoji: "❤️", label: "Yêu thích", color: "#f33e58" },
  { type: "haha", emoji: "😆", label: "Haha", color: "#f7b125" },
  { type: "wow", emoji: "😮", label: "Wow", color: "#f7b125" },
  { type: "sad", emoji: "😢", label: "Buồn", color: "#f7b125" },
  { type: "angry", emoji: "😡", label: "Phẫn nộ", color: "#e9710f" },
];

const getCfg = (type: ReactionType | null) => REACTIONS.find((r) => r.type === type) ?? null;

function tallyTopEmojis(data: ReactionUser[]): string[] {
  const tally: Record<string, number> = {};
  data.forEach((r) => {
    tally[r.reactionType] = (tally[r.reactionType] ?? 0) + 1;
  });
  return Object.entries(tally)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([type]) => getCfg(type as ReactionType)?.emoji ?? "");
}

interface ReactionButtonProps {
  postId: string;
  initialCount?: number;
  initialReaction?: ReactionType | null;
  initialReactionId?: string | null;
}

export default function ReactionButton({
  postId,
  initialCount = 0,
  initialReaction = null,
  initialReactionId = null,
}: ReactionButtonProps) {
  const [count, setCount] = useState(initialCount);
  const [myReaction, setMyReaction] = useState<ReactionType | null>(initialReaction);
  const [showPicker, setShowPicker] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [reactions, setReactions] = useState<ReactionUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const isLoggedIn = !!localStorage.getItem("accessToken");

  const loadReactions = useCallback(async () => {
    setFetching(true);
    try {
      const data = await reactionService.getReactions(postId);
      setReactions(data);
      setCount(data.length);

      if (isLoggedIn) {
        let uid = currentUserId;
        if (!uid) {
          const res = await import("../../services/axios").then((m) => m.default.get("/users/me/profile/full"));
          uid = res.data?.data?.id ?? null;
          setCurrentUserId(uid);
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
  }, [postId, isLoggedIn, currentUserId]);

  useEffect(() => {
    void loadReactions();
  }, [loadReactions]);

  useEffect(() => {
    if (!showPicker && !showTooltip) return;
    const handler = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node)) return;
      if (pickerRef.current?.contains(e.target as Node)) return;
      if (tooltipRef.current?.contains(e.target as Node)) return;
      setShowPicker(false);
      setShowTooltip(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPicker, showTooltip]);

  const onMouseEnter = () => {
    if (!isLoggedIn) return;
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    hoverTimer.current = setTimeout(() => setShowTooltip(true), 600);
  };

  const onMouseLeave = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    tooltipTimer.current = setTimeout(() => setShowTooltip(false), 300);
  };

  const onMainClick = () => {
    if (!isLoggedIn || loading) return;
    setShowPicker((v) => !v);
    setShowTooltip(false);
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
  const fmtCount = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n > 0 ? String(n) : "");

  return (
    <div className="rb-wrap">
      {showTooltip && reactions.length > 0 ? (
        <div
          ref={tooltipRef}
          className="rb-tooltip"
          onMouseEnter={() => {
            if (tooltipTimer.current) clearTimeout(tooltipTimer.current);
          }}
          onMouseLeave={onMouseLeave}
        >
          <div className="rb-tooltip-title">Người đã bày tỏ cảm xúc</div>
          <div className="rb-tooltip-list">
            {reactions.slice(0, 20).map((r, i) => {
              const rCfg = getCfg(r.reactionType as ReactionType);
              const initial = r.userFullName ? r.userFullName.charAt(0).toUpperCase() : "?";
              return (
                <div key={`${r.userId}-${i}`} className="rb-tooltip-item">
                  <div className="rb-tooltip-avatar">
                    {r.userAvatarUrl ? <img src={r.userAvatarUrl} alt={r.userFullName} /> : <span>{initial}</span>}
                  </div>
                  <span className="rb-tooltip-name">{r.userFullName}</span>
                  {rCfg ? <span className="rb-tooltip-emoji">{rCfg.emoji}</span> : null}
                </div>
              );
            })}
            {reactions.length > 20 ? (
              <div className="rb-tooltip-more">+{reactions.length - 20} người khác</div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div style={{ position: "relative" }}>
        <button
          ref={btnRef}
          className={`rb-btn ${myReaction ? "rb-btn--active" : ""} ${fetching ? "rb-btn--fetching" : ""}`}
          style={cfg ? { color: cfg.color } : undefined}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onClick={onMainClick}
          disabled={loading || fetching}
        >
          <span className="rb-icon">{cfg ? cfg.emoji : <ThumbsUp size={18} />}</span>
          <span className="rb-label">{cfg ? cfg.label : "Thích"}</span>
          {count > 0 ? <span className="rb-count">{fmtCount(count)}</span> : null}
        </button>

        {showPicker ? (
          <div ref={pickerRef} className="rb-popup">
            {REACTIONS.map((r, i) => (
              <button
                key={r.type}
                className={`rb-emoji-btn ${myReaction === r.type ? "rb-emoji-btn--active" : ""}`}
                style={{ animationDelay: `${i * 30}ms` }}
                onClick={() => void onPickReaction(r.type)}
                title={r.label}
              >
                <span className="rb-emoji">{r.emoji}</span>
                <span className="rb-emoji-label">{r.label}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ReactionSummary({ postId }: { postId: string }) {
  const [count, setCount] = useState(0);
  const [topEmojis, setTopEmojis] = useState<string[]>([]);
  const [avatars, setAvatars] = useState<Array<string | null>>([]);
  const [names, setNames] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    reactionService
      .getReactions(postId)
      .then((data: ReactionUser[]) => {
        setCount(data.length);
        setTopEmojis(tallyTopEmojis(data));

        const seen = new Set<string>();
        const av: Array<string | null> = [];
        const nm: string[] = [];
        for (const r of data) {
          if (!seen.has(r.userId)) {
            seen.add(r.userId);
            av.push(r.userAvatarUrl);
            nm.push(r.userFullName);
            if (av.length >= 3) break;
          }
        }
        setAvatars(av);
        setNames(nm);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [postId]);

  if (!loaded || count === 0) return null;

  const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

  return (
    <div className="rb-summary">
      <div className="rb-summary-avatars">
        {avatars.map((url, i) =>
          url ? (
            <img key={i} src={url} alt={names[i] ?? ""} className="rb-summary-avatar-img" title={names[i] ?? ""} />
          ) : (
            <div key={i} className="rb-summary-avatar-fallback" title={names[i] ?? ""}>
              {names[i] ? names[i].charAt(0).toUpperCase() : "?"}
            </div>
          ),
        )}
      </div>

      <span className="rb-summary-emojis">
        {topEmojis.map((emoji, i) => (
          <span key={i} className="rb-summary-emoji">
            {emoji}
          </span>
        ))}
      </span>
      <span className="rb-summary-count">{fmt(count)}</span>
      <span className="rb-summary-label">cảm xúc</span>
    </div>
  );
}
