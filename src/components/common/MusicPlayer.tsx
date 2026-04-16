import { useEffect, useState } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Heart,
  ListMusic,
  X,
  Mic2,
  Music,
  Radio,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { usePlayer } from "../../context/PlayerContext";
import { useLiveSession } from "../../context/LiveSessionContext";
import { showToast } from "../../utils/toast";
import podcastService from "../../services/podcastService";
import type { PodcastEpisode } from "../../types/podcast";
import "./MusicPlayer.css";

// Placeholder art when not in a session
const PLACEHOLDER_ART =
  "https://i.pinimg.com/736x/e2/8e/8c/e28e8c45eed55b1ffca39e0666be1f86.jpg";

type DrawerTab = "playlist" | "podcast";

export function MusicPlayer() {
  const {
    track,
    isPlaying: playerIsPlaying,
    volume: playerVolume,
    isMuted: playerIsMuted,
    elapsed: playerElapsed,
    toggle,
    setVolume: playerSetVolume,
    setElapsed,
    toggleMute: playerToggleMute,
    leaveSession,
    setTrack,
    setIsPlaying,
    audioRef: ctxAudioRef,
  } = usePlayer();

  const liveCtx = useLiveSession();
  const isInLiveSession = !!liveCtx.activeSessionId;

  // Use live context values when in a live session, otherwise use PlayerContext
  const isPlaying = isInLiveSession ? liveCtx.isPlaying : playerIsPlaying;
  const volume = isInLiveSession ? liveCtx.volume : playerVolume;
  const isMuted = isInLiveSession ? liveCtx.isMuted : playerIsMuted;
  const elapsed = isInLiveSession ? liveCtx.displayElapsed : playerElapsed;
  const toggleMute = isInLiveSession ? liveCtx.toggleMute : playerToggleMute;
  const setVolume = isInLiveSession
    ? liveCtx.setVolume
    : playerSetVolume;

  const navigate = useNavigate();
  const location = useLocation();

  // ─── Theme detection via MutationObserver (not on every render) ────────────
  const [isDark, setIsDark] = useState(
    document.documentElement.getAttribute("data-theme") === "dark",
  );

  useEffect(() => {
    const obs = new MutationObserver(() => {
      setIsDark(document.documentElement.getAttribute("data-theme") === "dark");
    });
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => obs.disconnect();
  }, []);

  // ─── Theme-aware icon colors ─────────────────────────────────────────────
  const iconAccent = isDark ? "#60a5fa" : "#3b82f6";
  const iconMuted = isDark ? "rgba(255,255,255,0.35)" : "#9CA3AF";
  const [isFavorite, setIsFavorite] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [drawerTab, setDrawerTab] = useState<DrawerTab>("playlist");
  const [podcastEpisodes, setPodcastEpisodes] = useState<PodcastEpisode[]>([]);
  const [podcasts, setPodcasts] = useState<{ id: string; title: string; banner: string | null }[]>([]);
  const [selectedPodcastId, setSelectedPodcastId] = useState<string | null>(null);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);

  // ─── Poll audio.currentTime directly from the shared audio element ────────
  // liveAudioRef: Audio instance owned by LiveRoomPage (live session playback).
  // ctxAudioRef:  Audio instance owned by PlayerContext (podcasts, on-demand).
  // Poll non-live audio to keep PlayerContext.elapsed in sync (podcasts/on-demand).
  // For live sessions, LiveRoomPage publishes server-calibrated elapsed via player.setElapsed.
  useEffect(() => {
    const tick = () => {
      const live = (window as any).__liveAudioRef;
      const srcAudio = (live ?? ctxAudioRef.current) as HTMLAudioElement | null | undefined;
      if (srcAudio && !live) {
        setElapsed(srcAudio.currentTime);
      }
    };
    tick();
    const id = setInterval(tick, 250); // 4×/s is enough for smooth display
    return () => clearInterval(id);
  }, [ctxAudioRef, setElapsed]);

  // Reset favorite when track changes
  useEffect(() => { setIsFavorite(false); }, [track?.title]);

  // Load podcasts when drawer opens on podcast tab
  useEffect(() => {
    if (showPlaylist && drawerTab === "podcast" && podcasts.length === 0) {
      podcastService.getPublishedPodcasts()
        .then((data) => setPodcasts(data.slice(0, 10).map((p) => ({ id: p.id, title: p.title, banner: p.banner }))))
        .catch(() => {});
    }
  }, [showPlaylist, drawerTab]);

  // Load episodes when a podcast is selected
  useEffect(() => {
    if (!selectedPodcastId) return;
    setLoadingEpisodes(true);
    podcastService.getEpisodes(selectedPodcastId)
      .then((eps) => setPodcastEpisodes(eps))
      .catch(() => setPodcastEpisodes([]))
      .finally(() => setLoadingEpisodes(false));
  }, [selectedPodcastId]);

  const playPodcastEpisode = async (ep: PodcastEpisode) => {
    if (!ep.audioUrl) {
      showToast.error("Tập podcast chưa có file audio");
      return;
    }
    if (ctxAudioRef.current) {
      ctxAudioRef.current.pause();
      ctxAudioRef.current = null;
    }
    const audio = new Audio(ep.audioUrl);
    ctxAudioRef.current = audio;
    audio.volume = volume / 100;
    const baseDuration = ep.duration ?? 0;
    setTrack({
      title: ep.title,
      artist: "Podcast",
      artUrl: ep.thumbnailUrl || PLACEHOLDER_ART,
      duration: baseDuration,
      elapsed: 0,
      listenUrl: ep.audioUrl,
    });
    audio.onloadedmetadata = () => {
      const d = Math.max(0, Math.floor(audio.duration || 0));
      if (d > 0 && d !== baseDuration) {
        setTrack({
          title: ep.title,
          artist: "Podcast",
          artUrl: ep.thumbnailUrl || PLACEHOLDER_ART,
          duration: d,
          elapsed: 0,
          listenUrl: ep.audioUrl,
        });
      }
    };
    audio.play().then(() => setIsPlaying(true)).catch((err) => {
      showToast.error(`Không phát được podcast: ${String(err?.message ?? err ?? "Unknown error")}`);
    });
  };

  /* ── Pause when navigating to auth pages ─────────────────────────────── */
  useEffect(() => {
    const shouldPauseForAuthPage =
      location.pathname === "/login" || location.pathname === "/register";
    if (shouldPauseForAuthPage && isPlaying && !isMuted) {
      toggleMute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  /* ── Helpers ─────────────────────────────────────────────────────────── */
  const fmt = (s: number) => {
    if (!s || s <= 0) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // Live session: derive track info from context
  const liveTrack = isInLiveSession ? liveCtx.nowPlaying?.currentTrack : null;
  const displayTrack = isInLiveSession
    ? (liveTrack
        ? {
            title: liveTrack.title,
            artist: liveTrack.artist,
            artUrl: liveTrack.artUrl,
            duration: liveTrack.duration,
          }
        : null)
    : track;

  const title = displayTrack?.title ?? "Chưa có bài phát";
  const artist = isInLiveSession
    ? (liveCtx.activeSession?.stationName || liveCtx.nowPlaying?.stationName || "Live")
    : (displayTrack?.artist ?? "...");
  const artUrl = displayTrack?.artUrl ?? PLACEHOLDER_ART;
  const duration = (isInLiveSession ? liveTrack?.duration : track?.duration) ?? 0;
  const displayElapsed = Math.max(0, duration > 0 ? Math.min(elapsed, duration) : elapsed);
  const progressPct = duration > 0 ? Math.min((displayElapsed / duration) * 100, 100) : 0;
  const displayVolume = isMuted ? 0 : volume;
  const showPlayIcon = !isPlaying || isMuted || volume === 0;

  // Whether to show the player at all
  const hasContent = isInLiveSession || !!track;

  const handleTogglePlay = () => {
    if (isInLiveSession) {
      liveCtx.toggleAudio();
    } else {
      toggle();
    }
  };

  const handleLeave = () => {
    if (isInLiveSession) {
      liveCtx.leaveLiveRoom();
    } else {
      leaveSession();
    }
  };

  const handleNavigateToLive = () => {
    if (liveCtx.activeSessionId) {
      navigate(`/live/${liveCtx.activeSessionId}`);
    }
  };

  const handleFavorite = async () => {
    if (!track) return;
    try {
      // TODO: wire up favoriteService.addFavorite() once the API is ready
      setIsFavorite(prev => !prev);
      showToast.success(isFavorite ? "Đã bỏ yêu thích" : "Đã thêm vào yêu thích");
    } catch {
      showToast.error("Không thể cập nhật yêu thích");
    }
  };

  // Hide the player entirely when there's nothing to play
  if (!hasContent) return null;

  return (
    <div className="music-player">
      <div className="music-player-container">
        {/* Progress Bar */}
        <div className="progress-section">
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {/* Main Player Content */}
        <div className="player-content">
          {/* Left Section */}
          <div className="left-section">
            <div
              className="album-art-container"
              style={{ cursor: isInLiveSession ? "pointer" : "default" }}
              onClick={isInLiveSession ? handleNavigateToLive : undefined}
              title={isInLiveSession ? "Quay lại phòng Live" : undefined}
            >
              <img
                src={artUrl}
                alt={title}
                className={`album-art ${!hasContent ? "album-art--placeholder" : ""}`}
              />
              {isInLiveSession && (
                <div className="live-badge-overlay">
                  <Radio size={10} />
                  LIVE
                </div>
              )}
            </div>

            <div className="track-info-container">
              <p className="track-title" style={{ cursor: isInLiveSession ? "pointer" : "default" }} onClick={isInLiveSession ? handleNavigateToLive : undefined}>{title}</p>
              <p className="track-artist">{artist}</p>
            </div>

            {/* Heart — only for non-live */}
            {!isInLiveSession && track && (
              <div
                className="heart-icon-container"
                title={isFavorite ? "Bỏ yêu thích" : "Yêu thích"}
                style={{ cursor: "pointer" }}
                onClick={handleFavorite}
              >
                <Heart
                  size={16}
                  strokeWidth={1.8}
                  fill={isFavorite ? "#ef4444" : "none"}
                  color={isFavorite ? "#ef4444" : iconMuted}
                />
              </div>
            )}
          </div>

          {/* Center Section */}
          <div className="center-section">
            <span className="time-display">{fmt(displayElapsed)}</span>

            <button
              className="play-button-clean"
              onClick={handleTogglePlay}
              disabled={!hasContent}
              title={showPlayIcon ? "Phát nhạc" : "Tạm dừng"}
            >
              {showPlayIcon ? (
                <Play size={22} strokeWidth={2.2} style={{ marginLeft: 2 }} />
              ) : (
                <Pause size={22} strokeWidth={2.2} />
              )}
            </button>

            <span className="time-display">
              {duration > 0 ? fmt(duration) : "--:--"}
            </span>
          </div>

          {/* Right Section */}
          <div className="right-section">
            {/* Playlist button — wired up */}
            <div
              className="download-list-icon-container"
              title="Danh sách phát"
              style={{ cursor: "pointer" }}
              onClick={() => setShowPlaylist(prev => !prev)}
            >
              <ListMusic size={20} strokeWidth={1.8} color={iconAccent} />
            </div>

            <div
              className="volume-icon-container"
              onClick={toggleMute}
              title={isMuted ? "Bật tiếng" : "Tắt tiếng"}
              style={{ cursor: "pointer" }}
            >
              {isMuted || volume === 0 ? (
                <VolumeX size={20} strokeWidth={1.8} color={iconMuted} />
              ) : (
                <Volume2 size={20} strokeWidth={1.8} color={iconAccent} />
              )}
            </div>

            <div className="volume-slider-container">
              <div
                className="volume-slider-track"
                style={{ "--vol-pct": displayVolume } as React.CSSProperties}
              >
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={displayVolume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="volume-slider"
                />
              </div>
            </div>

            {/* Leave session button */}
            {hasContent && (
              <div
                className="leave-session-btn"
                onClick={handleLeave}
                title={isInLiveSession ? "Thoát Live Session" : "Dừng phát"}
                style={{ cursor: "pointer" }}
              >
                <X size={18} strokeWidth={2} color={iconMuted} />
              </div>
            )}
          </div>
        </div>

        {/* Playlist + Podcast drawer */}
        {showPlaylist && (
          <div className="music-player-playlist-drawer">
            <div className="playlist-drawer-header">
              {/* Tabs */}
              <div className="playlist-drawer-tabs">
                <button
                  className={`playlist-drawer-tab ${drawerTab === "playlist" ? "active" : ""}`}
                  onClick={() => setDrawerTab("playlist")}
                >
                  <Music size={13} /> Nhạc
                </button>
                <button
                  className={`playlist-drawer-tab ${drawerTab === "podcast" ? "active" : ""}`}
                  onClick={() => setDrawerTab("podcast")}
                >
                  <Mic2 size={13} /> Podcast
                </button>
              </div>
              <button onClick={() => setShowPlaylist(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="playlist-drawer-body">
              {drawerTab === "playlist" && (
                <p className="playlist-drawer-placeholder">
                  Tính năng đang phát triển — sẽ hiển thị queue nhạc của phiên.
                </p>
              )}

              {drawerTab === "podcast" && (
                <div className="podcast-drawer-content">
                  {/* Podcast list */}
                  {selectedPodcastId === null ? (
                    <div className="podcast-drawer-list">
                      {loadingEpisodes ? (
                        <p className="playlist-drawer-placeholder">Đang tải podcast...</p>
                      ) : podcasts.length === 0 ? (
                        <p className="playlist-drawer-placeholder">Chưa có podcast nào</p>
                      ) : (
                        podcasts.map((pod) => (
                          <div
                            key={pod.id}
                            className="podcast-drawer-item"
                            onClick={() => setSelectedPodcastId(pod.id)}
                          >
                            <div className="podcast-drawer-art">
                              {pod.banner ? (
                                <img src={pod.banner} alt={pod.title} />
                              ) : (
                                <Mic2 size={16} />
                              )}
                            </div>
                            <div className="podcast-drawer-info">
                              <span className="podcast-drawer-title">{pod.title}</span>
                            </div>
                            <Play size={12} fill="currentColor" />
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    /* Episode list */
                    <div className="episode-drawer-list">
                      <button
                        className="episode-drawer-back"
                        onClick={() => { setSelectedPodcastId(null); setPodcastEpisodes([]); }}
                      >
                        <X size={12} /> Quay lại
                      </button>
                      {loadingEpisodes ? (
                        <p className="playlist-drawer-placeholder">Đang tải tập...</p>
                      ) : podcastEpisodes.length === 0 ? (
                        <p className="playlist-drawer-placeholder">Chưa có tập nào</p>
                      ) : (
                        podcastEpisodes.map((ep) => (
                          <div
                            key={ep.id}
                            className="episode-drawer-item"
                            onClick={() => playPodcastEpisode(ep)}
                          >
                            <Play size={12} fill="currentColor" />
                            <div className="episode-drawer-info">
                              <span className="episode-drawer-title">{ep.title}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
