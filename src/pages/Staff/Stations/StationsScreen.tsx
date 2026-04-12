import { useState, useEffect } from "react";
import {
  Radio,
  RefreshCw,
  Wifi,
  WifiOff,
  Globe,
  ArrowDownToLine,
  ExternalLink,
  Calendar,
  Plus,
  X,
} from "lucide-react";
import { liveSessionApiService } from "../../../services/liveSessionApiService";
import type { StationResult } from "../../../services/liveSessionApiService";
import { showSuccess, showError } from "../../../components/common/toastUtils";
import "../StaffShared.css";
import "./StationsScreen.css";

export function StationsScreen() {
  const [stations, setStations] = useState<StationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newStation, setNewStation] = useState({
    stationName: "",
    description: "",
    shortCode: "",
  });

  // Staff and Admin can create stations

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
        "Đồng bộ thành công!",
        `${result.createdStations} tạo mới, ${result.updatedStations} cập nhật`,
      );
      await loadStations();
    } catch {
      showError("Đồng bộ thất bại", "Không thể kết nối hệ thống");
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

  const handleViewLive = (station: StationResult) => {
    const target = station.publicPlayerUrl || station.streamUrl;
    if (!target) {
      showError("Không có link phát", "Station này chưa có URL phát trực tiếp");
      return;
    }
    window.open(target, "_blank", "noopener,noreferrer");
  };

  const handleCreateStation = async () => {
    if (!newStation.stationName.trim()) {
      showError("Lỗi", "Vui lòng nhập tên station");
      return;
    }

    try {
      await liveSessionApiService.createStation(newStation);
      showSuccess(
        "Tạo thành công!",
        `Station "${newStation.stationName}" đã được tạo`,
      );
      setShowCreateModal(false);
      setNewStation({ stationName: "", description: "", shortCode: "" });
      await loadStations();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Không thể tạo station";
      showError("Lỗi", errorMessage);
    }
  };

  return (
    <div className="staff-dashboard">
      {/* Header */}
      <div className="staff-page-header">
        <div>
          <h1
            className="staff-page-title"
            style={{
              background:
                "linear-gradient(135deg, #1a9fd4 0%, #55c5f1 50%, #a0e4ff 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Stations
          </h1>
          <p className="staff-page-subtitle">
            Quản lý các kênh phát sóng radio
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            className="staff-btn staff-btn--outline"
            onClick={loadStations}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "staff-spin" : ""} />
            Làm mới
          </button>
          <button
            className="staff-btn staff-btn--outline"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={16} />
            Tạo Station
          </button>
          <button
            className="staff-btn staff-btn--primary"
            onClick={handleSync}
            disabled={syncing}
          >
            <ArrowDownToLine
              size={16}
              className={syncing ? "staff-spin" : ""}
            />
            {syncing ? "Đang sync..." : "Đồng bộ"}
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
          <div
            className="staff-card-body"
            style={{ textAlign: "center", padding: "48px 24px" }}
          >
            <Radio size={40} style={{ color: "#94a3b8", marginBottom: 12 }} />
            <p className="staff-empty" style={{ fontSize: 15 }}>
              Chưa có station nào. Nhấn <strong>Đồng bộ</strong> để tải danh
              sách.
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
                <div className="station-meta-item">
                  <Calendar size={13} />
                  <span>Tạo lúc: {formatDate(station.createdAt)}</span>
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
                <button
                  className="station-live-btn"
                  onClick={() => handleViewLive(station)}
                  disabled={!station.publicPlayerUrl && !station.streamUrl}
                >
                  <ExternalLink size={14} />
                  Xem trực tiếp
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Station Modal */}
      {showCreateModal && (
        <div
          className="staff-modal-overlay"
          onClick={() => setShowCreateModal(false)}
        >
          <div className="staff-modal" onClick={(e) => e.stopPropagation()}>
            <div className="staff-modal-header">
              <h3>Tạo Station mới</h3>
              <button
                className="staff-modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="staff-modal-body">
              <label className="staff-label">Tên station *</label>
              <input
                className="staff-input"
                value={newStation.stationName}
                onChange={(e) =>
                  setNewStation({ ...newStation, stationName: e.target.value })
                }
                placeholder="Nhập tên station..."
                autoFocus
              />

              <label className="staff-label" style={{ marginTop: 12 }}>
                Short code (tuỳ chọn)
              </label>
              <input
                className="staff-input"
                value={newStation.shortCode}
                onChange={(e) =>
                  setNewStation({ ...newStation, shortCode: e.target.value })
                }
                placeholder="vd: jazz-fm, chill-radio..."
                pattern="^[a-z0-9_-]+$"
              />
              <p className="staff-input-hint">
                Chỉ dùng chữ thường, số, gạch ngang và gạch dưới
              </p>

              <label className="staff-label" style={{ marginTop: 12 }}>
                Mô tả (tuỳ chọn)
              </label>
              <textarea
                className="staff-input staff-textarea"
                value={newStation.description}
                onChange={(e) =>
                  setNewStation({ ...newStation, description: e.target.value })
                }
                placeholder="Mô tả ngắn về station..."
                rows={3}
              />

              <div className="staff-info-box">
                <strong>Lưu ý:</strong> Station sẽ được tạo trong local
                database. Để có stream URL thực, vui lòng đồng bộ với AzuraCast
                sau khi tạo.
              </div>
            </div>
            <div className="staff-modal-footer">
              <button
                className="staff-btn staff-btn--outline"
                onClick={() => setShowCreateModal(false)}
              >
                Huỷ
              </button>
              <button
                className="staff-btn staff-btn--primary"
                onClick={handleCreateStation}
                disabled={!newStation.stationName.trim()}
              >
                Tạo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
