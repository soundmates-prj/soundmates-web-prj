import { useState } from "react";
import { X, Loader2, Upload, Link as LinkIcon, FileAudio } from "lucide-react";
import podcastService from "../../../services/podcastService";
import { showError } from "../../../components/common/toastUtils";

interface Props {
  open: boolean;
  onClose: () => void;
  podcastId: string;
  onSuccess: () => void;
}

export default function CreateEpisodeRequestModal({
  open,
  onClose,
  podcastId,
  onSuccess,
}: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [duration, setDuration] = useState("");
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !audioUrl.trim()) {
      showError("Lỗi", "Vui lòng nhập Tiêu đề và Link Audio");
      return;
    }

    setSaving(true);
    try {
      await podcastService.createPodcastEpisodeRequest({
        podcastId,
        title: title.trim(),
        description: description.trim(),
        thumbnailUrl: thumbnailUrl.trim(),
        audioUrl: audioUrl.trim(),
        duration: duration ? parseInt(duration) : 0,
      });
      onSuccess();
      setTitle("");
      setDescription("");
      setThumbnailUrl("");
      setAudioUrl("");
      setDuration("");
    } catch (error: any) {
      showError("Lỗi", error.message || "Không thể gửi yêu cầu");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mps-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="mps-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div className="mps-modal-header">
          <h2>Yêu cầu thêm tập mới</h2>
          <button className="mps-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mps-modal-body">
          <p style={{ fontSize: 13, color: "var(--neutral-400)", marginBottom: 16 }}>
            Tập mới sẽ được gửi lên quản trị viên để phê duyệt trước khi xuất bản.
          </p>

          <label className="mps-label">Tiêu đề tập (*)</label>
          <input
            className="mps-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ví dụ: Tập 1: Bắt đầu..."
            required
          />

          <label className="mps-label">Mô tả</label>
          <textarea
            className="mps-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Nội dung chính của tập này..."
            rows={4}
          />

          <label className="mps-label">Ảnh thu nhỏ (URL)</label>
          <div style={{ position: "relative" }}>
            <LinkIcon size={16} style={{ position: "absolute", left: 12, top: 12, color: "var(--neutral-500)" }} />
            <input
              className="mps-input"
              style={{ paddingLeft: 36 }}
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <label className="mps-label">File Audio (URL) (*)</label>
          <div style={{ position: "relative" }}>
            <FileAudio size={16} style={{ position: "absolute", left: 12, top: 12, color: "var(--neutral-500)" }} />
            <input
              className="mps-input"
              style={{ paddingLeft: 36 }}
              value={audioUrl}
              onChange={(e) => setAudioUrl(e.target.value)}
              placeholder="https://..."
              required
            />
          </div>

          <label className="mps-label">Thời lượng (giây)</label>
          <input
            type="number"
            className="mps-input"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="Ví dụ: 300"
            min="0"
          />

          <div className="mps-modal-footer" style={{ marginTop: 24, padding: 0 }}>
            <button
              type="button"
              className="mps-btn mps-btn--cancel"
              onClick={onClose}
              disabled={saving}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="mps-btn mps-btn--save"
              disabled={saving || !title.trim() || !audioUrl.trim()}
            >
              {saving ? <Loader2 size={16} className="spin" /> : <Upload size={16} />}
              {saving ? "Đang gửi..." : "Gửi yêu cầu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
