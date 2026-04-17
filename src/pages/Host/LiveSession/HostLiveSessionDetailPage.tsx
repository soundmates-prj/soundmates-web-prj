import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Music,
  Pause,
  Play,
  RefreshCw,
  Send,
  Square,
  Trash2,
  X,
} from "lucide-react";
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

const GUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function tryParseJwtUserId(token: string | null): string | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );
    const json = atob(padded);
    const payload = JSON.parse(json);
    const sub = String(payload?.sub ?? "").trim();
    return GUID_REGEX.test(sub) ? sub : null;
  } catch {
    return null;
  }
}

const getCurrentUserId = (): string => {
  try {
    const raw = localStorage.getItem("userInfo");
    if (raw) {
      const user = JSON.parse(raw);
      const id = String(user?.id ?? user?.userId ?? "").trim();
      if (GUID_REGEX.test(id)) {
        return id;
      }
    }
  } catch {
    /* ignore */
  }
  return tryParseJwtUserId(localStorage.getItem("accessToken")) || "";
};

const getCurrentUserAvatar = () => {
  try {
    const raw = localStorage.getItem("userInfo");
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed.avatarUrl || "";
    }
  } catch {
    /* ignore */
  }
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
  const [nowPlaying, setNowPlaying] = useState<StationNowPlayingResult | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  // Song request review modal states
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(
    null,
  );
  const [rejectReason, setRejectReason] = useState("");

  // Chat states
  const [chatInput, setChatInput] = useState("");
  const [chats, setChats] = useState<DisplayChat[]>([]);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const [
        sessionData,
        listenerData,
        scheduleData,
        requestsData,
        nowPlayingData,
      ] = await Promise.all([
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
      console.log("[HostLiveSessionDetail] ChatHistory RAW:", history);
      const mapped = history.map((chat: any) => ({
        id: chat.id || chat.Id || `hub-${Date.now()}-${Math.random()}`,
        userId: chat.userId || chat.UserId || "",
        userName:
          chat.userName ||
          chat.UserName ||
          `User-${String(chat.userId || chat.UserId || "??").slice(0, 6)}`,
        avatarUrl: chat.avatarUrl || chat.AvatarUrl || "",
        message: chat.message || chat.Message,
        createdAt: chat.createdAt || chat.CreatedAt || new Date().toISOString(),
      }));
      setChats(mapped);
    });

    const offChatDeleted = liveHubService.onChatDeleted((chatId) => {
      setChats((prev) =>
        prev.map((c) => (c.id === chatId ? { ...c, isDeleted: true } : c)),
      );
    });

    const offReceiveChat = liveHubService.onReceiveChat((chat: any) => {
      console.log("[HostLiveSessionDetail] ReceiveChat RAW:", chat);
      const mapped: DisplayChat = {
        id: chat.id || chat.Id || `hub-${Date.now()}-${Math.random()}`,
        userId: chat.userId || chat.UserId || "",
        userName:
          chat.userName ||
          chat.UserName ||
          `User-${String(chat.userId || chat.UserId || "??").slice(0, 6)}`,
        avatarUrl: chat.avatarUrl || chat.AvatarUrl || "",
        message: chat.message || chat.Message,
        createdAt: chat.createdAt || chat.CreatedAt || new Date().toISOString(),
      };
      setChats((prev) => [...prev, mapped]);
    });

    void (async () => {
      try {
        await liveHubService.start();
        setTimeout(async () => {
          try {
            await liveHubService.joinSession(sessionId, currentUserId);
          } catch (err) {
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
    [],
  );

  const runAction = useCallback(
    async (type: "start" | "pause" | "resume" | "stop") => {
      if (!sessionId) return;

      try {
        await sessionActions[type](sessionId);
        showSuccess(`Đã ${type} session`);
        await loadData();
      } catch (error: any) {
        const msg =
          error?.response?.data?.message || `Không thể ${type} session`;
        showError("Thao tác thất bại", msg);
      }
    },
    [loadData, sessionActions, sessionId],
  );

  const openRejectModal = useCallback((songRequestId: string) => {
    setRejectingRequestId(songRequestId);
    setRejectReason("");
    setReviewModalOpen(true);
  }, []);

  const closeRejectModal = useCallback(() => {
    setReviewModalOpen(false);
    setRejectingRequestId(null);
    setRejectReason("");
  }, []);

  const handleApprove = useCallback(
    async (songRequestId: string) => {
      try {
        await liveSessionApiService.reviewSongRequest(songRequestId, {
          action: "approve",
        });
        showSuccess("Đã duyệt yêu cầu");
        await loadData();
      } catch {
        showError("Duyệt thất bại");
      }
    },
    [loadData],
  );

  const handleReject = useCallback(async () => {
    if (!rejectingRequestId) return;
    if (!rejectReason.trim()) {
      showError("Vui lòng nhập lý do từ chối");
      return;
    }
    try {
      await liveSessionApiService.reviewSongRequest(rejectingRequestId, {
        action: "reject",
        rejectReason: rejectReason.trim(),
      });
      showSuccess("Đã từ chối yêu cầu");
      closeRejectModal();
      await loadData();
    } catch {
      showError("Từ chối thất bại");
    }
  }, [rejectingRequestId, rejectReason, closeRejectModal, loadData]);

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
      const uName = parsed.firstName
        ? `${parsed.lastName} ${parsed.firstName}`
        : parsed.username || "Host";

      await liveHubService.sendChat(
        sessionId,
        userId,
        chatInput.trim(),
        uName,
        uAvatar,
      );
      setChatInput("");
    } catch {
      showError("Lỗi", "Không thể gửi đoạn trò chuyện");
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!sessionId) return;
    if (!window.confirm("Bạn muốn xóa đoạn trò chuyện này?")) return;
    const userId = getCurrentUserId();
    console.log("[HostLiveSessionDetail] Attempting to DeleteChat:", {
      sessionId,
      chatId,
      userId,
    });
    try {
      await liveHubService.deleteChat(sessionId, chatId, userId, "Host");
      const deletedName =
        chats.find((c) => c.id === chatId)?.userName || "Ẩn danh";
      showSuccess(`Đã yêu cầu xóa đoạn trò chuyện của ${deletedName}`);
    } catch (err) {
      console.error("[HostLiveSessionDetail] DeleteChat error:", err);
      showError("Lỗi", "Không thể xóa đoạn trò chuyện. Vui lòng xem Console.");
    }
  };

  const formattedSchedules = useMemo(
    () =>
      schedules.map((item) => ({
        ...item,
        displayRange: `${new Date(item.startTime).toLocaleString(LOCALE_VIETNAMESE)} - ${new Date(item.endTime).toLocaleString(LOCALE_VIETNAMESE)}`,
      })),
    [schedules],
  );

  return (
    <div className="host-live-page">
      <div className="host-live-header">
        <div>
          <button className="host-live-link-btn" onClick={handleBack}>
            <ArrowLeft size={13} /> Quay lại trang danh sách
          </button>
          <h1 className="host-live-title">Chi Tiết Phiên Phát Sóng</h1>
          <p className="host-live-subtitle">
            {session?.sessionName || sessionId}
          </p>
        </div>
        <div className="host-live-actions">
          <button
            className="host-live-btn host-live-btn--ghost"
            onClick={handleRefresh}
          >
            <RefreshCw size={15} />
            Làm mới
          </button>
          <button
            className="host-live-btn host-live-btn--primary"
            onClick={() => void runAction("start")}
            disabled={
              session?.status === "Live" ||
              session?.status === "Ended" ||
              session?.status === "Cancelled"
            }
          >
            <Play size={15} /> Bắt đầu
          </button>
          <button
            className="host-live-btn host-live-btn--ghost"
            onClick={() => void runAction("pause")}
            disabled={session?.status !== "Live"}
          >
            <Pause size={15} /> Tạm dừng
          </button>
          <button
            className="host-live-btn host-live-btn--ghost"
            onClick={() => void runAction("resume")}
            disabled={session?.status !== "Paused"}
          >
            <Play size={15} /> Tiếp tục
          </button>
          <button
            className="host-live-btn host-live-btn--ghost"
            onClick={() => void runAction("stop")}
            disabled={
              session?.status === "Ended" || session?.status === "Cancelled"
            }
          >
            <Square size={15} /> Dừng lại
          </button>
        </div>
      </div>

      <div className="host-live-overview">
        {/* Stats bar */}
        <div className="host-live-overview-card">
          {loading ? (
            <div className="host-live-skeleton" />
          ) : (
            <>
              <span className="host-live-overview-title">Người nghe</span>
              <div className="host-live-stat-item">
                <div className="host-live-stat-value">{listener?.currentListeners ?? 0}</div>
                <div className="host-live-stat-label">Hiện tại</div>
              </div>
              <div className="host-live-stat-item">
                <div className="host-live-stat-value">{listener?.peakListeners ?? 0}</div>
                <div className="host-live-stat-label">Cao nhất</div>
              </div>
              <div className="host-live-stat-item">
                <div className="host-live-stat-value">{listener?.totalListeners ?? 0}</div>
                <div className="host-live-stat-label">Tổng</div>
              </div>
            </>
          )}
        </div>

        {/* Now Playing */}
        <div className="host-live-overview-card">
          {nowPlaying?.currentTrack ? (
            <>
              <div className="host-live-now-playing">
                {nowPlaying.currentTrack.artUrl ? (
                  <img
                    className="host-live-now-playing-art"
                    src={nowPlaying.currentTrack.artUrl.replace("host.docker.internal", "localhost")}
                    alt="art"
                  />
                ) : (
                  <div className="host-live-now-playing-art">
                    <Music size={24} />
                  </div>
                )}
                <div className="host-live-now-playing-info">
                  <div className="host-live-now-playing-eyebrow">Đang phát</div>
                  <div className="host-live-now-playing-title">
                    {nowPlaying.currentTrack.title || "—"}
                  </div>
                  <div className="host-live-now-playing-artist">
                    {nowPlaying.currentTrack.artist || "—"}
                  </div>
                </div>
              </div>
              <div className="host-live-wave">
                <div className="host-live-wave-bar" />
                <div className="host-live-wave-bar" />
                <div className="host-live-wave-bar" />
                <div className="host-live-wave-bar" />
                <div className="host-live-wave-bar" />
              </div>
            </>
          ) : (
            <div className="host-live-empty">Không có bài hát đang phát</div>
          )}
        </div>
      </div>

      <div className="host-live-bottom-row">
        <div className="host-live-card">
          <h3 className="host-live-card-title">Lịch phát</h3>
          <div className="host-live-stack">
            {formattedSchedules.length === 0 ? (
              <div className="host-live-empty">Chưa có lịch</div>
            ) : (
              formattedSchedules.map((item) => (
                <div key={item.id} className="host-live-track-item">
                  <div>
                    <strong>{item.title || "Không tiêu đề"}</strong>
                    <div style={{ fontSize: 13, color: "#64748b" }}>
                      {item.displayRange}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="host-live-card">
          <h3 className="host-live-card-title">Yêu cầu bài hát</h3>
          <div className="host-live-stack">
            {songRequests.length === 0 ? (
              <div className="host-live-empty">Chưa có yêu cầu</div>
            ) : (
              songRequests.map((item) => (
                <div key={item.id} className="host-live-track-item">
                  <div>
                    <div className="host-live-track-title">{item.songTitle}</div>
                    <div className="host-live-track-subtitle" style={{ fontStyle: item.message ? "normal" : "italic", color: item.message ? "inherit" : "var(--neutral-400)" }}>
                      {item.message || "Không có tin nhắn"}
                    </div>
                    <div className={`host-live-badge host-live-badge--${item.status?.toLowerCase()}`}>
                      {item.status}
                    </div>
                  </div>
                  {item.status === "PENDING" || item.status === "Pending" ? (
                    <div className="host-live-inline-row">
                      <button
                        className="host-live-btn host-live-btn--approve"
                        onClick={() => void handleApprove(item.id)}
                      >
                        Duyệt
                      </button>
                      <button
                        className="host-live-btn host-live-btn--reject"
                        onClick={() => openRejectModal(item.id)}
                      >
                        Từ chối
                      </button>
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="host-live-card">
          <h3 className="host-live-card-title">Trò chuyện</h3>
          <div className="host-live-chat-container">
            <div ref={chatScrollRef} className="host-live-chat-messages">
              {chats.length === 0 ? (
                <div className="host-live-empty">Chưa có đoạn trò chuyện nào</div>
              ) : (
                chats.map((chat) => (
                  <div key={chat.id} className={`host-live-chat-msg${chat.isDeleted ? " is-deleted" : ""}`}>
                    <div className="host-live-chat-avatar">
                      {chat.avatarUrl ? (
                        <img src={chat.avatarUrl} alt="" />
                      ) : (
                        (chat.userName || "?").charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="host-live-chat-body">
                      <div className="host-live-chat-meta">
                        <span className="host-live-chat-name">{chat.userName}</span>
                        <span className="host-live-chat-time">
                          {new Date(chat.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className={`host-live-chat-text${chat.isDeleted ? " is-deleted" : ""}`}>
                        {chat.isDeleted ? "đoạn trò chuyện đã bị thu hồi/xoá." : chat.message}
                      </div>
                    </div>
                    {!chat.isSystem && !chat.isDeleted && (
                      <button
                        onClick={() => void handleDeleteChat(chat.id)}
                        className="host-live-btn host-live-btn--ghost"
                        style={{ padding: 4, height: "auto", color: "#ef4444" }}
                        title="Xóa đoạn trò chuyện"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
            <div className="host-live-chat-input-row">
              <input
                className="host-live-chat-input"
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void handleSendChat()}
                placeholder="Gửi tin nhắn..."
              />
              <button
                onClick={() => void handleSendChat()}
                disabled={!chatInput.trim()}
                className="host-live-chat-send"
                title="Gửi"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reject modal */}
      {reviewModalOpen && (
        <div
          className="host-live-modal-overlay"
          onClick={(e) => e.target === e.currentTarget && closeRejectModal()}
        >
          <div className="host-live-modal">
            <div className="host-live-modal-header">
              <h3 className="host-live-modal-title">
                <span className="host-live-modal-icon"><X size={16} /></span>
                Từ chối yêu cầu
              </h3>
              <button className="host-live-modal-close" onClick={closeRejectModal}>
                <X size={16} />
              </button>
            </div>
            <p className="host-live-modal-desc">
              Vui lòng nhập lý do từ chối yêu cầu bài hát này.
            </p>
            <textarea
              className="host-live-modal-textarea"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Nhập lý do từ chối..."
              rows={4}
              autoFocus
            />
            <div className="host-live-modal-actions">
              <button className="host-live-modal-btn-cancel" onClick={closeRejectModal}>
                Hủy
              </button>
              <button
                className="host-live-modal-btn-confirm"
                onClick={() => void handleReject()}
                disabled={!rejectReason.trim()}
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
