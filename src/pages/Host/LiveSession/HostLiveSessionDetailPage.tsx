import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Play, RefreshCw, Send, Square, Trash2, Music, X, Mic2, MicOff, SkipForward } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  liveSessionApiService,
  type ListenerStatsResult,
  type LiveSessionResult,
  type SessionScheduleResult,
  type SongRequestResult,
  type StationNowPlayingResult,
  type NowPlayingTrackResult,
} from "../../../services/liveSessionApiService";
import { showError } from "../../../components/common/toastUtils";
import { useConfirm } from "../../../context/ConfirmContext";
import { LOCALE_VIETNAMESE } from "../../Admin/LiveOps/liveSessionConstants";
import { getLiveListenersCount } from "../../../utils/listenerUtils";
import { liveHubService } from "../../../services/liveHubService";
import "./HostLiveSession.css";
import showToast from "../../../utils/toast";

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
  const { confirm } = useConfirm();
  const { sessionId = "" } = useParams();
  const isMountedRef = useRef(true);
  const [session, setSession] = useState<LiveSessionResult | null>(null);
  const [listener, setListener] = useState<ListenerStatsResult | null>(null);
  const [schedules, setSchedules] = useState<SessionScheduleResult[]>([]);
  const [songRequests, setSongRequests] = useState<SongRequestResult[]>([]);
  const [nowPlaying, setNowPlaying] = useState<StationNowPlayingResult | null>(null);
  const [queue, setQueue] = useState<NowPlayingTrackResult[]>([]);
  const [loading, setLoading] = useState(true);

  // Song request review modal states
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [songRequestPage, setSongRequestPage] = useState(1);
  const [viewRequestModalOpen, setViewRequestModalOpen] = useState(false);
  const [viewingRequest, setViewingRequest] = useState<SongRequestResult | null>(null);
  const requestsPerPage = 4;

  // Chat states
  const [chatInput, setChatInput] = useState("");
  const [chats, setChats] = useState<DisplayChat[]>([]);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // ── Mic state (Host) ───────────────────────────────────────────────
  const [isMicActive, setIsMicActive] = useState(false);
  // Ref mirrors isMicActive — đọc sync trong handler WebRTC (tránh stale closure)
  const isMicActiveRef = useRef(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");

  // ── WebRTC refs ───────────────────────────────────────────────────────────
  const localStreamRef = useRef<MediaStream | null>(null);
  const hostPeerConnsRef = useRef<Map<string, RTCPeerConnection>>(new Map());

  const STUN_SERVERS: RTCIceServer[] = useMemo(() => [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    // TURN server — relay audio khi NAT/Firewall chặn P2P trực tiếp
    {
      urls: [
        `turn:${import.meta.env.VITE_TURN_HOST ?? "161.97.85.232"}:3478?transport=udp`,
        `turn:${import.meta.env.VITE_TURN_HOST ?? "161.97.85.232"}:3478?transport=tcp`,
      ],
      username: import.meta.env.VITE_TURN_USERNAME ?? "soundmates",
      credential: import.meta.env.VITE_TURN_PASSWORD ?? "SoundmatesTurn@2024!",
    },
  ], []);

  // Throttle global volume updates to save SignalR bandwidth
  const updateGlobalVolRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleVolumeSync = useCallback((val: number) => {
    if (updateGlobalVolRef.current) clearTimeout(updateGlobalVolRef.current);
    updateGlobalVolRef.current = setTimeout(() => {
      if (sessionId) {
        console.log("Sending global volume:", val);
        void liveHubService.updateGlobalVolume(sessionId, val).catch(e => console.error("Volume sync error", e));
      }
    }, 100);
  }, [sessionId]);

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
        queueData,
      ] = await Promise.all([
        liveSessionApiService.getLiveSession(sessionId),
        liveSessionApiService.getListenerStats(sessionId),
        liveSessionApiService.getSchedules(sessionId),
        liveSessionApiService.getSongRequests(sessionId),
        liveSessionApiService.getNowPlaying(sessionId).catch(() => null),
        liveSessionApiService.getQueue(sessionId).catch(() => null),
      ]);

      if (!isMountedRef.current) {
        return;
      }

      setSession(sessionData);
      setListener(listenerData);
      setSchedules(scheduleData);
      setSongRequests(requestsData);
      setNowPlaying(nowPlayingData);
      setQueue(queueData ? queueData.queue : []);
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

    const interval = setInterval(() => {
      if (sessionId) {
        liveSessionApiService.getNowPlaying(sessionId)
          .then((data: any) => {
            if (isMountedRef.current) setNowPlaying(data);
          })
          .catch(() => { });
        liveSessionApiService.getQueue(sessionId)
          .then((data: any) => {
            if (isMountedRef.current) setQueue(data ? data.queue : []);
          })
          .catch(() => { });
      }
    }, 10000);

    // Lấy danh sách mic ngay khi mount
    navigator.mediaDevices?.enumerateDevices()
      .then((devices) => {
        const audioInputDevices = devices.filter((d) => d.kind === "audioinput");
        setAudioDevices(audioInputDevices);
        if (audioInputDevices.length > 0) {
          // Gán mặc định nếu có (nhưng label có thể rỗng nếu chưa request permission)
          setSelectedDeviceId((prev) => prev || audioInputDevices[0].deviceId);
        }
      })
      .catch((err) => console.warn("Lỗi list device:", err));

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
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

    const offListenersUpdated = liveHubService.onListenersUpdated((sid, count) => {
      if (sid === sessionId) {
        setNowPlaying((prev: any) => prev ? { ...prev, totalListeners: count } : prev);
        setSession((prev: any) => prev ? { ...prev, listenersCount: count, totalListeners: count } : prev);
      }
    });

    const offUserJoined = liveHubService.onUserJoined((sid, uid, count) => {
      if (sid === sessionId) {
        setNowPlaying((prev: any) => prev ? { ...prev, totalListeners: count } : prev);
        setSession((prev: any) => prev ? { ...prev, listenersCount: count, totalListeners: count } : prev);
      }
    });

    const offUserLeft = liveHubService.onUserLeft((sid, uid, count) => {
      if (sid === sessionId) {
        setNowPlaying((prev: any) => prev ? { ...prev, totalListeners: count } : prev);
        setSession((prev: any) => prev ? { ...prev, listenersCount: count, totalListeners: count } : prev);
      }
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
      offListenersUpdated();
      offUserJoined();
      offUserLeft();
      void liveHubService.leaveSession(sessionId, currentUserId);
    };
  }, [sessionId]);

  // ── Host: xử lý khi Listener muốn subscribe & ICE relay ───────────────────────────────────
  useEffect(() => {
    if (!sessionId) return;

    const offSub = liveHubService.onListenerWantsToSubscribe(async (sid, listenerConnId, sdpOffer) => {
      // Dùng isMicActiveRef thay vì isMicActive — tránh stale closure khi state chưa re-render kịp
      if (sid !== sessionId || !isMicActiveRef.current || !localStreamRef.current) return;

      const pc = new RTCPeerConnection({ iceServers: STUN_SERVERS });
      hostPeerConnsRef.current.set(listenerConnId, pc);

      localStreamRef.current.getAudioTracks().forEach(track =>
        pc.addTrack(track, localStreamRef.current!)
      );

      // ICE candidate relay qua SignalR
      pc.onicecandidate = (evt) => {
        if (evt.candidate) {
          void liveHubService.iceCandidateRelay(sessionId, listenerConnId, JSON.stringify(evt.candidate));
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "disconnected" || pc.connectionState === "failed" || pc.connectionState === "closed") {
          hostPeerConnsRef.current.delete(listenerConnId);
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp: sdpOffer }));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await liveHubService.hostAnswerListener(sessionId, listenerConnId, answer.sdp ?? "");
    });

    const offIce = liveHubService.onReceiveIceCandidate(async (sid, candidateStr) => {
      if (sid !== sessionId) return;
      try {
        const candidate = JSON.parse(candidateStr) as RTCIceCandidateInit;
        hostPeerConnsRef.current.forEach(async (pc) => {
          if (pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => { });
          }
        });
      } catch { /* ignore parse errors */ }
    });

    return () => {
      offSub();
      offIce();
    };
    // Chỉ phụ thuộc sessionId — isMicActive được đọc qua ref, STUN_SERVERS là hằng số
  }, [sessionId, STUN_SERVERS]);

  // ── Cleanup peer connections unmount ──────────────────────────────────────
  useEffect(() => {
    return () => {
      hostPeerConnsRef.current.forEach(pc => pc.close());
      hostPeerConnsRef.current.clear();
      localStreamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, []);

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
        showToast.success(`Đã ${type} session`);
        await loadData();
      } catch (error: any) {
        showToast.error(error?.response?.data?.message || "Thao tác thất bại");
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
        const result = await liveSessionApiService.reviewSongRequest(songRequestId, {
          action: "approve",
        });
        if (result.status?.toUpperCase() === "REJECTED") {
          showToast.error(result.rejectReason || "Bị từ chối bởi trạm phát");
        } else {
          showToast.success("Đã duyệt yêu cầu");
        }
        await loadData();
      } catch (error: any) {
        showToast.error(error?.response?.data?.message || "Duyệt thất bại");
      }
    },
    [loadData],
  );

  const handleReject = useCallback(async () => {
    if (!rejectingRequestId) return;
    if (!rejectReason.trim()) {
      showToast.error("Vui lòng nhập lý do từ chối");
      return;
    }
    try {
      await liveSessionApiService.reviewSongRequest(rejectingRequestId, {
        action: "reject",
        rejectReason: rejectReason.trim(),
      });
      showToast.success("Đã từ chối yêu cầu");
      closeRejectModal();
      await loadData();
    } catch {
      showToast.error("Từ chối thất bại");
    }
  }, [rejectingRequestId, rejectReason, closeRejectModal, loadData]);

  const openViewRequestModal = useCallback((req: SongRequestResult) => {
    setViewingRequest(req);
    setViewRequestModalOpen(true);
  }, []);

  const closeViewRequestModal = useCallback(() => {
    setViewRequestModalOpen(false);
    setViewingRequest(null);
  }, []);

  const handleBack = useCallback(() => {
    navigate("/host/sessions");
  }, [navigate]);

  const handleRefresh = useCallback(() => {
    void loadData();
  }, [loadData]);

  const handleRestartSession = async () => {
    if (!sessionId) return;
    const confirmed = await confirm("Kết nối của tất cả người nghe sẽ bị ngắt trong khoảng 10 giây. Bạn có chắc chắn muốn khởi động lại trạm phát sóng?");
    if (!confirmed) return;
    try {
      await liveSessionApiService.restartLiveSession(sessionId);
      showToast.success("Đã yêu cầu Restart Broadcasting");
    } catch {
      showToast.error("Restart thất bại");
    }
  };

  const handleReloadSession = async () => {
    if (!sessionId) return;
    try {
      await liveSessionApiService.reloadLiveSession(sessionId);
      showToast.success("Đã yêu cầu Reload Config");
    } catch {
      showToast.error("Reload thất bại");
    }
  };

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
      showToast.error("Không thể gửi đoạn trò chuyện");
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!sessionId) return;
    const confirmed = await confirm("Bạn muốn xóa đoạn trò chuyện này?");
    if (!confirmed) return;
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
      showToast.success(`Đã yêu cầu xóa đoạn trò chuyện của ${deletedName}`);
    } catch (err) {
      console.error("[HostLiveSessionDetail] DeleteChat error:", err);
      showToast.error("Không thể xóa đoạn trò chuyện. Vui lòng thử lại sau.");
    }
  };

  const handleToggleMic = useCallback(async () => {
    if (!sessionId) return;

    if (isMicActive) {
      // ── Tắt mic ──
      isMicActiveRef.current = false;          // Cập nhật ref NGAY LẬP TỨC trước setState
      hostPeerConnsRef.current.forEach(pc => pc.close());
      hostPeerConnsRef.current.clear();
      localStreamRef.current?.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
      setIsMicActive(false);
      setMicError(null);
      try {
        await liveHubService.stopMicrophone(sessionId);
      } catch { /* ignore disconnect errors */ }
      showToast.success("Đã tắt mic");
    } else {
      // ── Bật mic ──
      setMicError(null);
      try {
        const audioConstraints = selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : true;
        const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints, video: false });
        localStreamRef.current = stream;

        // Cập nhật lại device để lấy được tên hiển thị sau khi đã cấp quyền permission
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter((d) => d.kind === "audioinput");
        setAudioDevices(audioInputs);

        // Gửi thông báo lên hub (backend chỉ cần biết host connectionId, sdpOffer được bỏ qua)
        isMicActiveRef.current = true;         // Cập nhật ref NGAY LẬP TỨC trước setState
        await liveHubService.startMicrophone(sessionId, "");
        setIsMicActive(true);
        showToast.success("Mic đang bật — Listeners có thể nghe bạn");
      } catch (err: any) {
        isMicActiveRef.current = false;        // rollback nếu lỗi
        const msg = err?.name === "NotAllowedError"
          ? "Trình duyệt chưa cấp quyền micro. Vui lòng cho phép trong cài đặt."
          : `Không thể bật mic: ${err?.message ?? err}`;
        setMicError(msg);
        showToast.error(msg);
      }
    }
  }, [isMicActive, sessionId]);

  const formattedSchedules = useMemo(
    () => {
      return schedules.map((item) => {
        let startStr = "Invalid Date";
        let endStr = "Invalid Date";

        if (item.startDate && item.startTime && item.endTime) {
          const startDateTime = new Date(`${item.startDate}T${item.startTime}`);
          const endDateTime = new Date(`${item.startDate}T${item.endTime}`);

          // Nếu giờ kết thúc nhỏ hơn giờ bắt đầu (vd: 22:00 -> 02:00), nghĩa là kéo dài qua ngày hôm sau
          if (endDateTime < startDateTime) {
            endDateTime.setDate(endDateTime.getDate() + 1);
          }

          if (!isNaN(startDateTime.getTime())) {
            startStr = startDateTime.toLocaleString(LOCALE_VIETNAMESE);
          }
          if (!isNaN(endDateTime.getTime())) {
            endStr = endDateTime.toLocaleString(LOCALE_VIETNAMESE);
          }
        }

        return {
          ...item,
          displayRange: `${startStr} - ${endStr}`,
        };
      });
    },
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
          {/* Host Mic Control Button */}
          <div style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 8 }}>
            {audioDevices.length > 0 && (
              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                disabled={isMicActive || session?.status !== "Live"}
                style={{
                  padding: "8px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  background: "var(--layer-2)",
                  color: "var(--text-1)",
                  border: "1px solid var(--border-color)",
                  maxWidth: "180px",
                  outline: "none",
                  cursor: "pointer"
                }}
                title="Chọn Microphone"
              >
                {audioDevices.map((device, idx) => (
                  <option key={device.deviceId || idx} value={device.deviceId}>
                    {device.label || `Microphone ${idx + 1}`}
                  </option>
                ))}
              </select>
            )}

            <button
              className={`host-live-btn ${isMicActive ? "host-live-btn-mic active" : "host-live-btn-mic"}`}
              onClick={() => void handleToggleMic()}
              disabled={session?.status !== "Live"}
              title={session?.status !== "Live" ? "Chỉ mở mic khi đang Live" : isMicActive ? "Tắt mic" : "Bật mic"}
            >
              {isMicActive ? <MicOff size={15} /> : <Mic2 size={15} />}
              {isMicActive ? "Đang phát mic" : "Bật Mic"}
              {isMicActive && <span className="host-live-mic-pulse" />}
            </button>
            {micError && (
              <span style={{ position: "absolute", bottom: "-20px", left: 0, fontSize: "11px", color: "#ef4444", whiteSpace: "nowrap" }}>
                Lỗi: {micError}
              </span>
            )}
          </div>
          <button className="host-live-btn host-live-btn--ghost" onClick={handleRefresh}>
            <RefreshCw size={15} />
            Làm mới
          </button>
          <button className="host-live-btn host-live-btn--ghost" onClick={handleReloadSession} title="Reload AzuraCast config mà không ngắt kết nối">
            Reload Config
          </button>
          <button className="host-live-btn host-live-btn--ghost" onClick={handleRestartSession} title="Khởi động lại toàn bộ trạm phát sóng (ngắt kết nối)">
            Restart Broadcast
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
                <div className="host-live-stat-value">{getLiveListenersCount(session, nowPlaying)}</div>
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
                  {nowPlaying.currentTrack.duration && nowPlaying.currentTrack.duration > 0 && (
                    <div style={{ marginTop: "4px" }}>
                      <div style={{ width: "100%", height: "4px", background: "var(--neutral-200)", borderRadius: "2px", overflow: "hidden" }}>
                        <div style={{ width: `${Math.min((nowPlaying.currentTrack.elapsed / nowPlaying.currentTrack.duration) * 100, 100)}%`, height: "100%", background: "#55c5f1" }}></div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "2px", fontSize: "10px", color: "var(--neutral-500)" }}>
                        <span>{Math.floor(nowPlaying.currentTrack.elapsed / 60)}:{Math.floor(nowPlaying.currentTrack.elapsed % 60).toString().padStart(2, '0')}</span>
                        <span>{Math.floor(nowPlaying.currentTrack.duration / 60)}:{Math.floor(nowPlaying.currentTrack.duration % 60).toString().padStart(2, '0')}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Local Volume Control & Actions cho Host */}
                {session?.streamUrl && session.status === "Live" && (
                  <div style={{ display: "flex", gap: "24px", alignItems: "center", marginTop: "8px" }}>
                    {/* Âm lượng nhạc trên stream của khán giả */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center", minWidth: 100 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", alignSelf: "center", textAlign: "center" }}>
                        Khán giả nghe<br />(Toàn hệ thống)
                      </span>
                      <input
                        type="range"
                        className="host-live-volume-slider system-volume"
                        min={0}
                        max={1}
                        step={0.01}
                        defaultValue={1.0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          handleVolumeSync(val);
                          e.target.style.background = `linear-gradient(to right, currentColor ${val * 100}%, rgba(255,255,255,0.2) ${val * 100}%)`;
                        }}
                        title="Điều chỉnh âm lượng nhạc nền cho TẤT CẢ khán giả đang nghe"
                      />
                    </div>
                    {/* Âm lượng nhạc trên tai nghe/loa của Host */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center", minWidth: 100 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", alignSelf: "center", textAlign: "center" }}>
                        Host nghe<br />(Riêng máy bạn)
                      </span>
                      <input
                        type="range"
                        className="host-live-volume-slider local-volume"
                        min={0}
                        max={1}
                        step={0.01}
                        defaultValue={1.0}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          const audio = document.getElementById("host-local-audio") as HTMLAudioElement;
                          if (audio) audio.volume = val;
                          e.target.style.background = `linear-gradient(to right, currentColor ${val * 100}%, rgba(255,255,255,0.2) ${val * 100}%)`;
                        }}
                        title="Chỉnh âm lượng nhạc mà BẠN nghe thấy (không ảnh hưởng tới khán giả)"
                      />
                      <audio
                        id="host-local-audio"
                        src={session.streamUrl.replace(/host\.docker\.internal(:\d+)?/gi, "localhost:5000")}
                        autoPlay
                        onLoadedMetadata={(e) => { (e.target as HTMLAudioElement).volume = 1.0; }}
                      />
                    </div>

                    {/* Nút Skip */}
                    <button
                      className="host-live-btn-skip"
                      title="Chuyển sang bài tiếp theo (Bỏ qua bài này)"
                      onClick={async () => {
                        const confirmSkip = await confirm("Bạn có chắc chắn muốn bỏ qua (Skip) bài hát này không?");
                        if (!confirmSkip) return;

                        try {
                          await liveSessionApiService.skipTrack(sessionId);
                          showToast.success("Yêu cầu skip bài đã được gửi. Đang đợi hệ thống xử lý...");
                        } catch (err) {
                          console.error("Lỗi khi skip bài", err);
                          showToast.error("Không thể qua bài lúc này. Vui lòng thử lại sau.");
                        }
                      }}
                    >
                      <SkipForward size={22} />
                    </button>
                  </div>
                )}
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
          <h3 className="host-live-card-title">Bài hát tiếp theo</h3>
          <div className="host-live-stack">
            {queue.length === 0 ? (
              <div className="host-live-empty">Hàng đợi trống</div>
            ) : (
              queue.slice(0, 15).map((item, index) => (
                <div key={item.shId || index} className="host-live-track-item">
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {item.artUrl ? (
                      <img src={item.artUrl.replace("host.docker.internal", "localhost")} alt="cover" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 36, height: 36, borderRadius: 6, background: 'var(--neutral-200)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Music size={16} color="var(--neutral-400)" />
                      </div>
                    )}
                    <div>
                      <div className="host-live-track-title" style={{ fontSize: 13, marginBottom: 1 }}>{item.title || "Không rõ"}</div>
                      <div className="host-live-track-subtitle" style={{ fontSize: 11 }}>{item.artist || "Không rõ nghệ sĩ"}</div>
                      {item.isRequest && (
                        <div className="host-live-badge host-live-badge--pending" style={{ padding: "2px 6px", fontSize: 9, marginTop: 4 }}>Yêu cầu</div>
                      )}
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
              songRequests.slice((songRequestPage - 1) * requestsPerPage, songRequestPage * requestsPerPage).map((item) => (
                <div key={item.id} className="host-live-track-item host-live-request-item" onClick={() => openViewRequestModal(item)}>
                  <div style={{ flex: 1, cursor: "pointer", minWidth: 0 }}>
                    <div className="host-live-track-title" style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}>{item.songTitle}</div>
                    <div className="host-live-track-subtitle" style={{
                      fontStyle: item.message ? "normal" : "italic",
                      color: item.message ? "inherit" : "var(--neutral-400)",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      wordBreak: "break-word",
                      overflowWrap: "anywhere"
                    }}>
                      {item.message || "Không có tin nhắn"}
                    </div>
                    <div className={`host-live-badge host-live-badge--${item.status?.toLowerCase()}`} style={{ marginTop: 4 }}>
                      {item.status}
                    </div>
                  </div>
                  {item.status === "PENDING" || item.status === "Pending" ? (
                    <div className="host-live-inline-row" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="host-live-btn host-live-btn--approve"
                        onClick={(e) => { e.stopPropagation(); void handleApprove(item.id); }}
                      >
                        Duyệt
                      </button>
                      <button
                        className="host-live-btn host-live-btn--reject"
                        onClick={(e) => { e.stopPropagation(); openRejectModal(item.id); }}
                      >
                        Từ chối
                      </button>
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
          {songRequests.length > requestsPerPage && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-color)", paddingTop: "10px" }}>
              <button
                className="host-live-btn host-live-btn--ghost"
                disabled={songRequestPage <= 1}
                onClick={() => setSongRequestPage(p => Math.max(1, p - 1))}
                style={{ padding: "4px 8px", fontSize: "12px", background: "var(--layer-2)" }}
              >
                Trước
              </button>
              <span style={{ fontSize: "12px", color: "var(--text-2)", fontWeight: 500 }}>
                Trang {songRequestPage} / {Math.max(1, Math.ceil(songRequests.length / requestsPerPage))}
              </span>
              <button
                className="host-live-btn host-live-btn--ghost"
                disabled={songRequestPage >= Math.ceil(songRequests.length / requestsPerPage)}
                onClick={() => setSongRequestPage(p => p + 1)}
                style={{ padding: "4px 8px", fontSize: "12px", background: "var(--layer-2)" }}
              >
                Sau
              </button>
            </div>
          )}
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

      {/* View Request Modal */}
      {viewRequestModalOpen && viewingRequest && (
        <div
          className="host-live-modal-overlay"
          onClick={(e) => e.target === e.currentTarget && closeViewRequestModal()}
        >
          <div className="host-live-modal" style={{ maxWidth: 500 }}>
            <div className="host-live-modal-header">
              <h3 className="host-live-modal-title">
                <Music size={18} style={{ marginRight: 8, color: "var(--neutral-500)" }} />
                Chi tiết yêu cầu
              </h3>
              <button className="host-live-modal-close" onClick={closeViewRequestModal}>
                <X size={16} />
              </button>
            </div>
            <div className="host-live-modal-body" style={{ marginTop: 20, textAlign: "left" }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: "var(--neutral-500)", marginBottom: 4, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>Bài hát yêu cầu</div>
                <div style={{ fontSize: 20, fontWeight: 800, wordBreak: "break-word", overflowWrap: "anywhere" }}>{viewingRequest.songTitle}</div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: "var(--neutral-500)", marginBottom: 4, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>Trạng thái</div>
                <div className={`host-live-badge host-live-badge--${viewingRequest.status?.toLowerCase()}`}>
                  {viewingRequest.status}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "var(--neutral-500)", marginBottom: 6, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>Thư từ người gửi</div>
                <div style={{
                  background: "var(--layer-2)",
                  padding: "16px 20px",
                  borderRadius: 12,
                  fontSize: 15,
                  lineHeight: 1.6,
                  fontStyle: viewingRequest.message ? "normal" : "italic",
                  color: viewingRequest.message ? "var(--text-1)" : "var(--neutral-400)",
                  border: "1px solid var(--border-color)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  overflowWrap: "anywhere"
                }}>
                  {viewingRequest.message || "Không có lời nhắn nào được gửi kèm."}
                </div>
              </div>
            </div>
            <div className="host-live-modal-actions" style={{ marginTop: 28, justifyContent: "flex-end" }}>
              <button className="host-live-modal-btn-cancel" onClick={closeViewRequestModal} style={{ padding: "8px 24px" }}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
