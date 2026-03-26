import { useEffect, useState } from "react";
import { ExternalLink, RefreshCw, Radio, TowerControl, Waves } from "lucide-react";
import { liveSessionApiService, type StationResult } from "../../../services/liveSessionApiService";
import { showError, showSuccess } from "../../../components/common/toastUtils";
import "./LiveOps.css";

export default function StationPage() {
  const [stations, setStations] = useState<StationResult[]>([]);
  const [nowPlayingMap, setNowPlayingMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const loadStations = async () => {
    setLoading(true);
    try {
      const data = await liveSessionApiService.getStations();
      setStations(data);
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
      showError("Đồng bộ thất bại", "Không thể sync station từ AzuraCast");
    } finally {
      setSyncing(false);
    }
  };

  const loadNowPlaying = async (stationId: string) => {
    try {
      const data = await liveSessionApiService.getStationNowPlaying(stationId);
      const title = data?.nowPlaying?.song?.title || data?.song?.title || "Không có bài đang phát";
      setNowPlayingMap((prev) => ({ ...prev, [stationId]: title }));
    } catch {
      showError("Không lấy được now playing", "Kiểm tra lại cấu hình station");
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
                  <span>{nowPlayingMap[station.id] || "Chưa tải"}</span>
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
    </div>
  );
}
