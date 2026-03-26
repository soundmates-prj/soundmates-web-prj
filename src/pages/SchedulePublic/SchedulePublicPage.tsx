import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Radio,
  RefreshCw,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { liveSessionApiService } from "../../services/liveSessionApiService";
import type { SessionScheduleResult } from "../../services/liveSessionApiService";
import "./SchedulePublicPage.css";

export default function SchedulePublicPage() {
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
      setSchedules(
        data.sort(
          (a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
        ),
      );
    } catch (err) {
      console.error("Failed to fetch schedules:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ── Helpers ── */
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

  const isLiveNow = (start: string, end: string) => {
    const now = new Date();
    return new Date(start) <= now && now <= new Date(end);
  };

  const isUpcoming = (start: string) => new Date(start) > new Date();
  const isPast = (end: string) => new Date(end) < new Date();

  const getStatusLabel = (start: string, end: string) => {
    if (isLiveNow(start, end)) return { label: "Đang phát", cls: "live" };
    if (isUpcoming(start)) return { label: "Sắp diễn ra", cls: "upcoming" };
    return { label: "Đã kết thúc", cls: "ended" };
  };

  /* Nhóm theo ngày */
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

  /* Ngày có lịch trong tháng đang xem */
  const scheduleDays = new Set(
    schedules
      .filter((s) => {
        const d = new Date(s.startTime);
        return (
          d.getFullYear() === currentMonth.getFullYear() &&
          d.getMonth() === currentMonth.getMonth()
        );
      })
      .map((s) => new Date(s.startTime).getDate()),
  );

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
                {
                  schedules.filter((s) => isLiveNow(s.startTime, s.endTime))
                    .length
                }
              </span>
              <span className="sp-stat-lbl">Đang phát</span>
            </div>
            <div className="sp-stat-divider" />
            <div className="sp-stat-item">
              <span className="sp-stat-num">
                {schedules.filter((s) => isUpcoming(s.startTime)).length}
              </span>
              <span className="sp-stat-lbl">Sắp diễn ra</span>
            </div>
            <div className="sp-stat-divider" />
            <div className="sp-stat-item">
              <span className="sp-stat-num sp-stat-num--ended">
                {schedules.filter((s) => isPast(s.endTime)).length}
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
                    {formatDateLabel(grouped[day][0].startTime)}
                    <span className="sp-day-count">
                      {grouped[day].length} lịch
                    </span>
                  </div>

                  {/* Items */}
                  <div className="sp-items">
                    {grouped[day].map((sch) => {
                      const status = getStatusLabel(sch.startTime, sch.endTime);
                      return (
                        <div
                          key={sch.id}
                          className={`sp-item sp-item--${status.cls}`}
                        >
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
                                <Radio size={16} />
                              </div>
                              <h4 className="sp-item-title">
                                {sch.title || "Phiên phát sóng"}
                              </h4>
                              <span
                                className={`sp-status sp-status--${status.cls}`}
                              >
                                {status.cls === "live" && (
                                  <span className="sp-live-dot" />
                                )}
                                {status.label}
                              </span>
                            </div>

                            <div className="sp-item-meta">
                              <span>
                                <Clock size={12} />
                                {formatTime(sch.startTime)} –{" "}
                                {formatTime(sch.endTime)}
                              </span>
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
