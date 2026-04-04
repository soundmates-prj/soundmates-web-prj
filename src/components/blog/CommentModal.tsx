import { useState, useEffect, useCallback, useRef } from "react";
import {
  MessageCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  User,
  Send,
  Pencil,
  Trash2,
  X,
  MoreHorizontal,
  ThumbsUp,
} from "lucide-react";
import api from "../../services/axios";
import commentService from "../../services/commentService";
import reactionService, { type ReactionType, type ReactionUser } from "../../services/reactionService";
import type { Comment } from "../../types/comment";
import ShareCard from "./ShareCard";
import type { ShareCardData } from "./ShareCard";
import "./CommentModal.css";

/* ── Reaction config ── */
const REACTIONS: { type: ReactionType; emoji: string; label: string; color: string }[] = [
  { type: "like", emoji: "👍", label: "Thích", color: "#1877f2" },
  { type: "love", emoji: "❤️", label: "Yêu thích", color: "#f33e58" },
  { type: "haha", emoji: "😆", label: "Haha", color: "#f7b125" },
  { type: "wow", emoji: "😮", label: "Wow", color: "#f7b125" },
  { type: "sad", emoji: "😢", label: "Buồn", color: "#f7b125" },
  { type: "angry", emoji: "😡", label: "Phẫn nộ", color: "#e9710f" },
];
const getReaction = (type: ReactionType | null) =>
  REACTIONS.find((r) => r.type === type) ?? null;

/* ── Parse share-music JSON ── */
export const parseShareMusic = (contentText: string): ShareCardData | null => {
  try {
    const raw = JSON.parse(contentText);
    const id = raw.TrackId ?? raw.trackId;
    if (!id) return null;
    return {
      trackId: id,
      title: raw.Title ?? raw.title ?? "Unknown",
      artist: raw.Artist ?? raw.artist ?? "Unknown",
      albumImage: raw.AlbumImage ?? raw.albumImage ?? "",
      previewUrl: raw.PreviewUrl ?? raw.previewUrl ?? null,
      template: (raw.Template ?? raw.template ?? "dark") as ShareCardData["template"],
    };
  } catch {
    return null;
  }
};

/* ── Props ── */
export interface CommentModalPost {
  id: string;
  userId: string;
  title?: string | null;
  contentText: string;
  imageUrl?: string | null;
  audioUrl?: string | null;
  postType?: string | null;
  shareMusic?: ShareCardData | null;
  moodTag?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  authorName: string;
  authorAvatar?: string | null;
}

