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
  Music,
  X,
  Search,
  History,
  Clock,
} from "lucide-react";
import { liveSessionApiService } from "../../services/liveSessionApiService";
import type { LiveSessionResult } from "../../services/liveSessionApiService";
import liveHubService from "../../services/liveHubService";
import type { ChatMessage } from "../../services/liveHubService";
import { usePlayer } from "../../context/PlayerContext";
import "./LiveRoomPage.css";

interface TrackInfo {
  shId: number;
  title: string;
  artist: string;
  album: string;
  artUrl: string;
  duration: number;
  elapsed: number;
  isRequest: boolean;
}

interface NowPlayingData {
  currentTrack: TrackInfo | null;
  playingNext: TrackInfo | null;
  totalListeners: number;
  isLive: boolean;
  isOnline: boolean;
  listenUrl: string;
  stationName: string;
}

interface DisplayChat {
  id: string;
  userId: string;
  userName: string;
  message: string;
  createdAt: string;
  isSystem?: boolean;
}

interface RequestSongItem {
  id: string;
  title: string;
  artist: string;
  album?: string | null;
}

interface SystemMusicItem {
  id: string;
  title: string;
  artist: string;
  album: string | null;
}

const proxyArtUrl = (url: string | undefined | null): string => {
  if (!url) return "";
  return url.replace(/host\.docker\.internal/gi, "localhost");
};

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export function LiveRoomPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const player = usePlayer();

  const [session, setSession] = useState<LiveSessionResult | null>(null);
  const [nowPlaying, setNowPlaying] = useState<NowPlayingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [listeners, setListeners] = useState(0);
  const [chats, setChats] = useState<DisplayChat[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [activeChatTab, setActiveChatTab] = useState<"chat" | "history">("chat");
  // Lịch sử nhạc: 2 cột — sắp tới & đã chạy
  const [upNextHistory, setUpNextHistory] = useState<TrackInfo[]>([]);
  const [playedHistory, setPlayedHistory] = useState<TrackInfo[]>([]);
  const [ended, setEnded] = useState(false);

  // Request nhạc
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestSearch, setRequestSearch] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestableSongs, setRequestableSongs] = useState<RequestSongItem[]>([]);
  const [requestedSongIds, setRequestedSongIds] = useState<Set<string>>(new Set());

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const elapsedRef = useRef<number>(0);
  const [elapsed, setElapsed] = useState(0);
  const prevTrackIdRef = useRef<number | undefined>(undefined);

  const getCurrentUserId = (): string | null => {
    try {
      const raw = localStorage.getItem("userInfo");
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed.id || parsed.userId || null;
      }
    } catch { /* ignore */ }
    return null;
  };

  const getCurrentUserName = (): string => {
    try {
      const raw = localStorage.getItem("userInfo");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.firstName && parsed.lastName) return `${parsed.firstName} ${parsed.lastName}`;
        return parsed.username || parsed.email || "Ẩn danh";
      }
    } catch { /* ignore */ }
    return "Ẩn danh";
  };

  // Load session + now-playing
  useEffect(() => {
    if (!sessionId) return;

    const load = async () => {
      try {
        const sessionData = await liveSessionApiService.getLiveSession(sessionId);
        const nowPlayingData = await liveSessionApiService
          .getStationNowPlaying(String(sessionData.stationId))
          .catch(() => null);

        setSession(sessionData);
        setListeners(sessionData.listenersCount ?? 0);

        if (sessionData.status?.toLowerCase() === "ended" || sessionData.status?.toLowerCase() === "cancelled") {
          setEnded(true);
        }

        if (nowPlayingData) {
          const track = nowPlayingData.currentTrack;
          const current = track ? {
            shId: track.shId ?? 0,
            title: track.title || track.text || "—",
            artist: track.artist || "—",
            album: track.album || "",
            artUrl: proxyArtUrl(track.artUrl),
            duration: track.duration ?? 0,
            elapsed: track.elapsed ?? 0,
            isRequest: track.isRequest ?? false,
          } : null;

          const next = nowPlayingData.playingNext ? {
            shId: nowPlayingData.playingNext.shId ?? 0,
            title: nowPlayingData.playingNext.title || "—",
            artist: nowPlayingData.playingNext.artist || "—",
            album: nowPlayingData.playingNext.album || "",
            artUrl: proxyArtUrl(nowPlayingData.playingNext.artUrl),
            duration: nowPlayingData.playingNext.duration ?? 0,
            elapsed: 0,
            isRequest: nowPlayingData.playingNext.isRequest ?? false,
          } : null;

          setNowPlaying({
            currentTrack: current,
            playingNext: next,
            totalListeners: nowPlayingData.totalListeners ?? sessionData.listenersCount ?? 0,
            isLive: nowPlayingData.isLive ?? true,
            isOnline: nowPlayingData.isOnline ?? true,
            listenUrl: proxyArtUrl(nowPlayingData.listenUrl ?? sessionData.streamUrl),
            stationName: nowPlayingData.stationName || sessionData.stationName || "Live Station",
          });

          if (track) {
            elapsedRef.current = track.elapsed ?? 0;
            setElapsed(track.elapsed ?? 0);
          }
        } else {
          // Fallback when now-playing API fails
          setNowPlaying({
            currentTrack: null,
            playingNext: null,
            totalListeners: sessionData.listenersCount ?? 0,
            isLive: sessionData.status?.toLowerCase() === "live",
            isOnline: true,
            listenUrl: proxyArtUrl(sessionData.streamUrl),
            stationName: sessionData.stationName || "Live Station",
          });
        }
      } catch (err) {
        console.error("[LiveRoomPage] Load error:", err);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [sessionId]);

  // Sync bottom music player with current live-session
  useEffect(() => {
    const track = nowPlaying?.currentTrack;
    if (!track) return;

    player.setTrack({
      title: track.title,
      artist: track.artist,
      album: track.album,
      artUrl: track.artUrl,
      duration: track.duration,
      elapsed: track.elapsed,
      listenUrl: nowPlaying?.listenUrl || session?.streamUrl || undefined,
    });
    player.setIsPlaying(isPlaying);
    player.setVolume(Math.round(volume * 100));
    player.setElapsed(elapsed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nowPlaying?.currentTrack?.shId, nowPlaying?.listenUrl, session?.streamUrl]);

  // Elapsed timer
  useEffect(() => {
    const timer = setInterval(() => {
      if (isPlaying && nowPlaying?.currentTrack) {
        elapsedRef.current += 1;
        setElapsed(elapsedRef.current);
        player.setElapsed(elapsedRef.current);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying, nowPlaying?.currentTrack]);

  // Theo dõi track thay đổi → cập nhật lịch sử nhạc
  useEffect(() => {
    const current = nowPlaying?.currentTrack;
    const next = nowPlaying?.playingNext;
    const currentId = current?.shId;

    if (!current) return;

    // Khi track mới bắt đầu (prev !== current)
    if (prevTrackIdRef.current !== currentId) {
      console.log(`[LiveRoomPage] Track changed: ${prevTrackIdRef.current} → ${currentId}`);
      // Chuyển track cũ (nếu có) sang "đã chạy"
      if (prevTrackIdRef.current !== undefined) {
        const prevUpNext = upNextHistory[0];
        if (prevUpNext) {
          setPlayedHistory(prev => [prevUpNext, ...prev].slice(0, 10));
        }
      }
      // Reset upNext = playingNext mới
      if (next) {
        setUpNextHistory([next]);
      } else {
        setUpNextHistory([]);
      }
      prevTrackIdRef.current = currentId;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nowPlaying?.currentTrack?.shId, nowPlaying?.playingNext?.shId]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats]);

  // SignalR connection
  useEffect(() => {
    if (!sessionId || ended) return;

    const userId = getCurrentUserId();

    void (async () => {
      try {
        await liveHubService.start();
        await liveHubService.joinSession(sessionId, userId || undefined);
      } catch (err) {
        console.warn("[LiveRoomPage] SignalR connect failed:", err);
      }
    })();

    const offListeners = liveHubService.onListenersUpdated((sid, count) => {
      if (sid === sessionId) setListeners(count);
    });

    const offChat = liveHubService.onReceiveChat((chat: ChatMessage) => {
      if (chat.liveSessionId === sessionId) {
        setChats(prev => [...prev, {
          id: chat.id,
          userId: chat.userId || "",
          userName: chat.userId === userId ? getCurrentUserName() : `User-${(chat.userId || "?").slice(0, 6)}`,
          message: chat.message,
          createdAt: chat.createdAt,
        }]);
      }
    });

    const offJoined = liveHubService.onUserJoined((sid) => {
      if (sid === sessionId) setListeners(c => c + 1);
    });

    const offLeft = liveHubService.onUserLeft((sid) => {
      if (sid === sessionId) setListeners(c => Math.max(0, c - 1));
    });

    const offEnded = liveHubService.onSessionEnded(() => setEnded(true));

    return () => {
      offListeners();
      offChat();
      offJoined();
      offLeft();
      offEnded();
      liveHubService.leaveSession(sessionId, userId || undefined);
      liveHubService.offAll();
    };
  }, [sessionId, ended]);

  const playStream = useCallback(async () => {
    const url = nowPlaying?.listenUrl || session?.streamUrl;
    if (!url) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(url);
      audioRef.current.volume = isMuted ? 0 : volume;
    }

    try {
      await audioRef.current.play();
      setIsPlaying(true);
      player.setIsPlaying(true);
    } catch {
      try {
        if (audioRef.current) {
          audioRef.current.muted = true;
          await audioRef.current.play();
          setIsMuted(true);
          setIsPlaying(true);
          player.setIsPlaying(true);
        }
      } catch { /* ignore autoplay blocked */ }
    }
  }, [nowPlaying?.listenUrl, session?.streamUrl, isMuted, volume]);

  const togglePlay = () => {
    if (!audioRef.current) {
      void playStream();
      return;
    }
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      player.setIsPlaying(false);
    } else {
      void playStream();
    }
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    if (audioRef.current) audioRef.current.volume = next ? 0 : volume;
  };

  const handleVolume = (val: number) => {
    setVolume(val);
    if (val === 0) setIsMuted(true);
    else setIsMuted(false);
    if (audioRef.current) audioRef.current.volume = val;
    player.setVolume(Math.round(val * 100));
  };

  const loadRequestableSongs = useCallback(async () => {
    if (!session?.stationId) return;
    setRequestLoading(true);
    try {
      const stationSongs = await liveSessionApiService.getStationMusic(String(session.stationId));
      const mapped = stationSongs.map((song: SystemMusicItem) => ({
        id: song.id,
        title: song.title,
        artist: song.artist,
        album: song.album,
      }));
      setRequestableSongs(mapped);
    } catch (err) {
      console.warn("[LiveRoomPage] loadRequestableSongs failed:", err);
      setRequestableSongs([]);
    } finally {
      setRequestLoading(false);
    }
  }, [session?.stationId]);

  const handleRequestSong = async (song: RequestSongItem) => {
    if (!sessionId) return;
    try {
      await liveSessionApiService.createSongRequest(sessionId, {
        mediaFileId: song.id,
      });
      setRequestedSongIds(prev => new Set([...prev, song.id]));
      setChats(prev => [...prev, {
        id: `req-${Date.now()}`,
        userId: "",
        userName: "",
        message: `Bạn vừa gửi request bài: ${song.title} — ${song.artist}`,
        createdAt: new Date().toISOString(),
        isSystem: true,
      }]);
    } catch (err) {
      console.error("[LiveRoomPage] requestSong failed:", err);
    }
  };


  const handleSendChat = async () => {
    if (!chatInput.trim() || !sessionId) return;
    const userId = getCurrentUserId();
    if (!userId) {
      setChats(prev => [...prev, {
        id: `sys-${Date.now()}`,
        userId: "",
        userName: "",
        message: "Vui lòng đăng nhập để gửi tin nhắn",
        createdAt: new Date().toISOString(),
        isSystem: true,
      }]);
      return;
    }
    try {
      await liveHubService.sendChat(sessionId, userId, chatInput.trim());
      setChatInput("");
    } catch (err) {
      console.error("[LiveRoomPage] Send chat failed:", err);
    }
  };

  // Debug: log navigation attempts
  const handleNavigate = (path: string) => {
    console.log(`[LiveRoomPage] Navigate to: ${path}, sessionId: ${sessionId}`);
    navigate(path);
  };

  const handleChatKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSendChat();
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
    <div className="lr-page">
      {/* Top Bar */}
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
            {nowPlaying?.isLive !== false ? "LIVE" : "OFFLINE"}
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

            {/* Track Info */}
            <div className="lr-track-info">
              <h2 className="lr-track-name">{track?.title || "Đang tải..."}</h2>
              <p className="lr-track-artist">{track?.artist || ""}</p>
              {track?.album && (
                <p className="lr-track-album">{track.album}</p>
              )}
            </div>

            {/* Progress Bar */}
            {track && duration > 0 && (
              <div className="lr-progress-wrap">
                <div className="lr-progress-bar">
                  <div
                    className="lr-progress-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="lr-progress-times">
                  <span>{formatTime(elapsed)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="lr-controls">
              <button className="lr-play-btn" onClick={togglePlay}>
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>
              <div className="lr-volume">
                <button className="lr-vol-btn" onClick={toggleMute}>
                  {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <input
                  type="range" min={0} max={1} step={0.01}
                  value={isMuted ? 0 : volume}
                  onChange={e => handleVolume(parseFloat(e.target.value))}
                  className="lr-volume-slider"
                />
              </div>
            </div>

            {/* Playing Next */}
            {nowPlaying?.playingNext && (
              <div className="lr-up-next">
                <span className="lr-up-next-label">Tiếp theo</span>
                <span className="lr-up-next-track">
                  {nowPlaying.playingNext.title} — {nowPlaying.playingNext.artist}
                </span>
              </div>
            )}

            {/* Request nhạc */}
            <button
              className="lr-request-btn"
              onClick={() => {
                setShowRequestModal(true);
                void loadRequestableSongs();
              }}
            >
              <Music size={16} />
              Gửi Request Nhạc
            </button>
          </div>
        </div>

        {/* Chat Panel */}
        <div className="lr-chat-panel">
          {/* Tab header */}
          <div className="lr-chat-tabs">
            <button
              className={`lr-chat-tab ${activeChatTab === "chat" ? "active" : ""}`}
              onClick={() => setActiveChatTab("chat")}
            >
              <MessageSquare size={13} />
              Trò chuyện
            </button>
            <button
              className={`lr-chat-tab ${activeChatTab === "history" ? "active" : ""}`}
              onClick={() => setActiveChatTab("history")}
            >
              <History size={13} />
              Lịch sử nhạc
            </button>
          </div>

          {/* Tab: Trò chuyện */}
          {activeChatTab === "chat" && (
            <>
              <div className="lr-chat-messages">
                {chats.length === 0 && (
                  <div className="lr-chat-welcome">
                    Chào mừng đến phòng phát sóng! Hãy gửi tin nhắn đầu tiên.
                  </div>
                )}
                {chats.map((chat) =>
                  chat.isSystem ? (
                    <div key={chat.id} className="lr-chat-system">{chat.message}</div>
                  ) : (
                    <div key={chat.id} className="lr-chat-msg">
                      <div className="lr-chat-avatar">
                        {chat.userName.charAt(0).toUpperCase()}
                      </div>
                      <div className="lr-chat-bubble">
                        <div className="lr-chat-user">{chat.userName}</div>
                        <div className="lr-chat-text">{chat.message}</div>
                        <div className="lr-chat-time">{formatChatTime(chat.createdAt)}</div>
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
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={handleChatKeyDown}
                  placeholder="Nhập tin nhắn..."
                  maxLength={500}
                />
                <button
                  className="lr-chat-send"
                  onClick={() => void handleSendChat()}
                  disabled={!chatInput.trim()}
                >
                  <Send size={16} />
                </button>
              </div>
            </>
          )}

          {/* Tab: Lịch sử nhạc */}
          {activeChatTab === "history" && (
            <div className="lr-music-history">
              {/* Sắp tới */}
              {upNextHistory.length > 0 && (
                <div className="lr-history-section">
                  <div className="lr-history-section-title">
                    <Clock size={12} />
                    Sắp tới
                  </div>
                  {upNextHistory.map((track, i) => (
                    <div key={`next-${i}`} className="lr-history-item upcoming">
                      <Disc3 size={16} className="lr-history-icon" />
                      <div className="lr-history-info">
                        <div className="lr-history-title">{track.title}</div>
                        <div className="lr-history-artist">{track.artist}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Đã chạy */}
              {playedHistory.length > 0 && (
                <div className="lr-history-section">
                  <div className="lr-history-section-title">
                    <History size={12} />
                    Đã chạy
                  </div>
                  {playedHistory.map((track, i) => (
                    <div key={`played-${i}`} className="lr-history-item played">
                      <Disc3 size={16} className="lr-history-icon" />
                      <div className="lr-history-info">
                        <div className="lr-history-title">{track.title}</div>
                        <div className="lr-history-artist">{track.artist}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {upNextHistory.length === 0 && playedHistory.length === 0 && (
                <div className="lr-chat-welcome">
                  Chưa có lịch sử nhạc nào.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Request Song Modal */}
      {showRequestModal && (
        <div className="lr-request-modal-overlay" onClick={() => setShowRequestModal(false)}>
          <div className="lr-request-modal" onClick={(e) => e.stopPropagation()}>
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
                onChange={(e) => setRequestSearch(e.target.value)}
                placeholder="Tìm bài hát hoặc nghệ sĩ..."
                className="lr-request-search"
              />
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
                      <div className="lr-request-song-info">
                        <div className="lr-request-song-title">{song.title}</div>
                        <div className="lr-request-song-artist">{song.artist}{song.album ? ` • ${song.album}` : ""}</div>
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
    </div>
  );
}

export default LiveRoomPage;
