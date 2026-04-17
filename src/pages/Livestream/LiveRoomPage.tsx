/**
 * LiveRoomPage — Listener UI for a live session.
 *
 * All audio, SignalR, polling and nowPlaying state are now owned by
 * LiveSessionContext (following the mobile AudioPlayerContext pattern).
 * This component is a pure UI layer — it joins the session on mount but
 * does NOT stop audio when the user navigates away (mini-player continues).
 */
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import EmojiPicker from "emoji-picker-react";
import {
  ArrowLeft,
  Radio,
  Users,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Send,
  Disc3,
  RefreshCw,
  MessageSquare,
  Music,
  X,
  Search,
  History,
  Clock,
  Smile,
  MoreVertical,
  Mic2,
  MicOff,
} from "lucide-react";
import { showToast } from "../../utils/toast";
import { liveSessionApiService } from "../../services/liveSessionApiService";
import type { SongRequestResult } from "../../services/liveSessionApiService";
import { useLiveSession } from "../../context/LiveSessionContext";
import { usePlayer } from "../../context/PlayerContext";
import { liveHubService } from "../../services/liveHubService";
import "./LiveRoomPage.css";

// ─── Types (local UI only) ────────────────────────────────────────────────────

interface LyricLine {
  time: number;
  text: string;
}

type AuthPopupMode = "guestLimit" | "requestSong";

interface RequestSongItem {
  id: string;
  title: string;
  artist: string;
  album?: string | null;
  artUrl?: string | null;
}

interface SystemMusicItem {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  artUrl?: string | null;
  artworkUrl?: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DEFAULT_LYRICS_OFFSET_SEC = 1;
const LIVE_STREAM_LATENCY_COMPENSATION_MS = 3000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseLyrics(lrc: string | null | undefined): LyricLine[] {
  if (!lrc) return [];
  const result: LyricLine[] = [];
  for (const rawLine of lrc.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    const matches = Array.from(line.matchAll(/\[(\d{2}):(\d{2})(?:\.(\d{1,3}))?\]/g));
    if (!matches.length) continue;
    const text = line.replace(/\[(\d{2}):(\d{2})(?:\.(\d{1,3}))?\]/g, "").trim();
    if (!text) continue;
    for (const match of matches) {
      const min = parseInt(match[1], 10);
      const sec = parseInt(match[2], 10);
      const fraction = match[3] ?? "";
      const ms = fraction ? parseInt(fraction.padEnd(3, "0").slice(0, 3), 10) : 0;
      result.push({ time: min * 60 * 1000 + sec * 1000 + ms, text });
    }
  }
  return result.sort((a, b) => a.time - b.time);
}

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

function tryParseJwtUserId(token: string | null): string | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const payload = JSON.parse(atob(padded));
    const sub = String(payload?.sub ?? "").trim();
    return GUID_REGEX.test(sub) ? sub : null;
  } catch { return null; }
}

function getCurrentUserId(): string | null {
  try {
    const raw = localStorage.getItem("userInfo");
    if (raw) {
      const parsed = JSON.parse(raw);
      const id = String(parsed?.id ?? parsed?.userId ?? "").trim();
      if (GUID_REGEX.test(id)) return id;
    }
  } catch { /* ignore */ }
  return tryParseJwtUserId(localStorage.getItem("accessToken"));
}

function getCurrentUserName(): string {
  try {
    const raw = localStorage.getItem("userInfo");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.firstName && parsed.lastName) return `${parsed.lastName} ${parsed.firstName}`;
      return parsed.username || parsed.email || "Ẩn danh";
    }
  } catch { /* ignore */ }
  return "Ẩn danh";
}

function getCurrentUserAvatar(): string {
  try {
    const raw = localStorage.getItem("userInfo");
    if (raw) { const parsed = JSON.parse(raw); return parsed.avatarUrl || ""; }
  } catch { /* ignore */ }
  return "";
}

