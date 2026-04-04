import React, { useState, useEffect, useRef } from "react";
import {
  Radio,
  Send,
  Smile,
  X,
  Music,
  Users,
  Clock,
  Headphones,
  Mic2,
  Heart,
  Search,
  Share2,
  Settings2,
  Volume2,
  VolumeX,
  Sun,
  Moon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  livestreamService,
  type LiveSessionResult,
  type NowPlayingData,
  type TrackInfo,
} from "../../services/livestreamService";
import { liveSessionApiService } from "../../services/liveSessionApiService";
import { liveHubService } from "../../services/liveHubService";
import { usePlayer } from "../../context/PlayerContext";
import html2canvas from "html2canvas";

import {
  showInfo,
  showSuccess,
  showError,
} from "../../components/common/toastUtils";
import { Loading } from "../../components/common";
import brandLogo from "../../assets/logo_notext.png";
import "./Livestream.css";

// ===== TYPES =====
interface ChatMessage {
  id: string;
  type: "system" | "user" | "host" | "request";
  name: string;
  text: string;
  time: string;
  avatarColor?: string;
  isHost?: boolean;
  isSelf?: boolean;
  requestSong?: string;
}

interface PodcastCard {
  id: string;
  category: string;
  categoryColor: "purple" | "blue" | "green" | "red";
  title: string;
  author: string;
  voiceType: "ai" | "real";
}

interface FloatingReaction {
  id: number;
  emoji: string;
  x: number;
}

// ===== DEMO DATA =====
const DEMO_PODCASTS: PodcastCard[] = [
  {
    id: "1",
    category: "Live Đêm: Chuyện Gia Đình",
    categoryColor: "purple",
    title: '"Tôi nhớ quê hương mình, nhớ gia đình mình.."',
    author: "Thanh Nguyen",
    voiceType: "ai",
  },
  {
    id: "2",
    category: "Live Đêm: Chuyện Tình Cảm",
    categoryColor: "blue",
    title: '"Lần đầu tiên rung động của tôi..."',
    author: "Dung Ho",
    voiceType: "real",
  },
  {
    id: "3",
    category: "ON AIR: STORY TIME",
    categoryColor: "green",
    title: '"Các câu chuyện đồi thường của tôi bắt đầu vào 1 hôm kì lạ..."',
    author: "Oanh Tran",
    voiceType: "ai",
  },
];

const DEMO_CHAT: ChatMessage[] = [
  {
    id: "1",
    type: "system",
    name: "",
    text: "Chào mừng đến SoundMates trực tuyến",
    time: "",
  },
  {
    id: "2",
    type: "user",
    name: "A. Minh",
    text: "Bài này hay quá ! 🔥 Có thể chạy bài của J97 tiếp được không?",
    time: "10:42 PM",
    avatarColor: "#3498db",
  },
  {
    id: "3",
    type: "host",
    name: "Quoc Anh (Host)",
    text: "Oke! Sau bài này nhé. Mọi ngườii xem live vui vẻ <3",
    time: "10:43 PM",
    isHost: true,
    avatarColor: "#2ecc71",
  },
  {
    id: "4",
    type: "request",
    name: "C.Thanh",
    text: "Tôi rất thích bài này!",
    time: "10:44 PM",
    avatarColor: "#e74c3c",
    requestSong: "Blue in Green",
  },
];

const EMOTIONS = ["❤️", "🔥", "😍", "👏", "🎵", "✨", "🎶", "💜"];
const EMOJIS = [
  "😀",
  "😂",
  "❤️",
  "🔥",
  "👏",
  "🎵",
  "😍",
  "🙌",
  "💯",
  "✨",
  "🎶",
  "💜",
  "😎",
  "🤩",
  "💙",
  "🫡",
  "😭",
  "🥰",
];

