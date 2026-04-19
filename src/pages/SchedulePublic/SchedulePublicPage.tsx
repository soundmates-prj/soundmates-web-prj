import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  Radio,
  RefreshCw,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Disc3,
  Play,
  Tag,
} from "lucide-react";
import { liveSessionApiService } from "../../services/liveSessionApiService";
import type { SessionScheduleResult } from "../../services/liveSessionApiService";
import { showToast } from "../../utils/toast";
import "./SchedulePublicPage.css";

export default function SchedulePublicPage() {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<SessionScheduleResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  /* ── Fetch tất cả lịch từ GET /api/v1/schedule ── */
  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const data = await liveSessionApiService.getSchedules();
      // Sort by startDate + startTime (both DateOnly/TimeOnly strings, sortable lexicographically)
      setSchedules(
        [...data].sort((a, b) => {
          const aKey = `${a.startDate}${a.startTime}`;
          const bKey = `${b.startDate}${b.startTime}`;
          return aKey.localeCompare(bKey);
        }),
      );
    } catch (err) {
      console.error("Failed to fetch schedules:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ── Helpers ── */
  // Format TimeOnly "HH:mm:ss" → "HH:mm"
  const formatTime = (timeOnly: string) => timeOnly.substring(0, 5);

  // Format DateOnly "yyyy-MM-dd" → "Thứ X, dd/MM/yyyy"
  const formatDateLabel = (dateOnly: string) => {
    const d = new Date(dateOnly + "T00:00:00");
    const weekdays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    return `${weekdays[d.getDay()]}, ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  };

  // Compute a full Date for a schedule occurrence
  const scheduleDate = (sch: SessionScheduleResult): Date => {
    return new Date(`${sch.startDate}T${sch.startTime}`);
  };

  // Check if schedule is live right now (based on liveSession status OR time overlap)
  const isLiveNow = (sch: SessionScheduleResult) => {
    if (sch.liveSession?.status === "Live") return true;
    if (sch.liveSession?.status !== "Scheduled") return false;
    const start = scheduleDate(sch);
    const end = new Date(`${sch.startDate}T${sch.endTime}`);
    const now = new Date();
    return start <= now && now <= end;
  };

  const isUpcoming = (sch: SessionScheduleResult) =>
    scheduleDate(sch) > new Date();

  const isPast = (sch: SessionScheduleResult) => {
    const end = new Date(`${sch.startDate}T${sch.endTime}`);
    return end < new Date();
  };

  const getStatusLabel = (sch: SessionScheduleResult) => {
    if (isLiveNow(sch)) return { label: "Đang phát", cls: "live" as const };
    if (isUpcoming(sch))
      return { label: "Sắp diễn ra", cls: "upcoming" as const };
    return { label: "Đã kết thúc", cls: "ended" as const };
  };

  /* Nhóm theo startDate (DateOnly string) */
  const grouped = schedules.reduce<Record<string, SessionScheduleResult[]>>(
    (acc, s) => {
      if (!acc[s.startDate]) acc[s.startDate] = [];
      acc[s.startDate].push(s);
      return acc;
    },
    {},
  );

  const sortedDays = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

  /* Phân trang tháng */
  const prevMonth = () =>
    setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () =>
    setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0,
  ).getDate();
  const firstDayOfWeek = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1,
  ).getDay();

  /* Ngày có lịch trong tháng đang xem — dùng startDate */
  const scheduleDays = new Set(
    schedules
      .filter((s) => {
        const d = new Date(s.startDate + "T00:00:00");
        return (
          d.getFullYear() === currentMonth.getFullYear() &&
          d.getMonth() === currentMonth.getMonth()
        );
      })
      .map((s) => new Date(s.startDate + "T00:00:00").getDate()),
  );

  /* Live schedule for hero highlight */
  const liveSchedules = schedules.filter(isLiveNow);

  /* ── Render ── */
  return (
    <div className="sp-page">
      {/* Hero */}
      <div className="sp-hero">
        <div className="sp-hero-bg" />
        <div className="sp-hero-inner">
          <span className="sp-hero-badge">
            <Calendar size={13} /> Lịch phát sóng
          </span>
          <h1 className="sp-hero-title">Lịch Live SoundMates</h1>
          <p className="sp-hero-sub">
            Theo dõi tất cả các phiên phát sóng trực tiếp sắp diễn ra
          </p>
          {liveSchedules.length > 0 && (
            <div className="sp-live-badge-row">
              {liveSchedules.slice(0, 3).map((sch) => (
                <div key={sch.id} className="sp-live-badge">
                  <span className="sp-hero-live-dot" />
                  <span className="sp-live-name">
                    {sch.liveSession?.sessionName ||
                      sch.title ||
                      "Phiên đang phát"}
                  </span>
                  {sch.liveSession?.station?.stationName && (
                    <span className="sp-live-station">
                      <Radio size={10} />
                      {sch.liveSession.station.stationName}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="sp-layout">
        {/* Calendar mini */}
        <aside className="sp-sidebar">
          <div className="sp-cal-card">
            <div className="sp-cal-nav">
              <button className="sp-cal-btn" onClick={prevMonth}>
                <ChevronLeft size={16} />
              </button>
              <span className="sp-cal-month">
                {currentMonth.toLocaleDateString("vi-VN", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <button className="sp-cal-btn" onClick={nextMonth}>
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="sp-cal-grid">
              {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((d) => (
                <div key={d} className="sp-cal-weekday">
                  {d}
                </div>
              ))}

              {/* Empty cells */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`e-${i}`} />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(
                (day) => {
                  const isToday =
                    day === new Date().getDate() &&
                    currentMonth.getMonth() === new Date().getMonth() &&
                    currentMonth.getFullYear() === new Date().getFullYear();
                  const hasSchedule = scheduleDays.has(day);
                  return (
                    <div
                      key={day}
                      className={`sp-cal-day ${isToday ? "today" : ""} ${hasSchedule ? "has-event" : ""}`}
                    >
                      {day}
                      {hasSchedule && <span className="sp-cal-dot" />}
                    </div>
                  );
                },
              )}
            </div>

            <div className="sp-cal-legend">
              <span className="sp-cal-legend-dot" /> Có lịch phát sóng
            </div>
          </div>

          {/* Stats */}
          <div className="sp-stat-card">
            <div className="sp-stat-item">
              <span className="sp-stat-num sp-stat-num--live">
                {schedules.filter(isLiveNow).length}
              </span>
              <span className="sp-stat-lbl">Đang phát</span>
            </div>
            <div className="sp-stat-divider" />
            <div className="sp-stat-item">
              <span className="sp-stat-num">
                {schedules.filter(isUpcoming).length}
              </span>
              <span className="sp-stat-lbl">Sắp diễn ra</span>
            </div>
            <div className="sp-stat-divider" />
            <div className="sp-stat-item">
              <span className="sp-stat-num sp-stat-num--ended">
                {schedules.filter(isPast).length}
              </span>
              <span className="sp-stat-lbl">Đã kết thúc</span>
            </div>
          </div>
        </aside>

        {/* Timeline */}
        <main className="sp-main">
          <div className="sp-toolbar">
            <span className="sp-toolbar-info">
              {loading ? "Đang tải..." : `${schedules.length} lịch phát sóng`}
            </span>
            <button
              className="sp-refresh-btn"
              onClick={fetchSchedules}
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? "sp-spin" : ""} />
              Làm mới
            </button>
          </div>

          {loading ? (
            <div className="sp-loading">
              <RefreshCw size={26} className="sp-spin" />
              <p>Đang tải lịch phát sóng...</p>
            </div>
          ) : schedules.length === 0 ? (
            <div className="sp-empty">
              <CalendarDays size={44} />
              <h3>Chưa có lịch phát sóng</h3>
              <p>Các lịch phát sóng sẽ xuất hiện ở đây khi được tạo</p>
            </div>
          ) : (
            <div className="sp-timeline">
              {sortedDays.map((day) => (
                <div key={day} className="sp-day-group">
                  {/* Day label */}
                  <div className="sp-day-label">
                    <Calendar size={13} />
                    {formatDateLabel(day)}
                    <span className="sp-day-count">
                      {grouped[day].length} lịch
                    </span>
                  </div>

                  {/* Items */}
                  <div className="sp-items">
                    {grouped[day].map((sch) => {
                      const status = getStatusLabel(sch);
                      const isLive = status.cls === "live";
                      return (
                        <div
                          key={sch.id}
                          className={`sp-item sp-item--${status.cls}`}
                        >
                          {/* Thumbnail */}
                          {sch.liveSession?.thumbnailUrl && (
                            <div className="sp-item-thumb">
                              <img
                                src={sch.liveSession.thumbnailUrl}
                                alt={sch.liveSession.sessionName}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display =
                                    "none";
                                }}
                              />
                            </div>
                          )}

                          {/* Time strip */}
                          <div className="sp-item-time">
                            <span className="sp-time-start">
                              {formatTime(sch.startTime)}
                            </span>
                            <div className="sp-time-line" />
                            <span className="sp-time-end">
                              {formatTime(sch.endTime)}
                            </span>
                          </div>

                          {/* Content */}
                          <div className="sp-item-body">
                            <div className="sp-item-top">
                              <div className="sp-item-icon">
                                {isLive ? (
                                  <Play size={16} />
                                ) : (
                                  <Radio size={16} />
                                )}
                              </div>
                              <h4 className="sp-item-title">
                                {sch.title ||
                                  sch.liveSession?.sessionName ||
                                  "Phiên phát sóng"}
                              </h4>
                              <span
                                className={`sp-status sp-status--${status.cls}`}
                              >
                                {isLive && <span className="sp-live-dot" />}
                                {status.label}
                              </span>
                            </div>

                            {/* Session + Station info */}
                            <div className="sp-item-session">
                              {sch.liveSession?.sessionName && sch.title && (
                                <span className="sp-session-chip">
                                  <Disc3 size={11} />
                                  {sch.liveSession.sessionName}
                                </span>
                              )}
                              {sch.liveSession?.station?.stationName && (
                                <span className="sp-station-chip">
                                  <Radio size={11} />
                                  {sch.liveSession.station.stationName}
                                </span>
                              )}
                              {sch.liveSession?.genre && (
                                <span className="sp-genre-chip">
                                  <Tag size={11} />
                                  {sch.liveSession.genre}
                                </span>
                              )}
                            </div>

                            <div className="sp-item-meta">
                              <span>
                                <Clock size={12} />
                                {formatTime(sch.startTime)} –{" "}
                                {formatTime(sch.endTime)}
                              </span>
                              <button
                                className="sp-listen-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isLive) {
                                    const sid = sch.liveSession?.id || sch.id;
                                    void navigate(`/live/${sid}`);
                                  } else if (isPast(sch)) {
                                    showToast.warning("Live Stream đã kết thúc");
                                  } else {
                                    showToast.warning("Live Stream chưa phát");
                                  }
                                }}
                              >
                                <Play size={11} />
                                Nghe trực tiếp
                              </button>
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
        </main>
      </div>
    </div>
  );
}
