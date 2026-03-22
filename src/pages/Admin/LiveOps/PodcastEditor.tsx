import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { liveSessionApiService } from "../../../services/liveSessionApiService";
import { showError, showSuccess } from "../../../components/common/toastUtils";
import "./LiveOps.css";

const getCurrentUserId = () => {
  try {
    const raw = localStorage.getItem("userInfo");
    if (!raw) return "";
    const user = JSON.parse(raw);
    return user?.id || user?.userId || "";
  } catch {
    return "";
  }
};

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

  useEffect(() => {
    if (!isEdit || !podcastId) {
      return;
    }

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
    const reader = new FileReader();
    reader.onload = () => {
      setBanner(String(reader.result || ""));
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!title.trim()) {
      showError("Thiếu title");
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
        const createdBy = getCurrentUserId();
        if (!createdBy) {
          showError("Thiếu user id", "Không tìm thấy userInfo.id để tạo podcast");
          setSaving(false);
          return;
        }

        await liveSessionApiService.createPodcast({
          createdBy,
          title,
          description: description || undefined,
          author: author || undefined,
          type: type || undefined,
          banner: banner || undefined,
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
      <div className="ops-header">
        <div>
          <button className="ops-link-btn" onClick={() => navigate("/admin/podcasts")}>
            <ArrowLeft size={13} /> Quay lại Podcast Page
          </button>
          <h1 className="ops-title">PodcastEditor</h1>
          <p className="ops-subtitle">{isEdit ? "Chỉnh sửa podcast" : "Tạo podcast mới"}</p>
        </div>
        <div className="ops-actions">
          <button className="ops-btn ops-btn--primary" onClick={save} disabled={saving}>
            <Save size={14} />
            {saving ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </div>

      <div className="ops-card">
        <div className="ops-stack">
          <input className="ops-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
          <input className="ops-input" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Author" />
          <input className="ops-input" value={type} onChange={(e) => setType(e.target.value)} placeholder="Type" />
          <select className="ops-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="Draft">Draft</option>
            <option value="Published">Published</option>
            <option value="Archived">Archived</option>
          </select>
          <textarea className="ops-textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
          <input className="ops-input" value={banner} onChange={(e) => setBanner(e.target.value)} placeholder="Banner URL / Base64" />
          <input type="file" accept="image/*" onChange={(e) => void handleCoverUpload(e.target.files?.[0] || null)} />
          {banner ? <img src={banner} alt="Podcast cover" style={{ width: 180, borderRadius: 12, border: "1px solid rgba(148,163,184,0.3)" }} /> : null}
        </div>
      </div>
    </div>
  );
}
