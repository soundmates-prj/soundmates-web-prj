import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { liveSessionApiService } from "../../services/liveSessionApiService";
import type { LiveSessionResult } from "../../services/liveSessionApiService";
import liveHubService from "../../services/liveHubService";
import type { ChatMessage } from "../../services/liveHubService";
import "./LiveRoomPage.css";

interface DisplayChat {
  id: string;
  userId: string;
  userName: string;
  message: string;
  createdAt: string;
  isSystem?: boolean;
}

export function LiveRoomPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<LiveSessionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [listeners, setListeners] = useState(0);
  const [chats, setChats] = useState<DisplayChat[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [ended, setEnded] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const playStream = useCallback(async (streamUrl: string) => {
    if (!audioRef.current) return;

    const audio = audioRef.current;
    audio.src = streamUrl;
    audio.volume = isMuted ? 0 : volume;

    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      // Retry muted to satisfy browser autoplay policies.
      try {
        audio.muted = true;
        await audio.play();
        setIsMuted(true);
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    }
  }, [isMuted, volume]);

  const getCurrentUserId = (): string | null => {
    try {
      const raw = localStorage.getItem("userInfo");
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed.id || null;
      }
    } catch { /* ignore */ }
    return null;
  };

  const getCurrentUserName = (): string => {
    try {
      const raw = localStorage.getItem("userInfo");
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed.fullName || parsed.email || "Ẩn danh";
      }
    } catch { /* ignore */ }
    return "Ẩn danh";
  };

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Load session data
  useEffect(() => {
    if (!sessionId) return;

    const load = async () => {
      try {
        const data = await liveSessionApiService.getLiveSession(sessionId);
        setSession(data);
        setListeners(data.listenersCount);
        if (data.status === "Ended" || data.status === "Cancelled") {
          setEnded(true);
        }
      } catch {
        console.error("Failed to load session");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [sessionId]);

  // SignalR connection
  useEffect(() => {
    if (!sessionId || ended) return;

    const userId = getCurrentUserId();

    const connect = async () => {
      await liveHubService.start();
      await liveHubService.joinSession(sessionId, userId || undefined);
    };

    connect();

    liveHubService.onListenersUpdated((_sid: string, count: number) => {
      setListeners(count);
    });

    liveHubService.onReceiveChat((chat: ChatMessage) => {
      setChats((prev) => [
        ...prev,
        {
          id: chat.id,
          userId: chat.userId,
          userName: chat.userId === userId ? getCurrentUserName() : `User-${chat.userId.slice(0, 6)}`,
          message: chat.message,
          createdAt: chat.createdAt,
        },
      ]);
    });

    liveHubService.onUserJoined((_sid: string, joinedUserId: string | null) => {
      if (joinedUserId && joinedUserId !== userId) {
        setChats((prev) => [
          ...prev,
          {
            id: `sys-join-${Date.now()}`,
            userId: "",
            userName: "",
            message: `User-${joinedUserId.slice(0, 6)} đã tham gia`,
            createdAt: new Date().toISOString(),
            isSystem: true,
          },
        ]);
      }
    });

    liveHubService.onUserLeft((_sid: string, leftUserId: string | null) => {
      if (leftUserId && leftUserId !== userId) {
        setChats((prev) => [
          ...prev,
          {
            id: `sys-leave-${Date.now()}`,
            userId: "",
            userName: "",
            message: `User-${leftUserId.slice(0, 6)} đã rời phòng`,
            createdAt: new Date().toISOString(),
            isSystem: true,
          },
        ]);
      }
    });

    liveHubService.onSessionEnded(() => {
      setEnded(true);
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    });

    return () => {
      liveHubService.leaveSession(sessionId, userId || undefined);
      liveHubService.offAll();
    };
  }, [sessionId, ended]);

  // Auto-scroll chat
  useEffect(() => {
    scrollToBottom();
  }, [chats, scrollToBottom]);

  // Auto start stream when user joins room with a valid stream URL.
  useEffect(() => {
    if (!session?.streamUrl || ended) return;
    void playStream(session.streamUrl);
  }, [session?.streamUrl, ended, playStream]);

  // Audio controls
  const togglePlay = () => {
    if (!audioRef.current || !session?.streamUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      void playStream(session.streamUrl);
    }
  };

  const handleVolume = (val: number) => {
    setVolume(val);
    setIsMuted(val === 0);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    if (audioRef.current) {
      audioRef.current.muted = next;
      audioRef.current.volume = next ? 0 : volume;
    }
  };

  // Chat
  const handleSendChat = async () => {
    if (!chatInput.trim() || !sessionId) return;
    const userId = getCurrentUserId();
    if (!userId) return;
    try {
      await liveHubService.sendChat(sessionId, userId, chatInput.trim());
      setChatInput("");
    } catch (err) {
      console.error("Failed to send chat:", err);
    }
  };

  const handleChatKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendChat();
    }
  };

  const formatChatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="lr-loading">
        <RefreshCw size={28} className="lr-spin" />
        <p>Đang tải phòng phát sóng...</p>
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
          <button className="lr-ended-btn" onClick={() => navigate("/live")}>
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lr-page">
      <audio ref={audioRef} />

      {/* Top Bar */}
      <div className="lr-topbar">
        <div className="lr-topbar-left">
          <button className="lr-back-btn" onClick={() => navigate("/live")}>
            <ArrowLeft size={18} />
          </button>
          <div className="lr-session-info">
            <h2 className="lr-session-title">{session.sessionName}</h2>
            <p className="lr-session-station">
              <Radio size={11} />
              {session.stationName || "Station"}
            </p>
          </div>
        </div>
        <div className="lr-topbar-right">
          <span className="lr-live-indicator">LIVE</span>
          <span className="lr-listeners-count">
            <Users size={13} />
            {listeners} đang nghe
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="lr-main">
        {/* Player Panel */}
        <div className="lr-player-panel">
          <div className="lr-player-bg" />
          <div className="lr-player-content">
            <div className={`lr-artwork ${isPlaying ? "playing" : ""}`}>
              {session.thumbnailUrl ? (
                <img src={session.thumbnailUrl} alt={session.sessionName} />
              ) : (
                <Disc3 size={64} className="lr-artwork-icon" />
              )}
              {isPlaying && <div className="lr-artwork-rings" />}
            </div>

            <div className="lr-track-info">
              <h2 className="lr-track-name">{session.sessionName}</h2>
              {session.description && (
                <p className="lr-track-desc">{session.description}</p>
              )}
              {session.genre && (
                <span className="lr-track-genre">{session.genre}</span>
              )}
            </div>

            <div className="lr-audio-controls">
              <button className="lr-play-btn" onClick={togglePlay}>
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>
              <div className="lr-volume-slider">
                <button
                  onClick={toggleMute}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX size={18} />
                  ) : (
                    <Volume2 size={18} />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolume(parseFloat(e.target.value))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Chat Panel */}
        <div className="lr-chat-panel">
          <div className="lr-chat-header">
            <h3>
              <MessageSquare size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
              Trò chuyện
            </h3>
            <span className="lr-chat-count">{chats.length} tin nhắn</span>
          </div>

          <div className="lr-chat-messages">
            {chats.length === 0 && (
              <div className="lr-chat-system">
                Chào mừng đến phòng phát sóng! Hãy gửi tin nhắn đầu tiên.
              </div>
            )}
            {chats.map((chat) =>
              chat.isSystem ? (
                <div key={chat.id} className="lr-chat-system">
                  {chat.message}
                </div>
              ) : (
                <div key={chat.id} className="lr-chat-msg">
                  <div className="lr-chat-avatar">
                    {chat.userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="lr-chat-bubble">
                    <div className="lr-chat-user">{chat.userName}</div>
                    <div className="lr-chat-text">{chat.message}</div>
                    <div className="lr-chat-time">
                      {formatChatTime(chat.createdAt)}
                    </div>
                  </div>
                </div>
              )
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="lr-chat-input-wrap">
            <input
              className="lr-chat-input"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={handleChatKeyDown}
              placeholder="Nhập tin nhắn..."
              maxLength={500}
            />
            <button
              className="lr-chat-send"
              onClick={handleSendChat}
              disabled={!chatInput.trim()}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LiveRoomPage;
