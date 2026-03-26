import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Radio, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import staffService, { type HostUser } from "../../../services/staffService";
import {
  liveSessionApiService,
  type LiveSessionResult,
  type StationResult,
} from "../../../services/liveSessionApiService";
import { showError, showSuccess } from "../../../components/common/toastUtils";
import {
  HOST_LIST_PAGE,
  HOST_LIST_PAGE_SIZE,
  LIVE_SESSION_LIST_PAGE_SIZE,
} from "./liveSessionConstants";
import "./LiveOps.css";

export default function LiveSessionPage() {
  const navigate = useNavigate();
  const [stations, setStations] = useState<StationResult[]>([]);
  const [sessions, setSessions] = useState<LiveSessionResult[]>([]);
  const [hosts, setHosts] = useState<HostUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [stationId, setStationId] = useState("");
  const [hostId, setHostId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const isMountedRef = useRef(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [stationData, sessionData, hostRes] = await Promise.all([
        liveSessionApiService.getStations(),
        liveSessionApiService.getLiveSessions({ pageSize: LIVE_SESSION_LIST_PAGE_SIZE }),
        staffService.user.getHosts({ page: HOST_LIST_PAGE, pageSize: HOST_LIST_PAGE_SIZE }),
      ]);

      if (!isMountedRef.current) {
        return;
      }

      setStations(stationData);
      setSessions(sessionData.items);
      setHosts(hostRes.items.filter((item) => item.isActive));
      setStationId((prev) => prev || stationData[0]?.id || "");
      setHostId((prev) => prev || hostRes.items[0]?.id || "");
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

  const createSession = useCallback(async () => {
    if (!stationId || !hostId || !name.trim()) {
      showError("Thiếu dữ liệu", "Cần station, host và tên phiên");
      return;
    }

    try {
      await liveSessionApiService.createLiveSession({
        stationId,
        hostUserId: hostId,
        sessionName: name,
        description: description || undefined,
      });
      showSuccess("Tạo phiên thành công");
      setName("");
      setDescription("");
      await loadData();
    } catch {
      showError("Không thể tạo phiên");
    }
  }, [description, hostId, loadData, name, stationId]);

  const handleOpenDetail = useCallback(
    (sessionDetailId: string) => {
      navigate(`/admin/sessions/${sessionDetailId}`);
    },
    [navigate]
  );

  return (
    <div className="ops-page">
      <div className="ops-header">
        <div>
          <h1 className="ops-title">Trang Phiên Phát Sóng</h1>
          <p className="ops-subtitle">Tạo phiên và mở trang chi tiết để start/pause/resume/stop</p>
        </div>
        <div className="ops-actions">
          <button className="ops-btn ops-btn--ghost" onClick={handleRefreshClick}>
            <RefreshCw size={15} />
            Làm mới
          </button>
        </div>
      </div>

      <div className="ops-card" style={{ marginBottom: 14 }}>
        <h3 className="ops-card-title">Tạo live session</h3>
        <div className="ops-toolbar">
          <select className="ops-select" value={stationId} onChange={(e) => setStationId(e.target.value)}>
            <option value="">Chọn station</option>
            {stations.map((station) => (
              <option key={station.id} value={station.id}>{station.stationName}</option>
            ))}
          </select>
          <select className="ops-select" value={hostId} onChange={(e) => setHostId(e.target.value)}>
            <option value="">Chọn host</option>
            {hosts.map((host) => (
              <option key={host.id} value={host.id}>{host.username} ({host.email})</option>
            ))}
          </select>
          <input className="ops-input" placeholder="Tên phiên" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="ops-input" placeholder="Mô tả" value={description} onChange={(e) => setDescription(e.target.value)} />
          <button className="ops-btn ops-btn--primary" onClick={createSession}>
            <Plus size={14} />
            Tạo
          </button>
        </div>
      </div>

      <div className="ops-card">
        <h3 className="ops-card-title">Danh sách phiên</h3>
        {loading ? (
          <div className="ops-stack">
            <div className="ops-skeleton" />
            <div className="ops-skeleton" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="ops-empty">Không có phiên nào</div>
        ) : (
          <div className="ops-table-wrap">
            <table className="ops-table">
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
                    <td><span className="ops-badge"><Radio size={12} /> {session.status}</span></td>
                    <td>{session.listenersCount}</td>
                    <td>
                      <button className="ops-link-btn" onClick={() => handleOpenDetail(session.id)}>
                        Mở LiveSessionDetail Page
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
