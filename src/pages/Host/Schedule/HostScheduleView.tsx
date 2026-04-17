import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Radio,
  RefreshCw,
  Search,
  Filter,
  Disc3,
  Repeat,
  Eye,
} from "lucide-react";
import { liveSessionApiService } from "../../../services/liveSessionApiService";
import type { SessionScheduleResult } from "../../../services/liveSessionApiService";
import "./HostScheduleView.css";

const DAYS_OF_WEEK = [
  { label: "T2", value: 1 },
  { label: "T3", value: 2 },
  { label: "T4", value: 4 },
  { label: "T5", value: 8 },
  { label: "T6", value: 16 },
  { label: "T7", value: 32 },
  { label: "CN", value: 64 },
];

export function HostScheduleView() {
  const [schedules, setSchedules] = useState<SessionScheduleResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "upcoming" | "live" | "ended">("all");
  const [selectedSchedule, setSelectedSchedule] = useState<SessionScheduleResult | null>(null);

  useEffect(() => { loadSchedules(); }, []);

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const data = await liveSessionApiService.getSchedules();
      setSchedules(data);
    } catch {
      console.error("Không thể tải lịch");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (t: string) => t.substring(0, 5);

  const formatDateLabel = (dateOnly: string) => {
    const d = new Date(dateOnly + "T00:00:00");
    const weekdays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    return `${weekdays[d.getDay()]}, ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  };

  const getStatus = (s: SessionScheduleResult): "upcoming" | "live" | "ended" => {
    const now = new Date();
    const start = new Date(`${s.startDate}T${s.startTime}`);
    const end = new Date(`${s.startDate}T${s.endTime}`);
    
    if (end < start) {
      end.setDate(end.getDate() + 1);
    }
    
    if (start <= now && now <= end) return "live";
    if (start > now) return "upcoming";
    return "ended";
  };

  const filtered = schedules.filter((s) => {
    const matchSearch = searchTerm.trim() === "" ||
      `${s.title || ""} ${s.liveSession?.sessionName || ""}`.toLowerCase().includes(searchTerm.trim().toLowerCase());
    const matchStatus = filterStatus === "all" || getStatus(s) === filterStatus;
    return matchSearch && matchStatus;
  });

  const grouped = filtered.reduce<Record<string, SessionScheduleResult[]>>((acc, s) => {
    if (!acc[s.startDate]) acc[s.startDate] = [];
    acc[s.startDate].push(s);
    return acc;
  }, {});

  const totalLive = schedules.filter((s) => getStatus(s) === "live").length;
  const totalUpcoming = schedules.filter((s) => getStatus(s) === "upcoming").length;
  const sortedDays = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

  const getDaysOfWeekLabel = (flags: number) => {
    const days: string[] = [];
    for (const d of DAYS_OF_WEEK) {
      if ((flags & d.value) !== 0) days.push(d.label);
    }
    return days.join(", ");
  };

  return (
    <div className="host-sv-page">
      {/* Header */}
      <div className="host-sv-header">
        <div>
          <h1>Lịch trình phát sóng</h1>
          <p>Xem lịch phát sóng được phân công cho bạn</p>
        </div>
        <button className="host-sv-btn host-sv-btn--outline" onClick={loadSchedules} disabled={loading}>
          <RefreshCw size={15} className={loading ? "host-sv-spin" : ""} />
          Làm mới
        </button>
      </div>

      {/* Summary */}
      <div className="host-sv-summary-row">
        <div className="host-sv-summary-card">
          <span className="host-sv-summary-label">Tổng lịch</span>
          <span className="host-sv-summary-value">{schedules.length}</span>
        </div>
        <div className="host-sv-summary-card host-sv-summary-card--live">
          <span className="host-sv-summary-label">Đang diễn ra</span>
          <span className="host-sv-summary-value">{totalLive}</span>
        </div>
        <div className="host-sv-summary-card">
          <span className="host-sv-summary-label">Sắp diễn ra</span>
          <span className="host-sv-summary-value">{totalUpcoming}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="host-sv-filter-bar">
        <div className="host-sv-filter-search">
          <Search size={14} />
          <input
            className="host-sv-input"
            placeholder="Tìm theo tiêu đề, phiên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="host-sv-filter-controls">
          <select
            className="host-sv-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="live">Đang diễn ra</option>
            <option value="upcoming">Sắp diễn ra</option>
            <option value="ended">Đã kết thúc</option>
          </select>
        </div>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="host-sv-loading">
          <RefreshCw size={26} className="host-sv-spin" />
          <p>Đang tải lịch...</p>
        </div>
      ) : sortedDays.length === 0 ? (
        <div className="host-sv-empty">
          <Calendar size={48} />
          <h3>Không có lịch phù hợp</h3>
          <p>Thử đổi bộ lọc hoặc từ khóa tìm kiếm</p>
        </div>
      ) : (
        <div className="host-sv-timeline">
          {sortedDays.map((day) => (
            <div key={day} className="host-sv-day-group">
              <div className="host-sv-day-label">
                <Calendar size={14} />
                <span>{formatDateLabel(day)}</span>
                <span className="host-sv-day-count">{grouped[day].length} lịch</span>
              </div>

              <div className="host-sv-items">
                {[...grouped[day]].sort((a, b) => a.startTime.localeCompare(b.startTime)).map((sch) => {
                  const status = getStatus(sch);
                  return (
                    <div className={`host-sv-item host-sv-item--${status}`} key={sch.id}>
                      <div className="host-sv-item-time">
                        <span className="host-sv-time-start">{formatTime(sch.startTime)}</span>
                        <div className="host-sv-time-line" />
                        <span className="host-sv-time-end">{formatTime(sch.endTime)}</span>
                      </div>

                      <div className="host-sv-item-body">
                        <div className="host-sv-item-top">
                          <div className="host-sv-item-title-wrap">
                            <h4 className="host-sv-item-title">
                              {sch.title || sch.liveSession?.sessionName || "Phiên phát sóng"}
                            </h4>
                            <span className={`host-sv-status-badge host-sv-status-badge--${status}`}>
                              {status === "live" ? "Đang diễn ra" : status === "upcoming" ? "Sắp diễn ra" : "Đã kết thúc"}
                            </span>
                          </div>
                          <button
                            className="host-sv-action-btn"
                            onClick={() => setSelectedSchedule(sch)}
                            title="Xem chi tiết"
                          >
                            <Eye size={14} />
                          </button>
                        </div>

                        <div className="host-sv-item-meta">
                          {sch.liveSession?.sessionName && (
                            <span className="host-sv-meta-chip">
                              <Disc3 size={12} />
                              {sch.liveSession.sessionName}
                            </span>
                          )}
                          {sch.liveSession?.station?.stationName && (
                            <span className="host-sv-meta-chip">
                              <Radio size={12} />
                              {sch.liveSession.station.stationName}
                            </span>
                          )}
                          <span className="host-sv-meta-chip">
                            <Clock size={12} />
                            {formatTime(sch.startTime)} – {formatTime(sch.endTime)}
                          </span>
                          {sch.isRecurring && (
                            <span className="host-sv-meta-chip host-sv-meta-chip--recurring">
                              <Repeat size={12} />
                              {getDaysOfWeekLabel(sch.daysOfWeek)}
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

      {/* Detail Modal (Read-only) */}
      {selectedSchedule && (
        <div className="host-sv-overlay" onClick={() => setSelectedSchedule(null)}>
          <div className="host-sv-modal" onClick={(e) => e.stopPropagation()}>
            <div className="host-sv-modal-header">
              <div className="host-sv-modal-title">
                <Calendar size={20} />
                <h3>Chi tiết lịch phát sóng</h3>
              </div>
              <button className="host-sv-modal-close" onClick={() => setSelectedSchedule(null)}>×</button>
            </div>
            <div className="host-sv-modal-body">
              <div className="host-sv-detail-row">
                <span className="host-sv-detail-label">Tiêu đề</span>
                <span className="host-sv-detail-value">
                  {selectedSchedule.title || selectedSchedule.liveSession?.sessionName || "—"}
                </span>
              </div>
              <div className="host-sv-detail-row">
                <span className="host-sv-detail-label">Ngày</span>
                <span className="host-sv-detail-value">{formatDateLabel(selectedSchedule.startDate)}</span>
              </div>
              <div className="host-sv-detail-row">
                <span className="host-sv-detail-label">Giờ</span>
                <span className="host-sv-detail-value">
                  {formatTime(selectedSchedule.startTime)} – {formatTime(selectedSchedule.endTime)}
                </span>
              </div>
              {selectedSchedule.liveSession?.sessionName && (
                <div className="host-sv-detail-row">
                  <span className="host-sv-detail-label">Phiên</span>
                  <span className="host-sv-detail-value">{selectedSchedule.liveSession.sessionName}</span>
                </div>
              )}
              {selectedSchedule.liveSession?.station?.stationName && (
                <div className="host-sv-detail-row">
                  <span className="host-sv-detail-label">Đài phát</span>
                  <span className="host-sv-detail-value">{selectedSchedule.liveSession.station.stationName}</span>
                </div>
              )}
              <div className="host-sv-detail-row">
                <span className="host-sv-detail-label">Lặp lại</span>
                <span className="host-sv-detail-value">
                  {selectedSchedule.isRecurring
                    ? `Hàng tuần (${getDaysOfWeekLabel(selectedSchedule.daysOfWeek)})`
                    : "Không lặp lại"}
                </span>
              </div>
              <div className="host-sv-detail-row">
                <span className="host-sv-detail-label">Trạng thái</span>
                <span className={`host-sv-status-badge host-sv-status-badge--${getStatus(selectedSchedule)}`}>
                  {getStatus(selectedSchedule) === "live" ? "Đang diễn ra"
                    : getStatus(selectedSchedule) === "upcoming" ? "Sắp diễn ra" : "Đã kết thúc"}
                </span>
              </div>
            </div>
            <div className="host-sv-modal-footer">
              <button className="host-sv-btn host-sv-btn--outline" onClick={() => setSelectedSchedule(null)}>
                Đóng
              </button>
              {getStatus(selectedSchedule) === "upcoming" && (
                <button className="host-sv-btn host-sv-btn--primary" onClick={() => setSelectedSchedule(null)}>
                  Bắt đầu phát sóng
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