function getCurrentUserRole(): string {
  try {
    const raw = localStorage.getItem("userInfo");
    if (raw) { const parsed = JSON.parse(raw); return parsed.role || "User"; }
  } catch { /* ignore */ }
  return "User";
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LiveRoomPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  // ── All live session state comes from context ─────────────────────────────
  const {
    activeSession: session,
    nowPlaying,
    chatMessages: ctxChatMessages,
    listeners,
    isPlaying,
    isLoading: ctxLoading,
    isMuted,
    volume,
    displayElapsed: elapsed,
    sessionEnded: ended,
    joinLiveRoom,
    toggleAudio,
    toggleMute,
    setVolume,
    sendChat: ctxSendChat,
    deleteChat: ctxDeleteChat,
  } = useLiveSession();

  // Stop PlayerContext audio (podcast etc.) so it doesn't play over the live stream
  const { leaveSession: stopPlayerContextAudio } = usePlayer();

  // ── Local UI state only ───────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeDotMenu, setActiveDotMenu] = useState<string | null>(null);
  const [activeChatTab, setActiveChatTab] = useState<"chat" | "history" | "lyrics">("chat");
  const [upNextHistory, setUpNextHistory] = useState<any[]>([]);
  const [playedHistory, setPlayedHistory] = useState<any[]>([]);
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [authPopupMode, setAuthPopupMode] = useState<AuthPopupMode>("guestLimit");
  const [manualSyncBaseMs, setManualSyncBaseMs] = useState<number | null>(null);
  const [manualSyncClockMs, setManualSyncClockMs] = useState<number | null>(null);
  const [adjustedElapsedMs, setAdjustedElapsedMs] = useState(0);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestSearch, setRequestSearch] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestableSongs, setRequestableSongs] = useState<RequestSongItem[]>([]);
  const [requestedSongIds, setRequestedSongIds] = useState<Set<string>>(new Set());
  const [listeningTime, setListeningTime] = useState(0); // kept for type safety (unused — timer moved to context)
  const guestLimitReachedRef = useRef(false);

  // ── Mic state (Host & Listener) ───────────────────────────────────────────
  const [isMicActive, setIsMicActive] = useState(false);          // Host: mic đang bật
  const [hostMicActive, setHostMicActive] = useState(false);      // Listener: Host đang nói
  const [micError, setMicError] = useState<string | null>(null);  // Lỗi mic

  // ── WebRTC refs ───────────────────────────────────────────────────────────
  const localStreamRef = useRef<MediaStream | null>(null);                            // Host mic stream
  const hostPeerConnsRef = useRef<Map<string, RTCPeerConnection>>(new Map());         // Host: map listenerConnId → RTCPeerConnection
  const listenerPeerConnRef = useRef<RTCPeerConnection | null>(null);                 // Listener: connection to host
  const listenerMicAudioRef = useRef<HTMLAudioElement | null>(null);                  // Listener: audio element for host mic

  const STUN_SERVERS: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ];

  // ── Host: hàm mở mic và bắt đầu broadcast ─────────────────────────────────
  const handleToggleMic = useCallback(async () => {
    const sid = sessionIdRef.current;
    if (!sid) return;

    if (isMicActive) {
      // ── Tắt mic ──
      // Dừng tất cả peer connections
      hostPeerConnsRef.current.forEach(pc => pc.close());
      hostPeerConnsRef.current.clear();
      // Dừng local stream
      localStreamRef.current?.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
      setIsMicActive(false);
      setMicError(null);
      try {
        await liveHubService.stopMicrophone(sid);
      } catch { /* ignore disconnect errors */ }
      showToast.success("Đã tắt mic");
    } else {
      // ── Bật mic ──
      setMicError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        localStreamRef.current = stream;

        // Gửi SDP offer tạm thời để báo Hub "host đang bật mic"
        // Listeners sẽ subscribe sau khi nhận HostMicStarted
        const tempPc = new RTCPeerConnection({ iceServers: STUN_SERVERS });
        stream.getAudioTracks().forEach(track => tempPc.addTrack(track, stream));
        const offer = await tempPc.createOffer();
        tempPc.close(); // Chỉ dùng để tạo SDP, không kết nối thực sự

        await liveHubService.startMicrophone(sid, offer.sdp ?? "");
        setIsMicActive(true);
        showToast.success("Mic đang bật — Listeners có thể nghe bạn");
      } catch (err: any) {
        const msg = err?.name === "NotAllowedError"
          ? "Trình duyệt chưa cấp quyền micro. Vui lòng cho phép trong cài đặt."
          : `Không thể bật mic: ${err?.message ?? err}`;
        setMicError(msg);
        showToast.error(msg);
      }
    }
  }, [isMicActive]);

  // ── Host: xử lý khi Listener muốn subscribe ────────────────────────────────
  useEffect(() => {
    if (currentUserRoleRef.current !== "Host") return;
    const sid = sessionIdRef.current;
    if (!sid) return;

    const off = liveHubService.onListenerWantsToSubscribe(async (sessionId, listenerConnId, sdpOffer) => {
      if (sessionId !== sid || !isMicActive || !localStreamRef.current) return;

      // Tạo RTCPeerConnection mới cho listener này
      const pc = new RTCPeerConnection({ iceServers: STUN_SERVERS });
      hostPeerConnsRef.current.set(listenerConnId, pc);

      // Thêm audio track vào connection
      localStreamRef.current.getAudioTracks().forEach(track =>
        pc.addTrack(track, localStreamRef.current!)
      );

      // ICE candidate relay
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

      // Set remote description (listener's offer)
      await pc.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp: sdpOffer }));
      // Create + set answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      // Send answer back to listener via Hub
      await liveHubService.hostAnswerListener(sessionId, listenerConnId, answer.sdp ?? "");
    });

    return () => off();
  }, [isMicActive]);

  // ── Listener: xử lý khi Host bật mic ──────────────────────────────────────
  useEffect(() => {
    const sid = sessionIdRef.current;
    if (!sid) return;

    const offStarted = liveHubService.onHostMicStarted(async (sessionId) => {
      if (sessionId !== sid) return;
      setHostMicActive(true);

      // Tạo RTCPeerConnection để nhận audio từ Host
      const pc = new RTCPeerConnection({ iceServers: STUN_SERVERS });
      listenerPeerConnRef.current = pc;

      pc.ontrack = (evt) => {
        // Tạo audio element để phát
        let audioEl = listenerMicAudioRef.current;
        if (!audioEl) {
          audioEl = new Audio();
          audioEl.autoplay = true;
          listenerMicAudioRef.current = audioEl;
        }
        const [stream] = evt.streams;
        audioEl.srcObject = stream;
        void audioEl.play().catch(() => {});
      };

      pc.onicecandidate = (evt) => {
        if (evt.candidate) {
          void liveHubService.iceCandidateRelay(sessionId, "", JSON.stringify(evt.candidate));
        }
      };

      // SDP offer để gửi Host (listener muốn nhận track)
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await liveHubService.listenerRequestMic(sessionId, offer.sdp ?? "");
    });

    const offStopped = liveHubService.onHostMicStopped((sessionId) => {
      if (sessionId !== sid) return;
      setHostMicActive(false);
      // Dừng playback
      if (listenerMicAudioRef.current) {
        listenerMicAudioRef.current.pause();
        listenerMicAudioRef.current.srcObject = null;
        listenerMicAudioRef.current = null;
      }
      listenerPeerConnRef.current?.close();
      listenerPeerConnRef.current = null;
    });

    const offAnswer = liveHubService.onReceiveHostAnswer(async (sessionId, sdpAnswer) => {
      if (sessionId !== sid || !listenerPeerConnRef.current) return;
      await listenerPeerConnRef.current.setRemoteDescription(
        new RTCSessionDescription({ type: "answer", sdp: sdpAnswer })
      );
    });

    const offIce = liveHubService.onReceiveIceCandidate(async (sessionId, candidateStr) => {
      if (sessionId !== sid) return;

      try {
        const candidate = JSON.parse(candidateStr) as RTCIceCandidateInit;
        // Check if we're host or listener
        const isHost = currentUserRoleRef.current === "Host";
        if (isHost) {
          // Find the right peer connection — we need targetConnId but ICE relay target is ambiguous here
          // In practice, host handles it per-connection via raw WebRTC
          hostPeerConnsRef.current.forEach(async (pc) => {
            if (pc.remoteDescription) {
              await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
            }
          });
        } else {
          if (listenerPeerConnRef.current?.remoteDescription) {
            await listenerPeerConnRef.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
          }
        }
      } catch { /* ignore parse errors */ }
    });

    return () => {
      offStarted();
      offStopped();
      offAnswer();
      offIce();
    };
  }, [sessionId]);

  // ── Cleanup WebRTC on unmount ─────────────────────────────────────────────
  useEffect(() => {
    return () => {
      // Không dừng mic hoàn toàn khi navigate — chỉ cleanup khi component unmount hẳn
      // Các peer connections và stream tự cleanup khi tabclose
    };
  }, []);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const lyricsContainerRef = useRef<HTMLDivElement | null>(null);
  const isPlayingRef = useRef(isPlaying);
  const prevTrackIdRef = useRef<number | undefined>(undefined);
  const prevTrackDataRef = useRef<any | null>(null);
  const sessionIdRef = useRef<string | undefined>(sessionId);

  // Cache user info refs
  const currentUserIdRef = useRef<string | null>(getCurrentUserId());
  const currentUserNameRef = useRef<string>(getCurrentUserName());
  const currentUserAvatarRef = useRef<string>(getCurrentUserAvatar());
  const currentUserRoleRef = useRef<string>(getCurrentUserRole());

  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);

  // ── Join live room on mount (context handles dedup) ───────────────────────
  useEffect(() => {
    if (!sessionId) return;
    // Stop any PlayerContext audio (podcast etc.) to avoid double playback
    stopPlayerContextAudio();
    const userId = getCurrentUserId();
    void joinLiveRoom(sessionId, userId).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // ── Sync context loading state ────────────────────────────────────────────
  useEffect(() => {
    if (!ctxLoading) setLoading(false);
  }, [ctxLoading]);

  // ── Map context chatMessages → local DisplayChat format ───────────────────
  const chats = useMemo(() => ctxChatMessages.map(msg => ({
    id: msg.id,
    userId: msg.userId || "",
    userName: msg.userName || `User-${(msg.userId || "?").slice(0, 6)}`,
    avatarUrl: msg.avatarUrl || "",
    message: msg.message,
    createdAt: msg.createdAt,
    isDeleted: msg.isDeleted,
    isSystem: false,
  })), [ctxChatMessages]);

  // ── Lyrics ────────────────────────────────────────────────────────────────
  const currentLyricsStr = nowPlaying?.currentTrack?.lyrics ?? null;
  const parsedLyrics = useMemo(() => parseLyrics(currentLyricsStr), [currentLyricsStr]);

  // Auto-clear manual override when API data updates nowPlaying
  useEffect(() => {
    setManualSyncBaseMs(null);
    setManualSyncClockMs(null);
  }, [nowPlaying]);

  // Update adjustedElapsedMs every 500ms based on context elapsed updates
  useEffect(() => {
    if (!isPlayingRef.current) return;

    if (manualSyncBaseMs !== null && manualSyncClockMs !== null) {
      // Use manual override timing
      const delta = Date.now() - manualSyncClockMs;
      setAdjustedElapsedMs(manualSyncBaseMs + delta);
    } else {
      // Use true server timing
      const elapsedSec = elapsed;
      const wallClockMs = elapsedSec * 1000;
      setAdjustedElapsedMs(Math.max(0, wallClockMs - LIVE_STREAM_LATENCY_COMPENSATION_MS));
    }
  }, [elapsed, manualSyncBaseMs, manualSyncClockMs]);

  const activeLyricIndex = useMemo(() => {
    if (!parsedLyrics.length) return -1;
    let idx = -1;
    for (let i = 0; i < parsedLyrics.length; i++) {
      if (adjustedElapsedMs >= parsedLyrics[i].time) idx = i;
      else break;
    }
    return idx;
  }, [parsedLyrics, adjustedElapsedMs]);

  // Scroll lyrics into view
  useEffect(() => {
    if (activeLyricIndex >= 0 && lyricsContainerRef.current) {
      const activeEl = lyricsContainerRef.current.querySelector(
        ".lr-lyric-sync-line.active, .lr-lyric-line.active"
      ) as HTMLElement | null;
      if (activeEl) activeEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeLyricIndex]);

  // ── Track change: update up-next / played history ─────────────────────────
  useEffect(() => {
    const current = nowPlaying?.currentTrack;
    const next = nowPlaying?.playingNext;
    const currentId = current?.shId;
    if (!current) return;
    const prevId = prevTrackIdRef.current;
    if (prevId !== currentId) {
      if (prevId !== undefined && prevTrackDataRef.current) {
        setPlayedHistory(prev => [prevTrackDataRef.current!, ...prev].slice(0, 10));
      }
      setUpNextHistory(next ? [next] : []);
      prevTrackDataRef.current = current;
      prevTrackIdRef.current = currentId;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nowPlaying?.currentTrack?.shId, nowPlaying?.playingNext?.shId]);

  // ── Auto-scroll chat ──────────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats]);

  // ── Guest preview limit — listen to global event from LiveSessionContext ──
  // Timer now runs in context (survives navigation). Page only shows the popup.
  useEffect(() => {
    const handleGuestLimit = () => {
      if (guestLimitReachedRef.current) return;
      guestLimitReachedRef.current = true;
      setAuthPopupMode("guestLimit");
      setShowAuthPopup(true);
    };
    window.addEventListener("guestLimitReached", handleGuestLimit);
    return () => window.removeEventListener("guestLimitReached", handleGuestLimit);
  }, []);

  // ── Song request ──────────────────────────────────────────────────────────
  const loadRequestableSongs = useCallback(async () => {
    if (!session?.stationId) return;
    setRequestLoading(true);
    try {
      const stationSongs = await liveSessionApiService.getStationMusic(String(session.stationId));
      setRequestableSongs(stationSongs.map((song: SystemMusicItem) => ({
        id: song.id, title: song.title, artist: song.artist,
        album: song.album, artUrl: song.artworkUrl || song.artUrl || null,
      })));
    } catch (err) {
      console.warn("[LiveRoomPage] loadRequestableSongs failed:", err);
      setRequestableSongs([]);
    } finally {
      setRequestLoading(false);
    }
  }, [session?.stationId]);

  const handleRequestSong = async (song: RequestSongItem) => {
    const userId = getCurrentUserId();
    if (!userId || !GUID_REGEX.test(userId)) {
      setAuthPopupMode("requestSong"); setShowAuthPopup(true); return;
    }
    const sid = sessionIdRef.current;
    if (!sid) return;
    try {
      await liveSessionApiService.createSongRequest(sid, {
        mediaFileId: song.id, message: requestMessage.trim() || undefined,
      });
      setRequestedSongIds(prev => new Set([...prev, song.id]));
      setRequestMessage("");
      showToast.success(`Đã gửi yêu cầu "${song.title}" - đang chờ host duyệt`);
    } catch (err: any) {
      if (err?.response?.status === 401 || err?.status === 401) {
        setAuthPopupMode("requestSong"); setShowAuthPopup(true);
      } else {
        showToast.error("Không thể gửi yêu cầu. Vui lòng thử lại.");
      }
    }
  };

  // ── Chat ──────────────────────────────────────────────────────────────────
  const handleSendChat = async () => {
    if (!chatInput.trim() || !sessionIdRef.current) return;
    const userId = getCurrentUserId();
    if (!userId) {
      showToast.error("Vui lòng đăng nhập để gửi tin nhắn"); return;
    }
    try {
      ctxSendChat(sessionIdRef.current, userId, chatInput.trim(), getCurrentUserName(), getCurrentUserAvatar());
      setChatInput("");
    } catch (err) {
      showToast.error("Không thể gửi tin nhắn. Vui lòng thử lại.");
    }
  };

  const handleChatKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (chatInput.trim()) { void handleSendChat(); e.currentTarget.style.height = "40px"; }
    }
  };

  const formatChatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

  const handleNavigate = (path: string) => {
    // Do NOT call leaveLiveRoom — audio continues in mini-player
    navigate(path);
  };

  // ── Volume control ────────────────────────────────────────────────────────
  const handleVolumeChange = (v: number) => setVolume(v);

  // ── Render guards ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="lr-page">
        <div className="lr-loading">
          <RefreshCw size={28} className="lr-spin" />
          <p>Đang tải phòng phát sóng...</p>
        </div>
      </div>
    );
  }

  if (ended || !session) {
    return (
      <div className="lr-page">
        <div className="lr-ended">
          <Radio size={56} />
          <h2>Phiên phát sóng đã kết thúc</h2>
          <p>Cảm ơn bạn đã tham gia! Hãy quay lại để khám phá các phiên mới.</p>
          <button className="lr-ended-btn" onClick={() => handleNavigate("/live")}>
            Quay lại danh sách Live
          </button>
        </div>
      </div>
    );
  }

  const track = nowPlaying?.currentTrack;
  const duration = track?.duration ?? 0;
  const progress = duration > 0 ? Math.min((elapsed / duration) * 100, 100) : 0;

  return (
    <div className="lr-page user-theme-wrapper">
      {/* Topbar */}
      <div className="lr-topbar">
        <div className="lr-topbar-left">
          <button className="lr-back-btn" onClick={() => handleNavigate("/live")}>
            <ArrowLeft size={18} />
          </button>
          <div className="lr-session-info">
            <h2 className="lr-session-title">{session.sessionName}</h2>
            <p className="lr-session-station">
              <Radio size={11} />
              {nowPlaying?.stationName || session.stationName || "Station"}
            </p>
          </div>
        </div>
        <div className="lr-topbar-right">
          <span className="lr-live-indicator">
            {session?.status?.toLowerCase() === "live" ? "LIVE" : "OFFLINE"}
          </span>
          <span className="lr-listeners-count">
            <Users size={13} />
            {listeners} đang nghe
          </span>
        </div>
      </div>

      {/* Main: Player + Chat */}
      <div className="lr-main">
        {/* Player Panel */}
        <div className="lr-player-panel">
          <div className="lr-artwork-section">
            <div className={`lr-artwork ${isPlaying ? "playing" : ""}`}>
              {track?.artUrl ? (
                <img src={track.artUrl} alt={track.title} />
              ) : (
                <Disc3 size={64} className="lr-artwork-icon" />
              )}
            </div>

            <div className="lr-track-info-card">
              <div className="lr-track-info-text">
                <h2 className="lr-track-name">{track?.title || "Đang tải..."}</h2>
                <p className="lr-track-artist">{track?.artist || ""}</p>
                {track?.album && <p className="lr-track-album">{track.album}</p>}
              </div>

              {/* Host Mic Badge — visible to listeners khi Host đang nói */}
              {hostMicActive && currentUserRoleRef.current !== "Host" && (
                <div className="lr-host-speaking-badge">
                  <span className="lr-host-speaking-dot" />
                  <Mic2 size={13} />
                  Host đang nói
                </div>
              )}

              {/* Host Mic Control Button — chỉ hiện với Host */}
              {currentUserRoleRef.current === "Host" && (
                <div className="lr-host-mic-section">
                  <button
                    id="lr-host-mic-btn"
                    className={`lr-host-mic-btn ${isMicActive ? "active" : ""}`}
                    onClick={() => void handleToggleMic()}
                    title={isMicActive ? "Tắt mic" : "Bật mic nói chuyện với listeners"}
                  >
                    {isMicActive ? <MicOff size={15} /> : <Mic2 size={15} />}
                    {isMicActive ? "Tắt Mic" : "Bật Mic"}
                    {isMicActive && <span className="lr-mic-pulse-ring" />}
                  </button>
                  {micError && (
                    <p className="lr-mic-error">{micError}</p>
                  )}
                </div>
              )}

              {/* Request nhạc */}
              <button
                className="lr-request-btn"
                onClick={() => {
                  const uid = getCurrentUserId();
                  if (!uid || !GUID_REGEX.test(uid)) {
                    setAuthPopupMode("requestSong"); setShowAuthPopup(true); return;
                  }
                  setRequestMessage("");
                  setShowRequestModal(true);
                  void loadRequestableSongs();
                }}
              >
                <Music size={16} />
                Gửi Request Nhạc
              </button>
            </div>

            {/* Playing Next */}
            {nowPlaying?.playingNext && (
              <div className="lr-up-next-card">
                <div className="lr-up-next-left">
                  <span className="lr-up-next-label"><Clock size={14} /> Tiếp theo</span>
                  <div className="lr-up-next-info">
                    <div className="lr-up-next-title" title={nowPlaying.playingNext.title}>{nowPlaying.playingNext.title}</div>
                    <div className="lr-up-next-artist" title={nowPlaying.playingNext.artist}>{nowPlaying.playingNext.artist}</div>
                  </div>
                </div>
                {nowPlaying.playingNext.artUrl ? (
                  <img src={nowPlaying.playingNext.artUrl} alt={nowPlaying.playingNext.title} className="lr-up-next-art" />
                ) : (
                  <div className="lr-up-next-icon-wrap"><Disc3 size={24} className="lr-up-next-icon" /></div>
                )}
              </div>
            )}

            {/* Floating Lyrics */}
            {parsedLyrics.length > 0 && (
              <div className="lr-floating-lyrics" ref={lyricsContainerRef}>
                <div className="lr-floating-lyrics-content">
                  {activeLyricIndex >= 0 ? (
                    <div className="lr-lyric-line active" key={activeLyricIndex}>
                      {parsedLyrics[activeLyricIndex].text}
                    </div>
                  ) : (
                    <div className="lr-lyric-line waiting">
                      <Music size={16} className="lr-lyric-icon" /> Đang đợi lời bài hát...
                    </div>
                  )}
                  {activeLyricIndex + 1 < parsedLyrics.length && (
                    <div className="lr-lyric-line next" key={activeLyricIndex + 1}>
                      {parsedLyrics[activeLyricIndex + 1].text}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat Panel */}
        <div className="lr-chat-panel">
          <div className="lr-chat-tabs">
            <button className={`lr-chat-tab ${activeChatTab === "chat" ? "active" : ""}`} onClick={() => setActiveChatTab("chat")}>
              <MessageSquare size={13} /> Trò chuyện
            </button>
            <button className={`lr-chat-tab ${activeChatTab === "history" ? "active" : ""}`} onClick={() => setActiveChatTab("history")}>
              <History size={13} /> Lịch sử nhạc
            </button>
            <button className={`lr-chat-tab ${activeChatTab === "lyrics" ? "active" : ""}`} onClick={() => setActiveChatTab("lyrics")}>
              <Music size={13} /> Lyrics
            </button>
          </div>

          {activeChatTab === "chat" && (
            <>
              <div className="lr-chat-messages">
                {chats.length === 0 && (
                  <div className="lr-chat-welcome">
                    Chào mừng đến phòng phát sóng! Hãy gửi tin nhắn đầu tiên.
                  </div>
                )}
                {chats.map(chat =>
                  chat.isSystem ? (
                    <div key={chat.id} className="lr-chat-system">{chat.message}</div>
                  ) : (
                    <div key={chat.id} className="lr-chat-msg" style={{ position: "relative" }}>
                      <div className="lr-chat-avatar">
                        {chat.avatarUrl ? (
                          <img src={chat.avatarUrl} alt="avt" style={{ width: "100%", height: "100%", borderRadius: "50%" }} />
                        ) : (
                          chat.userName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="lr-chat-bubble">
                        <div className="lr-chat-user" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span>{chat.userName}</span>
                          {(currentUserRoleRef.current === "Host" || currentUserRoleRef.current === "Staff" || currentUserRoleRef.current === "Admin" || chat.userId === currentUserIdRef.current) && !chat.isDeleted && (
                            <div style={{ position: "relative" }}>
                              <button
                                className="lr-chat-more-btn"
                                onClick={() => setActiveDotMenu(activeDotMenu === chat.id ? null : chat.id)}
                                title="Thao tác"
                              >
                                <MoreVertical size={14} />
                              </button>
                              {activeDotMenu === chat.id && (
                                <div className="lr-dot-popover">
                                  <button
                                    className="lr-dot-popover-item"
                                    onClick={() => {
                                      if (sessionIdRef.current) {
                                        ctxDeleteChat(sessionIdRef.current, chat.id, currentUserIdRef.current!, currentUserRoleRef.current);
                                      }
                                      setActiveDotMenu(null);
                                    }}
                                  >
                                    Thu hồi
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        {chat.isDeleted ? (
                          <div className="lr-chat-text" style={{ fontStyle: "italic", color: "#888" }}>
                            Tin nhắn đã bị thu hồi/xoá.
                          </div>
                        ) : (
                          <div className="lr-chat-text">{chat.message}</div>
                        )}
                        <div className="lr-chat-time">{formatChatTime(chat.createdAt)}</div>
                      </div>
                    </div>
                  )
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="lr-chat-input-wrap">
                <div className="lr-chat-avatar-self">
                  {currentUserAvatarRef.current ? (
                    <img src={currentUserAvatarRef.current} alt="avatar" />
                  ) : (
                    <span>{(currentUserNameRef.current || "B").charAt(0).toUpperCase()}</span>
                  )}
                </div>

                <div className="lr-chat-input-container">
                  <textarea
                    className="lr-chat-input"
                    value={chatInput}
                    onChange={e => {
                      setChatInput(e.target.value);
                      e.target.style.height = "40px";
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 80)}px`;
                    }}
                    onKeyDown={handleChatKeyDown}
                    placeholder="Nhập tin nhắn..."
                    maxLength={500}
                    rows={1}
                  />
                  <button className="lr-chat-emoji-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                    <Smile size={20} />
                  </button>
                </div>

                <button
                  className="lr-chat-send"
                  onClick={() => { setShowEmojiPicker(false); void handleSendChat(); }}
                  disabled={!chatInput.trim()}
                >
                  <Send size={24} />
                </button>

                {showEmojiPicker && (
                  <div className="lr-emoji-picker-container">
                    <EmojiPicker
                      onEmojiClick={(e) => setChatInput(prev => prev + e.emoji)}
                      autoFocusSearch={false}
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {activeChatTab === "history" && (
            <div className="lr-music-history">
              {upNextHistory.length > 0 && (
                <div className="lr-history-section">
                  <div className="lr-history-section-title"><Clock size={12} /> Sắp tới</div>
                  {upNextHistory.map((t, i) => (
                    <div key={`next-${i}`} className="lr-history-item upcoming">
                      {t.artUrl ? <img src={t.artUrl} alt={t.title} className="lr-history-art" /> : <Disc3 size={16} className="lr-history-icon" />}
                      <div className="lr-history-info">
                        <div className="lr-history-title">{t.title}</div>
                        <div className="lr-history-artist">{t.artist}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {nowPlaying?.songHistory && nowPlaying.songHistory.length > 0 && (
                <div className="lr-history-section">
                  <div className="lr-history-section-title"><History size={12} /> Đã chạy</div>
                  {nowPlaying.songHistory.map((t, i) => (
                    <div key={`played-${i}`} className="lr-history-item played">
                      {t.artUrl ? <img src={t.artUrl} alt={t.title} className="lr-history-art" /> : <Disc3 size={16} className="lr-history-icon" />}
                      <div className="lr-history-info">
                        <div className="lr-history-title">{t.title}</div>
                        <div className="lr-history-artist">{t.artist}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {upNextHistory.length === 0 && (!nowPlaying?.songHistory || nowPlaying.songHistory.length === 0) && (
                <div className="lr-chat-welcome">Chưa có lịch sử nhạc nào.</div>
              )}
            </div>
          )}

          {activeChatTab === "lyrics" && parsedLyrics.length === 0 && (
            <div className="lr-chat-welcome">
              <Music size={28} />
              <p>Không có lời bài hát cho bài này.</p>
            </div>
          )}

          {activeChatTab === "lyrics" && parsedLyrics.length > 0 && (
            <div className="lr-lyrics-full-list" ref={lyricsContainerRef}>
              {parsedLyrics.map((line, i) => {
                const isActive = i === activeLyricIndex;
                return (
                  <button
                    key={i} type="button"
                    className={`lr-lyric-sync-line ${isActive ? "active" : ""}`}
                    onClick={() => {
                      setManualSyncBaseMs(line.time);
                      setManualSyncClockMs(Date.now());
                    }}
                  >
                    {line.text}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Request Song Modal */}
      {showRequestModal && (
        <div className="lr-request-modal-overlay" onClick={() => setShowRequestModal(false)}>
          <div className="lr-request-modal" onClick={e => e.stopPropagation()}>
            <div className="lr-request-modal-header">
              <h3>Gửi Request Nhạc</h3>
              <button onClick={() => setShowRequestModal(false)} className="lr-request-close">
                <X size={16} />
              </button>
            </div>

            <div className="lr-request-search-wrap">
              <Search size={14} />
              <input
                value={requestSearch}
                onChange={e => setRequestSearch(e.target.value)}
                placeholder="Tìm bài hát hoặc nghệ sĩ..."
                className="lr-request-search"
              />
            </div>

            <div className="lr-request-message-wrap">
              <textarea
                value={requestMessage}
                onChange={e => setRequestMessage(e.target.value.slice(0, 300))}
                placeholder="Nhắn host (tuỳ chọn)"
                className="lr-request-message"
                rows={3} maxLength={300}
              />
              <div className="lr-request-message-count">{requestMessage.length}/300</div>
            </div>

            <div className="lr-request-list">
              {requestLoading ? (
                <div className="lr-request-empty">Đang tải danh sách...</div>
              ) : requestableSongs.length === 0 ? (
                <div className="lr-request-empty">Không có bài hát để request</div>
              ) : (
                requestableSongs
                  .filter(song => {
                    const q = requestSearch.toLowerCase();
                    return !q || song.title.toLowerCase().includes(q) || song.artist.toLowerCase().includes(q);
                  })
                  .map(song => (
                    <div key={song.id} className="lr-request-item">
                      <div className="lr-request-song-content">
                        {song.artUrl ? (
                          <img src={song.artUrl} alt={song.title} className="lr-request-song-art" />
                        ) : (
                          <div className="lr-request-song-art-placeholder"><Music size={16} /></div>
                        )}
                        <div className="lr-request-song-info">
                          <div className="lr-request-song-title">{song.title}</div>
                          <div className="lr-request-song-artist">
                            {song.artist}{song.album ? ` • ${song.album}` : ""}
                          </div>
                        </div>
                      </div>
                      <button
                        className="lr-request-send"
                        disabled={requestedSongIds.has(song.id)}
                        onClick={() => void handleRequestSong(song)}
                      >
                        {requestedSongIds.has(song.id) ? "Đã gửi" : "Request"}
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Auth Prompt Modal */}
      {showAuthPopup && (
        <div className="lr-request-modal-overlay">
          <div className="lr-request-modal" style={{ textAlign: "center", padding: "30px 20px" }}>
            <h3 style={{ marginBottom: 15, color: "var(--user-theme-text, var(--lr-title))" }}>
              Hết thời gian nghe thử
            </h3>
            <p style={{ color: "var(--user-theme-text, var(--lr-muted))", marginBottom: 25, fontSize: "14px" }}>
              Bạn đã trải nghiệm 2 phút. Vui lòng đăng nhập hoặc đăng ký để tiếp tục tham gia Live Session và trò chuyện cùng mọi người nhé!
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button onClick={() => navigate("/login")} style={{ padding: "10px 20px", background: "var(--user-theme-primary, #5cc3f0)", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
                Đăng nhập
              </button>
              <button onClick={() => navigate("/register")} style={{ padding: "10px 20px", background: "var(--lr-btn-soft-bg)", color: "var(--user-theme-text, var(--lr-text))", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>
                Đăng ký
              </button>
              <button onClick={() => navigate("/")} style={{ padding: "10px 20px", background: "transparent", color: "var(--user-theme-text, var(--lr-muted))", border: "1px solid var(--lr-border)", borderRadius: "8px", cursor: "pointer" }}>
                Về trang chủ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LiveRoomPage;
