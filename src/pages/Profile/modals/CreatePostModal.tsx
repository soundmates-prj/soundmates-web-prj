import { useEffect, useState } from "react";
import { X, Plus, Image, Mic, Globe, Users, Lock, Smile } from "lucide-react";
import api from "../../../services/axios";
import { Avatar } from "../../../components/common";
import "./CreatePostModal.css";
import "./CreatePostModal-dark.css";
import type { User } from "../../../types/user";
import type { Post } from "../../../types/post";

const MOOD_TAGS = ["happy", "sad", "chill", "energetic", "romantic", "focus"];

const PRIVACY_OPTIONS = [
  { value: "public", label: "Công khai", icon: Globe },
  { value: "friends", label: "Bạn bè", icon: Users },
  { value: "private", label: "Chỉ mình tôi", icon: Lock },
] as const;

type PrivacyScope = "public" | "friends" | "private";

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
  user: User;
  name: string;
  defaultAv: string;
  onCreated: (post: Post) => void;
}

/* ---------- default form ---------- */
const defaultForm = {
  title: "",
  contentText: "",
  imageUrl: "",
  audioUrl: "",
  privacyScope: "public" as PrivacyScope,
  moodTag: "",
};

/* ---------- small components ---------- */
const PrivacyButton = ({
  label,
  Icon,
  active,
  onClick,
}: {
  label: string;
  Icon: any;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    className={`cp-privacy-btn ${active ? "active" : ""}`}
    onClick={onClick}
  >
    <Icon size={11} />
    {label}
  </button>
);

export default function CreatePostModal({
  open,
  onClose,
  user,
  name,
  defaultAv,
  onCreated,
}: CreatePostModalProps) {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showUrlInputs, setShowUrlInputs] = useState(false);

  /* ---------- helpers ---------- */
  const updateField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  /* ---------- reset khi mở ---------- */
  useEffect(() => {
    if (open) {
      setForm(defaultForm);
      setError("");
      setShowUrlInputs(false);
    }
  }, [open]);

  /* ---------- ESC đóng modal ---------- */
  useEffect(() => {
    if (!open) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  /* ---------- submit ---------- */
  const handleSubmit = async () => {
    if (!form.contentText.trim()) {
      setError("Vui lòng nhập nội dung bài đăng.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const payload = Object.fromEntries(
        Object.entries({
          ...form,
          contentText: form.contentText.trim(),
        }).filter(([_, v]) => v !== ""),
      );

      const res = await api.post("posts", payload);
      const created: Post = res.data?.data ?? res.data;

      onCreated(created);
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Đăng bài thất bại, thử lại nhé!");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="cp-overlay" onClick={onClose}>
      <div className="cp-modal" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="cp-header">
          <h2 className="cp-title">Tạo bài đăng</h2>
          <button className="cp-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="cp-divider" />

        {/* USER */}
        <div className="cp-user-row">
          <Avatar
            src={user.profileImageUrl || defaultAv}
            name={name}
            size="sm"
          />
          <div className="cp-user-info">
            <span className="cp-user-name">{name}</span>

            <div className="cp-privacy-select">
              {PRIVACY_OPTIONS.map((opt) => (
                <PrivacyButton
                  key={opt.value}
                  label={opt.label}
                  Icon={opt.icon}
                  active={form.privacyScope === opt.value}
                  onClick={() => updateField("privacyScope", opt.value)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* TITLE */}
        <input
          className="cp-input cp-input-title"
          placeholder="Tiêu đề (tuỳ chọn)"
          value={form.title}
          onChange={(e) => updateField("title", e.target.value)}
          maxLength={200}
        />

        {/* CONTENT */}
        <textarea
          className="cp-textarea"
          placeholder="Bạn đang nghe gì? Chia sẻ cảm xúc âm nhạc của bạn..."
          value={form.contentText}
          onChange={(e) => updateField("contentText", e.target.value)}
          rows={4}
        />

        {/* MOOD */}
        <div className="cp-moods">
          <span className="cp-moods-label">
            <Smile size={13} /> Tâm trạng:
          </span>

          <div className="cp-mood-chips">
            {MOOD_TAGS.map((m) => (
              <button
                key={m}
                className={`cp-mood-chip ${form.moodTag === m ? "active" : ""}`}
                onClick={() =>
                  updateField("moodTag", form.moodTag === m ? "" : m)
                }
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* TOGGLE URL */}
        <button
          className="cp-toggle-url"
          onClick={() => setShowUrlInputs((v) => !v)}
        >
          {showUrlInputs ? <X size={13} /> : <Plus size={13} />}
          {showUrlInputs ? "Ẩn tuỳ chọn" : "Thêm ảnh / audio (URL)"}
        </button>

        {showUrlInputs && (
          <div className="cp-url-inputs">
            <div className="cp-url-row">
              <Image size={14} className="cp-url-icon" />
              <input
                className="cp-input"
                placeholder="URL hình ảnh"
                value={form.imageUrl}
                onChange={(e) => updateField("imageUrl", e.target.value)}
              />
            </div>

            <div className="cp-url-row">
              <Mic size={14} className="cp-url-icon" />
              <input
                className="cp-input"
                placeholder="URL audio"
                value={form.audioUrl}
                onChange={(e) => updateField("audioUrl", e.target.value)}
              />
            </div>
          </div>
        )}

        {/* IMAGE PREVIEW */}
        {form.imageUrl.startsWith("http") && (
          <div className="cp-preview-img">
            <img src={form.imageUrl} alt="preview" />
          </div>
        )}

        {/* ERROR */}
        {error && <p className="cp-error">{error}</p>}

        <div className="cp-divider" />

        {/* FOOTER */}
        <div className="cp-footer">
          <span className="cp-chars">
            {form.contentText.length > 0 && `${form.contentText.length} ký tự`}
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
              disabled={loading || !form.contentText.trim()}
            >
              {loading ? (
                <span className="cp-spinner" />
              ) : (
                <>
                  <Plus size={14} /> Đăng bài
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
