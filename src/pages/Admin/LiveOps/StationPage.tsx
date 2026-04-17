import { useEffect, useState } from "react";
import { ExternalLink, RefreshCw, Radio, TowerControl, Waves, Plus, X } from "lucide-react";
import { liveSessionApiService, type StationResult } from "../../../services/liveSessionApiService";
import { showError, showSuccess } from "../../../components/common/toastUtils";
import "./LiveOps.css";

export default function StationPage() {
  const [stations, setStations] = useState<StationResult[]>([]);
  const [nowPlayingMap, setNowPlayingMap] = useState<Record<string, string>>({});
  const [stationStatusMap, setStationStatusMap] = useState<Record<string, "active" | "idle" | "error">>({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newStation, setNewStation] = useState({
    stationName: "",
    description: "",
    shortCode: "",
  });

  const loadStations = async () => {
    setLoading(true);
    try {
      const data = await liveSessionApiService.getStations();
      setStations(data);

      // Fetch now-playing for each station to check activity
      const statusMap: Record<string, "active" | "idle" | "error"> = {};
      await Promise.all(
        data.map(async (station) => {
          try {
            const np = await liveSessionApiService.getStationNowPlaying(station.id);
            // Station has active now-playing track → active
            const title = np?.currentTrack?.title || np?.song?.title;
            if (title) {
              setNowPlayingMap((prev) => ({ ...prev, [station.id]: title }));
              statusMap[station.id] = "active";
            } else {
              // Station has no playlist / no tracks → idle (not an error)
              statusMap[station.id] = "idle";
            }
          } catch {
            statusMap[station.id] = "error";
          }
        })
      );
      setStationStatusMap(statusMap);
    } catch {
      showError("Lỗi", "Không thể tải danh sách station");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStations();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await liveSessionApiService.syncStations();
      showSuccess("Đồng bộ thành công", `${res.createdStations} tạo mới, ${res.updatedStations} cập nhật`);
      await loadStations();
    } catch {
      showError("Đồng bộ thất bại", "Không thể sync station từ Streaming Server. Vui lòng thử lại.");
    } finally {
      setSyncing(false);
    }
  };

  const loadNowPlaying = async (stationId: string) => {
    try {
      const data = await liveSessionApiService.getStationNowPlaying(stationId);
      const title = data?.currentTrack?.title || data?.song?.title;
      if (title) {
        setNowPlayingMap((prev) => ({ ...prev, [stationId]: title }));
        setStationStatusMap((prev) => ({ ...prev, [stationId]: "active" }));
      } else {
        setStationStatusMap((prev) => ({ ...prev, [stationId]: "idle" }));
        showError("Station chưa có playlist", "Station này chưa có track nào trong playlist.");
      }
    } catch {
      setStationStatusMap((prev) => ({ ...prev, [stationId]: "error" }));
      showError("Không lấy được now playing", "Kiểm tra lại cấu hình station");
    }
  };

  const handleCreateStation = async () => {
    if (!newStation.stationName.trim()) {
      showError("Lỗi", "Vui lòng nhập tên station");
      return;
    }

    setCreating(true);
    try {
      await liveSessionApiService.createStation({
        stationName: newStation.stationName.trim(),
        description: newStation.description.trim() || undefined,
        shortCode: newStation.shortCode.trim() || undefined,
      });
      showSuccess("Tạo thành công", `Station "${newStation.stationName.trim()}" đã được tạo`);
      setShowCreateModal(false);
      setNewStation({ stationName: "", description: "", shortCode: "" });
      await loadStations();
    } catch (error: unknown) {
      const errObj = error as { response?: { data?: { message?: string } }; message?: string };
      showError("Tạo station thất bại", errObj?.response?.data?.message || errObj?.message || "Không thể tạo station");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="ops-page">
      <div className="ops-header">
        <div>
          <h1 className="ops-title">Trang Đài Phát</h1>
          <p className="ops-subtitle">Danh sách station, trạng thái và now playing</p>
        </div>
        <div className="ops-actions">
          <button className="ops-btn ops-btn--ghost" onClick={loadStations} disabled={loading}>
            <RefreshCw size={15} className={loading ? "staff-spin" : ""} />
            Làm mới
          </button>
          <button className="ops-btn ops-btn--ghost" onClick={() => setShowCreateModal(true)}>
            <Plus size={15} />
            Tạo Station
          </button>
          <button className="ops-btn ops-btn--primary" onClick={handleSync} disabled={syncing}>
            <TowerControl size={15} />
            {syncing ? "Đang sync..." : "Sync Station"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="ops-stack">
          <div className="ops-skeleton" />
          <div className="ops-skeleton" />
          <div className="ops-skeleton" />
        </div>
      ) : stations.length === 0 ? (
        <div className="ops-empty">Không có station nào</div>
      ) : (
        <div className="ops-grid">
          {stations.map((station) => (
            <div className="ops-card" key={station.id}>
              <div className="ops-inline-row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                <h3 className="ops-card-title" style={{ marginBottom: 0 }}>{station.stationName}</h3>
                <span className={`ops-badge ${station.isEnabled ? "ops-badge--good" : "ops-badge--warn"}`}>
                  <Radio size={12} />
                  {station.isEnabled ? "Online" : "Offline"}
                </span>
              </div>
              <p className="ops-subtitle" style={{ marginTop: 0 }}>{station.stationShortcode || "Không có shortcode"}</p>
              <div className="ops-stack" style={{ marginTop: 8 }}>
                <div className="ops-inline-row">
                  <Waves size={14} />
                  <span>{station.mounts.length} mount</span>
                </div>
                <div className="ops-inline-row">
                  <span style={{ fontWeight: 600 }}>Now playing:</span>
                  <span>{nowPlayingMap[station.id] || "—"}</span>
                  {stationStatusMap[station.id] === "active" && (
                    <span className="ops-badge ops-badge--good" style={{ padding: "2px 6px", fontSize: 10 }}>
                      Hoạt động
                    </span>
                  )}
                  {stationStatusMap[station.id] === "idle" && (
                    <span className="ops-badge ops-badge--warn" style={{ padding: "2px 6px", fontSize: 10 }}>
                      Chưa có playlist
                    </span>
                  )}
                  {stationStatusMap[station.id] === "error" && (
                    <span className="ops-badge ops-badge--danger" style={{ padding: "2px 6px", fontSize: 10 }}>
                      Lỗi
                    </span>
                  )}
                </div>
              </div>
              <div className="ops-actions" style={{ marginTop: 12 }}>
                <button className="ops-btn ops-btn--ghost" onClick={() => loadNowPlaying(station.id)}>
                  <RefreshCw size={14} />
                  Cập nhật now playing
                </button>
                <button
                  className="ops-btn ops-btn--ghost"
                  onClick={() => {
                    const target = station.publicPlayerUrl || station.streamUrl;
                    if (target) window.open(target, "_blank", "noopener,noreferrer");
                  }}
                >
                  <ExternalLink size={14} />
                  Mở player
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="ops-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="ops-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ops-modal-head ops-inline-row" style={{ justifyContent: "space-between" }}>
              <h3 className="ops-card-title" style={{ margin: 0 }}>Tạo Station mới</h3>
              <button
                type="button"
                className="ops-btn ops-btn--ghost"
                onClick={() => setShowCreateModal(false)}
              >
                <X size={14} />
                Đóng
              </button>
            </div>

            <div className="ops-modal-body ops-stack">
              <div className="ops-stack" style={{ gap: 6 }}>
                <label htmlFor="station-name" style={{ fontWeight: 600, fontSize: 13 }}>Tên station *</label>
                <input
                  id="station-name"
                  className="ops-input"
                  value={newStation.stationName}
                  onChange={(e) => setNewStation((prev) => ({ ...prev, stationName: e.target.value }))}
                  placeholder="Nhập tên station"
                  autoFocus
                />
              </div>

              <div className="ops-stack" style={{ gap: 6 }}>
                <label htmlFor="station-shortcode" style={{ fontWeight: 600, fontSize: 13 }}>Short code</label>
                <input
                  id="station-shortcode"
                  className="ops-input"
                  value={newStation.shortCode}
                  onChange={(e) => setNewStation((prev) => ({ ...prev, shortCode: e.target.value }))}
                  placeholder="vd: jazz-fm"
                />
                <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
                  Chỉ dùng chữ thường, số, gạch ngang và gạch dưới.
                </span>
              </div>

              <div className="ops-stack" style={{ gap: 6 }}>
                <label htmlFor="station-description" style={{ fontWeight: 600, fontSize: 13 }}>Mô tả</label>
                <textarea
                  id="station-description"
                  className="ops-textarea"
                  value={newStation.description}
                  onChange={(e) => setNewStation((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Mô tả ngắn về station"
                />
              </div>

              <div className="ops-badge ops-badge--warn" style={{ alignSelf: "flex-start" }}>
                Station sẽ được tạo ở local database. Có thể cần sync sau đó để cập nhật dữ liệu từ Streaming Server.
              </div>
            </div>

            <div className="ops-modal-foot">
              <button
                type="button"
                className="ops-btn ops-btn--ghost"
                onClick={() => setShowCreateModal(false)}
                disabled={creating}
              >
                Huỷ
              </button>
              <button
                type="button"
                className="ops-btn ops-btn--primary"
                onClick={handleCreateStation}
                disabled={creating || !newStation.stationName.trim()}
              >
                {creating ? "Đang tạo..." : "Tạo station"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
