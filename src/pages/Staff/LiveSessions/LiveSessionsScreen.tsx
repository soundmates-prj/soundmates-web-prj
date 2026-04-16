import { useState, useEffect, useCallback } from "react";
import {
  Disc3,
  RefreshCw,
  Plus,
  Users,
  Clock,
  X,
  Radio,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { liveSessionApiService } from "../../../services/liveSessionApiService";
import staffService, { type HostUser } from "../../../services/staffService";
import type {
  StationResult,
  LiveSessionResult,
} from "../../../services/liveSessionApiService";
import { showSuccess, showError } from "../../../components/common/toastUtils";
import "./LiveSessionsScreen.css";

type FilterStatus =
  | "all"
  | "Created"
  | "Scheduled"
  | "Live"
  | "Paused"
  | "Ended"
  | "Cancelled";

const PAGE_SIZE = 12;

export function LiveSessionsScreen() {
  // ── Station state ──
  const [stations, setStations] = useState<StationResult[]>([]);
  const [loadingStations, setLoadingStations] = useState(true);

  // ── Session list state ──
  const [sessions, setSessions] = useState<LiveSessionResult[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  // ── Filter ──
  const [filter, setFilter] = useState<FilterStatus>("all");

  // ── Create modal ──
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [hostUsers, setHostUsers] = useState<HostUser[]>([]);
  const [loadingHosts, setLoadingHosts] = useState(false);
  const [formStationId, setFormStationId] = useState("");
  const [formHostUserId, setFormHostUserId] = useState("");
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [creating, setCreating] = useState(false);

  // ── Khởi tạo: load stations một lần ──
  useEffect(() => {
    loadStations();
  }, []);

  const loadStations = async () => {
    setLoadingStations(true);
    try {
      const data = await liveSessionApiService.getStations();
      setStations(data);
      if (data.length > 0) {
        setFormStationId((prev) => prev || data[0].id);
      }
    } catch {
      showError("Lỗi", "Không thể tải danh sách station");
    } finally {
      setLoadingStations(false);
    }
  };

  // ── GET /livesession với server-side filter + pagination ──
  const loadSessions = useCallback(
    async (status: FilterStatus, page: number) => {
      setLoadingSessions(true);
      try {
        const params: Parameters<
          typeof liveSessionApiService.getLiveSessions
        >[0] = {
          pageNumber: page,
          pageSize: PAGE_SIZE,
        };
        if (status !== "all") params.status = status;

        const result = await liveSessionApiService.getLiveSessions(params);
        setSessions(result.items);
        setTotalCount(result.totalCount);
        setTotalPages(result.totalPages);
        setCurrentPage(result.pageNumber);
      } catch {
        showError("Lỗi", "Không thể tải danh sách phiên phát sóng");
        setSessions([]);
      } finally {
        setLoadingSessions(false);
      }
    },
    [],
  );

  // Tải lại khi filter hoặc page thay đổi
  useEffect(() => {
    loadSessions(filter, currentPage);
  }, [filter, loadSessions]); // currentPage được điều khiển qua handlePageChange

  // Đổi filter → reset về trang 1
  const handleFilterChange = (newFilter: FilterStatus) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  // Phân trang
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadSessions(filter, page);
  };

  // Làm mới thủ công
  const handleRefresh = () => {
    loadSessions(filter, currentPage);
  };

  const loadHostUsers = async () => {
    setLoadingHosts(true);
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
      showError("Lỗi", "Không thể tải danh sách host");
    } finally {
      setLoadingHosts(false);
    }
  };

  useEffect(() => {
    if (showCreateModal) {
      loadHostUsers();
    }
  }, [showCreateModal]);

  const resetCreateForm = () => {
    setFormName("");
    setFormDesc("");
    // Reset host về item đầu tiên (nếu có), không để trống
    setFormHostUserId(hostUsers[0]?.id || "");
    // Giữ nguyên formStationId để UX thuận tiện hơn
  };

  const handleCreate = async () => {
    if (!formStationId || !formHostUserId || !formName.trim()) return;

    setCreating(true);
    try {
      // Gọi POST /api/v1/livesession
      await liveSessionApiService.createLiveSession({
        stationId: formStationId,
        hostUserId: formHostUserId,
        sessionName: formName.trim(),
        description: formDesc.trim() || undefined,
      });

      showSuccess("Tạo thành công!", `Phiên "${formName}" đã được tạo`);
      setShowCreateModal(false);
      resetCreateForm();
      // Reload trang hiện tại để thấy session mới
      await loadSessions(filter, 1);
      setCurrentPage(1);
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Không thể tạo phiên phát sóng";
      showError("Lỗi", message);
    } finally {
      setCreating(false);
    }
  };

  // ── Helpers ──
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
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
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

  const filterTabs: { label: string; value: FilterStatus }[] = [
    { label: "Tất cả", value: "all" },
    { label: "Chờ phát", value: "Created" },
    { label: "Đang phát", value: "Live" },
    { label: "Đã kết thúc", value: "Ended" },
  ];

  if (loadingStations) {
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
          <button
            className="lm-btn lm-btn--outline"
            onClick={handleRefresh}
            disabled={loadingSessions}
          >
            <RefreshCw size={15} className={loadingSessions ? "lm-spin" : ""} />
            Làm mới
          </button>
          <button
            className="lm-btn lm-btn--primary"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={15} />
            Tạo phiên mới
          </button>
        </div>
      </div>

      {/* Filter tabs — mỗi lần click gọi API server-side */}
      <div className="lm-filter-tabs">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            className={`lm-tab ${filter === tab.value ? "active" : ""}`}
            onClick={() => handleFilterChange(tab.value)}
            disabled={loadingSessions}
          >
            {tab.label}
            {/* Chỉ hiện tổng count khi tab đang active (lấy từ API) */}
            {filter === tab.value && totalCount > 0 && (
              <span className="lm-tab-count">{totalCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Session list — loading overlay thay vì block toàn trang */}
      <div style={{ position: "relative", minHeight: 200 }}>
        {loadingSessions && (
          <div
            className="lm-loading"
            style={{ position: "absolute", inset: 0, zIndex: 1 }}
          >
            <RefreshCw size={24} className="lm-spin" />
            <p>Đang tải...</p>
          </div>
        )}

        {!loadingSessions && sessions.length === 0 ? (
          <div className="lm-empty">
            <Disc3 size={48} />
            <p>Không có phiên phát sóng nào</p>
          </div>
        ) : (
          <div
            className="lm-grid"
            style={{ opacity: loadingSessions ? 0.4 : 1 }}
          >
            {sessions.map((session) => (
              <div className="lm-card" key={session.id}>
                <div className="lm-card-top">
                  {getStatusBadge(session.status)}
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
                    <span>
                      {formatDate(session.startedAt || session.createdAt)}
                    </span>
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
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="lm-pagination">
          <span className="lm-pagination-info">
            Trang {currentPage} / {totalPages} &nbsp;·&nbsp; {totalCount} phiên
          </span>
          <div className="lm-pagination-controls">
            <button
              className="lm-page-btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || loadingSessions}
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1,
              )
              .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1)
                  acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <span key={`ellipsis-${i}`} className="lm-page-ellipsis">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    className={`lm-page-btn ${currentPage === p ? "active" : ""}`}
                    onClick={() => handlePageChange(p as number)}
                    disabled={loadingSessions}
                  >
                    {p}
                  </button>
                ),
              )}
            <button
              className="lm-page-btn"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || loadingSessions}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div
          className="lm-modal-overlay"
          onClick={() => setShowCreateModal(false)}
        >
          <div className="lm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="lm-modal-header">
              <h3>Tạo phiên phát sóng mới</h3>
              <button
                className="lm-modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="lm-modal-body">
              {/* ── Station ── */}
              <label className="lm-label">Trạm phát sóng *</label>
              {stations.length === 0 ? (
                <p style={{ fontSize: 13, color: "#ef4444", marginBottom: 4 }}>
                  Chưa có station nào. Vui lòng đồng bộ trước.
                </p>
              ) : (
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
              )}

              {/* ── Host ── */}
              <label className="lm-label" style={{ marginTop: 16 }}>
                Host *
              </label>
              <select
                className="lm-select"
                value={formHostUserId}
                onChange={(e) => setFormHostUserId(e.target.value)}
                disabled={loadingHosts}
              >
                {loadingHosts ? (
                  <option value="">Đang tải danh sách host...</option>
                ) : (
                  <>
                    <option value="">-- Chọn host --</option>
                    {hostUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.firstName || u.lastName
                          ? `${u.firstName || ""} ${u.lastName || ""}`.trim()
                          : u.username}{" "}
                        ({u.email})
                      </option>
                    ))}
                  </>
                )}
              </select>
              {!loadingHosts && hostUsers.length === 0 && (
                <p style={{ fontSize: 12, color: "#f59e0b", marginTop: 4 }}>
                  Không tìm thấy host nào đang hoạt động.
                </p>
              )}

              {/* ── Tên phiên ── */}
              <label className="lm-label" style={{ marginTop: 16 }}>
                Tên phiên *
              </label>
              <input
                className="lm-input"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="VD: Chill Night Radio..."
                autoFocus
              />

              {/* ── Mô tả ── */}
              <label className="lm-label" style={{ marginTop: 16 }}>
                Mô tả (tuỳ chọn)
              </label>
              <textarea
                className="lm-textarea"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Mô tả ngắn cho phiên phát sóng..."
                rows={3}
              />
            </div>
            <div className="lm-modal-footer">
              <button
                className="lm-btn lm-btn--outline"
                onClick={() => setShowCreateModal(false)}
                disabled={creating}
              >
                Huỷ
              </button>
              <button
                className="lm-btn lm-btn--primary"
                onClick={handleCreate}
                disabled={
                  !formName.trim() ||
                  !formStationId ||
                  !formHostUserId ||
                  creating ||
                  loadingHosts
                }
              >
                {creating ? (
                  <>
                    <RefreshCw
                      size={14}
                      className="lm-spin"
                      style={{ marginRight: 6 }}
                    />
                    Đang tạo...
                  </>
                ) : (
                  "Tạo phiên"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LiveSessionsScreen;
