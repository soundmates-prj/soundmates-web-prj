import { useState, useEffect } from "react";
import {
  Disc3,
  RefreshCw,
  Plus,
  Play,
  Square,
  Users,
  Clock,
  X,
  Radio,
} from "lucide-react";
import { liveSessionApiService } from "../../../services/liveSessionApiService";
import type {
  StationResult,
  LiveSessionResult,
} from "../../../services/liveSessionApiService";
import { showSuccess, showError } from "../../../components/common/toastUtils";
import "./LiveSessionsScreen.css";

type FilterStatus = "all" | "Scheduled" | "Live" | "Ended";

export function LiveSessionsScreen() {
  const [stations, setStations] = useState<StationResult[]>([]);
  const [sessions, setSessions] = useState<LiveSessionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create form
  const [formStationId, setFormStationId] = useState("");
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [stationsData, sessionsData] = await Promise.allSettled([
        liveSessionApiService.getStations(),
        liveSessionApiService.getLiveSessions({ pageSize: 50 }),
      ]);
      if (stationsData.status === "fulfilled") {
        setStations(stationsData.value);
        if (stationsData.value.length > 0 && !formStationId) {
          setFormStationId(stationsData.value[0].id);
        }
      }
      if (sessionsData.status === "fulfilled") setSessions(sessionsData.value.items);
    } catch {
      showError("Lỗi", "Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formStationId || !formName.trim()) return;
    setCreating(true);
    try {
      const userInfo = localStorage.getItem("userInfo");
      let userId = "00000000-0000-0000-0000-000000000000";
      if (userInfo) {
        try {
          const parsed = JSON.parse(userInfo);
          if (parsed.id) userId = parsed.id;
        } catch { /* ignore */ }
      }

      await liveSessionApiService.createLiveSession({
        userId,
        stationId: formStationId,
        sessionName: formName.trim(),
        description: formDesc.trim() || undefined,
      });
      showSuccess("Tạo thành công!", `Session "${formName}" đã được tạo`);
      setShowCreateModal(false);
      setFormName("");
      setFormDesc("");
      await loadData();
    } catch {
      showError("Lỗi", "Không thể tạo session");
    } finally {
      setCreating(false);
    }
  };

  const handleStart = async (id: string) => {
    try {
      await liveSessionApiService.startSession(id);
      showSuccess("Đã bắt đầu!", "Session đang phát sóng");
      await loadData();
    } catch {
      showError("Lỗi", "Không thể bắt đầu session");
    }
  };

  const handleStop = async (id: string) => {
    try {
      await liveSessionApiService.stopSession(id);
      showSuccess("Đã dừng", "Session đã kết thúc");
      await loadData();
    } catch {
      showError("Lỗi", "Không thể dừng session");
    }
  };

  const filteredSessions =
    filter === "all" ? sessions : sessions.filter((s) => s.status === filter);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return "—";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Live":
        return <span className="staff-badge staff-badge--live">LIVE</span>;
      case "Scheduled":
        return <span className="staff-badge staff-badge--scheduled">Scheduled</span>;
      case "Ended":
        return <span className="staff-badge staff-badge--ended">Ended</span>;
      default:
        return <span className="staff-badge staff-badge--draft">{status}</span>;
    }
  };

  const filterTabs: { label: string; value: FilterStatus }[] = [
    { label: "Tất cả", value: "all" },
    { label: "Scheduled", value: "Scheduled" },
    { label: "Đang phát", value: "Live" },
    { label: "Đã kết thúc", value: "Ended" },
  ];

  if (loading) {
    return (
      <div className="staff-loading">
        <RefreshCw size={24} className="staff-spin" />
        <p>Đang tải sessions...</p>
      </div>
    );
  }

  return (
    <div className="staff-dashboard">
      {/* Header */}
      <div className="staff-page-header">
        <div>
          <h1 className="staff-page-title">Live Sessions</h1>
          <p className="staff-page-subtitle">Tạo và quản lý các phiên phát sóng trực tiếp</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="staff-btn staff-btn--outline" onClick={loadData}>
            <RefreshCw size={16} />
            Làm mới
          </button>
          <button className="staff-btn staff-btn--primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            Tạo Session
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="ls-filter-tabs">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            className={`pl-station-tab ${filter === tab.value ? "active" : ""}`}
            onClick={() => setFilter(tab.value)}
          >
            {tab.label}
            {tab.value !== "all" && (
              <span className="ls-tab-count">
                {sessions.filter((s) => s.status === tab.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Sessions list */}
      {filteredSessions.length === 0 ? (
        <div className="staff-card">
          <div className="staff-card-body" style={{ textAlign: "center", padding: "48px 24px" }}>
            <Disc3 size={40} style={{ color: "#c4b5fd", marginBottom: 12 }} />
            <p className="staff-empty" style={{ fontSize: 15 }}>Không có session nào</p>
          </div>
        </div>
      ) : (
        <div className="ls-sessions-grid">
          {filteredSessions.map((session) => (
            <div className="ls-session-card" key={session.id}>
              <div className="ls-card-top">
                {getStatusBadge(session.status)}
                <div className="ls-card-actions">
                  {session.status === "Scheduled" && (
                    <button
                      className="ls-action-btn ls-action-btn--start"
                      onClick={() => handleStart(session.id)}
                      title="Bắt đầu phát sóng"
                    >
                      <Play size={14} />
                    </button>
                  )}
                  {session.status === "Live" && (
                    <button
                      className="ls-action-btn ls-action-btn--stop"
                      onClick={() => handleStop(session.id)}
                      title="Dừng phát sóng"
                    >
                      <Square size={14} />
                    </button>
                  )}
                </div>
              </div>

              <h3 className="ls-session-name">{session.sessionName}</h3>
              {session.description && (
                <p className="ls-session-desc">{session.description}</p>
              )}

              <div className="ls-session-meta">
                <div className="ls-meta-item">
                  <Radio size={13} />
                  <span>{session.stationName || "Unknown"}</span>
                </div>
                <div className="ls-meta-item">
                  <Clock size={13} />
                  <span>{formatDate(session.startedAt || session.createdAt)}</span>
                </div>
                <div className="ls-meta-item">
                  <Users size={13} />
                  <span>{session.peakListeners} peak · {session.totalListeners} total</span>
                </div>
                {session.totalDuration > 0 && (
                  <div className="ls-meta-item">
                    <Disc3 size={13} />
                    <span>{formatDuration(session.totalDuration)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Session Modal */}
      {showCreateModal && (
        <div className="staff-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="staff-modal" onClick={(e) => e.stopPropagation()}>
            <div className="staff-modal-header">
              <h3>Tạo Live Session mới</h3>
              <button className="staff-modal-close" onClick={() => setShowCreateModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="staff-modal-body">
              <label className="staff-label">Station</label>
              <select
                className="staff-select"
                value={formStationId}
                onChange={(e) => setFormStationId(e.target.value)}
              >
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.stationName}
                  </option>
                ))}
              </select>

              <label className="staff-label" style={{ marginTop: 14 }}>Tên session</label>
              <input
                className="staff-input"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="VD: Chill Night Radio..."
                autoFocus
              />

              <label className="staff-label" style={{ marginTop: 14 }}>Mô tả (tuỳ chọn)</label>
              <textarea
                className="staff-input staff-textarea"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Mô tả ngắn cho session..."
                rows={3}
              />
            </div>
            <div className="staff-modal-footer">
              <button className="staff-btn staff-btn--outline" onClick={() => setShowCreateModal(false)}>
                Huỷ
              </button>
              <button
                className="staff-btn staff-btn--primary"
                onClick={handleCreate}
                disabled={!formName.trim() || !formStationId || creating}
              >
                {creating ? "Đang tạo..." : "Tạo Session"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LiveSessionsScreen;
