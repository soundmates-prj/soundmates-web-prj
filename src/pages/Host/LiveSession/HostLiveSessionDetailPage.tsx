import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Pause, Play, RefreshCw, Square, Users } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  liveSessionApiService,
  type ListenerStatsResult,
  type LiveSessionResult,
  type SessionScheduleResult,
  type SongRequestResult,
  type StationNowPlayingResult,
} from "../../../services/liveSessionApiService";
import { showError, showSuccess } from "../../../components/common/toastUtils";
import { LOCALE_VIETNAMESE } from "../../Admin/LiveOps/liveSessionConstants";
import "./HostLiveSession.css";

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

export default function HostLiveSessionDetailPage() {
  const navigate = useNavigate();
  const { sessionId = "" } = useParams();
  const isMountedRef = useRef(true);
  const [session, setSession] = useState<LiveSessionResult | null>(null);
  const [listener, setListener] = useState<ListenerStatsResult | null>(null);
  const [schedules, setSchedules] = useState<SessionScheduleResult[]>([]);
  const [songRequests, setSongRequests] = useState<SongRequestResult[]>([]);
  const [nowPlaying, setNowPlaying] = useState<StationNowPlayingResult | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const [sessionData, listenerData, scheduleData, requestsData, nowPlayingData] = await Promise.all([
        liveSessionApiService.getLiveSession(sessionId),
        liveSessionApiService.getListenerStats(sessionId),
        liveSessionApiService.getSchedules(sessionId),
        liveSessionApiService.getSongRequests(sessionId),
        liveSessionApiService.getNowPlaying(sessionId).catch(() => null),
      ]);

      if (!isMountedRef.current) {
        return;
      }

      setSession(sessionData);
      setListener(listenerData);
      setSchedules(scheduleData);
      setSongRequests(requestsData);
      setNowPlaying(nowPlayingData);
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
    } catch (error: any) {
      const msg = error?.response?.data?.message || `Không thể ${type} session`;
      showError("Thao tác thất bại", msg);
    }
  }, [loadData, sessionActions, sessionId]);

  const reviewRequest = useCallback(async (songRequestId: string, action: "approve" | "reject") => {
    try {
      await liveSessionApiService.reviewSongRequest(songRequestId, {
        action,
        rejectReason: action === "reject" ? "Rejected by admin" : undefined,
      });
      showSuccess("Review thành công");
      await loadData();
    } catch {
      showError("Review thất bại");
    }
  }, [loadData]);

  const handleBack = useCallback(() => {
    navigate("/host/sessions");
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
    <div className="host-live-page">
      <div className="host-live-header">
        <div>
          <button className="host-live-link-btn" onClick={handleBack}>
            <ArrowLeft size={13} /> Quay lại trang danh sách
          </button>
          <h1 className="host-live-title">Chi Tiết Phiên Phát Sóng</h1>
          <p className="host-live-subtitle">{session?.sessionName || sessionId}</p>
        </div>
        <div className="host-live-actions">
          <button className="host-live-btn host-live-btn--ghost" onClick={handleRefresh}>
            <RefreshCw size={15} />
            Làm mới
          </button>
          <button 
            className="host-live-btn host-live-btn--primary" 
            onClick={() => void runAction("start")}
            disabled={session?.status === "Live" || session?.status === "Ended" || session?.status === "Cancelled"}
          >
            <Play size={15} /> Start
          </button>
          <button 
            className="host-live-btn host-live-btn--ghost" 
            onClick={() => void runAction("pause")}
            disabled={session?.status !== "Live"}
          >
            <Pause size={15} /> Pause
          </button>
          <button 
            className="host-live-btn host-live-btn--ghost" 
            onClick={() => void runAction("resume")}
            disabled={session?.status !== "Paused"}
          >
            <Play size={15} /> Resume
          </button>
          <button 
            className="host-live-btn host-live-btn--ghost" 
            onClick={() => void runAction("stop")}
            disabled={session?.status === "Ended" || session?.status === "Cancelled"}
          >
            <Square size={15} /> Stop
          </button>
        </div>
      </div>

      <div className="host-live-grid" style={{ marginBottom: 14 }}>
        <div className="host-live-card">
          <h3 className="host-live-card-title">Listener stats</h3>
          {loading ? <div className="host-live-skeleton" /> : (
            <div className="host-live-stack">
              <div className="host-live-inline-row"><Users size={14} /> Current: {listener?.currentListeners ?? 0}</div>
              <div>Peak: {listener?.peakListeners ?? 0}</div>
              <div>Total: {listener?.totalListeners ?? 0}</div>
            </div>
          )}
        </div>

        <div className="host-live-card" style={{ gridColumn: "span 2" }}>
          <h3 className="host-live-card-title">Now Playing</h3>
          <div className="host-live-stack">
            {nowPlaying?.currentTrack ? (
              <div className="host-live-inline-row" style={{ alignItems: "center", gap: 12 }}>
                {nowPlaying.currentTrack.artUrl && (
                  <img 
                    src={nowPlaying.currentTrack.artUrl.replace("host.docker.internal", "localhost")} 
                    alt="art" 
                    style={{ width: 60, height: 60, borderRadius: 8, objectFit: "cover" }} 
                  />
                )}
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{nowPlaying.currentTrack.title || "Unknown Title"}</div>
                  <div style={{ color: "var(--text-muted)", fontSize: 13 }}>{nowPlaying.currentTrack.artist || "Unknown Artist"}</div>
                </div>
              </div>
            ) : (
              <div className="host-live-empty" style={{ padding: 16 }}>Không có bài hát đang phát</div>
            )}
          </div>
        </div>
      </div>

      <div className="host-live-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", marginBottom: 14 }}>
        <div className="host-live-card">
          <h3 className="host-live-card-title">Lịch phát</h3>
          <div className="host-live-stack">
            {formattedSchedules.length === 0 ? <div className="host-live-empty">Chưa có lịch</div> : formattedSchedules.map((item) => (
              <div key={item.id} className="host-live-track-item">
                <div>
                  <strong>{item.title || "Không tiêu đề"}</strong>
                  <div style={{ fontSize: 13, color: "#64748b" }}>
                    {item.displayRange}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="host-live-card">
          <h3 className="host-live-card-title">Song requests</h3>
          <div className="host-live-stack">
            {songRequests.length === 0 ? <div className="host-live-empty">Chưa có yêu cầu</div> : songRequests.map((item) => (
              <div key={item.id} className="host-live-track-item">
                <div>
                  <strong>{item.songTitle}</strong>
                  <div style={{ color: "var(--text-muted)", fontSize: 12 }}>{item.status}</div>
                </div>
                {item.status === 'PENDING' ? (
                  <div className="host-live-inline-row">
                    <button className="host-live-btn host-live-btn--ghost" onClick={() => void reviewRequest(item.id, "reject")}>Reject</button>
                    <button className="host-live-btn host-live-btn--primary" onClick={() => void reviewRequest(item.id, "approve")}>Approve</button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="host-live-card">
          <h3 className="host-live-card-title">Live Chat</h3>
          <div className="host-live-stack" style={{ height: "400px", display: "flex", flexDirection: "column" }}>
            <div className="host-live-empty" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              Tính năng Live Chat chưa được hiển thị
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
