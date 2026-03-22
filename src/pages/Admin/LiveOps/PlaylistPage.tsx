import { useEffect, useState } from "react";
import { ListPlus, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { liveSessionApiService, type PlaylistResult, type StationResult } from "../../../services/liveSessionApiService";
import { showError, showSuccess } from "../../../components/common/toastUtils";
import "./LiveOps.css";

export default function PlaylistPage() {
  const navigate = useNavigate();
  const [stations, setStations] = useState<StationResult[]>([]);
  const [selectedStationId, setSelectedStationId] = useState("");
  const [playlists, setPlaylists] = useState<PlaylistResult[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const loadData = async (stationId?: string) => {
    setLoading(true);
    try {
      const stationData = await liveSessionApiService.getStations();
      setStations(stationData);
      const target = stationId || selectedStationId || stationData[0]?.id;
      if (target) {
        setSelectedStationId(target);
        const list = await liveSessionApiService.getStationPlaylists(target);
        setPlaylists(list);
      }
    } catch {
      showError("Lỗi", "Không thể tải dữ liệu playlist");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (!selectedStationId) return;
    void loadData(selectedStationId);
  }, [selectedStationId]);

  const createPlaylist = async () => {
    if (!selectedStationId || !name.trim()) return;
    try {
      await liveSessionApiService.createPlaylist({
        stationId: selectedStationId,
        playlistName: name.trim(),
        description: description || undefined,
        isAutoPlay: false,
      });
      showSuccess("Tạo playlist thành công");
      setName("");
      setDescription("");
      await loadData(selectedStationId);
    } catch {
      showError("Tạo playlist thất bại");
    }
  };

  const syncPlaylist = async () => {
    if (!selectedStationId) return;
    try {
      await liveSessionApiService.syncStationPlaylists(selectedStationId);
      showSuccess("Đồng bộ playlist thành công");
      await loadData(selectedStationId);
    } catch {
      showError("Đồng bộ playlist thất bại");
    }
  };

  return (
    <div className="ops-page">
      <div className="ops-header">
        <div>
          <h1 className="ops-title">Playlist Page</h1>
          <p className="ops-subtitle">Tạo playlist, đồng bộ và truy cập trang chi tiết playlist</p>
        </div>
        <div className="ops-actions">
          <select className="ops-select" value={selectedStationId} onChange={(e) => setSelectedStationId(e.target.value)}>
            {stations.map((station) => (
              <option key={station.id} value={station.id}>{station.stationName}</option>
            ))}
          </select>
          <button className="ops-btn ops-btn--ghost" onClick={() => void loadData(selectedStationId)}>
            <RefreshCw size={15} />
            Làm mới
          </button>
          <button className="ops-btn ops-btn--primary" onClick={syncPlaylist}>
            Sync playlist
          </button>
        </div>
      </div>

      <div className="ops-card" style={{ marginBottom: 14 }}>
        <h3 className="ops-card-title">Tạo playlist mới</h3>
        <div className="ops-toolbar">
          <input className="ops-input" placeholder="Tên playlist" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="ops-input" placeholder="Mô tả" value={description} onChange={(e) => setDescription(e.target.value)} />
          <button className="ops-btn ops-btn--primary" onClick={createPlaylist} disabled={!name.trim() || !selectedStationId}>
            <ListPlus size={14} />
            Tạo playlist
          </button>
        </div>
      </div>

      <div className="ops-card">
        <h3 className="ops-card-title">Danh sách playlist</h3>
        {loading ? (
          <div className="ops-stack">
            <div className="ops-skeleton" />
            <div className="ops-skeleton" />
            <div className="ops-skeleton" />
          </div>
        ) : playlists.length === 0 ? (
          <div className="ops-empty">Chưa có playlist</div>
        ) : (
          <div className="ops-table-wrap">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Tên</th>
                  <th>Tracks</th>
                  <th>Duration</th>
                  <th>Tạo lúc</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {playlists.map((playlist) => (
                  <tr key={playlist.id}>
                    <td>{playlist.playlistName}</td>
                    <td>{playlist.totalTracks}</td>
                    <td>{Math.floor(playlist.totalDuration / 60)} phút</td>
                    <td>{new Date(playlist.createdAt).toLocaleString("vi-VN")}</td>
                    <td>
                      <button
                        className="ops-link-btn"
                        onClick={() => navigate(`/admin/playlists/${playlist.id}?stationId=${selectedStationId}`)}
                      >
                        Xem chi tiết
                      </button>
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
