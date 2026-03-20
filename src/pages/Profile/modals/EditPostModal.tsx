import { useEffect, useState } from "react";
import { X, Save, Smile, Globe, Users, Lock } from "lucide-react";

const MOOD_TAGS = [
  "happy",
  "sad",
  "chill",
  "energetic",
  "romantic",
  "focus",
] as const;

const PRIVACY_OPTIONS = [
  { value: "public", label: "Công khai", icon: Globe },
  { value: "friends", label: "Bạn bè", icon: Users },
  { value: "private", label: "Chỉ mình tôi", icon: Lock },
] as const;

type PrivacyScope = "public" | "friends" | "private";

import api from "../../../services/axios";
import { Avatar } from "../../../components/common";
import ImageUploader from "./ImageUploader";
import AudioUploader from "./AudioUploader";
import "./CreatePostModal.css";
import "./ImageUploader.css";
import type { User } from "../../../types/user";
import type { Post } from "../../../types/post";

interface EditPostModalProps {
  open: boolean;
  post: Post | null;
  onClose: () => void;
  user: User;
  name: string;
  defaultAv: string;
  onUpdated: (post: Post) => void;
}

export default function EditPostModal({
  open,
  post,
  onClose,
  user,
  name,
  defaultAv,
  onUpdated,
}: EditPostModalProps) {
  const [title, setTitle] = useState("");
  const [contentText, setContentText] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [privacyScope, setPrivacyScope] = useState<PrivacyScope>("public");
  const [moodTag, setMoodTag] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* Prefill dữ liệu bài hiện tại */
  useEffect(() => {
    if (post && open) {
      setTitle(post.title ?? "");
      setContentText(post.contentText ?? "");
      setImageUrl(post.imageUrl || null);
      setAudioUrl(post.audioUrl || null);
      setPrivacyScope((post.privacyScope as PrivacyScope) ?? "public");
      setMoodTag(post.moodTag ?? "");
      setError("");
    }
  }, [post, open]);

  /* Escape để đóng */
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [open, onClose]);

  const handleSubmit = async () => {
    if (!contentText.trim()) {
      setError("Vui lòng nhập nội dung bài đăng.");
      return;
    }
    if (!post) return;
    setError("");
    setLoading(true);
    try {
      const payload: Record<string, string> = {
        contentText: contentText.trim(),
        privacyScope,
        // Luôn gửi title (kể cả rỗng) để backend có thể xoá title cũ
        title: title.trim(),
        // Luôn gửi imageUrl/audioUrl: "" = xoá media, URL = giữ/thay mới
        imageUrl: imageUrl ?? "",
        audioUrl: audioUrl ?? "",
      };
      if (moodTag) payload.moodTag = moodTag;

      const res = await api.put(`posts/${post.id}`, payload);
      onUpdated(res.data?.data ?? res.data);
      onClose();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(
        err?.response?.data?.message ?? "Cập nhật thất bại, thử lại nhé!",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!open || !post) return null;

  return (
    <div className="cp-overlay" onClick={onClose}>
      <div className="cp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cp-header">
          <h2 className="cp-title">Chỉnh sửa bài đăng</h2>
          <button className="cp-close" onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
        </div>
        <div className="cp-divider" />

        <div className="cp-user-row">
          <Avatar
            src={user.profileImageUrl || defaultAv}
            name={name}
            size="sm"
          />
          <div className="cp-user-info">
            <span className="cp-user-name">{name}</span>
            <div className="cp-privacy-select">
              {PRIVACY_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  className={`cp-privacy-btn ${privacyScope === value ? "active" : ""}`}
                  onClick={() => setPrivacyScope(value)}
                >
                  <Icon size={11} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <input
          className="cp-input cp-input-title"
          placeholder="Tiêu đề (tuỳ chọn)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
        />

        <textarea
          className="cp-textarea"
          placeholder="Nội dung bài đăng..."
          value={contentText}
          onChange={(e) => setContentText(e.target.value)}
          rows={4}
        />

        <div className="cp-moods">
          <span className="cp-moods-label">
            <Smile size={13} /> Tâm trạng:
          </span>
          <div className="cp-mood-chips">
            {MOOD_TAGS.map((m) => (
              <button
                key={m}
                className={`cp-mood-chip ${moodTag === m ? "active" : ""}`}
                onClick={() => setMoodTag(moodTag === m ? "" : m)}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="cp-media-label">
          <span>Phương tiện</span>
        </div>

        <ImageUploader preview={imageUrl} onChange={setImageUrl} />
        <AudioUploader preview={audioUrl} onChange={setAudioUrl} />

        {error && <p className="cp-error">{error}</p>}
        <div className="cp-divider" />

        <div className="cp-footer">
          <span className="cp-chars">
            {contentText.length > 0 && `${contentText.length} ký tự`}
          </span>
          <div className="cp-footer-actions">
            <button
              className="cp-cancel-btn"
              onClick={onClose}
              disabled={loading}
            >
              Huỷ
            </button>
            <button
              className="cp-submit-btn"
              onClick={handleSubmit}
              disabled={loading || !contentText.trim()}
            >
              {loading ? (
                <>
                  <span className="cp-spinner" /> Đang lưu...
                </>
              ) : (
                <>
                  <Save size={14} /> Lưu thay đổi
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
