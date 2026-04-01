import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Pause, Play, RefreshCw, Square, Users } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  liveSessionApiService,
  type ListenerStatsResult,
  type LiveSessionResult,
  type SessionScheduleResult,
  type SongRequestResult,
} from "../../../services/liveSessionApiService";
import { showError, showSuccess } from "../../../components/common/toastUtils";
import {
  LOCALE_VIETNAMESE,
  REQUEST_REJECT_REASON_BY_ADMIN,
  REQUEST_STATUS_PENDING,
} from "./liveSessionConstants";
import "./LiveOps.css";

const getCurrentUserId = () => {
  try {
    const raw = localStorage.getItem("userInfo");
    if (!raw) return "";
    const user = JSON.parse(raw);
    return user?.id || user?.userId || "";
  } catch {
    return "";
  }
};

export default function LiveSessionDetailPage() {
  const navigate = useNavigate();
  const { sessionId = "" } = useParams();
  const isMountedRef = useRef(true);
  const [session, setSession] = useState<LiveSessionResult | null>(null);
  const [listener, setListener] = useState<ListenerStatsResult | null>(null);
  const [schedules, setSchedules] = useState<SessionScheduleResult[]>([]);
  const [songRequests, setSongRequests] = useState<SongRequestResult[]>([]);
  const [loading, setLoading] = useState(true);

  const [scheduleTitle, setScheduleTitle] = useState("");
  const [scheduleStart, setScheduleStart] = useState("");
  const [scheduleEnd, setScheduleEnd] = useState("");

  const [requestMediaId, setRequestMediaId] = useState("");
  const [requestMessage, setRequestMessage] = useState("");

  const loadData = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const [sessionData, listenerData, scheduleData, requestsData] = await Promise.all([
        liveSessionApiService.getLiveSession(sessionId),
        liveSessionApiService.getListenerStats(sessionId),
        liveSessionApiService.getSchedules(sessionId),
        liveSessionApiService.getSongRequests(sessionId),
      ]);

      if (!isMountedRef.current) {
        return;
      }

      setSession(sessionData);
      setListener(listenerData);
      setSchedules(scheduleData);
      setSongRequests(requestsData);
    } catch {
      showError("Lỗi", "Không thể tải chi tiết live session");
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [sessionId]);

  useEffect(() => {
    isMountedRef.current = true;
    void loadData();

    return () => {
      isMountedRef.current = false;
    };
  }, [sessionId]);

  const sessionActions = useMemo(
    () => ({
      start: liveSessionApiService.startSession,
      pause: liveSessionApiService.pauseSession,
      resume: liveSessionApiService.resumeSession,
      stop: liveSessionApiService.stopSession,
    }),
    []
  );

  const runAction = useCallback(async (type: "start" | "pause" | "resume" | "stop") => {
    if (!sessionId) return;

    try {
      await sessionActions[type](sessionId);
      showSuccess(`Đã ${type} session`);
      await loadData();
    } catch {
      showError("Thao tác thất bại", `Không thể ${type} session`);
    }
  }, [loadData, sessionActions, sessionId]);

  const createSchedule = useCallback(async () => {
    if (!sessionId || !scheduleStart || !scheduleEnd) {
      showError("Thiếu dữ liệu", "Cần start time và end time");
      return;
    }

    try {
      await liveSessionApiService.createSchedule(sessionId, {
        title: scheduleTitle || undefined,
        startDate: new Date(scheduleStart).toISOString().split('T')[0],
        startTime: new Date(scheduleStart).toTimeString().slice(0, 8),
        endDate: new Date(scheduleEnd).toISOString().split('T')[0],
        endTime: new Date(scheduleEnd).toTimeString().slice(0, 8),
      });
      showSuccess("Tạo lịch thành công");
      setScheduleTitle("");
      setScheduleStart("");
      setScheduleEnd("");
      await loadData();
    } catch {
      showError("Không thể tạo lịch");
    }
  }, [loadData, scheduleEnd, scheduleStart, scheduleTitle, sessionId]);

  const createSongRequest = useCallback(async () => {
    if (!sessionId || !requestMediaId) {
      showError("Thiếu mediaFileId", "Nhập mediaFileId để gửi request");
      return;
    }

    try {
      await liveSessionApiService.createSongRequest(sessionId, {
        mediaFileId: requestMediaId,
        message: requestMessage || undefined,
      });
      showSuccess("Đã gửi song request");
      setRequestMediaId("");
      setRequestMessage("");
      await loadData();
    } catch {
      showError("Gửi request thất bại", "Kiểm tra mediaFileId và quyền truy cập");
    }
  }, [loadData, requestMediaId, requestMessage, sessionId]);

  const reviewRequest = useCallback(async (songRequestId: string, action: "approve" | "reject") => {
    try {
      await liveSessionApiService.reviewSongRequest(songRequestId, {
        action,
        rejectReason: action === "reject" ? REQUEST_REJECT_REASON_BY_ADMIN : undefined,
      });
      showSuccess("Review thành công");
      await loadData();
    } catch {
      showError("Review thất bại");
    }
  }, [loadData]);

  const handleBack = useCallback(() => {
    navigate("/admin/sessions");
  }, [navigate]);

  const handleRefresh = useCallback(() => {
    void loadData();
  }, [loadData]);

  const formattedSchedules = useMemo(
    () =>
      schedules.map((item) => ({
        ...item,
        displayRange: `${new Date(item.startTime).toLocaleString(LOCALE_VIETNAMESE)} - ${new Date(item.endTime).toLocaleString(LOCALE_VIETNAMESE)}`,
      })),
    [schedules]
  );

  return (
    <div className="ops-page">
      <div className="ops-header">
        <div>
          <button className="ops-link-btn" onClick={handleBack}>
            <ArrowLeft size={13} /> Quay lại LiveSession Page
          </button>
          <h1 className="ops-title">LiveSessionDetail Page</h1>
          <p className="ops-subtitle">{session?.sessionName || sessionId}</p>
        </div>
        <div className="ops-actions">
          <button className="ops-btn ops-btn--ghost" onClick={handleRefresh}>
            <RefreshCw size={15} />
            Làm mới
          </button>
          <button className="ops-btn ops-btn--primary" onClick={() => void runAction("start")}>
            <Play size={15} /> Start
          </button>
          <button className="ops-btn ops-btn--ghost" onClick={() => void runAction("pause")}>
            <Pause size={15} /> Pause
          </button>
          <button className="ops-btn ops-btn--ghost" onClick={() => void runAction("resume")}>
            <Play size={15} /> Resume
          </button>
          <button className="ops-btn ops-btn--ghost" onClick={() => void runAction("stop")}>
            <Square size={15} /> Stop
          </button>
        </div>
      </div>

      <div className="ops-grid" style={{ marginBottom: 14 }}>
        <div className="ops-card">
          <h3 className="ops-card-title">Listener stats</h3>
          {loading ? <div className="ops-skeleton" /> : (
            <div className="ops-stack">
              <div className="ops-inline-row"><Users size={14} /> Current: {listener?.currentListeners ?? 0}</div>
              <div>Peak: {listener?.peakListeners ?? 0}</div>
              <div>Total: {listener?.totalListeners ?? 0}</div>
            </div>
          )}
        </div>

        <div className="ops-card">
          <h3 className="ops-card-title">Schedule UI</h3>
          <div className="ops-stack">
            <input className="ops-input" placeholder="Title" value={scheduleTitle} onChange={(e) => setScheduleTitle(e.target.value)} />
            <input className="ops-input" type="datetime-local" value={scheduleStart} onChange={(e) => setScheduleStart(e.target.value)} />
            <input className="ops-input" type="datetime-local" value={scheduleEnd} onChange={(e) => setScheduleEnd(e.target.value)} />
            <button className="ops-btn ops-btn--primary" onClick={createSchedule}>Tạo lịch</button>
          </div>
        </div>

        <div className="ops-card">
          <h3 className="ops-card-title">Song request UI</h3>
          <div className="ops-stack">
            <input className="ops-input" placeholder="mediaFileId" value={requestMediaId} onChange={(e) => setRequestMediaId(e.target.value)} />
            <input className="ops-input" placeholder="Message" value={requestMessage} onChange={(e) => setRequestMessage(e.target.value)} />
            <button className="ops-btn ops-btn--primary" onClick={createSongRequest}>Gửi request</button>
          </div>
        </div>
      </div>

      <div className="ops-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="ops-card">
          <h3 className="ops-card-title">Lịch phát</h3>
          <div className="ops-stack">
            {formattedSchedules.length === 0 ? <div className="ops-empty">Chưa có lịch</div> : formattedSchedules.map((item) => (
              <div key={item.id} className="ops-track-item">
                <div>
                  <strong>{item.title || "Không tiêu đề"}</strong>
                  <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
                    {item.displayRange}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="ops-card">
          <h3 className="ops-card-title">Song requests</h3>
          <div className="ops-stack">
            {songRequests.length === 0 ? <div className="ops-empty">Chưa có yêu cầu</div> : songRequests.map((item) => (
              <div key={item.id} className="ops-track-item">
                <div>
                  <strong>{item.songTitle}</strong>
                  <div style={{ color: "var(--text-muted)", fontSize: 12 }}>{item.status}</div>
                </div>
                {item.status === REQUEST_STATUS_PENDING ? (
                  <div className="ops-inline-row">
                    <button className="ops-btn ops-btn--ghost" onClick={() => void reviewRequest(item.id, "reject")}>Reject</button>
                    <button className="ops-btn ops-btn--primary" onClick={() => void reviewRequest(item.id, "approve")}>Approve</button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
