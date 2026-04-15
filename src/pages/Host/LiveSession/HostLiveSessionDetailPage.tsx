import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Pause, Play, RefreshCw, Send, Square, Trash2, Users } from "lucide-react";
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
import { liveHubService } from "../../../services/liveHubService";
import "./HostLiveSession.css";

interface DisplayChat {
  id: string;
  userId: string;
  userName: string;
  message: string;
  createdAt: string;
  isSystem?: boolean;
  avatarUrl?: string;
  isDeleted?: boolean;
}

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

const getCurrentUserAvatar = () => {
  try {
    const raw = localStorage.getItem("userInfo");
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed.avatarUrl || "";
    }
  } catch { /* ignore */ }
  return "";
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

  // Chat states
  const [chatInput, setChatInput] = useState("");
  const [chats, setChats] = useState<DisplayChat[]>([]);
  const chatScrollRef = useRef<HTMLDivElement>(null);

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
  }, [sessionId, loadData]);

  // SignalR Chat Connection
  useEffect(() => {
    if (!sessionId) return;
    const currentUserId = getCurrentUserId();
    
    const offChatHistory = liveHubService.onChatHistory((history) => {
      const mapped = history.map((chat: any) => ({
        id: chat.id || chat.Id || `hub-${Date.now()}-${Math.random()}`,
        userId: chat.userId || chat.UserId || "",
        userName: chat.userName || chat.UserName || `User-${String(chat.userId || chat.UserId || "??").slice(0, 6)}`,
        avatarUrl: chat.avatarUrl || chat.AvatarUrl || "",
        message: chat.message,
        createdAt: chat.createdAt || new Date().toISOString()
      }));
      setChats(mapped);
    });

    const offChatDeleted = liveHubService.onChatDeleted((chatId) => {
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, isDeleted: true } : c));
    });

    const offReceiveChat = liveHubService.onReceiveChat((chat: any) => {
      const mapped: DisplayChat = {
        id: chat.id || chat.Id || `hub-${Date.now()}-${Math.random()}`,
        userId: chat.userId || chat.UserId || "",
        userName: chat.userName || chat.UserName || `User-${String(chat.userId || chat.UserId || "??").slice(0, 6)}`,
        avatarUrl: chat.avatarUrl || chat.AvatarUrl || "",
        message: chat.message,
        createdAt: chat.createdAt || new Date().toISOString()
      };
      setChats(prev => [...prev, mapped]);
    });

    void (async () => {
      try {
        await liveHubService.start();
        setTimeout(async () => {
          try {
            await liveHubService.joinSession(sessionId, currentUserId);
          } catch(err) {
            console.warn("SignalR Join Error:", err);
          }
        }, 500);
      } catch (err) {
        console.warn("SignalR Start Error:", err);
      }
    })();

    return () => {
      offChatHistory();
      offChatDeleted();
      offReceiveChat();
      void liveHubService.leaveSession(sessionId, currentUserId);
    };
  }, [sessionId]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chats]);

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

  const handleSendChat = async () => {
    if (!chatInput.trim() || !sessionId) return;
    const userId = getCurrentUserId();
    if (!userId) return;
    
    try {
      const uAvatar = getCurrentUserAvatar();
      const raw = localStorage.getItem("userInfo");
      const parsed = raw ? JSON.parse(raw) : {};
      const uName = parsed.firstName ? `${parsed.firstName} ${parsed.lastName}` : parsed.username || "Host";
      
      await liveHubService.sendChat(sessionId, userId, chatInput.trim(), uName, uAvatar);
      setChatInput("");
    } catch {
      showError("Lỗi", "Không thể gửi tin nhắn");
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!sessionId) return;
    if (!window.confirm("Bạn muốn xóa tin nhắn này?")) return;
    const userId = getCurrentUserId();
    try {
      await liveHubService.deleteChat(sessionId, chatId, userId, "Host");
      showSuccess("Đã yêu cầu xóa tin nhắn");
    } catch {
      showError("Lỗi", "Không thể xóa tin nhắn");
    }
  };

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
            <div ref={chatScrollRef} style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, paddingRight: 5 }}>
              {chats.length === 0 ? (
                <div className="host-live-empty" style={{ margin: "auto", border: "none" }}>Chưa có tin nhắn nào</div>
              ) : (
                chats.map((chat) => (
                  <div key={chat.id} style={{ display: "flex", gap: 8, opacity: chat.isDeleted ? 0.6 : 1 }}>
                    <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: "50%", backgroundColor: "#334155", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                      {chat.avatarUrl ? (
                        <img src={chat.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span style={{ fontSize: 12, color: "#fff", fontWeight: "bold" }}>
                          {(chat.userName || "?").charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{chat.userName}</span>
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          {new Date(chat.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div style={{ fontSize: 14, color: chat.isDeleted ? "var(--text-muted)" : "inherit", fontStyle: chat.isDeleted ? "italic" : "normal", wordBreak: "break-word" }}>
                        {chat.isDeleted ? "Tin nhắn đã bị thu hồi/xoá." : chat.message}
                      </div>
                    </div>
                    {!chat.isSystem && !chat.isDeleted && (
                      <button
                        onClick={() => void handleDeleteChat(chat.id)}
                        className="host-live-btn host-live-btn--ghost"
                        style={{ padding: 4, height: "auto", color: "#ef4444" }}
                        title="Xóa tin nhắn"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
            {/* Input area */}
            <div style={{ display: "flex", gap: 8, marginTop: 10, borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 10 }}>
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && void handleSendChat()}
                placeholder="Gửi tin nhắn với tư cách Host..."
                style={{ 
                  flex: 1, padding: "8px 12px", borderRadius: 6, 
                  border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)", color: "#fff" 
                }}
              />
              <button 
                onClick={() => void handleSendChat()}
                disabled={!chatInput.trim()}
                className="host-live-btn host-live-btn--primary"
                style={{ padding: "0 12px", height: "auto" }}
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
