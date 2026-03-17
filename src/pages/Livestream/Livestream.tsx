import React, { useState, useEffect, useRef, useCallback } from "react";
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
import {
  livestreamService,
  type NowPlayingData,
  type TrackInfo,
} from "../../services/livestreamService";
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
    title: '"Các câu chuyện đời thường của tôi bắt đầu vào 1 hôm kì lạ..."',
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
    text: "Oke! Sau bài này nhé. Mọi người xem live vui vẻ <3",
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

  // Refs
  const chatEndRef = useRef<HTMLDivElement>(null);
  const reactionIdRef = useRef(0);

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

  // ===== DATA FETCHING =====
  const fetchNowPlaying = useCallback(async () => {
    try {
      const data = await livestreamService.getNowPlaying();
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
        listenUrl: data.listenUrl,
      });
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch now playing:", err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, [fetchNowPlaying]);

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

  const handleChatKeyDown = (e: React.KeyboardEvent) => {
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
          <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
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
      <div className="livestream-page">
        <Loading
          fullscreen
          size="large"
          text="Đang kết nối đến phiên phát sóng..."
        />
      </div>
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
    stationName,
    totalListeners,
    isLive,
    isOnline,
  } = nowPlaying;

  return (
    <div className={`livestream-page livestream-theme-${theme}`}>
      <div className="livestream-container">
        {/* ===== LEFT: Main Content ===== */}
        <div className="livestream-main">
          {/* Now Playing Hero */}
          <div className="now-playing-hero">
            <div
              className="now-playing-cover"
              onClick={player.toggle}
              style={{ cursor: "pointer" }}
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
            </div>

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
                  <Users size={13} /> {totalListeners} người nghe
                </span>
              </div>

              {renderProgressBar()}
            </div>
          </div>

          {/* Live Action Bar – đặt gần hero để nằm trong 1 màn hình */}
          <div className="livestream-action-bar">
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
              <button
                className="action-btn emotion"
                onClick={() => {
                  setShowEmotionPicker((p) => !p);
                  setShowRequestModal(false);
                  setShowPodcastModal(false);
                }}
              >
                <Smile size={15} /> Cảm xúc
              </button>
              <button
                className="action-btn request"
                onClick={() => {
                  setShowRequestModal(true);
                  setShowEmotionPicker(false);
                  setShowPodcastModal(false);
                }}
              >
                <Music size={15} /> Request Nhạc
              </button>
              <button
                className="action-btn podcast-submit"
                onClick={() => {
                  setShowPodcastModal(true);
                  setShowEmotionPicker(false);
                  setShowRequestModal(false);
                }}
              >
                <Mic2 size={15} /> Gửi Podcast
              </button>

              {showEmotionPicker && (
                <div className="emotion-popup">
                  {EMOTIONS.map((em) => (
                    <button
                      key={em}
                      className="emotion-btn"
                      onClick={() => sendEmotion(em)}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="action-bar-right">
              <div className="listener-count">
                <Users size={14} />
                {totalListeners || 128}
              </div>
            </div>
          </div>

          {/* Podcast Cards */}
          <div className="podcast-section">
            {DEMO_PODCASTS.map((pc) => (
              <div className="podcast-card" key={pc.id}>
                <div className="podcast-card-header">
                  <span className={`podcast-category-icon ${pc.categoryColor}`}>
                    {pc.categoryColor === "purple" && <Headphones size={12} />}
                    {pc.categoryColor === "blue" && <Heart size={12} />}
                    {pc.categoryColor === "green" && <Mic2 size={12} />}
                    {pc.categoryColor === "red" && <Radio size={12} />}
                  </span>
                  <span className={`podcast-category-name ${pc.categoryColor}`}>
                    {pc.category}
                  </span>
                </div>
                <p className="podcast-card-title">{pc.title}</p>
                <div className="podcast-card-footer">
                  <div className="podcast-card-author">
                    <div className="podcast-author-checkbox" />
                    <span className="podcast-author-name">
                      Được gửi bởi {pc.author}
                    </span>
                  </div>
                  <span className={`podcast-voice-badge ${pc.voiceType}`}>
                    {pc.voiceType === "ai" ? "Giọng AI" : "Giọng thật"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ===== RIGHT: Sidebar ===== */}
        <div className="livestream-sidebar">
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

          {/* Chat Tab */}
          {sidebarTab === "chat" && (
            <div className="chat-panel">
              <div className="chat-messages">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`chat-msg ${msg.type === "system" ? "system" : ""} ${msg.isSelf ? "self" : ""}`}
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
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <div className="chat-input-area" style={{ position: "relative" }}>
                {showEmojiPicker && (
                  <div className="emoji-picker-popup">
                    {EMOJIS.map((em) => (
                      <button
                        key={em}
                        className="emoji-btn"
                        onClick={() => addEmoji(em)}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                )}
                <div className="chat-input-wrap">
                  <input
                    className="chat-input"
                    placeholder="Gửi tin nhắn..."
                    value={chatInput}
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
            </div>
          )}

          {/* Playlist Tab */}
          {sidebarTab === "playlist" && (
            <div className="playlist-panel">
              {/* Currently Playing */}
              <div className="playlist-now-label">Đang phát</div>
              <div className="playlist-item active">
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
              </div>

              {/* Up Next */}
              {playingNext && (
                <>
                  <div className="playlist-next-label">Tiếp theo</div>
                  <div className="playlist-item">
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
                  </div>
                </>
              )}

              {/* History */}
              {songHistory && songHistory.length > 0 && (
                <>
                  <div className="playlist-history-label">Đã phát</div>
                  {songHistory.map((track: TrackInfo) => (
                    <div key={track.shId} className="playlist-item history">
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
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* Podcast Tab */}
          {sidebarTab === "podcast" && (
            <div className="podcast-tab-panel">
              {DEMO_PODCASTS.map((pc) => (
                <div key={pc.id} className="podcast-tab-item">
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===== MODALS ===== */}
      {showRequestModal && (
        <RequestMusicModal
          onClose={() => setShowRequestModal(false)}
          requestSearch={requestSearch}
          setRequestSearch={setRequestSearch}
          songHistory={songHistory}
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

      {/* Floating Reactions */}
      <div className="floating-reactions">
        {floatingReactions.map((r) => (
          <span
            key={r.id}
            className="floating-emoji"
            style={{ left: r.x, animationDelay: "0s" }}
          >
            {r.emoji}
          </span>
        ))}
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
  onRequest: (songTitle: string) => void;
}

const RequestMusicModal: React.FC<RequestMusicModalProps> = ({
  onClose,
  requestSearch,
  setRequestSearch,
  songHistory,
  onRequest,
}) => {
  const [requestableLibrary, setRequestableLibrary] = useState<TrackInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [requestedIds, setRequestedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Use songHistory as a demo library (unique by title)
    const seen = new Set<string>();
    const unique: TrackInfo[] = [];
    for (const t of songHistory) {
      if (!seen.has(t.title)) {
        seen.add(t.title);
        unique.push(t);
      }
    }
    setRequestableLibrary(unique);
  }, [songHistory]);

  const filteredSongs = requestableLibrary.filter(
    (s) =>
      s.title.toLowerCase().includes(requestSearch.toLowerCase()) ||
      s.artist.toLowerCase().includes(requestSearch.toLowerCase()),
  );

  const handleRequest = async (song: TrackInfo) => {
    setLoading(true);
    // Try to request via AzuraCast API
    try {
      await livestreamService.requestSong(song.shId.toString());
    } catch {
      // demo fallback - still show in chat
    }
    setRequestedIds((prev) => new Set(prev).add(song.shId));
    onRequest(song.title);
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="request-modal" onClick={(e) => e.stopPropagation()}>
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
              <div key={song.shId} className="request-song-item">
                <img
                  className="request-song-art"
                  src={proxyArtUrl(song.artUrl)}
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
                  disabled={loading || requestedIds.has(song.shId)}
                  onClick={() => handleRequest(song)}
                >
                  {requestedIds.has(song.shId) ? "✓ Đã gửi" : "Request"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="podcast-modal" onClick={(e) => e.stopPropagation()}>
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
            <option value="life">Chuyện Đời Thường</option>
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
      </div>
    </div>
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
