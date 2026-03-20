import { useState, useEffect } from "react";
import {
  Radio,
  RefreshCw,
  Wifi,
  WifiOff,
  Globe,
  ArrowDownToLine,
} from "lucide-react";
import { liveSessionApiService } from "../../../services/liveSessionApiService";
import type { StationResult } from "../../../services/liveSessionApiService";
import { showSuccess, showError } from "../../../components/common/toastUtils";
import "./StationsScreen.css";

export function StationsScreen() {
  const [stations, setStations] = useState<StationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadStations();
  }, []);

  const loadStations = async () => {
    setLoading(true);
    try {
      const data = await liveSessionApiService.getStations();
      setStations(data);
    } catch {
      showError("Lỗi", "Không thể tải danh sách stations");
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await liveSessionApiService.syncStations();
      showSuccess(
        "Sync thành công!",
        `${result.createdStations} tạo mới, ${result.updatedStations} cập nhật`
      );
      await loadStations();
    } catch {
      showError("Sync thất bại", "Không thể kết nối AzuraCast");
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Chưa sync";
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="staff-dashboard">
      {/* Header */}
      <div className="staff-page-header">
        <div>
          <h1 className="staff-page-title">Stations</h1>
          <p className="staff-page-subtitle">
            Quản lý các stations phát sóng từ AzuraCast
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="staff-btn staff-btn--outline" onClick={loadStations} disabled={loading}>
            <RefreshCw size={16} className={loading ? "staff-spin" : ""} />
            Làm mới
          </button>
          <button className="staff-btn staff-btn--primary" onClick={handleSync} disabled={syncing}>
            <ArrowDownToLine size={16} className={syncing ? "staff-spin" : ""} />
            {syncing ? "Đang sync..." : "Sync AzuraCast"}
          </button>
        </div>
      </div>

      {/* Station Cards */}
      {loading ? (
        <div className="staff-loading">
          <RefreshCw size={24} className="staff-spin" />
          <p>Đang tải stations...</p>
        </div>
      ) : stations.length === 0 ? (
        <div className="staff-card">
          <div className="staff-card-body" style={{ textAlign: "center", padding: "48px 24px" }}>
            <Radio size={40} style={{ color: "#94a3b8", marginBottom: 12 }} />
            <p className="staff-empty" style={{ fontSize: 15 }}>
              Chưa có station nào. Nhấn <strong>Sync AzuraCast</strong> để đồng bộ.
            </p>
          </div>
        </div>
      ) : (
        <div className="stations-grid">
          {stations.map((station) => (
            <div className="station-card" key={station.id}>
              <div className="station-card-top">
                <div className="station-icon-wrap">
                  <Radio size={22} />
                </div>
                <div className="station-status-dot">
                  {station.isEnabled ? (
                    <Wifi size={14} style={{ color: "#34D399" }} />
                  ) : (
                    <WifiOff size={14} style={{ color: "#94a3b8" }} />
                  )}
                </div>
              </div>

              <h3 className="station-name">{station.stationName}</h3>
              <p className="station-code">{station.stationShortcode || "—"}</p>

              {station.description && (
                <p className="station-desc">{station.description}</p>
              )}

              <div className="station-meta">
                <div className="station-meta-item">
                  <Globe size={13} />
                  <span>{station.mounts.length} mount(s)</span>
                </div>
                <div className="station-meta-item">
                  <RefreshCw size={13} />
                  <span>{formatDate(station.lastSyncedAt)}</span>
                </div>
              </div>

              <div className="station-footer">
                <span
                  className={`staff-badge ${
                    station.syncStatus === "Synced"
                      ? "staff-badge--live"
                      : "staff-badge--scheduled"
                  }`}
                >
                  {station.syncStatus}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default StationsScreen;
