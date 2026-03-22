import { useEffect, useState } from "react";
import { Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { liveSessionApiService, type PodcastResult } from "../../../services/liveSessionApiService";
import { showError, showSuccess } from "../../../components/common/toastUtils";
import "./LiveOps.css";

export default function PodcastPage() {
  const navigate = useNavigate();
  const [podcasts, setPodcasts] = useState<PodcastResult[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPodcasts = async () => {
    setLoading(true);
    try {
      const data = await liveSessionApiService.getPodcasts();
      setPodcasts(data);
    } catch {
      showError("Lỗi", "Không thể tải danh sách podcast");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPodcasts();
  }, []);

  const deletePodcast = async (id: string) => {
    try {
      await liveSessionApiService.deletePodcast(id);
      setPodcasts((prev) => prev.filter((item) => item.id !== id));
      showSuccess("Đã xóa podcast");
    } catch {
      showError("Xóa podcast thất bại");
    }
  };

  return (
    <div className="ops-page">
      <div className="ops-header">
        <div>
          <h1 className="ops-title">Podcast Page</h1>
          <p className="ops-subtitle">Tạo, sửa, xóa podcast theo API /api/v1/podcast</p>
        </div>
        <div className="ops-actions">
          <button className="ops-btn ops-btn--ghost" onClick={loadPodcasts}>
            <RefreshCw size={15} />
            Làm mới
          </button>
          <button className="ops-btn ops-btn--primary" onClick={() => navigate("/admin/podcasts/new")}>
            <Plus size={15} />
            Tạo podcast
          </button>
        </div>
      </div>

      <div className="ops-card">
        {loading ? (
          <div className="ops-stack">
            <div className="ops-skeleton" />
            <div className="ops-skeleton" />
          </div>
        ) : podcasts.length === 0 ? (
          <div className="ops-empty">Chưa có podcast</div>
        ) : (
          <div className="ops-table-wrap">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Status</th>
                  <th>Episodes</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {podcasts.map((podcast) => (
                  <tr key={podcast.id}>
                    <td>{podcast.title}</td>
                    <td>{podcast.author || "Unknown"}</td>
                    <td>{podcast.status}</td>
                    <td>{podcast.episodeCount}</td>
                    <td>
                      <div className="ops-inline-row">
                        <button className="ops-btn ops-btn--ghost" onClick={() => navigate(`/admin/podcasts/${podcast.id}`)}>
                          <Pencil size={14} />
                          Sửa
                        </button>
                        <button className="ops-btn ops-btn--ghost" onClick={() => void deletePodcast(podcast.id)}>
                          <Trash2 size={14} />
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
