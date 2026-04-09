import { useState, useEffect, useCallback } from "react";
import {
  Mic,
  Upload,
  Trash2,
  Play,
  Pause,
  Loader2,
  Info,
  Volume2,
  X,
  Waves,
} from "lucide-react";
import { voiceCloneService, type ClonedVoice, type SubscriptionPlan } from "../../../services/voiceCloneService";
import { showToast } from "../../../utils/toast";
import "./VoiceCloneSection.css";

interface VoiceCloneSectionProps {
  onUpgradeClick?: () => void;
}

const ALLOWED_TYPES = ["audio/wav", "audio/mpeg", "audio/mp3", "audio/m4a", "audio/flac", "audio/ogg"];
const ALLOWED_EXTENSIONS = [".wav", ".mp3", ".m4a", ".flac", ".ogg"];
const MAX_FILE_SIZE_MB = 10;
const MIN_REF_TEXT_CHARS = 5;

/* ─── Helpers ───────────────────────────────────────────────────────────── */

function formatFileSize(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function validateFile(file: File): string | null {
  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
  if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(ext)) {
    return "Định dạng không được hỗ trợ. Vui lòng upload file WAV, MP3, M4A, FLAC, hoặc OGG.";
  }
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return `File quá lớn (${formatFileSize(file.size)}). Tối đa ${MAX_FILE_SIZE_MB}MB.`;
  }
  return null;
}

/* ─── Delete Confirm Modal ───────────────────────────────────────────────── */

