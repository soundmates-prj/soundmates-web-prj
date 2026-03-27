import {
  MessageCircle,
  Share2,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import api from "../../services/axios";
import { Avatar } from "../common";
import type { User } from "../../types/user";
import type { Post } from "../../types/post";
import ShareCard from "./ShareCard";
import CommentModal from "./CommentModal";
import type { CommentModalPost } from "./CommentModal";
import ReactionButton, { ReactionSummary } from "./ReactionButton";
import "./BlogPostCard.css";

interface BlogPostCardProps {
  post: Post;
  user: User;
  name: string;
  defaultAv: string;
  onEdit: (post: Post) => void;
  onDelete: (postId: string) => void;
}

export default function BlogPostCard({
  post,
  user,
  name,
  defaultAv,
  onEdit,
  onDelete,
}: BlogPostCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const handleDelete = async () => {
    if (!window.confirm("Xoá bài đăng này?")) return;
    setDeleting(true);
    try {
      await api.delete(`posts/${post.id}`);
      onDelete(post.id);
    } finally {
      setDeleting(false);
    }
  };

  const isShareMusic = post.postType === "share-music" && post.shareMusic;

  // Chuyển Post → CommentModalPost
  const modalPost: CommentModalPost = {
    id: post.id,
    userId: post.userId,
    title: post.title,
    contentText: post.contentText,
    imageUrl: post.imageUrl,
    audioUrl: post.audioUrl,
    postType: post.postType,
    shareMusic: post.shareMusic ?? null,
    moodTag: post.moodTag,
    publishedAt: post.publishedAt,
    createdAt: post.createdAt,
    authorName: name,
    authorAvatar: user.profileImageUrl || defaultAv,
  };

  return (
    <>
      <div className={`post-card ${deleting ? "post-card--deleting" : ""}`}>
        <div className="post-header">
          <Avatar
            src={user.profileImageUrl || defaultAv}
            name={name}
            size="sm"
          />
          <div className="post-meta">
            <p className="post-name">{name}</p>
            <p className="post-time">
              {new Date(post.publishedAt ?? post.createdAt).toLocaleDateString(
                "vi-VN",
                {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                },
              )}
            </p>
          </div>

          <div className="post-menu-wrap" ref={menuRef}>
            <button
              className="post-menu-btn"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Tuỳ chọn"
            >
              <MoreHorizontal size={16} />
            </button>
            {menuOpen && (
              <div className="post-menu-dropdown">
                <button
                  className="post-menu-item"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(post);
                  }}
                >
                  <Pencil size={14} /> Chỉnh sửa
                </button>
                <div className="post-menu-divider" />
                <button
                  className="post-menu-item post-menu-item--danger"
                  onClick={() => {
                    setMenuOpen(false);
                    void handleDelete();
                  }}
                >
                  <Trash2 size={14} /> Xoá bài
                </button>
              </div>
            )}
          </div>
        </div>

        {isShareMusic && post.shareMusic ? (
          <div className="post-share-wrap">
            <ShareCard data={post.shareMusic} compact />
          </div>
        ) : (
          <>
            <div className="post-body-wrap">
              {post.title ? <p className="post-title">{post.title}</p> : null}
              <p className="post-body">{post.contentText}</p>
            </div>
            {post.imageUrl?.startsWith("http") && (
              <div className="post-img-wrap">
                <img src={post.imageUrl} alt="post" />
              </div>
            )}
            {post.audioUrl?.startsWith("http") && (
              <div className="post-audio-wrap">
                <audio controls src={post.audioUrl} />
              </div>
            )}
          </>
        )}

        <ReactionSummary postId={post.id} />
        <div className="post-actions">
          <ReactionButton
            postId={post.id}
            initialCount={post.reactionCount ?? 0}
          />
          <button className="post-btn" onClick={() => setShowComments(true)}>
            <MessageCircle size={14} /> Bình luận
          </button>
          <button className="post-btn">
            <Share2 size={14} /> Chia sẻ
          </button>
        </div>
      </div>

      {/* Comment Modal */}
      {showComments && (
        <CommentModal post={modalPost} onClose={() => setShowComments(false)} />
      )}
    </>
  );
}
