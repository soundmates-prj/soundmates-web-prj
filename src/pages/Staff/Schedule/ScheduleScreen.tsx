import { useState, useEffect } from "react";
import {
  Calendar,
  Plus,
  Clock,
  Radio,
  Trash2,
  RefreshCw,
  X,
  CalendarDays,
  Disc3,
  Pencil,
  Repeat,
  Search,
  Filter,
} from "lucide-react";
import { liveSessionApiService } from "../../../services/liveSessionApiService";
import type {
  SessionScheduleResult,
  LiveSessionResult,
} from "../../../services/liveSessionApiService";
import { showSuccess, showError } from "../../../components/common/toastUtils";
import { useConfirm } from "../../../context/ConfirmContext";
import "./ScheduleScreen.css";

// DaysOfWeek flags enum — must match backend LiveSessionService.Domain.Enums.DaysOfWeek
const DAYS_OF_WEEK = [
  { label: "T2", value: 1, day: 1 },
  { label: "T3", value: 2, day: 2 },
  { label: "T4", value: 4, day: 3 },
  { label: "T5", value: 8, day: 4 },
  { label: "T6", value: 16, day: 5 },
  { label: "T7", value: 32, day: 6 },
  { label: "CN", value: 64, day: 0 },
] as const;

const toDaysOfWeekFlags = (selected: number[]) =>
  selected.reduce((acc, v) => acc | v, 0);