// ===== HELPER FUNCTIONS =====
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatPlayedAt(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function proxyArtUrl(url: string): string {
  if (!url) return "";
  // Replace host.docker.internal with localhost for browser access
  return url.replace("host.docker.internal", "localhost");
}

// ===== MAIN COMPONENT =====
const LivestreamPage: React.FC = () => {
  const player = usePlayer();

  // State
  const [nowPlaying, setNowPlaying] = useState<NowPlayingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [sidebarTab, setSidebarTab] = useState<"chat" | "playlist" | "podcast">(
    "chat",
  );
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(DEMO_CHAT);
  const [chatInput, setChatInput] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showEmotionPicker, setShowEmotionPicker] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState<
    FloatingReaction[]
  >([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showPodcastModal, setShowPodcastModal] = useState(false);
  const [requestSearch, setRequestSearch] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [activeSession, setActiveSession] = useState<LiveSessionResult | null>(null);
  // SignalR real-time
  const [hubConnected, setHubConnected] = useState(false);
  const activeSessionIdRef = useRef<string | null>(null);

  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null);
  const reactionIdRef = useRef(0);
  const hasLoadedLiveSessionRef = useRef(false);

  // Theme persistence
  useEffect(() => {
    const stored = window.localStorage.getItem("livestreamTheme");
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("livestreamTheme", theme);
  }, [theme]);

  useEffect(() => {
    if (hasLoadedLiveSessionRef.current) {
      return;
    }

    hasLoadedLiveSessionRef.current = true;

    const loadLiveSession = async () => {
      try {
        const activeSessions = await livestreamService.getActiveSessions();
        const liveSession = activeSessions.find(
          (session) => session.status?.toLowerCase() === "live",
        );

        if (!liveSession) {
          setNowPlaying(null);
          setActiveSession(null);
          setLoading(false);
          return;
        }

        const session = await livestreamService.getLiveSession(liveSession.id);
        setActiveSession(session);

        // Fetch real now-playing from AzuraCast via backend for album art / track info
        let trackData: NowPlayingData | null = null;
        try {
          const azuraData: any = await liveSessionApiService.getStationNowPlaying(session.stationId);
          if (azuraData) {
            trackData = {
              externalStationId: azuraData.externalStationId ?? azuraData.station?.id ?? 0,
              stationName: azuraData.stationName ?? session.stationName ?? azuraData.station?.name ?? '',
              stationShortcode: azuraData.stationShortcode ?? '',
              listenUrl: azuraData.listenUrl ?? '',
              publicPlayerUrl: azuraData.publicPlayerUrl ?? '',
              isOnline: azuraData.isOnline ?? true,
              isLive: azuraData.isLive ?? true,
              streamerName: azuraData.streamerName ?? null,
              totalListeners: azuraData.totalListeners ?? 0,
              uniqueListeners: azuraData.uniqueListeners ?? 0,
              currentTrack: azuraData.currentTrack ? {
                shId: azuraData.currentTrack.shId ?? azuraData.currentTrack.id ?? 0,
                text: azuraData.currentTrack.text ?? azuraData.currentTrack.title ?? '',
                title: azuraData.currentTrack.title ?? 'Unknown',
                artist: azuraData.currentTrack.artist ?? 'Unknown',
                album: azuraData.currentTrack.album ?? '',
                genre: azuraData.currentTrack.genre ?? '',
                artUrl: proxyArtUrl(azuraData.currentTrack.artUrl ?? ''),
                lyrics: azuraData.currentTrack.lyrics ?? null,
                playedAt: azuraData.currentTrack.playedAt ?? 0,
                duration: azuraData.currentTrack.duration ?? 0,
                elapsed: azuraData.currentTrack.elapsed ?? 0,
                remaining: azuraData.currentTrack.remaining ?? 0,
                isRequest: azuraData.currentTrack.isRequest ?? false,
              } : {
                shId: 0, text: '', title: 'Unknown', artist: 'Unknown',
                album: '', genre: '', artUrl: '',
                lyrics: null, playedAt: 0, duration: 0, elapsed: 0, remaining: 0, isRequest: false,
              },
              playingNext: azuraData.playingNext ? {
                shId: azuraData.playingNext.shId ?? 0,
                text: azuraData.playingNext.text ?? '',
                title: azuraData.playingNext.title ?? 'Unknown',
                artist: azuraData.playingNext.artist ?? 'Unknown',
                album: azuraData.playingNext.album ?? '',
                genre: azuraData.playingNext.genre ?? '',
                artUrl: proxyArtUrl(azuraData.playingNext.artUrl ?? ''),
                lyrics: azuraData.playingNext.lyrics ?? null,
                playedAt: azuraData.playingNext.playedAt ?? 0,
                duration: azuraData.playingNext.duration ?? 0,
                elapsed: 0,
                remaining: azuraData.playingNext.remaining ?? 0,
                isRequest: azuraData.playingNext.isRequest ?? false,
              } : azuraData.nextSong ? {
                shId: azuraData.nextSong.shId ?? azuraData.nextSong.id ?? 0,
                text: azuraData.nextSong.text ?? azuraData.nextSong.title ?? '',
                title: azuraData.nextSong.title ?? 'Unknown',
                artist: azuraData.nextSong.artist ?? 'Unknown',
                album: azuraData.nextSong.album ?? '',
                genre: azuraData.nextSong.genre ?? '',
                artUrl: proxyArtUrl(azuraData.nextSong.artUrl ?? ''),
                lyrics: null, playedAt: 0, duration: 0, elapsed: 0, remaining: 0, isRequest: false,
              } : {
                shId: 0, text: '', title: 'Không có bài tiếp theo', artist: '',
                album: '', genre: '', artUrl: proxyArtUrl(''),
                lyrics: null, playedAt: 0, duration: 0, elapsed: 0, remaining: 0, isRequest: false,
              },
              songHistory: (azuraData.songHistory || []).map((t: any) => ({
                shId: t.shId ?? t.id ?? 0,
                text: t.text ?? t.title ?? '',
                title: t.title ?? 'Unknown',
                artist: t.artist ?? 'Unknown',
                album: t.album ?? '',
                genre: t.genre ?? '',
                artUrl: proxyArtUrl(t.artUrl ?? ''),
                lyrics: t.lyrics ?? null,
                playedAt: t.playedAt ?? 0,
                duration: t.duration ?? 0,
                elapsed: 0,
                remaining: t.remaining ?? 0,
                isRequest: t.isRequest ?? false,
              })),
            };
          }
        } catch {
          // Fallback: use session data if now-playing fetch fails
        }

        // Use AzuraCast data if available, otherwise fallback to session
        const data = trackData || livestreamService.toNowPlaying(session);
        setNowPlaying(data);
        setElapsed(data.currentTrack.elapsed);

        // Push track info to global player context
        player.setTrack({
          title: data.currentTrack.title,
          artist: data.currentTrack.artist,
          album: data.currentTrack.album,
          artUrl: data.currentTrack.artUrl.replace(
            "host.docker.internal",
            "localhost",
          ),
          duration: data.currentTrack.duration,
          elapsed: data.currentTrack.elapsed,
          listenUrl: livestreamService.getListenUrl(session.streamUrl || data.listenUrl),
        });

        // Start SignalR real-time
        if (session.id) {
          activeSessionIdRef.current = session.id;
          try {
            await liveHubService.start();
            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            await liveHubService.joinSession(session.id, userInfo.id || userInfo.userId);
            setHubConnected(true);
          } catch (err) {
            console.warn('[Livestream] SignalR connection failed:', err);
          }
        }
      } catch (err) {
        console.error("Failed to fetch now playing:", err);
      } finally {
        setLoading(false);
      }
    };

    void loadLiveSession();
  }, [player]);

  // Elapsed timer
  useEffect(() => {
    if (!nowPlaying) return;
    const timer = setInterval(() => {
      setElapsed((prev) => {
        if (prev >= nowPlaying.currentTrack.duration) return prev;
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [nowPlaying]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // SignalR real-time: listener count + chat
  useEffect(() => {
    const offListeners = liveHubService.onListenersUpdated((sessionId, count) => {
      if (activeSessionIdRef.current === sessionId && nowPlaying) {
        setNowPlaying(prev => prev ? { ...prev, totalListeners: count } : prev);
      }
    });

    const offChat = liveHubService.onReceiveChat((msg) => {
      if (activeSessionIdRef.current === msg.liveSessionId) {
        setChatMessages(prev => [...prev, {
          id: msg.id || Date.now().toString(),
          type: 'user' as const,
          name: msg.userId || 'Khách',
          text: msg.message,
          time: msg.createdAt
            ? new Date(msg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
            : 'Vừa xong',
          avatarColor: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
        }]);
      }
    });

    return () => {
      offListeners();
      offChat();
      if (activeSessionIdRef.current) {
        liveHubService.leaveSession(activeSessionIdRef.current);
      }
      liveHubService.offAll();
    };
  }, []);

  // ===== CHAT =====
  const sendChat = () => {
    if (!chatInput.trim()) return;
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      name: "Bạn",
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isSelf: true,
      avatarColor: "#5F6EE0",
    };
    setChatMessages((prev) => [...prev, newMsg]);
    setChatInput("");
    setShowEmojiPicker(false);
  };

  const handleChatKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Block all keys that might scroll the page (arrow keys, space, enter, etc.)
    const scrollKeys = ["Enter", " ", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"];
    if (scrollKeys.includes(e.key)) {
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();
    }
    // Enter without Shift → send message
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChat();
    }
  };

  const addEmoji = (emoji: string) => {
    setChatInput((prev) => prev + emoji);
  };

  // ===== EMOTIONS / REACTIONS =====
  const sendEmotion = (emoji: string) => {
    const id = reactionIdRef.current++;
    const x = Math.random() * 200 - 100;
    setFloatingReactions((prev) => [...prev, { id, emoji, x }]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
    }, 2200);
  };

  // ===== RENDER HELPERS =====
  const renderProgressBar = () => {
    if (!nowPlaying) return null;
    const { duration } = nowPlaying.currentTrack;
    const pct = duration > 0 ? Math.min((elapsed / duration) * 100, 100) : 0;
    return (
      <div className="now-playing-progress">
        <div className="progress-bar-track">
          <motion.div 
            className="progress-bar-fill" 
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }} 
            transition={{ duration: 1, ease: "linear" }}
          />
        </div>
        <div className="progress-times">
          <span>{formatTime(elapsed)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <motion.div 
        className="livestream-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <Loading
          fullscreen
          size="large"
          text="Đang kết nối đến phiên phát sóng..."
        />
      </motion.div>
    );
  }

  if (!nowPlaying) {
    return (
      <div
        className="livestream-page"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <Radio size={48} color="#55C5F1" />
        <p style={{ color: "rgba(255,255,255,0.5)" }}>
          Không thể kết nối đến phiên phát sóng
        </p>
      </div>
    );
  }

  const {
    currentTrack,
    playingNext,
    songHistory,
    totalListeners,
    isLive,
    isOnline,
  } = nowPlaying;

  const stationName = activeSession?.stationName || nowPlaying.stationName;

  return (
    <div className={`livestream-page livestream-theme-${theme}`}>
      <div className="livestream-container">
        {/* ===== LEFT: Main Content ===== */}
        <div className="livestream-main">
          {/* Now Playing Hero */}
          <motion.div 
            className="now-playing-hero"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="now-playing-cover"
              onClick={player.toggle}
              style={{ cursor: "pointer" }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <img
                src={proxyArtUrl(currentTrack.artUrl)}
                alt={currentTrack.title}
              />
              <div className="now-playing-cover-overlay">
                <div className="now-playing-cover-title">
                  {currentTrack.title}
                </div>
                <div className="now-playing-cover-artist">
                  {currentTrack.artist}
                </div>
              </div>
              {player.isPlaying && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 12,
                    right: 12,
                  }}
                >
                  <div className="audio-visualizer">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <div key={i} className="bar" />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            <div className="now-playing-info">
              <div className="now-playing-station">
                {(isLive || isOnline) && (
                  <span className="station-live-badge">
                    <span className="dot" />
                    {isLive ? "Trực tiếp" : "Đang phát sóng"}
                  </span>
                )}
                <span className="station-name">{stationName}</span>
              </div>

              <h1 className="now-playing-title">{currentTrack.title}</h1>
              <p className="now-playing-artist">{currentTrack.artist}</p>
              <p className="now-playing-album">{currentTrack.album}</p>

              <div className="now-playing-meta">
                <span className="meta-item">
                  <Music size={13} /> {currentTrack.genre || "Music"}
                </span>
                <span className="meta-item">
                  <Clock size={13} /> {formatTime(currentTrack.duration)}
                </span>
                <span className="meta-item">
                  <Users size={13} /> {totalListeners} ngườii nghe
                </span>
              </div>

              {renderProgressBar()}
            </div>
          </motion.div>

          {/* Live Action Bar */}
          <motion.div 
            className="livestream-action-bar"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="action-bar-left">
              <button className="action-bar-icon-btn" title="Cài đặt">
                <Settings2 size={17} />
              </button>
              <button
                className="action-bar-icon-btn"
                title="Chia sẻ phiên nghe"
                onClick={() => {
                  setShowShareModal(true);
                  setShowEmotionPicker(false);
                  setShowRequestModal(false);
                  setShowPodcastModal(false);
                }}
              >
                <Share2 size={17} />
              </button>
              <button
                className="action-bar-icon-btn"
                title={theme === "dark" ? "Giao diện sáng" : "Giao diện tối"}
                onClick={() =>
                  setTheme((t) => (t === "dark" ? "light" : "dark"))
                }
              >
                {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
              </button>
              <button
                className="action-bar-icon-btn"
                title={player.isMuted ? "Bật tiếng" : "Tắt tiếng"}
                onClick={player.toggleMute}
              >
                {player.isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={player.isMuted ? 0 : player.volume}
                onChange={(e) => player.setVolume(Number(e.target.value))}
                className="action-volume-slider"
                style={{
                  background: `linear-gradient(to right, #55C5F1 0%, #55C5F1 ${player.isMuted ? 0 : player.volume}%, rgba(255,255,255,0.15) ${player.isMuted ? 0 : player.volume}%, rgba(255,255,255,0.15) 100%)`,
                }}
              />
            </div>

            <div className="action-bar-center" style={{ position: "relative" }}>
              <motion.button
                className="action-btn emotion"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowEmotionPicker((p) => !p);
                  setShowRequestModal(false);
                  setShowPodcastModal(false);
                }}
              >
                <Smile size={15} /> Cảm xúc
              </motion.button>
              <motion.button
                className="action-btn request"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowRequestModal(true);
                  setShowEmotionPicker(false);
                  setShowPodcastModal(false);
                }}
              >
                <Music size={15} /> Request Nhạc
              </motion.button>
              <motion.button
                className="action-btn podcast-submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowPodcastModal(true);
                  setShowEmotionPicker(false);
                  setShowRequestModal(false);
                }}
              >
                <Mic2 size={15} /> Gửi Podcast
              </motion.button>

              <AnimatePresence>
                {showEmotionPicker && (
                  <motion.div 
                    className="emotion-popup"
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  >
                    {EMOTIONS.map((em) => (
                      <motion.button
                        key={em}
                        className="emotion-btn"
                        whileHover={{ scale: 1.3 }}
                        onClick={() => sendEmotion(em)}
                      >
                        {em}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="action-bar-right">
              <div className="listener-count">
                <Users size={14} />
                {totalListeners || 128}
              </div>
            </div>
          </motion.div>

          {/* Podcast Cards */}
          <motion.div 
            className="podcast-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {DEMO_PODCASTS.map((pc, index) => (
              <motion.div 
                className="podcast-card" 
                key={pc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <div className="podcast-card-inner-pad">
                  <div className="podcast-card-header">
                    <span className={`podcast-category-icon ${pc.categoryColor}`}>
                      {pc.categoryColor === "purple" && <Headphones size={11} />}
                      {pc.categoryColor === "blue" && <Heart size={11} />}
                      {pc.categoryColor === "green" && <Mic2 size={11} />}
                      {pc.categoryColor === "red" && <Radio size={11} />}
                    </span>
                    <span className={`podcast-category-name ${pc.categoryColor}`}>
                      {pc.category}
                    </span>
                  </div>
                  <p className="podcast-card-title">{pc.title}</p>
                  <div className="podcast-card-footer">
                    <div className="podcast-card-author">
                      <div className="podcast-author-avatar">
                        {pc.author.charAt(0)}
                      </div>
                      <span className="podcast-author-name">{pc.author}</span>
                    </div>
                    <span className={`podcast-voice-badge ${pc.voiceType}`}>
                      {pc.voiceType === "ai" ? "AI" : "Thật"}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* ===== RIGHT: Sidebar ===== */}
        <motion.div 
          className="livestream-sidebar"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="sidebar-tabs">
            <button
              className={`sidebar-tab ${sidebarTab === "chat" ? "active" : ""}`}
              onClick={() => setSidebarTab("chat")}
            >
              Chat
            </button>
            <button
              className={`sidebar-tab ${sidebarTab === "playlist" ? "active" : ""}`}
              onClick={() => setSidebarTab("playlist")}
            >
              Nhạc phát
            </button>
            <button
              className={`sidebar-tab ${sidebarTab === "podcast" ? "active" : ""}`}
              onClick={() => setSidebarTab("podcast")}
            >
              Podcast
            </button>
          </div>

          <AnimatePresence mode="wait">
            {sidebarTab === "chat" && (
              <motion.div 
                className="chat-panel"
                key="chat"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="chat-messages">
                  {chatMessages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      className={`chat-msg ${msg.type === "system" ? "system" : ""} ${msg.isSelf ? "self" : ""}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {msg.type === "system" ? (
                        <div className="chat-msg-system">{msg.text}</div>
                      ) : (
                        <>
                          {!msg.isSelf && (
                            <div className="chat-msg-header">
                              <div
                                className="chat-msg-avatar"
                                style={{ background: msg.avatarColor || "#555" }}
                              />
                              <span
                                className={`chat-msg-name ${msg.isHost ? "host" : ""}`}
                              >
                                {msg.name}
                              </span>
                              <span className="chat-msg-time">{msg.time}</span>
                            </div>
                          )}
                          <div
                            className={`chat-msg-bubble ${msg.requestSong ? "request-bubble" : ""}`}
                          >
                            {msg.requestSong && (
                              <div className="chat-request-tag">
                                🎵 Requested "{msg.requestSong}"
                              </div>
                            )}
                            {msg.text}
                          </div>
                          {msg.isSelf && (
                            <span
                              className="chat-msg-time"
                              style={{ marginTop: 2 }}
                            >
                              {msg.time}
                            </span>
                          )}
                        </>
                      )}
                    </motion.div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                <div
                  className="chat-input-area"
                  style={{ position: "relative" }}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <AnimatePresence>
                    {showEmojiPicker && (
                      <motion.div 
                        className="emoji-picker-popup"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                      >
                        {EMOJIS.map((em) => (
                          <button
                            key={em}
                            className="emoji-btn"
                            onClick={() => addEmoji(em)}
                          >
                            {em}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="chat-input-wrap">
                    <textarea
                      className="chat-input"
                      placeholder="Gửi tin nhắn..."
                      value={chatInput}
                      rows={1}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={handleChatKeyDown}
                    />
                    <button
                      className="chat-emoji-btn"
                      onClick={() => setShowEmojiPicker((p) => !p)}
                    >
                      <Smile size={18} />
                    </button>
                    <button
                      className="chat-send-btn"
                      disabled={!chatInput.trim()}
                      onClick={sendChat}
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Playlist Tab */}
            {sidebarTab === "playlist" && (
              <motion.div 
                className="playlist-panel"
                key="playlist"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Currently Playing */}
                <div className="playlist-now-label">Đang phát</div>
                <motion.div 
                  className="playlist-item active"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="playlist-item-art">
                    <img
                      src={proxyArtUrl(currentTrack.artUrl)}
                      alt={currentTrack.title}
                    />
                    <div className="playlist-item-playing-indicator">
                      <div className="mini-visualizer">
                        <div className="bar" />
                        <div className="bar" />
                        <div className="bar" />
                      </div>
                    </div>
                  </div>
                  <div className="playlist-item-info">
                    <div className="playlist-item-title">
                      {currentTrack.title}
                    </div>
                    <div className="playlist-item-artist">
                      {currentTrack.artist}
                    </div>
                  </div>
                  <div className="playlist-item-duration">
                    {formatTime(currentTrack.duration)}
                  </div>
                </motion.div>

                {/* Up Next */}
                {playingNext && (
                  <>
                    <div className="playlist-next-label">Tiếp theo</div>
                    <motion.div 
                      className="playlist-item"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <div className="playlist-item-art">
                        <img
                          src={proxyArtUrl(playingNext.artUrl)}
                          alt={playingNext.title}
                        />
                      </div>
                      <div className="playlist-item-info">
                        <div className="playlist-item-title">
                          {playingNext.title}
                        </div>
                        <div className="playlist-item-artist">
                          {playingNext.artist}
                        </div>
                      </div>
                      <div className="playlist-item-duration">
                        {formatTime(playingNext.duration)}
                      </div>
                    </motion.div>
                  </>
                )}

                {/* History */}
                {songHistory && songHistory.length > 0 && (
                  <>
                    <div className="playlist-history-label">Đã phát</div>
                    {songHistory.map((track: TrackInfo, index: number) => (
                      <motion.div 
                        key={track.shId} 
                        className="playlist-item history"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + index * 0.05 }}
                      >
                        <div className="playlist-item-art">
                          <img
                            src={proxyArtUrl(track.artUrl)}
                            alt={track.title}
                          />
                        </div>
                        <div className="playlist-item-info">
                          <div className="playlist-item-title">{track.title}</div>
                          <div className="playlist-item-artist">
                            {track.artist} · {formatPlayedAt(track.playedAt)}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </>
                )}
              </motion.div>
            )}

            {/* Podcast Tab */}
            {sidebarTab === "podcast" && (
              <motion.div 
                className="podcast-tab-panel"
                key="podcast"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {DEMO_PODCASTS.map((pc, index) => (
                  <motion.div 
                    key={pc.id} 
                    className="podcast-tab-item"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div
                      className="podcast-tab-item-category"
                      style={{
                        color:
                          pc.categoryColor === "purple"
                            ? "#9b59ff"
                            : pc.categoryColor === "blue"
                              ? "#55C5F1"
                              : pc.categoryColor === "green"
                                ? "#2ecc71"
                                : "#ff3b3f",
                      }}
                    >
                      {pc.category}
                    </div>
                    <div className="podcast-tab-item-text">{pc.title}</div>
                    <div className="podcast-tab-item-footer">
                      <span>Bởi {pc.author}</span>
                      <span className={`podcast-voice-badge ${pc.voiceType}`}>
                        {pc.voiceType === "ai" ? "Giọng AI" : "Giọng thật"}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ===== MODALS ===== */}
      <AnimatePresence>
        {showRequestModal && (
          <RequestMusicModal
            onClose={() => setShowRequestModal(false)}
            requestSearch={requestSearch}
            setRequestSearch={setRequestSearch}
            songHistory={songHistory}
            liveSessionId={activeSession?.id}
            stationId={activeSession?.stationId}
            onRequest={(song) => {
              const newMsg: ChatMessage = {
                id: Date.now().toString(),
                type: "request",
                name: "Bạn",
                text: `Mình muốn nghe bài này!`,
                time: new Date().toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                isSelf: true,
                avatarColor: "#5F6EE0",
                requestSong: song,
              };
              setChatMessages((prev) => [...prev, newMsg]);
              setShowRequestModal(false);
            }}
          />
        )}

        {showPodcastModal && (
          <PodcastSubmitModal onClose={() => setShowPodcastModal(false)} />
        )}

        {showShareModal && (
          <ShareNowPlayingModal
            track={currentTrack}
            stationName={stationName}
            onClose={() => setShowShareModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Floating Reactions */}
      <div className="floating-reactions" style={{ pointerEvents: 'none', position: 'absolute', bottom: '80px', left: '50%', zIndex: 1000 }}>
        <AnimatePresence>
          {floatingReactions.map((r) => (
            <motion.span
              key={r.id}
              className="floating-emoji"
              initial={{ opacity: 0, y: 0, x: r.x, scale: 0.5 }}
              animate={{ 
                opacity: [0, 1, 1, 0], 
                y: -300 - Math.random() * 100, 
                x: r.x + (Math.random() * 100 - 50),
                scale: [0.5, 1.5, 1.2, 1] 
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.2, ease: "easeOut" }}
              style={{ position: 'absolute', fontSize: '2rem', filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.5))' }}
            >
              {r.emoji}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ===== REQUEST MUSIC MODAL =====
interface RequestMusicModalProps {
  onClose: () => void;
  requestSearch: string;
  setRequestSearch: (v: string) => void;
  songHistory: TrackInfo[];
  liveSessionId?: string;
  stationId?: string;
  onRequest: (songTitle: string) => void;
}

interface RequestableSong {
  id: string;
  mediaFileId: string;
  title: string;
  artist: string;
  album?: string;
  artUrl?: string;
}

const RequestMusicModal: React.FC<RequestMusicModalProps> = ({
  onClose,
  requestSearch,
  setRequestSearch,
  songHistory,
  liveSessionId,
  stationId,
  onRequest,
}) => {
  const [requestableLibrary, setRequestableLibrary] = useState<RequestableSong[]>([]);
  const [loading, setLoading] = useState(false);
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let ignore = false;

    const loadRequestableSongs = async () => {
      if (!stationId) {
        if (!ignore) {
          setRequestableLibrary([]);
        }
        return;
      }

      setLoading(true);
      try {
        const stationSongs = await liveSessionApiService.getStationMusic(stationId);
        const mapped = stationSongs.map((song) => ({
          id: song.id,
          mediaFileId: song.id,
          title: song.title,
          artist: song.artist,
          album: song.album || "",
          artUrl: song.artworkUrl || "",
        }));

        if (!ignore) {
          setRequestableLibrary(mapped);
        }
      } catch {
        // Fallback to song history only for display; cannot submit without mediaFileId.
        const fallback = songHistory.map((track) => ({
          id: `history-${track.shId}`,
          mediaFileId: "",
          title: track.title,
          artist: track.artist,
          album: track.album,
          artUrl: track.artUrl,
        }));
        if (!ignore) {
          setRequestableLibrary(fallback);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    void loadRequestableSongs();

    return () => {
      ignore = true;
    };
  }, [songHistory, stationId]);

  const filteredSongs = requestableLibrary.filter(
    (s) =>
      s.title.toLowerCase().includes(requestSearch.toLowerCase()) ||
      s.artist.toLowerCase().includes(requestSearch.toLowerCase()),
  );

  const handleRequest = async (song: RequestableSong) => {
    if (!liveSessionId) {
      showError("Không tìm thấy phiên live", "Vui lòng tải lại trang và thử lại");
      return;
    }

    if (!song.mediaFileId) {
      showInfo("Bài hát chưa sẵn sàng", "Chưa đồng bộ được mediaFileId để gửi request");
      return;
    }

    setLoading(true);
    try {
      await liveSessionApiService.createSongRequest(liveSessionId, {
        mediaFileId: song.mediaFileId,
      });
      setRequestedIds((prev) => new Set(prev).add(song.mediaFileId));
      onRequest(song.title);
      showSuccess("Đã gửi request", `Đã gửi bài \"${song.title}\"`);
    } catch {
      showError("Gửi request thất bại", "Vui lòng thử lại sau");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      className="modal-overlay" 
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="request-modal" 
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
      >
        <div className="request-modal-header">
          <span className="request-modal-title">🎵 Request Nhạc</span>
          <button className="request-modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="request-modal-search">
          <div style={{ position: "relative" }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "rgba(255,255,255,0.3)",
              }}
            />
            <input
              className="request-search-input"
              placeholder="Tìm bài hát..."
              value={requestSearch}
              onChange={(e) => setRequestSearch(e.target.value)}
              style={{ paddingLeft: 36 }}
            />
          </div>
        </div>
        <div className="request-song-list">
          {filteredSongs.length === 0 ? (
            <div className="request-empty">
              <Music size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
              <p>Không tìm thấy bài hát</p>
            </div>
          ) : (
            filteredSongs.map((song) => (
              <div key={song.id} className="request-song-item">
                <img
                  className="request-song-art"
                  src={proxyArtUrl(song.artUrl || "")}
                  alt={song.title}
                />
                <div className="request-song-info">
                  <div className="request-song-title">{song.title}</div>
                  <div className="request-song-artist">
                    {song.artist} · {song.album}
                  </div>
                </div>
                <button
                  className="request-song-btn"
                  disabled={loading || !song.mediaFileId || requestedIds.has(song.mediaFileId)}
                  onClick={() => handleRequest(song)}
                >
                  {requestedIds.has(song.mediaFileId)
                    ? "✓ Đã gửi"
                    : !song.mediaFileId
                    ? "Chưa sync"
                    : "Request"}
                </button>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ===== PODCAST SUBMIT MODAL =====
interface PodcastSubmitModalProps {
  onClose: () => void;
}

const PodcastSubmitModal: React.FC<PodcastSubmitModalProps> = ({ onClose }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("story");
  const [voiceType, setVoiceType] = useState("ai");

  return (
    <motion.div 
      className="modal-overlay" 
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="podcast-modal" 
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
      >
        <div className="podcast-modal-title">
          🎙️ Gửi Podcast
          <button className="request-modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="podcast-form-group">
          <label className="podcast-form-label">Chủ đề</label>
          <select
            className="podcast-form-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="story">Story Time</option>
            <option value="family">Chuyện Gia Đình</option>
            <option value="love">Chuyện Tình Cảm</option>
            <option value="life">Chuyện Đồi Thường</option>
          </select>
        </div>

        <div className="podcast-form-group">
          <label className="podcast-form-label">Tiêu đề</label>
          <input
            className="podcast-form-input"
            placeholder="Nhập tiêu đề podcast..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="podcast-form-group">
          <label className="podcast-form-label">Nội dung / Kịch bản</label>
          <textarea
            className="podcast-form-textarea"
            placeholder="Viết nội dung hoặc kịch bản podcast của bạn..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        <div className="podcast-form-group">
          <label className="podcast-form-label">Loại giọng</label>
          <select
            className="podcast-form-select"
            value={voiceType}
            onChange={(e) => setVoiceType(e.target.value)}
          >
            <option value="ai">Giọng AI</option>
            <option value="real">Giọng thật (tải lên file âm thanh)</option>
          </select>
        </div>

        <div className="podcast-form-actions">
          <button className="podcast-form-cancel" onClick={onClose}>
            Hủy
          </button>
          <button
            className="podcast-form-submit"
            onClick={() => {
              // Demo - just close
              onClose();
            }}
          >
            Gửi Podcast
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ===== SHARE NOW-PLAYING MODAL =====
interface ShareNowPlayingModalProps {
  track: TrackInfo;
  stationName: string;
  onClose: () => void;
}

const ShareNowPlayingModal: React.FC<ShareNowPlayingModalProps> = ({
  track,
  stationName,
  onClose,
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [generating, setGenerating] = useState(false);
  const [cachedDataUrl, setCachedDataUrl] = useState<string | null>(null);

  const safeTitle = track.title || "Bài hát đang phát";
  const safeArtist = track.artist || "Không rõ nghệ sĩ";
  const safeAlbum = track.album || "Live Radio";

  const buildImage = async (): Promise<string | null> => {
    if (cachedDataUrl) return cachedDataUrl;
    if (!cardRef.current) return null;
    try {
      setGenerating(true);
      const rect = cardRef.current.getBoundingClientRect();
      const scaleBase = window.devicePixelRatio || 2;
      const scale = Math.min(scaleBase * 1.5, 3);

      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale,
        useCORS: true,
        allowTaint: false,
        width: rect.width,
        height: rect.height,
        windowWidth: document.documentElement.clientWidth,
      });

      const dataUrl = canvas.toDataURL("image/png", 0.95);
      setCachedDataUrl(dataUrl);
      return dataUrl;
    } catch (e) {
      console.error("Failed to generate share image", e);
      if (e instanceof DOMException && e.name === "SecurityError") {
        showError(
          "Không xuất được ảnh đầy đủ",
          "Server ảnh album chưa bật CORS nên trình duyệt không cho phép kèm cover trong file. Hãy cấu hình CORS cho domain cover hoặc dùng ảnh trong hệ thống SoundMates.",
        );
      } else {
        showError(
          "Không tạo được ảnh chia sẻ",
          "Vui lòng thử lại sau vài giây.",
        );
      }
      return null;
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    const dataUrl = await buildImage();
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `soundmates-now-playing-${track.title || "track"}.png`;
    link.click();
    showSuccess(
      "Đã tải ảnh card",
      "Bạn có thể dùng ảnh này để chia sẻ lên mạng xã hội.",
    );
  };

  const handleCopyLink = async () => {
    const dataUrl = await buildImage();
    if (!dataUrl) return;
    try {
      await navigator.clipboard.writeText(dataUrl);
      showSuccess("Đã copy link ảnh", "Dán link này vào nơi bạn muốn chia sẻ.");
    } catch (e) {
      console.error("Clipboard error", e);
      showError(
        "Không copy được link ảnh",
        "Trình duyệt không cho phép copy, thử lại thủ công.",
      );
    }
  };

  const handleShareToWall = async () => {
    // Demo: trong tương lai có thể gọi API tạo bài viết / status trong hệ thống
    await buildImage();
    showInfo(
      "Đã chia sẻ lên tường (demo)",
      "Khi có backend tường bài viết, card này sẽ được đẩy lên đó.",
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="share-modal" onClick={(e) => e.stopPropagation()}>
        <div className="share-modal-header">
          <span className="share-modal-title">Chia sẻ phiên đang nghe</span>
          <button className="request-modal-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Card preview dùng để export thành ảnh */}
        <div className="share-card-preview-wrap">
          <div className="share-card-preview" ref={cardRef}>
            <div className="share-card-inner">
              <div className="share-card-header">
                <div className="share-card-logo">
                  <div className="share-card-logo-mark">
                    <img src={brandLogo} alt="SoundMates logo" />
                  </div>
                  <span className="share-card-logo-text">SoundMates</span>
                </div>
                <span className="share-card-pill">Live Session</span>
              </div>

              <div className="share-card-main">
                <div className="share-card-art-wrap">
                  <div className="share-card-art-shadow" />
                  {track.artUrl ? (
                    <img
                      src={proxyArtUrl(track.artUrl)}
                      alt={safeTitle}
                      className="share-card-art"
                    />
                  ) : (
                    <div className="share-card-art share-card-art-placeholder">
                      <span>SM</span>
                    </div>
                  )}
                </div>

                <div className="share-card-text">
                  <p className="share-card-track-title">{safeTitle}</p>
                  <p className="share-card-track-artist">{safeArtist}</p>
                  <p className="share-card-track-meta">
                    {stationName} • {safeAlbum}
                  </p>
                </div>
              </div>

              <div className="share-card-footer">
                <div className="share-card-footer-left">
                  <div className="share-card-progress-shell">
                    <div className="share-card-progress-fill" />
                  </div>
                  <span className="share-card-caption">
                    Đang nghe cùng SoundMates
                  </span>
                </div>
                <span className="share-card-tagline">soundmates.fm</span>
              </div>
            </div>
          </div>
        </div>

        <div className="share-modal-actions">
          <button
            className="share-modal-btn primary"
            onClick={handleShareToWall}
            disabled={generating}
          >
            Chia sẻ lên tường (demo)
          </button>
          <button
            className="share-modal-btn outline"
            onClick={handleCopyLink}
            disabled={generating}
          >
            Copy link ảnh
          </button>
          <button
            className="share-modal-btn subtle"
            onClick={handleDownload}
            disabled={generating}
          >
            Tải ảnh về máy
          </button>
        </div>
      </div>
    </div>
  );
};

export default LivestreamPage;
