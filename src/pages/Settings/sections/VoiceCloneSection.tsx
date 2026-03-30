import { useState, useRef, useEffect } from "react";
import { Mic, Upload, Trash2, Play, Pause, Loader2, Info, Volume2 } from "lucide-react";
import api from "../../../services/axios";
import { showToast } from "../../../utils/toast";
import "./VoiceCloneSection.css";

interface ClonedVoice {
  id: string;
  voiceCode: string;
  displayName: string;
  provider: string;
  gender?: string;
  model?: string;
  isActive: boolean;
  createdAt: string;
}

interface SubscriptionPlan {
  id: string;
  planName: string;
  voiceModelLimit: number;
  ttsMinuteLimit: number;
  podcastRequestLimit: number;
  price: number;
}

interface VoiceCloneSectionProps {
  onUpgradeClick?: () => void;
}

export default function VoiceCloneSection({ onUpgradeClick }: VoiceCloneSectionProps) {
  const [voices, setVoices] = useState<ClonedVoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Upload form state
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [refText, setRefText] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [gender, setGender] = useState("Unknown");
  const [dragActive, setDragActive] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch user's voices
      const voicesRes = await api.get("/voice-clone/my-voices");
      if (voicesRes.data.success && voicesRes.data.data?.voices) {
        setVoices(voicesRes.data.data.voices);
      }

      // Fetch subscription plan for limits
      const planRes = await api.get("/me/subscriptions");
      if (planRes.data.success && planRes.data.data?.planId) {
        const planDetailRes = await api.get(`/subscription-plans/${planRes.data.data.planId}`);
        if (planDetailRes.data.success && planDetailRes.data.data) {
          setPlan(planDetailRes.data.data);
        }
      }
    } catch (error: any) {
      console.error("Failed to fetch voice data:", error);
      if (error?.response?.status === 401) {
        // Not logged in
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const allowedTypes = ["audio/wav", "audio/mpeg", "audio/mp3", "audio/m4a", "audio/flac", "audio/ogg"];
    const allowedExtensions = [".wav", ".mp3", ".m4a", ".flac", ".ogg"];
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(ext)) {
      showToast.error("Định dạng không được hỗ trợ. Vui lòng upload file WAV, MP3, M4A, FLAC, hoặc OGG.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast.error("File quá lớn. Vui lòng chọn file nhỏ hơn 10MB.");
      return;
    }

    setAudioFile(file);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setAudioPreview(url);
  };

  const togglePlayPause = () => {
    if (!audioRef.current || !audioPreview) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleUpload = async () => {
    if (!audioFile) {
      showToast.error("Vui lòng chọn file audio");
      return;
    }
    if (!refText.trim()) {
      showToast.error("Vui lòng nhập nội dung bạn đã nói trong file audio");
      return;
    }
    if (!displayName.trim()) {
      showToast.error("Vui lòng nhập tên cho giọng đọc");
      return;
    }

    // Validate refText length (should roughly match audio duration)
    if (refText.trim().length < 5) {
      showToast.error("Nội dung bạn nhập quá ngắn. Vui lòng nhập đoạn văn bản bạn đã nói trong audio.");
      return;
    }

    setUploading(true);
    const toastId = showToast.loading("Đang clone giọng... Vui lòng chờ 10-30 giây.");

    try {
      const formData = new FormData();
      formData.append("displayName", displayName.trim());
      formData.append("refText", refText.trim());
      formData.append("gender", gender);
      formData.append("file", audioFile);

      const response = await api.post("/voice-clone/clone", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 120000, // 2 minutes for voice cloning
      });

      showToast.dismiss(toastId);

      if (response.data.success) {
        showToast.success("Clone giọng thành công! Giờ bạn có thể dùng giọng này để tạo podcast.");
        setShowUploadModal(false);
        resetForm();
        fetchData(); // Refresh list
      } else {
        showToast.error(response.data.message || "Clone giọng thất bại");
      }
    } catch (error: any) {
      showToast.dismiss(toastId);
      console.error("Voice clone error:", error);
      showToast.error(
        error.response?.data?.message ||
        error.message ||
        "Đã xảy ra lỗi khi clone giọng. Vui lòng thử lại."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (voiceId: string) => {
    if (!confirm("Bạn có chắc muốn xóa giọng đọc này? Hành động này không thể hoàn tác.")) {
      return;
    }

    try {
      const response = await api.delete(`/voice-clone/${voiceId}`);
      if (response.data.success) {
        showToast.success("Đã xóa giọng đọc");
        fetchData();
      } else {
        showToast.error(response.data.message || "Xóa thất bại");
      }
    } catch (error: any) {
      showToast.error(error.response?.data?.message || "Đã xảy ra lỗi khi xóa");
    }
  };

  const resetForm = () => {
    setAudioFile(null);
    setAudioPreview(null);
    setRefText("");
    setDisplayName("");
    setGender("Unknown");
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
  };

  const canCreateMoreVoices = plan ? voices.length < plan.voiceModelLimit : false;
  const isVoiceCloneEnabled = plan && plan.voiceModelLimit > 0;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

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
        <div className="vc-upgrade-prompt">
          <div className="vc-upgrade-icon">
            <Volume2 size={48} />
          </div>
          <h3>Tính năng Voice Clone</h3>
          <p>
            Nâng cấp lên <strong>Premium</strong> hoặc <strong>Elite</strong> để tạo giọng đọc AI
            từ chính giọng nói của bạn. Dùng nó để tạo podcast với giọng của bạn!
          </p>
          {onUpgradeClick && (
            <button className="vc-upgrade-btn" onClick={onUpgradeClick}>
              Nâng cấp ngay
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Stats Bar */}
          <div className="vc-stats-bar">
            <div className="vc-stat">
              <span className="vc-stat-value">{voices.length}</span>
              <span className="vc-stat-label">/ {plan.voiceModelLimit} giọng đã tạo</span>
            </div>
            <div className="vc-stat-info">
              <Info size={16} />
              <span>Clone giọng cần 3-10 giây audio. Upload file có giọng nói rõ ràng để có kết quả tốt nhất.</span>
            </div>
          </div>

          {/* Voice List */}
          <div className="vc-voices-list">
            {voices.length === 0 ? (
              <div className="vc-empty">
                <Mic size={48} />
                <h3>Chưa có giọng đọc nào</h3>
                <p>Tạo giọng đọc AI đầu tiên của bạn bằng cách upload một đoạn audio ngắn</p>
              </div>
            ) : (
              voices.map((voice) => (
                <div key={voice.id} className="vc-voice-card">
                  <div className="vc-voice-info">
                    <div className="vc-voice-header">
                      <h4>{voice.displayName}</h4>
                      <span className={`vc-voice-gender ${voice.gender?.toLowerCase() || 'unknown'}`}>
                        {voice.gender || "Không xác định"}
                      </span>
                    </div>
                    <div className="vc-voice-meta">
                      <span>Provider: {voice.provider}</span>
                      <span>Tạo: {formatDate(voice.createdAt)}</span>
                    </div>
                  </div>
                  <div className="vc-voice-actions">
                    <button
                      className="vc-delete-btn"
                      onClick={() => handleDelete(voice.id)}
                      title="Xóa giọng đọc"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Create Button */}
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

      {/* Upload Modal */}
      {showUploadModal && (
        <>
          <div className="vc-modal-backdrop" onClick={() => !uploading && setShowUploadModal(false)} />
          <div className="vc-modal">
            <div className="vc-modal-header">
              <h3>Tạo giọng đọc AI</h3>
              {!uploading && (
                <button className="vc-modal-close" onClick={() => setShowUploadModal(false)}>×</button>
              )}
            </div>

            <div className="vc-modal-body">
              {/* Audio Upload Zone */}
              <div className="vc-upload-section">
                <label>1. Upload audio mẫu (3-10 giây)</label>
                <div
                  className={`vc-dropzone ${dragActive ? "active" : ""} ${audioFile ? "has-file" : ""}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => !uploading && fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".wav,.mp3,.m4a,.flac,.ogg,audio/*"
                    onChange={handleFileChange}
                    hidden
                    disabled={uploading}
                  />

                  {audioFile ? (
                    <div className="vc-file-preview">
                      <div className="vc-file-info">
                        <span className="vc-file-name">{audioFile.name}</span>
                        <span className="vc-file-size">
                          {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                      <button
                        className="vc-play-btn"
                        onClick={(e) => { e.stopPropagation(); togglePlayPause(); }}
                        disabled={uploading}
                      >
                        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                      </button>
                      <audio ref={audioRef} src={audioPreview || ""} onEnded={() => setIsPlaying(false)} />
                    </div>
                  ) : (
                    <div className="vc-dropzone-content">
                      <Upload size={32} />
                      <p>Kéo thả file audio hoặc click để chọn</p>
                      <span>WAV, MP3, M4A, FLAC, OGG (tối đa 10MB)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Reference Text */}
              <div className="vc-form-group">
                <label>2. Nội dung bạn đã nói trong audio</label>
                <textarea
                  value={refText}
                  onChange={(e) => setRefText(e.target.value)}
                  placeholder="Nhập chính xác những gì bạn đã nói trong file audio. Đây là văn bản mẫu để hệ thống học cách phát âm của bạn."
                  rows={3}
                  disabled={uploading}
                />
                <span className="vc-form-hint">
                  <Info size={14} />
                  Nhập chính xác nội dung bạn đọc trong audio để hệ thống clone chính xác hơn
                </span>
              </div>

              {/* Display Name */}
              <div className="vc-form-group">
                <label>3. Tên giọng đọc</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="VD: Giọng Bác sĩ, Giọng MC..."
                  maxLength={100}
                  disabled={uploading}
                />
              </div>

              {/* Gender */}
              <div className="vc-form-group">
                <label>4. Giới tính giọng nói</label>
                <div className="vc-gender-options">
                  {["Male", "Female", "Unknown"].map((g) => (
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
                onClick={handleUpload}
                disabled={uploading || !audioFile || !refText.trim() || !displayName.trim()}
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
    </div>
  );
}