/* ── CommentAvatar ── */
function CommentAvatar({ url, name, size = 32 }: { url?: string | null; name: string; size?: number }) {
  return (
    <div className="cm-avatar" style={{ width: size, height: size }}>
      {url ? (
        <img src={url} alt={name} style={{ width: size, height: size }} />
      ) : (
        <div className="cm-avatar-fallback" style={{ width: size, height: size }}>
          {(name || "U").charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}

/* ── CommentItem ── */
function CommentItem({
  comment,
  currentUserId,
  postOwnerId,
  onDelete,
  onUpdate,
  onReply,
}: {
  comment: Comment;
  currentUserId: string | null;
  postOwnerId: string;
  onDelete: (id: string) => void;
  onUpdate: (id: string, content: string) => void;
  onReply: (id: string, content: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isOwner = currentUserId === comment.userId;
  const isPostOwner = currentUserId === postOwnerId;
  const canDelete = isOwner || isPostOwner;
  const isLoggedIn = !!localStorage.getItem("accessToken");

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Vừa xong";
    if (mins < 60) return `${mins} phút`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} giờ`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days} ngày`;
    return new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  return (
    <div className="cm-item">
      <CommentAvatar url={comment.userAvatarUrl} name={comment.userFullName} />
      <div className="cm-body">
        {editing ? (
          <div className="cm-edit-wrap">
            <textarea className="cm-edit-input" value={editContent}
              onChange={(e) => setEditContent(e.target.value)} rows={2} autoFocus
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); } }}
            />
            <div className="cm-edit-actions">
              <button className="cm-btn cm-btn--ghost" onClick={() => setEditing(false)}><X size={12} /> Huỷ</button>
              <button className="cm-btn cm-btn--primary" onClick={() => { void (async () => { setSubmitting(true); await onUpdate(comment.id, editContent.trim()); setEditing(false); setSubmitting(false); })(); }} disabled={submitting}><Send size={12} /> Lưu</button>
            </div>
          </div>
        ) : (
          <div className="cm-bubble-row">
            <div className="cm-bubble">
              <span className="cm-name">{comment.userFullName || "Ẩn danh"}</span>
              <p className="cm-content">{comment.content}</p>
            </div>
            {(isOwner || canDelete) && (
              <div className="cm-menu-wrap" ref={menuRef}>
                <button className="cm-menu-btn" onClick={() => setMenuOpen((v) => !v)}>
                  <MoreHorizontal size={15} />
                </button>
                {menuOpen && (
                  <div className="cm-menu-dropdown">
                    {isOwner && (
                      <button className="cm-menu-item" onClick={() => { setEditing(true); setMenuOpen(false); }}>
                        <Pencil size={13} /> Chỉnh sửa
                      </button>
                    )}
                    {canDelete && (
                      <button className="cm-menu-item cm-menu-item--danger" onClick={() => { setMenuOpen(false); void onDelete(comment.id); }}>
                        <Trash2 size={13} /> Xoá
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {!editing && (
          <div className="cm-action-row">
            <span className="cm-action-row-time">{timeAgo(comment.createdAt)}</span>
            {isLoggedIn && (
              <button className="cm-action-row-btn" onClick={() => setReplying((v) => !v)}>Trả lời</button>
            )}
          </div>
        )}

        {replying && (
          <div className="cm-reply-wrap">
            <div className="cm-input-inner" style={{ marginTop: 6 }}>
              <textarea className="cm-textarea" placeholder={`Trả lời ${comment.userFullName}...`}
                value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={1} autoFocus
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void (async () => { if (!replyText.trim()) return; setSubmitting(true); await onReply(comment.id, replyText.trim()); setReplyText(""); setReplying(false); setSubmitting(false); })(); } }}
              />
              <button className="cm-send-icon-btn" onClick={() => void (async () => { if (!replyText.trim()) return; setSubmitting(true); await onReply(comment.id, replyText.trim()); setReplyText(""); setReplying(false); setSubmitting(false); })()} disabled={submitting || !replyText.trim()}>
                <Send size={14} />
              </button>
            </div>
            <button className="cm-btn cm-btn--ghost" style={{ marginTop: 5, fontSize: 11 }} onClick={() => setReplying(false)}>
              <X size={11} /> Huỷ
            </button>
          </div>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="cm-replies">
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} currentUserId={currentUserId} postOwnerId={postOwnerId}
                onDelete={onDelete} onUpdate={onUpdate} onReply={onReply} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── ReactionsList inside CommentModal ── */
function ReactionsList({ postId }: { postId: string }) {
  const [reactions, setReactions] = useState<ReactionUser[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    reactionService.getReactions(postId)
      .then((data: ReactionUser[]) => { setReactions(data); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, [postId]);

  if (!loaded) return null;

  const uniqueUsers = (() => {
    const seen = new Map<string, ReactionUser>();
    for (const r of reactions) {
      if (!seen.has(r.userId)) seen.set(r.userId, r);
    }
    return Array.from(seen.values());
  })();

  const byType = REACTIONS.map((cfg) => ({
    ...cfg,
    users: uniqueUsers.filter((r) => r.reactionType === cfg.type),
  })).filter((g) => g.users.length > 0);

  if (byType.length === 0) return null;

  return (
    <div className="rl-list">
      {byType.map((group) => (
        <div key={group.type} className="rl-group">
          <div className="rl-group-header">
            <span className="rl-emoji">{group.emoji}</span>
            <span className="rl-label">{group.label}</span>
            <span className="rl-count">{group.users.length}</span>
          </div>
          <div className="rl-users">
            {group.users.map((u) => (
              <div key={u.userId} className="rl-user-chip">
                {u.userAvatarUrl ? (
                  <img src={u.userAvatarUrl} alt={u.userFullName} className="rl-user-avatar" />
                ) : (
                  <div className="rl-user-avatar-fallback">{u.userFullName.charAt(0).toUpperCase()}</div>
                )}
                <span className="rl-user-name">{u.userFullName}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── CommentModal ── */
export default function CommentModal({ post, onClose }: { post: CommentModalPost; onClose: () => void }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(null);
  const [showReactions, setShowReactions] = useState(false);

  const isLoggedIn = !!localStorage.getItem("accessToken");

  const shareData =
    post.postType === "share-music"
      ? (post.shareMusic ?? parseShareMusic(post.contentText))
      : null;

  const formatDate = (iso: string | null) => {
    if (!iso) return "";
    return new Date(iso).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const getMoodColor = (tag: string | null) => {
    const map: Record<string, string> = {
      happy: "#f59e0b", sad: "#3b82f6", chill: "#10b981",
      hype: "#ef4444", energetic: "#f97316", romantic: "#ec4899", focus: "#8b5e6",
    };
    return tag ? (map[tag.toLowerCase()] ?? "#64748b") : "#64748b";
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    api.get("/users/me/profile/full")
      .then((res) => {
        const data = res.data?.data;
        if (data?.id) {
          setCurrentUserId(data.id);
          setCurrentUserAvatar(data.profileImageUrl ?? null);
        }
      }).catch(() => {});
  }, [isLoggedIn]);

  const fetchComments = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const data = await commentService.getComments(post.id, p);
      setComments(data.items);
      setTotalCount(data.totalCount);
      setTotalPages(data.totalPages);
      setPage(data.page);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [post.id]);

  useEffect(() => { void fetchComments(1); }, [fetchComments]);
  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);
  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); }; window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, [onClose]);

  const handleAdd = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const added = await commentService.addComment(post.id, newComment.trim());
      // Backend will populate userFullName/avatar now
      setComments((prev) => [added, ...prev]);
      setTotalCount((c) => c + 1);
      setNewComment("");
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Xoá bình luận này?")) return;
    try {
      await commentService.deleteComment(id);
      setComments((prev) => removeInTree(prev, id));
      setTotalCount((c) => Math.max(0, c - 1));
    } catch (err) { console.error(err); }
  };

  const handleUpdate = async (id: string, content: string) => {
    try {
      const updated = await commentService.updateComment(id, content);
      setComments((prev) => updateInTree(prev, updated));
    } catch (err) { console.error(err); }
  };

  const handleReply = async (parentId: string, content: string) => {
    try {
      const reply = await commentService.replyComment(parentId, content);
      setComments((prev) => addReply(prev, parentId, reply));
      setTotalCount((c) => c + 1);
    } catch (err) { console.error(err); }
  };

  const removeInTree = (list: Comment[], id: string): Comment[] =>
    list.filter((c) => c.id !== id).map((c) => ({ ...c, replies: removeInTree(c.replies ?? [], id) }));
  const updateInTree = (list: Comment[], updated: Comment): Comment[] =>
    list.map((c) => c.id === updated.id ? { ...c, content: updated.content } : { ...c, replies: updateInTree(c.replies ?? [], updated) });
  const addReply = (list: Comment[], parentId: string, reply: Comment): Comment[] =>
    list.map((c) => c.id === parentId ? { ...c, replies: [...(c.replies ?? []), reply] } : { ...c, replies: addReply(c.replies ?? [], parentId, reply) });

  const moodColor = getMoodColor(post.moodTag ?? null);

  return (
    <div className="cm-modal-overlay" onClick={onClose}>
      <div className="cm-modal cm-modal--wide" onClick={(e) => e.stopPropagation()}>
        {/* ── Left: post preview ── */}
        <div className="cm-modal-post-preview">
          {!shareData && post.imageUrl?.startsWith("http") ? (
            <img className="cm-preview-img-hero" src={post.imageUrl} alt={post.title || "post"} />
          ) : shareData ? (
            <div className="cm-preview-no-img">
              <div style={{ padding: "16px", width: "100%" }}><ShareCard data={shareData} compact /></div>
            </div>
          ) : (
            <div className="cm-preview-no-img">
              <div style={{ padding: "20px", textAlign: "center" }}>
                {post.title && <p className="cm-preview-title">{post.title}</p>}
                <p className="cm-preview-text">{post.contentText}</p>
              </div>
            </div>
          )}

          <div className="cm-preview-author-strip">
            <div className="cm-preview-author">
              <div className="cm-preview-avatar">
                {post.authorAvatar ? <img src={post.authorAvatar} alt={post.authorName} /> : <User size={14} />}
              </div>
              <div>
                <span className="cm-preview-name">{post.authorName}</span>
                <span className="cm-preview-time">{formatDate(post.publishedAt ?? post.createdAt)}</span>
              </div>
              {post.moodTag && (
                <span className="cm-preview-mood" style={{ background: `${moodColor}18`, color: moodColor }}>
                  #{post.moodTag}
                </span>
              )}
            </div>
            {post.title && <p className="cm-preview-title">{post.title}</p>}
            {!shareData && <p className="cm-preview-text">{post.contentText}</p>}
          </div>
        </div>

        {/* ── Right: comments + reactions ── */}
        <div className="cm-modal-right">
          <div className="cm-modal-header">
            <h3 className="cm-modal-title">
              <MessageCircle size={17} />
              Bình luận
              {totalCount > 0 && <span className="cm-modal-count">{totalCount}</span>}
            </h3>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {/* Toggle reactions panel */}
              <button
                className={`cm-reactions-toggle ${showReactions ? "active" : ""}`}
                onClick={() => setShowReactions((v) => !v)}
                title="Xem reactions"
              >
                <ThumbsUp size={14} />
                Cảm xúc
              </button>
              <button className="cm-modal-close" onClick={onClose}><X size={16} /></button>
            </div>
          </div>

          {/* ── Reactions panel ── */}
          {showReactions && (
            <div className="cm-reactions-panel">
              <div className="cm-reactions-panel-header">
                <span>Người bày tỏ cảm xúc</span>
                <button className="cm-reactions-close" onClick={() => setShowReactions(false)}>
                  <X size={13} />
                </button>
              </div>
              <ReactionsList postId={post.id} />
            </div>
          )}

          <div className="cm-modal-body">
            {loading ? (
              <div className="cm-loading"><RefreshCw size={15} className="cm-spin" /> Đang tải...</div>
            ) : comments.length === 0 ? (
              <p className="cm-empty">Chưa có bình luận nào.<br />Hãy là người đầu tiên! 💬</p>
            ) : (
              <>
                <div className="cm-list">
                  {comments.map((c) => (
                    <CommentItem key={c.id} comment={c} currentUserId={currentUserId} postOwnerId={post.userId}
                      onDelete={handleDelete} onUpdate={handleUpdate} onReply={handleReply} />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="cm-pagination">
                    <button className="cm-page-btn" onClick={() => void fetchComments(page - 1)} disabled={page <= 1 || loading}>
                      <ChevronLeft size={13} />
                    </button>
                    <span className="cm-page-info">{page} / {totalPages}</span>
                    <button className="cm-page-btn" onClick={() => void fetchComments(page + 1)} disabled={page >= totalPages || loading}>
                      <ChevronRight size={13} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="cm-modal-footer">
            {isLoggedIn ? (
              <div className="cm-input-wrap">
                <div className="cm-input-avatar">
                  {currentUserAvatar ? <img src={currentUserAvatar} alt="me" /> : <User size={14} />}
                </div>
                <div className="cm-input-inner">
                  <textarea className="cm-textarea" placeholder="Viết bình luận... (Enter để gửi)"
                    value={newComment} onChange={(e) => setNewComment(e.target.value)} rows={1}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleAdd(); } }} />
                  <button className="cm-send-icon-btn" onClick={() => void handleAdd()} disabled={submitting || !newComment.trim()}>
                    <Send size={15} />
                  </button>
                </div>
              </div>
            ) : (
              <p className="cm-login-hint">Đăng nhập để bình luận</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