export function ScheduleScreen() {
  // ── Data ──
  const [schedules, setSchedules] = useState<SessionScheduleResult[]>([]);
  const [sessions, setSessions] = useState<LiveSessionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const { confirm } = useConfirm();

  // ── Create modal ──
  const [showModal, setShowModal] = useState(false);
  const [formSessionId, setFormSessionId] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState(""); // "yyyy-MM-dd"
  const [formStartTime, setFormStartTime] = useState(""); // "HH:mm"
  const [formEndTime, setFormEndTime] = useState(""); // "HH:mm"
  const [formIsRecurring, setFormIsRecurring] = useState(false);
  const [formDaysOfWeek, setFormDaysOfWeek] = useState<number[]>([]);
  const [creating, setCreating] = useState(false);

  // ── Edit modal ──
  const [editTarget, setEditTarget] = useState<SessionScheduleResult | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editIsRecurring, setEditIsRecurring] = useState(false);
  const [editDaysOfWeek, setEditDaysOfWeek] = useState<number[]>([]);
  const [updating, setUpdating] = useState(false);

  // ── Delete ──
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Filters ──
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSessionId, setFilterSessionId] = useState("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "upcoming" | "live" | "ended">("all");

  /* ── Load schedules ── */
  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const [sessionsRes, schedulesRes] = await Promise.allSettled([
        liveSessionApiService.getLiveSessions({ pageSize: 100 }),
        liveSessionApiService.getSchedules(),
      ]);
      if (sessionsRes.status === "fulfilled") {
        const list = sessionsRes.value.items;
        setSessions(list);
        if (list.length > 0) setFormSessionId(list[0].id);
      }
      if (schedulesRes.status === "fulfilled") {
        setSchedules(schedulesRes.value);
      }
    } catch {
      showError("Lỗi", "Không thể tải dữ liệu lịch");
    } finally {
      setLoading(false);
    }
  };

  /* ── POST: Create ── */
  const handleCreate = async () => {
    if (!formSessionId || !formDate || !formStartTime || !formEndTime) return;

    // Backend expects: startTime "HH:mm:ss", startDate "yyyy-MM-dd"
    const startTime = `${formStartTime}:00`;
    const endTime = `${formEndTime}:00`;

    if (formStartTime >= formEndTime) {
      showError("Lỗi", "Giờ kết thúc phải sau giờ bắt đầu");
      return;
    }

    if (formIsRecurring && formDaysOfWeek.length === 0) {
      showError("Lỗi", "Vui lòng chọn ít nhất một ngày trong tuần");
      return;
    }

    setCreating(true);
    try {
      await liveSessionApiService.createSchedule(formSessionId, {
        startDate: formDate,
        endDate: undefined,
        startTime,
        endTime,
        title: formTitle.trim() || undefined,
        isRecurring: formIsRecurring,
        daysOfWeek: toDaysOfWeekFlags(formDaysOfWeek),
      });
      showSuccess("Tạo thành công!", "Lịch phát sóng đã được tạo");
      setShowModal(false);
      resetCreateForm();
      await loadSchedules();
    } catch (err: any) {
      showError("Lỗi", err?.response?.data?.message || "Không thể tạo lịch");
    } finally {
      setCreating(false);
    }
  };

  /* ── PUT: Open edit modal ── */
  const openEdit = (sch: SessionScheduleResult) => {
    setEditTarget(sch);
    setEditTitle(sch.title || "");

    // Backend returns DateOnly "yyyy-MM-dd" and TimeOnly "HH:mm:ss"
    setEditDate(sch.startDate);
    // TimeOnly "HH:mm:ss" → display as "HH:mm"
    setEditStartTime(sch.startTime.substring(0, 5));
    setEditEndTime(sch.endTime.substring(0, 5));

    setEditIsRecurring(sch.isRecurring);
    // Parse DaysOfWeek flags
    const selected: number[] = [];
    for (const d of DAYS_OF_WEEK) {
      if ((sch.daysOfWeek & d.value) !== 0) selected.push(d.value);
    }
    setEditDaysOfWeek(selected);
  };

  const handleUpdate = async () => {
    if (!editTarget || !editDate || !editStartTime || !editEndTime) return;

    const startTime = `${editStartTime}:00`;
    const endTime = `${editEndTime}:00`;

    if (editStartTime >= editEndTime) {
      showError("Lỗi", "Giờ kết thúc phải sau giờ bắt đầu");
      return;
    }

    if (editIsRecurring && editDaysOfWeek.length === 0) {
      showError("Lỗi", "Vui lòng chọn ít nhất một ngày trong tuần");
      return;
    }

    setUpdating(true);
    try {
      await liveSessionApiService.updateSchedule(editTarget.id, {
        startDate: editDate,
        endDate: undefined,
        startTime,
        endTime,
        title: editTitle.trim() || undefined,
        isRecurring: editIsRecurring,
        daysOfWeek: toDaysOfWeekFlags(editDaysOfWeek),
      });
      showSuccess("Cập nhật thành công!", "Lịch đã được cập nhật");
      setEditTarget(null);
      await loadSchedules();
    } catch (err: any) {
      showError("Lỗi", err?.response?.data?.message || "Không thể cập nhật lịch");
    } finally {
      setUpdating(false);
    }
  };

  /* ── DELETE ── */
  const handleDelete = async (id: string) => {
    const confirmed = await confirm("Bạn có chắc muốn xoá lịch này không?");
    if (!confirmed) return;

    setDeletingId(id);
    try {
      await liveSessionApiService.deleteSchedule(id);
      setSchedules((prev) => prev.filter((s) => s.id !== id));
      showSuccess("Đã xoá", "Lịch phát sóng đã được xoá");
    } catch {
      showError("Lỗi", "Không thể xoá lịch");
    } finally {
      setDeletingId(null);
    }
  };

  /* ── Helpers ── */
  const resetCreateForm = () => {
    setFormTitle("");
    setFormDate("");
    setFormStartTime("");
    setFormEndTime("");
    setFormIsRecurring(false);
    setFormDaysOfWeek([]);
  };

  // formatTime: backend sends TimeOnly "HH:mm:ss" → display "HH:mm"
  const formatTime = (timeOnly: string) =>
    timeOnly.substring(0, 5);

  // formatDateLabel: backend sends DateOnly "yyyy-MM-dd" → "Thứ X, dd/MM/yyyy"
  const formatDateLabel = (dateOnly: string) => {
    const d = new Date(dateOnly + "T00:00:00");
    const weekdays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    return `${weekdays[d.getDay()]}, ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  };

  const todayDate = new Date().toISOString().slice(0, 10);

  const getScheduleDateTime = (s: SessionScheduleResult, isEnd = false) =>
    new Date(`${s.startDate}T${isEnd ? s.endTime : s.startTime}`);

  const getScheduleStatus = (s: SessionScheduleResult): "upcoming" | "live" | "ended" => {
    const now = new Date();
    const start = getScheduleDateTime(s);
    const end = getScheduleDateTime(s, true);
    if (start <= now && now <= end) return "live";
    if (start > now) return "upcoming";
    return "ended";
  };

  const filteredSchedules = schedules.filter((s) => {
    const matchSearch =
      searchTerm.trim() === "" ||
      `${s.title || ""} ${s.liveSession?.sessionName || ""} ${s.liveSession?.station?.stationName || ""}`
        .toLowerCase()
        .includes(searchTerm.trim().toLowerCase());

    const matchSession =
      filterSessionId === "all" || s.liveSessionId === filterSessionId;

    const matchStatus =
      filterStatus === "all" || getScheduleStatus(s) === filterStatus;

    return matchSearch && matchSession && matchStatus;
  });

  // Group by startDate (DateOnly string)
  const grouped = filteredSchedules.reduce<Record<string, SessionScheduleResult[]>>(
    (acc, s) => {
      if (!acc[s.startDate]) acc[s.startDate] = [];
      acc[s.startDate].push(s);
      return acc;
    },
    {},
  );

  const totalLive = schedules.filter((s) => getScheduleStatus(s) === "live").length;
  const totalUpcoming = schedules.filter((s) => getScheduleStatus(s) === "upcoming").length;
  const totalEnded = schedules.filter((s) => getScheduleStatus(s) === "ended").length;

  const sortedDays = Object.keys(grouped).sort((a, b) =>
    a.localeCompare(b),
  );

  const toggleDay = (
    current: number[],
    value: number,
    setter: (v: number[]) => void,
  ) => {
    setter(
      current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value],
    );
  };

  return (
    <div className="sc-page">
      {/* Header */}
      <div className="sc-header">
        <div className="sc-header-left">
          <h1>Lịch phát sóng</h1>
          <p>Quản lý lịch trình tất cả các phiên phát sóng</p>
        </div>
        <div className="sc-header-actions">
          <button
            className="sc-btn sc-btn--outline"
            onClick={loadSchedules}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? "sc-spin" : ""} />
            Làm mới
          </button>
          <button
            className="sc-btn sc-btn--primary"
            onClick={() => setShowModal(true)}
            disabled={sessions.length === 0}
          >
            <Plus size={15} />
            Tạo lịch
          </button>
        </div>
      </div>

      {/* Summary + Filters */}
      {/* Summary + Filters */}
      <div className="sc-summary-row">
        <div className="sc-summary-card">
          <span className="sc-summary-label">Tổng lịch</span>
          <span className="sc-summary-value">{schedules.length}</span>
        </div>
        <div className="sc-summary-card sc-summary-card--live">
          <span className="sc-summary-label">Đang diễn ra</span>
          <span className="sc-summary-value">{totalLive}</span>
        </div>
        <div className="sc-summary-card">
          <span className="sc-summary-label">Sắp diễn ra</span>
          <span className="sc-summary-value">{totalUpcoming}</span>
        </div>
        <div className="sc-summary-card sc-summary-card--muted">
          <span className="sc-summary-label">Đã kết thúc</span>
          <span className="sc-summary-value">{totalEnded}</span>
        </div>
      </div>

      <div className="sc-filter-bar">
        <div className="sc-filter-search">
          <Search size={14} />
          <input
            className="sc-input"
            placeholder="Tìm theo tiêu đề, phiên, station..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="sc-filter-controls">
          <div className="sc-filter-item">
            <Filter size={13} />
            <select
              className="sc-select"
              value={filterSessionId}
              onChange={(e) => setFilterSessionId(e.target.value)}
            >
              <option value="all">Tất cả phiên</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.sessionName}
                </option>
              ))}
            </select>
          </div>

          <div className="sc-filter-item">
            <select
              className="sc-select"
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(e.target.value as "all" | "upcoming" | "live" | "ended")
              }
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="live">Đang diễn ra</option>
              <option value="upcoming">Sắp diễn ra</option>
              <option value="ended">Đã kết thúc</option>
            </select>
          </div>
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="sc-loading">
          <RefreshCw size={26} className="sc-spin" />
          <p>Đang tải...</p>
        </div>
      ) : sortedDays.length === 0 ? (
        <div className="sc-empty">
          <CalendarDays size={48} />
          <h3>Không có lịch phù hợp</h3>
          <p>Thử đổi bộ lọc hoặc từ khóa tìm kiếm</p>
        </div>
      ) : (
        <div className="sc-timeline">
          {sortedDays.map((day) => (
            <div key={day} className="sc-day-group">
              <div className="sc-day-label">
                <Calendar size={14} />
                <span>{formatDateLabel(day)}</span>
                <span className="sc-day-count">{grouped[day].length} lịch</span>
              </div>

              <div className="sc-items">
                {[...grouped[day]]
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((sch) => {
                    const status = getScheduleStatus(sch);
                    return (
                    <div className={`sc-item sc-item--${status}`} key={sch.id}>
                      <div className="sc-item-time">
                        <span className="sc-time-start">
                          {formatTime(sch.startTime)}
                        </span>
                        <div className="sc-time-line" />
                        <span className="sc-time-end">
                          {formatTime(sch.endTime)}
                        </span>
                      </div>

                      <div className="sc-item-body">
                        <div className="sc-item-top">
                          <div className="sc-item-title-wrap">
                            <h4 className="sc-item-title">
                              {sch.title ||
                                sch.liveSession?.sessionName ||
                                "Phiên phát sóng"}
                            </h4>
                            <span className={`sc-status-badge sc-status-badge--${status}`}>
                              {status === "live" ? "Đang diễn ra" : status === "upcoming" ? "Sắp diễn ra" : "Đã kết thúc"}
                            </span>
                          </div>
                          <div className="sc-item-actions">
                            {status !== "ended" && (
                              <button
                                className="sc-action-btn sc-action-btn--edit"
                                onClick={() => openEdit(sch)}
                                title="Chỉnh sửa"
                              >
                                <Pencil size={13} />
                              </button>
                            )}
                            <button
                              className="sc-action-btn sc-action-btn--delete"
                              onClick={() => handleDelete(sch.id)}
                              disabled={deletingId === sch.id}
                              title="Xoá lịch"
                            >
                              {deletingId === sch.id ? (
                                <RefreshCw size={13} className="sc-spin" />
                              ) : (
                                <Trash2 size={13} />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="sc-item-meta">
                          {sch.liveSession?.sessionName && (
                            <span className="sc-meta-chip sc-meta-chip--session">
                              <Disc3 size={12} />
                              {sch.liveSession.sessionName}
                            </span>
                          )}
                          {sch.liveSession?.station?.stationName && (
                            <span className="sc-meta-chip">
                              <Radio size={12} />
                              {sch.liveSession.station.stationName}
                            </span>
                          )}
                          <span className="sc-meta-chip">
                            <Clock size={12} />
                            {formatTime(sch.startTime)} – {formatTime(sch.endTime)}
                          </span>
                          {sch.isRecurring && (
                            <span className="sc-meta-chip sc-meta-chip--recurring">
                              <Repeat size={12} />
                              Lặp lại
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                  })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create Modal ── */}
      {showModal && (
        <div className="sc-overlay" onClick={() => setShowModal(false)}>
          <div className="sc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sc-modal-header">
              <div className="sc-modal-title">
                <CalendarDays size={20} />
                <h3>Tạo lịch phát sóng</h3>
              </div>
              <button className="sc-modal-close" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="sc-modal-body">
              <div className="sc-field">
                <label className="sc-label">Phiên phát sóng *</label>
                <select
                  className="sc-select"
                  value={formSessionId}
                  onChange={(e) => setFormSessionId(e.target.value)}
                >
                  <option value="">-- Chọn phiên --</option>
                  {sessions
                    .filter((s) => s.status === "Created")
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.sessionName}
                        {s.stationName ? ` — ${s.stationName}` : ""}
                      </option>
                    ))}
                </select>
              </div>

              <div className="sc-field">
                <label className="sc-label">Ngày *</label>
                <input
                  className="sc-input"
                  type="date"
                  value={formDate}
                  min={todayDate}
                  onChange={(e) => setFormDate(e.target.value)}
                />
              </div>

              <div className="sc-field-row">
                <div className="sc-field">
                  <label className="sc-label">Giờ bắt đầu *</label>
                  <input
                    className="sc-input"
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                  />
                </div>
                <div className="sc-field">
                  <label className="sc-label">Giờ kết thúc *</label>
                  <input
                    className="sc-input"
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="sc-field">
                <label className="sc-label">Tiêu đề lịch (tuỳ chọn)</label>
                <input
                  className="sc-input"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="VD: Buổi sáng thứ 2..."
                  autoFocus
                />
              </div>

              <div className="sc-field">
                <label className="sc-toggle-row">
                  <input
                    type="checkbox"
                    checked={formIsRecurring}
                    onChange={(e) => setFormIsRecurring(e.target.checked)}
                  />
                  <Repeat size={14} />
                  <span>Lặp lại hàng tuần</span>
                </label>
              </div>

              {formIsRecurring && (
                <div className="sc-field">
                  <label className="sc-label">Ngày trong tuần</label>
                  <div className="sc-days-grid">
                    {DAYS_OF_WEEK.map((d) => (
                      <button
                        key={d.value}
                        type="button"
                        className={`sc-day-btn ${formDaysOfWeek.includes(d.value) ? "active" : ""}`}
                        onClick={() =>
                          toggleDay(formDaysOfWeek, d.value, setFormDaysOfWeek)
                        }
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="sc-modal-footer">
              <button
                className="sc-btn sc-btn--outline"
                onClick={() => setShowModal(false)}
                disabled={creating}
              >
                Huỷ
              </button>
              <button
                className="sc-btn sc-btn--primary"
                onClick={handleCreate}
                disabled={
                  !formDate || !formStartTime || !formEndTime || creating
                }
              >
                {creating ? (
                  <><RefreshCw size={14} className="sc-spin" /> Đang tạo...</>
                ) : (
                  <><Disc3 size={14} /> Tạo lịch</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editTarget && (
        <div className="sc-overlay" onClick={() => setEditTarget(null)}>
          <div className="sc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sc-modal-header">
              <div className="sc-modal-title">
                <Pencil size={20} />
                <h3>Chỉnh sửa lịch</h3>
              </div>
              <button
                className="sc-modal-close"
                onClick={() => setEditTarget(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="sc-modal-body">
              <div className="sc-field">
                <label className="sc-label">Tiêu đề lịch</label>
                <input
                  className="sc-input"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="VD: Buổi sáng thứ 2..."
                  autoFocus
                />
              </div>

              <div className="sc-field">
                <label className="sc-label">Ngày *</label>
                <input
                  className="sc-input"
                  type="date"
                  value={editDate}
                  min={todayDate}
                  onChange={(e) => setEditDate(e.target.value)}
                />
              </div>

              <div className="sc-field-row">
                <div className="sc-field">
                  <label className="sc-label">Giờ bắt đầu *</label>
                  <input
                    className="sc-input"
                    type="time"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                  />
                </div>
                <div className="sc-field">
                  <label className="sc-label">Giờ kết thúc *</label>
                  <input
                    className="sc-input"
                    type="time"
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                  />
                </div>
              </div>

              {/* Recurring toggle */}
              <div className="sc-field">
                <label className="sc-toggle-row">
                  <input
                    type="checkbox"
                    checked={editIsRecurring}
                    onChange={(e) => setEditIsRecurring(e.target.checked)}
                  />
                  <Repeat size={14} />
                  <span>Lặp lại hàng tuần</span>
                </label>
              </div>

              {editIsRecurring && (
                <div className="sc-field">
                  <label className="sc-label">Ngày trong tuần</label>
                  <div className="sc-days-grid">
                    {DAYS_OF_WEEK.map((d) => (
                      <button
                        key={d.value}
                        type="button"
                        className={`sc-day-btn ${editDaysOfWeek.includes(d.value) ? "active" : ""}`}
                        onClick={() =>
                          toggleDay(editDaysOfWeek, d.value, setEditDaysOfWeek)
                        }
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="sc-modal-footer">
              <button
                className="sc-btn sc-btn--outline"
                onClick={() => setEditTarget(null)}
                disabled={updating}
              >
                Huỷ
              </button>
              <button
                className="sc-btn sc-btn--primary"
                onClick={handleUpdate}
                disabled={
                  !editDate || !editStartTime || !editEndTime || updating
                }
              >
                {updating ? (
                  <>
                    <RefreshCw size={14} className="sc-spin" /> Đang lưu...
                  </>
                ) : (
                  <>
                    <Pencil size={14} /> Lưu thay đổi
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScheduleScreen;
