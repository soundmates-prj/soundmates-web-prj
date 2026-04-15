import { useState, useEffect } from "react";
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
import "./SchedulePublicPage.css";

const WEEKDAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

type StatusClass = "live" | "upcoming" | "ended";

export default function SchedulePublicPage() {
  const [schedules, setSchedules] = useState<SessionScheduleResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const data = await liveSessionApiService.getSchedules();
      // startDate (DateOnly) + startTime (TimeOnly) là chuỗi ISO-like nên so sánh
      // lexicographical = so sánh theo thứ tự thời gian, không cần parse Date.
      setSchedules(
        [...data].sort((a, b) =>
          `${a.startDate}${a.startTime}`.localeCompare(
            `${b.startDate}${b.startTime}`,
          ),
        ),
      );
    } catch (err) {
      console.error("Failed to fetch schedules:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ── Formatters ─────────────────────────────────────────── */
  const formatTime = (timeOnly: string) => timeOnly.substring(0, 5);

  const formatDateLabel = (dateOnly: string) => {
    const d = new Date(`${dateOnly}T00:00:00`);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${WEEKDAY_LABELS[d.getDay()]}, ${dd}/${mm}/${d.getFullYear()}`;
  };

  /* ── Status helpers ─────────────────────────────────────── */
  const scheduleStart = (sch: SessionScheduleResult) =>
    new Date(`${sch.startDate}T${sch.startTime}`);
  const scheduleEnd = (sch: SessionScheduleResult) =>
    new Date(`${sch.startDate}T${sch.endTime}`);

  // "Live" khi BE đã mark Live, hoặc BE mark Scheduled nhưng hiện tại rơi vào
  // khung giờ phát — tránh hiển thị Live cho phiên đã Cancel/Ended.
  const isLiveNow = (sch: SessionScheduleResult) => {
    if (sch.liveSession?.status === "Live") return true;
    if (sch.liveSession?.status !== "Scheduled") return false;
    const now = new Date();
    return scheduleStart(sch) <= now && now <= scheduleEnd(sch);
  };

  const isUpcoming = (sch: SessionScheduleResult) =>
    scheduleStart(sch) > new Date();
  const isPast = (sch: SessionScheduleResult) => scheduleEnd(sch) < new Date();

  const getStatus = (
    sch: SessionScheduleResult,
  ): { label: string; cls: StatusClass } => {
    if (isLiveNow(sch)) return { label: "Đang phát", cls: "live" };
    if (isUpcoming(sch)) return { label: "Sắp diễn ra", cls: "upcoming" };
    return { label: "Đã kết thúc", cls: "ended" };
  };

  /* ── Derived data ───────────────────────────────────────── */
  const grouped = schedules.reduce<Record<string, SessionScheduleResult[]>>(
    (acc, s) => {
      (acc[s.startDate] ||= []).push(s);
      return acc;
    },
    {},
  );
  const sortedDays = Object.keys(grouped).sort((a, b) => a.localeCompare(b));
  const liveSchedules = schedules.filter(isLiveNow);

  /* ── Mini calendar ──────────────────────────────────────── */
  const prevMonth = () =>
    setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () =>
    setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  // Chỉ lấy ngày có schedule thuộc đúng tháng đang xem để chấm dot trên lịch
  const scheduleDays = new Set(
    schedules
      .filter((s) => {
        const d = new Date(`${s.startDate}T00:00:00`);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .map((s) => new Date(`${s.startDate}T00:00:00`).getDate()),
  );

  const today = new Date();
  const isToday = (day: number) =>
    day === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div className="sp-page">
      <Hero liveSchedules={liveSchedules} />

      <div className="sp-layout">
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
              {WEEKDAY_LABELS.map((d) => (
                <div key={d} className="sp-cal-weekday">
                  {d}
                </div>
              ))}

              {/* Padding ô trống trước ngày 1 để ngày đầu tháng thẳng cột weekday */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`e-${i}`} />
              ))}

              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(
                (day) => {
                  const hasEvent = scheduleDays.has(day);
                  return (
                    <div
                      key={day}
                      className={`sp-cal-day ${isToday(day) ? "today" : ""} ${hasEvent ? "has-event" : ""}`}
                    >
                      {day}
                      {hasEvent && <span className="sp-cal-dot" />}
                    </div>
                  );
                },
              )}
            </div>

            <div className="sp-cal-legend">
              <span className="sp-cal-legend-dot" /> Có lịch phát sóng
            </div>
          </div>

          <div className="sp-stat-card">
            <Stat
              value={schedules.filter(isLiveNow).length}
              label="Đang phát"
              variant="live"
            />
            <div className="sp-stat-divider" />
            <Stat
              value={schedules.filter(isUpcoming).length}
              label="Sắp diễn ra"
            />
            <div className="sp-stat-divider" />
            <Stat
              value={schedules.filter(isPast).length}
              label="Đã kết thúc"
              variant="ended"
            />
          </div>
        </aside>

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
                  <div className="sp-day-label">
                    <Calendar size={13} />
                    {formatDateLabel(day)}
                    <span className="sp-day-count">
                      {grouped[day].length} lịch
                    </span>
                  </div>

                  <div className="sp-items">
                    {grouped[day].map((sch) => (
                      <ScheduleItem
                        key={sch.id}
                        schedule={sch}
                        status={getStatus(sch)}
                        formatTime={formatTime}
                      />
                    ))}
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

/* ── Sub-components ──────────────────────────────────────── */

function Hero({ liveSchedules }: { liveSchedules: SessionScheduleResult[] }) {
  return (
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
            {/* Giới hạn 3 badge để hero không tràn khi nhiều phiên Live cùng lúc */}
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
  );
}

function Stat({
  value,
  label,
  variant,
}: {
  value: number;
  label: string;
  variant?: "live" | "ended";
}) {
  const modifier = variant ? `sp-stat-num--${variant}` : "";
  return (
    <div className="sp-stat-item">
      <span className={`sp-stat-num ${modifier}`}>{value}</span>
      <span className="sp-stat-lbl">{label}</span>
    </div>
  );
}

function ScheduleItem({
  schedule: sch,
  status,
  formatTime,
}: {
  schedule: SessionScheduleResult;
  status: { label: string; cls: StatusClass };
  formatTime: (t: string) => string;
}) {
  const isLive = status.cls === "live";
  const session = sch.liveSession;

  return (
    <div className={`sp-item sp-item--${status.cls}`}>
      {session?.thumbnailUrl && (
        <div className="sp-item-thumb">
          <img
            src={session.thumbnailUrl}
            alt={session.sessionName}
            // Ẩn hẳn thumb khi ảnh vỡ để không tạo khoảng trống trong layout
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}

      <div className="sp-item-time">
        <span className="sp-time-start">{formatTime(sch.startTime)}</span>
        <div className="sp-time-line" />
        <span className="sp-time-end">{formatTime(sch.endTime)}</span>
      </div>

      <div className="sp-item-body">
        <div className="sp-item-top">
          <div className="sp-item-icon">
            {isLive ? <Play size={16} /> : <Radio size={16} />}
          </div>
          <h4 className="sp-item-title">
            {sch.title || session?.sessionName || "Phiên phát sóng"}
          </h4>
          <span className={`sp-status sp-status--${status.cls}`}>
            {isLive && <span className="sp-live-dot" />}
            {status.label}
          </span>
        </div>

        <div className="sp-item-session">
          {/* Chỉ show sessionName khi title đã chiếm chỗ — tránh trùng lặp */}
          {session?.sessionName && sch.title && (
            <Chip className="sp-session-chip" icon={<Disc3 size={11} />}>
              {session.sessionName}
            </Chip>
          )}
          {session?.station?.stationName && (
            <Chip className="sp-station-chip" icon={<Radio size={11} />}>
              {session.station.stationName}
            </Chip>
          )}
          {session?.genre && (
            <Chip className="sp-genre-chip" icon={<Tag size={11} />}>
              {session.genre}
            </Chip>
          )}
        </div>

        <div className="sp-item-meta">
          <span>
            <Clock size={12} />
            {formatTime(sch.startTime)} – {formatTime(sch.endTime)}
          </span>
          {session?.station?.publicPlayerUrl && (
            <a
              href={session.station.publicPlayerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="sp-listen-btn"
              onClick={(e) => e.stopPropagation()}
            >
              <Play size={11} />
              Nghe trực tiếp
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function Chip({
  className,
  icon,
  children,
}: {
  className: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className={className}>
      {icon}
      {children}
    </span>
  );
}