function DeleteConfirmModal({
  voiceName,
  onConfirm,
  onCancel,
  loading,
}: {
  voiceName: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <>
      <div className="vc-modal-backdrop" onClick={onCancel} />
      <div className="vc-delete-modal">
        <div className="vc-delete-modal-icon">
          <Trash2 size={28} />
        </div>
        <h3>Xóa giọng đọc?</h3>
        <p>
          Bạn có chắc muốn xóa <strong>&quot;{voiceName}&quot;</strong>? Hành động này không
          thể hoàn tác.
        </p>
        <div className="vc-delete-modal-actions">
          <button className="vc-cancel-btn" onClick={onCancel} disabled={loading}>
            Hủy
          </button>
          <button className="vc-delete-confirm-btn" onClick={onConfirm} disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={14} className="vc-spinner" />
                Đang xóa...
              </>
            ) : (
              <>
                <Trash2 size={14} />
                Xóa
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */

export default function VoiceCloneSection({ onUpgradeClick }: VoiceCloneSectionProps) {
  const [voices, setVoices] = useState<ClonedVoice[]>([]);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload form state
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [refText, setRefText] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [gender, setGender] = useState("Unknown");
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Audio element ref
  const audioRef = useCallback((node: HTMLAudioElement | null) => {
    if (node && audioPreviewUrl) {
      node.src = audioPreviewUrl;
      node.onplay = () => setIsPlaying(true);
      node.onpause = () => setIsPlaying(false);
      node.onended = () => setIsPlaying(false);
    }
  }, [audioPreviewUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // Delete confirm modal
  const [deleteTarget, setDeleteTarget] = useState<ClonedVoice | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* ─── Load data ─────────────────────────────────────────────────────── */

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [voicesData, planData] = await Promise.all([
        voiceCloneService.getMyVoices(),
        voiceCloneService.getMySubscriptionPlan(),
      ]);
      setVoices(voicesData);
      setPlan(planData);
    } catch (err) {
      console.error("[VoiceCloneSection] fetchData error:", err);
      showToast.error("Không thể tải dữ liệu giọng đọc");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchData(); }, [fetchData]);

  /* ─── Cleanup audio preview URL on unmount ───────────────────────────── */

  useEffect(() => {
    return () => {
      if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    };
  }, [audioPreviewUrl]);

  /* ─── Audio playback ────────────────────────────────────────────────── */

  const togglePlayPause = () => {
    if (!audioRef || !audioPreviewUrl) return;
    const audio = document.querySelector("audio") as HTMLAudioElement | null;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => {
        showToast.error("Trình duyệt chặn phát tự động. Vui lòng tương tác thủ công.");
      });
    }
  };

  /* ─── Drag & Drop ───────────────────────────────────────────────────── */

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else {
      setDragActive(false);
    }
  };

  const applyFile = (file: File) => {
    const err = validateFile(file);
    if (err) {
      showToast.error(err);
      return;
    }
    setAudioFile(file);
    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    setAudioPreviewUrl(URL.createObjectURL(file));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) applyFile(e.dataTransfer.files[0]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) applyFile(e.target.files[0]);
  };

  /* ─── Upload ────────────────────────────────────────────────────────── */

  const validateForm = (): string | null => {
    if (!audioFile) return "Vui lòng chọn file audio mẫu.";
    if (!refText.trim() || refText.trim().length < MIN_REF_TEXT_CHARS)
      return `Nội dung bạn nhập quá ngắn (ít nhất ${MIN_REF_TEXT_CHARS} ký tự).`;
    if (!displayName.trim()) return "Vui lòng nhập tên cho giọng đọc.";
    return null;
  };

  const handleUpload = async () => {
    const err = validateForm();
    if (err) {
      showToast.error(err);
      return;
    }

    setUploading(true);
    const toastId = showToast.loading("Đang clone giọng... Vui lòng chờ 10–30 giây.");

    try {
      await voiceCloneService.cloneVoice({
        displayName: displayName.trim(),
        refText: refText.trim(),
        gender,
        audioFile: audioFile!,
      });

      showToast.dismiss(toastId);
      showToast.success("Clone giọng thành công! Giờ bạn có thể dùng giọng này để tạo podcast.");
      resetForm();
      setShowUploadModal(false);
      void fetchData();
    } catch (err: any) {
      showToast.dismiss(toastId);
      showToast.error(err?.response?.data?.message ?? err?.message ?? "Clone giọng thất bại. Vui lòng thử lại.");
    } finally {
      setUploading(false);
    }
  };

  /* ─── Delete ────────────────────────────────────────────────────────── */

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await voiceCloneService.deleteVoice(deleteTarget.id);
      showToast.success("Đã xóa giọng đọc");
      setVoices(prev => prev.filter(v => v.id !== deleteTarget.id));
    } catch (err: any) {
      showToast.error(err?.response?.data?.message ?? err?.message ?? "Xóa thất bại");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  /* ─── Reset form ────────────────────────────────────────────────────── */

  const resetForm = () => {
    setAudioFile(null);
    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    setAudioPreviewUrl(null);
    setRefText("");
    setDisplayName("");
    setGender("Unknown");
    setIsPlaying(false);
  };

  /* ─── Derived state ─────────────────────────────────────────────────── */

  const isVoiceCloneEnabled = plan != null && plan.voiceModelLimit > 0;
  const canCreateMoreVoices = !plan || voices.length < plan.voiceModelLimit;

  /* ─── Render ────────────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="voice-clone-settings">
        <div className="settings-section-header">
          <h1>Voice Clone</h1>
          <p>Tạo giọng đọc AI từ giọng thật của bạn</p>
        </div>
        <div className="vc-loading">
          <Loader2 size={32} className="vc-spinner" />
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="voice-clone-settings">
      <div className="settings-section-header">
        <h1>Voice Clone</h1>
        <p>Tạo giọng đọc AI từ giọng thật của bạn để tạo podcast</p>
      </div>

      {!isVoiceCloneEnabled ? (
        /* ── Upgrade prompt ── */
        <div className="vc-upgrade-prompt">
          <div className="vc-upgrade-icon">
            <Volume2 size={48} />
          </div>
          <h3>Tính năng Voice Clone</h3>
          <p>
            Nâng cấp lên <strong>Premium</strong> hoặc <strong>Elite</strong> để tạo giọng đọc
            AI từ chính giọng nói của bạn. Dùng nó để tạo podcast với giọng của bạn!
          </p>
          {onUpgradeClick && (
            <button className="vc-upgrade-btn" onClick={onUpgradeClick}>
              Nâng cấp ngay
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ── Stats bar ── */}
          <div className="vc-stats-bar">
            <div className="vc-stat">
              <span className="vc-stat-value">{voices.length}</span>
              <span className="vc-stat-label">/ {plan.voiceModelLimit} giọng đã tạo</span>
            </div>
            <div className="vc-stat-info">
              <Info size={16} />
              <span>
                Clone giọng cần 3–10 giây audio. Upload file có giọng nói rõ ràng để có kết
                quả tốt nhất.
              </span>
            </div>
          </div>

          {/* ── Voice list ── */}
          <div className="vc-voices-list">
            {voices.length === 0 ? (
              <div className="vc-empty">
                <Mic size={48} />
                <h3>Chưa có giọng đọc nào</h3>
                <p>Tạo giọng đọc AI đầu tiên của bạn bằng cách upload một đoạn audio ngắn</p>
              </div>
            ) : (
              voices.map(voice => (
                <div key={voice.id} className="vc-voice-card">
                  <div className="vc-voice-info">
                    <div className="vc-voice-header">
                      <h4>{voice.displayName}</h4>
                      <span className={`vc-voice-gender ${voice.gender?.toLowerCase() ?? "unknown"}`}>
                        {voice.gender ?? "Không rõ"}
                      </span>
                    </div>
                    <div className="vc-voice-meta">
                      <span>
                        <Waves size={12} /> {voice.provider}
                      </span>
                      <span>Tạo: {formatDate(voice.createdAt)}</span>
                    </div>
                  </div>
                  <div className="vc-voice-actions">
                    <button
                      className="vc-delete-btn"
                      onClick={() => setDeleteTarget(voice)}
                      title="Xóa giọng đọc"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ── Create button ── */}
          {canCreateMoreVoices && (
            <button
              className="vc-create-btn"
              onClick={() => setShowUploadModal(true)}
            >
              <Mic size={18} />
              Tạo giọng đọc mới
            </button>
          )}
        </>
      )}

      {/* ── Upload modal ── */}
      {showUploadModal && (
        <>
          <div className="vc-modal-backdrop" onClick={() => !uploading && setShowUploadModal(false)} />
          <div className="vc-modal">
            <div className="vc-modal-header">
              <h3>Tạo giọng đọc AI</h3>
              {!uploading && (
                <button className="vc-modal-close" onClick={() => setShowUploadModal(false)}>
                  <X size={18} />
                </button>
              )}
            </div>

            <div className="vc-modal-body">
              {/* Step 1: Audio upload */}
              <div className="vc-upload-section">
                <label>1. Upload audio mẫu (3–10 giây)</label>
                <div
                  className={`vc-dropzone ${dragActive ? "active" : ""} ${audioFile ? "has-file" : ""}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => !uploading && document.getElementById("vc-audio-input")?.click()}
                >
                  <input
                    id="vc-audio-input"
                    type="file"
                    accept=".wav,.mp3,.m4a,.flac,.ogg,audio/*"
                    onChange={handleFileChange}
                    hidden
                    disabled={uploading}
                  />

                  {audioFile ? (
                    <div className="vc-file-preview">
                      <div className="vc-file-icon">
                        <Waves size={20} />
                      </div>
                      <div className="vc-file-info">
                        <span className="vc-file-name">{audioFile.name}</span>
                        <span className="vc-file-size">{formatFileSize(audioFile.size)}</span>
                      </div>
                      {/* Hidden audio — controlled via ref callback */}
                      <audio
                        ref={audioRef}
                        onEnded={() => setIsPlaying(false)}
                        onError={() => {
                          setIsPlaying(false);
                          showToast.error("Không thể phát file audio này");
                        }}
                      />
                      <button
                        className={`vc-play-btn ${isPlaying ? "playing" : ""}`}
                        onClick={e => {
                          e.stopPropagation();
                          togglePlayPause();
                        }}
                        disabled={uploading}
                        title={isPlaying ? "Dừng" : "Phát"}
                      >
                        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                      </button>
                    </div>
                  ) : (
                    <div className="vc-dropzone-content">
                      <Upload size={32} />
                      <p>Kéo thả file audio hoặc click để chọn</p>
                      <span>WAV, MP3, M4A, FLAC, OGG (tối đa {MAX_FILE_SIZE_MB}MB)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: Reference text */}
              <div className="vc-form-group">
                <label>2. Nội dung bạn đã nói trong audio</label>
                <textarea
                  value={refText}
                  onChange={e => setRefText(e.target.value)}
                  placeholder="Nhập chính xác những gì bạn đã nói trong file audio. Đây là văn bản mẫu để hệ thống học cách phát âm của bạn."
                  rows={3}
                  disabled={uploading}
                  maxLength={1000}
                />
                <span className="vc-form-hint">
                  <Info size={14} />
                  Nhập chính xác nội dung bạn đọc trong audio để hệ thống clone chính xác hơn
                </span>
              </div>

              {/* Step 3: Display name */}
              <div className="vc-form-group">
                <label>3. Tên giọng đọc</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="VD: Giọng Bác sĩ, Giọng MC..."
                  maxLength={100}
                  disabled={uploading}
                />
              </div>

              {/* Step 4: Gender */}
              <div className="vc-form-group">
                <label>4. Giới tính giọng nói</label>
                <div className="vc-gender-options">
                  {(["Male", "Female", "Unknown"] as const).map(g => (
                    <button
                      key={g}
                      type="button"
                      className={`vc-gender-btn ${gender === g ? "active" : ""}`}
                      onClick={() => setGender(g)}
                      disabled={uploading}
                    >
                      {g === "Male" ? "👨 Nam" : g === "Female" ? "👩 Nữ" : "❓ Không rõ"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="vc-modal-footer">
              <button
                className="vc-cancel-btn"
                onClick={() => setShowUploadModal(false)}
                disabled={uploading}
              >
                Hủy
              </button>
              <button
                className="vc-submit-btn"
                onClick={() => void handleUpload()}
                disabled={
                  uploading ||
                  !audioFile ||
                  refText.trim().length < MIN_REF_TEXT_CHARS ||
                  !displayName.trim()
                }
              >
                {uploading ? (
                  <>
                    <Loader2 size={16} className="vc-spinner" />
                    Đang clone giọng...
                  </>
                ) : (
                  <>
                    <Mic size={16} />
                    Clone giọng
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Delete confirm modal ── */}
      {deleteTarget && (
        <DeleteConfirmModal
          voiceName={deleteTarget.displayName}
          onConfirm={() => void handleDeleteConfirm()}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
