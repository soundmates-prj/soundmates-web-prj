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
import staffService, { type HostUser } from "../../../services/staffService";
import type {
  StationResult,
  LiveSessionResult,
} from "../../../services/liveSessionApiService";
import { showSuccess, showError } from "../../../components/common/toastUtils";
import "./LiveSessionsScreen.css";

type FilterStatus = "all" | "Created" | "Scheduled" | "Live" | "Paused" | "Ended" | "Cancelled";

export function LiveSessionsScreen() {
  const [stations, setStations] = useState<StationResult[]>([]);
  const [sessions, setSessions] = useState<LiveSessionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [hostUsers, setHostUsers] = useState<HostUser[]>([]);

  const [formStationId, setFormStationId] = useState("");
  const [formHostUserId, setFormHostUserId] = useState("");
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
      showError("L\u1ed7i", "Kh\u00f4ng th\u1ec3 t\u1ea3i d\u1eef li\u1ec7u");
    } finally {
      setLoading(false);
    }
  };

  const loadHostUsers = async () => {
    try {
      const res = await staffService.user.getHosts({ page: 1, pageSize: 100 });
      const hosts = res.items.filter((u) => u.isActive);

      setHostUsers(hosts);
      setFormHostUserId((prev) => {
        if (prev && hosts.some((h) => h.id === prev)) return prev;
        return hosts[0]?.id || "";
      });
    } catch {
      setHostUsers([]);
      setFormHostUserId("");
    }
  };

  useEffect(() => {
    if (showCreateModal) {
      loadHostUsers();
    }
  }, [showCreateModal]);

  const handleCreate = async () => {
    if (!formStationId || !formHostUserId || !formName.trim()) return;
    setCreating(true);
    try {
      await liveSessionApiService.createLiveSession({
        stationId: formStationId,
        hostUserId: formHostUserId,
        sessionName: formName.trim(),
        description: formDesc.trim() || undefined,
      });
      showSuccess("Tạo thành công!", `Phiên "${formName}" đã được tạo`);
      setShowCreateModal(false);
      setFormName("");
      setFormDesc("");
      setFormHostUserId("");
      await loadData();
    } catch (error: any) {
      const message = error?.response?.data?.message || "Không thể tạo phiên phát sóng";
      showError("Lỗi", message);
    } finally {
      setCreating(false);
    }
  };

  const handleStart = async (id: string) => {
    try {
      await liveSessionApiService.startSession(id);
      showSuccess("Bắt đầu!", "Phiên phát sóng đang hoạt động");
      await loadData();
    } catch {
      showError("Lỗi", "Không thể bắt đầu phiên phát sóng");
    }
  };

  const handleStop = async (id: string) => {
    try {
      await liveSessionApiService.stopSession(id);
      showSuccess("Đã dừng", "Phiên phát sóng đã kết thúc");
      await loadData();
    } catch {
      showError("Lỗi", "Không thể dừng phiên phát sóng");
    }
  };

  const filteredSessions =
    filter === "all" ? sessions : sessions.filter((s) => s.status === filter);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "\u2014";
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return "\u2014";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const getStatusBadge = (status: string) => {
    const key = status.toLowerCase();
    const labels: Record<string, string> = {
      live: "LIVE",
      created: "Chờ",
      scheduled: "Đã lên lịch",
      paused: "Tạm dừng",
      ended: "Đã kết thúc",
      cancelled: "Đã huỷ",
    };
    return (
      <span className={`lm-badge lm-badge--${key}`}>
        {labels[key] || status}
      </span>
    );
  };

  const canStart = (status: string) => ["Created", "Scheduled", "Paused"].includes(status);
  const canStop = (status: string) => ["Live", "Paused"].includes(status);

  const filterTabs: { label: string; value: FilterStatus }[] = [
    { label: "Tất cả", value: "all" },
    { label: "Chờ phát", value: "Created" },
    { label: "Đang phát", value: "Live" },
    { label: "Đã kết thúc", value: "Ended" },
  ];

  if (loading) {
    return (
      <div className="lm-loading">
        <RefreshCw size={28} className="lm-spin" />
        <p>Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="lm-page">
      <div className="lm-header">
        <div className="lm-header-left">
          <h1>Quản lý phát sóng</h1>
          <p>Tạo và điều khiển các phiên phát sóng trực tiếp</p>
        </div>
        <div className="lm-header-actions">
          <button className="lm-btn lm-btn--outline" onClick={loadData}>
            <RefreshCw size={15} />
            Làm mới
          </button>
          <button className="lm-btn lm-btn--primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={15} />
            Tạo phiên mới
          </button>
        </div>
      </div>

      <div className="lm-filter-tabs">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            className={`lm-tab ${filter === tab.value ? "active" : ""}`}
            onClick={() => setFilter(tab.value)}
          >
            {tab.label}
            {tab.value !== "all" && (
              <span className="lm-tab-count">
                {sessions.filter((s) => s.status === tab.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {filteredSessions.length === 0 ? (
        <div className="lm-empty">
          <Disc3 size={48} />
          <p>Không có phiên phát sóng nào</p>
        </div>
      ) : (
        <div className="lm-grid">
          {filteredSessions.map((session) => (
            <div className="lm-card" key={session.id}>
              <div className="lm-card-top">
                {getStatusBadge(session.status)}
                <div className="lm-card-actions">
                  {canStart(session.status) && (
                    <button
                      className="lm-action-btn lm-action-btn--start"
                      onClick={() => handleStart(session.id)}
                      title="Bắt đầu phát sóng"
                    >
                      <Play size={15} />
                    </button>
                  )}
                  {canStop(session.status) && (
                    <button
                      className="lm-action-btn lm-action-btn--stop"
                      onClick={() => handleStop(session.id)}
                      title="Dừng phát sóng"
                    >
                      <Square size={15} />
                    </button>
                  )}
                </div>
              </div>

              <h3 className="lm-card-name">{session.sessionName}</h3>
              {session.description && (
                <p className="lm-card-desc">{session.description}</p>
              )}

              <div className="lm-card-meta">
                <div className="lm-meta-item">
                  <Radio size={13} />
                  <span>{session.stationName || "Chưa rõ"}</span>
                </div>
                <div className="lm-meta-item">
                  <Clock size={13} />
                  <span>{formatDate(session.startedAt || session.createdAt)}</span>
                </div>
                <div className="lm-meta-item">
                  <Users size={13} />
                  <span>{session.listenersCount} đang nghe</span>
                </div>
                {session.totalDuration > 0 && (
                  <div className="lm-meta-item">
                    <Disc3 size={13} />
                    <span>{formatDuration(session.totalDuration)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="lm-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="lm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="lm-modal-header">
              <h3>Tạo phiên phát sóng mới</h3>
              <button className="lm-modal-close" onClick={() => setShowCreateModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="lm-modal-body">
              <label className="lm-label">Trạm phát sóng</label>
              <select
                className="lm-select"
                value={formStationId}
                onChange={(e) => setFormStationId(e.target.value)}
              >
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.stationName}
                  </option>
                ))}
              </select>

              <label className="lm-label" style={{ marginTop: 16 }}>Host</label>
              <select
                className="lm-select"
                value={formHostUserId}
                onChange={(e) => setFormHostUserId(e.target.value)}
              >
                <option value="">Chọn host</option>
                {hostUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName || u.lastName
                      ? `${u.firstName || ""} ${u.lastName || ""}`.trim()
                      : u.username} ({u.email})
                  </option>
                ))}
              </select>

              <label className="lm-label" style={{ marginTop: 16 }}>Tên phiên</label>
              <input
                className="lm-input"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="VD: Chill Night Radio..."
                autoFocus
              />

              <label className="lm-label" style={{ marginTop: 16 }}>Mô tả (tuỳ chọn)</label>
              <textarea
                className="lm-textarea"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Mô tả ngắn cho phiên phát sóng..."
                rows={3}
              />
            </div>
            <div className="lm-modal-footer">
              <button className="lm-btn lm-btn--outline" onClick={() => setShowCreateModal(false)}>
                Huỷ
              </button>
              <button
                className="lm-btn lm-btn--primary"
                onClick={handleCreate}
                disabled={!formName.trim() || !formStationId || !formHostUserId || creating}
              >
                {creating ? "Đang tạo..." : "Tạo phiên"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LiveSessionsScreen;
