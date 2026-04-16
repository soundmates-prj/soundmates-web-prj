import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Save,
  ImagePlus,
  Trash2,
  Mic2,
  FileText,
  User,
  Tag,
  Radio,
  Info,
  Loader2,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { liveSessionApiService } from "../../../services/liveSessionApiService";
import { uploadImage } from "../../../utils/cloudinaryUpload";
import { showError, showSuccess } from "../../../components/common/toastUtils";
import "./LiveOps.css";

const PODCAST_TYPES = [
  { value: "Podcast", label: "Podcast" },
  { value: "technology", label: "Công nghệ" },
  { value: "music", label: "Âm nhạc" },
  { value: "education", label: "Giáo dục" },
  { value: "entertainment", label: "Giải trí" },
  { value: "business", label: "Kinh doanh" },
  { value: "health", label: "Sức khỏe" },
  { value: "sports", label: "Thể thao" },
  { value: "news", label: "Tin tức" },
  { value: "society", label: "Xã hội" },
  { value: "comedy", label: "Hài kịch" },
];

const STATUS_OPTIONS = [
  { value: "Draft", label: "Bản nháp", color: "#94a3b8" },
  { value: "Published", label: "Xuất bản", color: "#22c55e" },
  { value: "Archived", label: "Lưu trữ", color: "#f59e0b" },
];

export default function PodcastEditor() {
  const navigate = useNavigate();
  const { podcastId } = useParams();
  const isEdit = useMemo(() => !!podcastId && podcastId !== "new", [podcastId]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("");
  const [type, setType] = useState("Podcast");
  const [banner, setBanner] = useState("");
  const [status, setStatus] = useState("Draft");
  const [saving, setSaving] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEdit || !podcastId) return;

    const loadPodcast = async () => {
      try {
        const data = await liveSessionApiService.getPodcast(podcastId);
        setTitle(data.title || "");
        setDescription(data.description || "");
        setAuthor(data.author || "");
        setType(data.type || "Podcast");
        setBanner(data.banner || "");
        setStatus(data.status || "Draft");
      } catch {
        showError("Không tải được podcast");
      }
    };

    void loadPodcast();
  }, [isEdit, podcastId]);

  const handleCoverUpload = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showError("Chỉ chấp nhận file ảnh");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showError("Ảnh tối đa 5MB");
      return;
    }
    setUploadingBanner(true);
    try {
      const url = await uploadImage(file);
      setBanner(url);
    } catch {
      showError("Upload ảnh bìa thất bại");
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleCoverUpload(file);
  };

  const save = async () => {
    if (!title.trim()) {
      showError("Vui lòng nhập tiêu đề podcast");
      return;
    }

    setSaving(true);
    try {
      if (isEdit && podcastId) {
        await liveSessionApiService.updatePodcast(podcastId, {
          title,
          description: description || undefined,
          author: author || undefined,
          type: type || undefined,
          banner: banner || undefined,
          status: status || undefined,
        });
      } else {
        await liveSessionApiService.createPodcast({
          title,
          description: description || undefined,
          author: author || undefined,
          type: type || undefined,
          banner: banner || undefined,
          status: status || undefined,
        });
      }

      showSuccess("Lưu podcast thành công");
      navigate("/admin/podcasts");
    } catch {
      showError("Lưu podcast thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ops-page">
      {/* Header */}
      <div className="ops-header">
        <div>
          <button
            className="ops-link-btn"
            onClick={() => navigate("/admin/podcasts")}
          >
            <ArrowLeft size={13} /> Quay lại Podcast
          </button>
          <h1
            className="ops-title"
            style={{ display: "flex", alignItems: "center", gap: 10 }}
          >
            <Mic2 size={26} />
            {isEdit ? "Chỉnh sửa Podcast" : "Tạo Podcast mới"}
          </h1>
          <p className="ops-subtitle">
            {isEdit
              ? "Cập nhật thông tin podcast của bạn"
              : "Điền thông tin để tạo kênh podcast mới"}
          </p>
        </div>
        <div className="ops-actions">
          <button
            className="ops-btn ops-btn--primary"
            onClick={save}
            disabled={saving}
          >
            <Save size={14} />
            {saving ? "Đang lưu..." : "Lưu Podcast"}
          </button>
        </div>
      </div>

      {/* Body — 2 columns */}
      <div className="pe-layout">
        {/* Left — Form */}
        <div className="ops-card pe-form-card">
          <h3 className="pe-section-title">
            <FileText size={16} />
            Thông tin cơ bản
          </h3>

          <div className="pe-field">
            <label className="pe-label">
              Tiêu đề <span className="pe-required">*</span>
            </label>
            <input
              className="ops-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tên podcast..."
            />
          </div>

          <div className="pe-field">
            <label className="pe-label">
              <User size={13} />
              Tác giả
            </label>
            <input
              className="ops-input"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Tên tác giả hoặc host..."
            />
          </div>

          <div className="pe-row">
            <div className="pe-field pe-field--half">
              <label className="pe-label">
                <Tag size={13} />
                Thể loại
              </label>
              <select
                className="ops-select"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                {PODCAST_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="pe-field pe-field--half">
              <label className="pe-label">
                <Radio size={13} />
                Trạng thái
              </label>
              <div className="pe-status-group">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`pe-status-chip${status === opt.value ? " active" : ""}`}
                    onClick={() => setStatus(opt.value)}
                  >
                    <span
                      className="pe-status-dot"
                      style={{ background: opt.color }}
                    />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pe-field">
            <label className="pe-label">
              <Info size={13} />
              Mô tả
            </label>
            <textarea
              className="ops-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn gọn về nội dung podcast..."
              rows={5}
            />
            <span className="pe-hint">{description.length}/500 ký tự</span>
          </div>
        </div>

        {/* Right — Banner */}
        <div className="ops-card pe-banner-card">
          <h3 className="pe-section-title">
            <ImagePlus size={16} />
            Ảnh bìa
          </h3>

          {banner ? (
            <div className="pe-banner-preview">
              <img src={banner} alt="Banner preview" />
              <div className="pe-banner-actions">
                <button
                  className="pe-banner-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingBanner}
                >
                  {uploadingBanner ? (
                    <Loader2 size={14} className="spin" />
                  ) : (
                    <ImagePlus size={14} />
                  )}
                  {uploadingBanner ? "Đang tải..." : "Đổi ảnh"}
                </button>
                <button
                  className="pe-banner-btn pe-banner-btn--danger"
                  onClick={() => setBanner("")}
                  disabled={uploadingBanner}
                >
                  <Trash2 size={14} />
                  Xóa
                </button>
              </div>
            </div>
          ) : (
            <div
              className={`pe-dropzone${dragOver ? " drag-over" : ""}${uploadingBanner ? " loading" : ""}`}
              onClick={() => !uploadingBanner && fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              {uploadingBanner ? (
                <>
                  <Loader2 size={28} className="pe-dropzone-icon spin" />
                  <p className="pe-dropzone-title">Đang tải lên Cloudinary...</p>
                </>
              ) : (
                <>
                  <ImagePlus size={28} className="pe-dropzone-icon" />
                  <p className="pe-dropzone-title">Kéo thả ảnh vào đây</p>
                  <p className="pe-dropzone-sub">
                    hoặc nhấn để chọn file • PNG, JPG • Tối đa 5MB
                  </p>
                </>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => handleCoverUpload(e.target.files?.[0] || null)}
          />
        </div>
      </div>
    </div>
  );
}
