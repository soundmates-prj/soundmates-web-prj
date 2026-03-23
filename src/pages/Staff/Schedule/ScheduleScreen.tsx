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
} from "lucide-react";
import { liveSessionApiService } from "../../../services/liveSessionApiService";
import type {
  SessionScheduleResult,
  LiveSessionResult,
} from "../../../services/liveSessionApiService";
import { showSuccess, showError } from "../../../components/common/toastUtils";
import "./ScheduleScreen.css";

export function ScheduleScreen() {
  // ── Data ──
  const [schedules, setSchedules] = useState<SessionScheduleResult[]>([]);
  const [sessions, setSessions] = useState<LiveSessionResult[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Create modal ──
  const [showModal, setShowModal] = useState(false);
  const [formSessionId, setFormSessionId] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formStartTime, setFormStartTime] = useState("");
  const [formEndTime, setFormEndTime] = useState("");
  const [creating, setCreating] = useState(false);

  // ── Edit modal ──
  const [editTarget, setEditTarget] = useState<SessionScheduleResult | null>(
    null,
  );
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [updating, setUpdating] = useState(false);

  // ── Delete ──
  const [deletingId, setDeletingId] = useState<string | null>(null);

  /* ── Load all ── */
  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
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
      if (schedulesRes.status === "fulfilled") setSchedules(schedulesRes.value);
    } catch {
      showError("Lỗi", "Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  const reloadSchedules = async () => {
    try {
      const data = await liveSessionApiService.getSchedules();
      setSchedules(data);
    } catch {
      showError("Lỗi", "Không thể làm mới lịch");
    }
  };

  /* ── POST: Create ── */
  const handleCreate = async () => {
    if (!formSessionId || !formDate || !formStartTime || !formEndTime) return;
    const startTime = new Date(`${formDate}T${formStartTime}:00`).toISOString();
    const endTime = new Date(`${formDate}T${formEndTime}:00`).toISOString();
    if (new Date(endTime) <= new Date(startTime)) {
      showError("Lỗi", "Giờ kết thúc phải sau giờ bắt đầu");
      return;
    }
    setCreating(true);
    try {
      await liveSessionApiService.createSchedule(formSessionId, {
        startTime,
        endTime,
        title: formTitle.trim() || undefined,
      });
      showSuccess("Tạo thành công!", "Lịch phát sóng đã được tạo");
      setShowModal(false);
      resetCreateForm();
      await reloadSchedules();
    } catch (err: any) {
      showError("Lỗi", err?.response?.data?.message || "Không thể tạo lịch");
    } finally {
      setCreating(false);
    }
  };

  /* ── PUT: Open edit modal ── */
  const openEdit = (sch: SessionScheduleResult) => {
    setEditTarget(sch);
    const start = new Date(sch.startTime);
    const end = new Date(sch.endTime);
    setEditTitle(sch.title || "");
    setEditDate(start.toISOString().slice(0, 10));
    setEditStartTime(
      `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`,
    );
    setEditEndTime(
      `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`,
    );
  };

  const handleUpdate = async () => {
    if (!editTarget || !editDate || !editStartTime || !editEndTime) return;
    const startTime = new Date(`${editDate}T${editStartTime}:00`).toISOString();
    const endTime = new Date(`${editDate}T${editEndTime}:00`).toISOString();
    if (new Date(endTime) <= new Date(startTime)) {
      showError("Lỗi", "Giờ kết thúc phải sau giờ bắt đầu");
      return;
    }
    setUpdating(true);
    try {
      await liveSessionApiService.updateSchedule(editTarget.id, {
        startTime,
        endTime,
        title: editTitle.trim() || undefined,
      });
      showSuccess("Cập nhật thành công!", "Lịch đã được cập nhật");
      setEditTarget(null);
      await reloadSchedules();
    } catch (err: any) {
      showError(
        "Lỗi",
        err?.response?.data?.message || "Không thể cập nhật lịch",
      );
    } finally {
      setUpdating(false);
    }
  };

  /* ── DELETE ── */
  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Bạn có chắc muốn xoá lịch này không?");
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
    setFormSessionId(sessions[0]?.id || "");
  };

  const getSessionName = (id: string) =>
    sessions.find((s) => s.id === id)?.sessionName ?? "—";

  const getSessionStation = (id: string) =>
    sessions.find((s) => s.id === id)?.stationName ?? null;

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatDateLabel = (iso: string) =>
    new Date(iso).toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const todayDate = new Date().toISOString().slice(0, 10);

  const grouped = schedules.reduce<Record<string, SessionScheduleResult[]>>(
    (acc, s) => {
      const day = new Date(s.startTime).toDateString();
      if (!acc[day]) acc[day] = [];
      acc[day].push(s);
      return acc;
    },
    {},
  );

  const sortedDays = Object.keys(grouped).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime(),
  );

  /* ── Render ── */
  return (
    <div className="sc-page">
      {/* Header */}
      <div className="sc-header">
        <div className="sc-header-left">
          <h1>Lịch phát sóng</h1>
          <p>Tổng hợp lịch trình tất cả các phiên live</p>
        </div>
        <div className="sc-header-actions">
          <button
            className="sc-btn sc-btn--outline"
            onClick={loadAll}
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

      {/* Body */}
      {loading ? (
        <div className="sc-loading">
          <RefreshCw size={26} className="sc-spin" />
          <p>Đang tải...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="sc-empty">
          <CalendarDays size={48} />
          <p>Chưa có phiên phát sóng nào. Hãy tạo phiên trước.</p>
        </div>
      ) : sortedDays.length === 0 ? (
        <div className="sc-empty">
          <CalendarDays size={48} />
          <p>Chưa có lịch phát sóng nào</p>
          <button
            className="sc-btn sc-btn--primary"
            onClick={() => setShowModal(true)}
          >
            <Plus size={14} /> Tạo lịch đầu tiên
          </button>
        </div>
      ) : (
        <div className="sc-timeline">
          {sortedDays.map((day) => (
            <div key={day} className="sc-day-group">
              <div className="sc-day-label">
                <Calendar size={14} />
                <span>{formatDateLabel(grouped[day][0].startTime)}</span>
                <span className="sc-day-count">{grouped[day].length} lịch</span>
              </div>

              <div className="sc-items">
                {[...grouped[day]]
                  .sort(
                    (a, b) =>
                      new Date(a.startTime).getTime() -
                      new Date(b.startTime).getTime(),
                  )
                  .map((sch) => (
                    <div className="sc-item" key={sch.id}>
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
                          <h4 className="sc-item-title">
                            {sch.title || getSessionName(sch.liveSessionId)}
                          </h4>
                          <div className="sc-item-actions">
                            <button
                              className="sc-action-btn sc-action-btn--edit"
                              onClick={() => openEdit(sch)}
                              title="Chỉnh sửa"
                            >
                              <Pencil size={13} />
                            </button>
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
                          <span className="sc-meta-chip sc-meta-chip--session">
                            <Disc3 size={12} />
                            {getSessionName(sch.liveSessionId)}
                          </span>
                          {getSessionStation(sch.liveSessionId) && (
                            <span className="sc-meta-chip">
                              <Radio size={12} />
                              {getSessionStation(sch.liveSessionId)}
                            </span>
                          )}
                          <span className="sc-meta-chip">
                            <Clock size={12} />
                            {formatTime(sch.startTime)} –{" "}
                            {formatTime(sch.endTime)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
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
              <button
                className="sc-modal-close"
                onClick={() => setShowModal(false)}
              >
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
                  !formSessionId ||
                  !formDate ||
                  !formStartTime ||
                  !formEndTime ||
                  creating
                }
              >
                {creating ? (
                  <>
                    <RefreshCw size={14} className="sc-spin" /> Đang tạo...
                  </>
                ) : (
                  <>
                    <Disc3 size={14} /> Tạo lịch
                  </>
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
                <label className="sc-label">Tiêu đề lịch (tuỳ chọn)</label>
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
