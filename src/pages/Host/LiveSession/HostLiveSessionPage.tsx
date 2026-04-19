import { useCallback, useEffect, useRef, useState } from "react";
import { Radio, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  liveSessionApiService,
  type LiveSessionResult,
  type SessionScheduleResult,
} from "../../../services/liveSessionApiService";
import { showError } from "../../../components/common/toastUtils";
import { LIVE_SESSION_LIST_PAGE_SIZE } from "../../Admin/LiveOps/liveSessionConstants";
import NotificationButton from "../../../components/layout/NotificationButton";
import "./HostLiveSession.css";

const LOCALE_VIETNAMESE = "vi-VN";

export default function HostLiveSessionPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<LiveSessionResult[]>([]);
  const [schedules, setSchedules] = useState<SessionScheduleResult[]>([]);
  const [loading, setLoading] = useState(true);

  const isMountedRef = useRef(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const userInfoStr = localStorage.getItem("userInfo");
      const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
      const params: any = { pageSize: LIVE_SESSION_LIST_PAGE_SIZE };

      if (userInfo && userInfo.role === "HOST") {
        params.userId = userInfo.id || userInfo.userId;
      }

      const [sessionData, schedulesData] = await Promise.all([
        liveSessionApiService.getLiveSessions(params),
        liveSessionApiService.getSchedules(),
      ]);

      if (!isMountedRef.current) {
        return;
      }

      setSessions(sessionData.items);
      setSchedules(schedulesData);
    } catch {
      showError("Lỗi", "Không thể tải dữ liệu live session");
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    void loadData();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleRefreshClick = useCallback(() => {
    void loadData();
  }, [loadData]);

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "—";
    
    try {
      const isoStr = dateStr.endsWith("Z") ? dateStr.slice(0, -1) : dateStr;
      const date = new Date(isoStr);
      
      if (isNaN(date.getTime())) {
        return "—";
      }

      return date.toLocaleString(LOCALE_VIETNAMESE, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Ho_Chi_Minh",
        hour12: false,
      });
    } catch {
      return "—";
    }
  };

  const handleOpenDetail = useCallback(
    (sessionDetailId: string) => {
      navigate(`/host/sessions/${sessionDetailId}`);
    },
    [navigate],
  );

  return (
    <div className="host-live-page">
      <div className="host-live-header">
        <div>
          <h1 className="host-live-title">Trang Phiên Phát Sóng</h1>
          <p className="host-live-subtitle">
            Quản lý và cập nhật phiên phát sóng trực tiếp
          </p>
        </div>
        <div className="host-live-actions">
          <button
            className="host-live-btn host-live-btn--ghost"
            onClick={handleRefreshClick}
          >
            <RefreshCw size={15} />
            Làm mới
          </button>
        </div>
      </div>

      <div className="host-live-card">
        <h3 className="host-live-card-title">Danh sách phiên</h3>
        {loading ? (
          <div className="host-live-stack">
            <div className="host-live-skeleton" />
            <div className="host-live-skeleton" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="host-live-empty">Không có phiên nào</div>
        ) : (
          <div className="host-live-table-wrap">
            <table className="host-live-table">
              <thead>
                <tr>
                  <th>Tên phiên</th>
                  <th>Đài phát</th>
                  <th>Trạng thái</th>
                  <th>Thời gian phát sóng</th>
                  <th>Người nghe</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => {
                  const sessionSchedules = schedules.filter(s => s.liveSessionId === session.id);

                  return (
                    <tr key={session.id}>
                      <td>{session.sessionName}</td>
                      <td>{session.stationName || "-"}</td>
                      <td>
                        <span className="host-live-badge">
                          <Radio size={12} />
                          {session.status === "Created"
                            ? "Chờ lên lịch"
                            : session.status === "Scheduled"
                              ? "Đã lên lịch"
                              : session.status === "Live"
                                ? "Đang phát"
                                : session.status === "Ended"
                                  ? "Đã kết thúc"
                                  : "Không xác định"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {sessionSchedules.length > 0 ? (
                            sessionSchedules.map((sch) => {
                              let startStr = "—";
                              let endStr = "—";
                              if (sch.startDate && sch.startTime && sch.endTime) {
                                const startDateTime = new Date(`${sch.startDate}T${sch.startTime}`);
                                const endDateTime = new Date(`${sch.startDate}T${sch.endTime}`);
                                
                                if (endDateTime < startDateTime) {
                                  endDateTime.setDate(endDateTime.getDate() + 1);
                                }
                                
                                if (!isNaN(startDateTime.getTime())) startStr = startDateTime.toLocaleString(LOCALE_VIETNAMESE);
                                if (!isNaN(endDateTime.getTime())) endStr = endDateTime.toLocaleString(LOCALE_VIETNAMESE);
                              }
                              return (
                                <span key={sch.id} style={{ fontSize: '12px' }}>
                                  {startStr} - {endStr}
                                </span>
                              );
                            })
                          ) : (
                            session.startedAt ? (
                              <span style={{ fontSize: '12px' }}>
                                {formatDateTime(session.startedAt)} - {session.endedAt ? formatDateTime(session.endedAt) : "Đang phát"}
                              </span>
                            ) : (
                              <span style={{ fontSize: '12px' }}>
                                {formatDateTime(session.scheduledStartAt)}
                              </span>
                            )
                          )}
                        </div>
                      </td>
                      <td>{session.listenersCount}</td>
                      <td>
                        <button
                          className="host-live-link-btn"
                          onClick={() => handleOpenDetail(session.id)}
                        >
                          Mở chi tiết
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
