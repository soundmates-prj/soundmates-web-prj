import { useCallback, useEffect, useRef, useState } from "react";
import { Radio, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  liveSessionApiService,
  type LiveSessionResult,
} from "../../../services/liveSessionApiService";
import { showError, showSuccess } from "../../../components/common/toastUtils";
import { LIVE_SESSION_LIST_PAGE_SIZE } from "../../Admin/LiveOps/liveSessionConstants";
import "./HostLiveSession.css";

export default function HostLiveSessionPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<LiveSessionResult[]>([]);
  const [loading, setLoading] = useState(true);

  const isMountedRef = useRef(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const userInfoStr = localStorage.getItem("userInfo");
      const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
      const params: any = { pageSize: LIVE_SESSION_LIST_PAGE_SIZE };
      
      // If the current user is a Host, only fetch their sessions
      if (userInfo && userInfo.role === "HOST") {
        params.userId = userInfo.id || userInfo.userId;
      }

      const sessionData = await liveSessionApiService.getLiveSessions(params);

      if (!isMountedRef.current) {
        return;
      }

      setSessions(sessionData.items);
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



  const handleOpenDetail = useCallback(
    (sessionDetailId: string) => {
      navigate(`/host/sessions/${sessionDetailId}`);
    },
    [navigate]
  );

  return (
    <div className="host-live-page">
      <div className="host-live-header">
        <div>
          <h1 className="host-live-title">Trang Phiên Phát Sóng</h1>
          <p className="host-live-subtitle">Quản lý và cập nhật phiên phát sóng trực tiếp</p>
        </div>
        <div className="host-live-actions">
          <button className="host-live-btn host-live-btn--ghost" onClick={handleRefreshClick}>
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
                  <th>Người nghe</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session.id}>
                    <td>{session.sessionName}</td>
                    <td>{session.stationName || "-"}</td>
                    <td><span className="host-live-badge"><Radio size={12} /> {session.status}</span></td>
                    <td>{session.listenersCount}</td>
                    <td>
                      <button className="host-live-link-btn" onClick={() => handleOpenDetail(session.id)}>
                        Mở chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
