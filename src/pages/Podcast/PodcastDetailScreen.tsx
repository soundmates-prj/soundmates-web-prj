import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Headphones,
  Loader2,
  Mic2,
  Music2,
  Pause,
  Play,
  StopCircle,
  User,
} from "lucide-react";
import podcastService from "../../services/podcastService";
import type { PodcastItem, PodcastEpisode } from "../../types/podcast";
import { usePlayer } from "../../context/PlayerContext";
import { useLiveSession } from "../../context/LiveSessionContext";
import "./PodcastDetailScreen.css";

const fmtDate = (d?: string) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const fmtTime = (seconds: number) => {
  if (!seconds || !isFinite(seconds)) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
};

export default function PodcastDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [podcast, setPodcast] = useState<PodcastItem | null>(null);
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvedDurations, setResolvedDurations] = useState<
    Record<string, number>
  >({});
  const resolvedDurationsRef = useRef<Record<string, number>>({});

  const {
    track,
    isPlaying: ctxIsPlaying,
    audioRef: ctxAudioRef,
    setIsPlaying,
    setTrack,
    volume: ctxVolume,
  } = usePlayer();
  const liveCtx = useLiveSession();
  
  // We no longer need local playingId, isPaused, currentTime, etc.
  // We'll map them from PlayerContext.
  const playingId = track?.listenUrl ? episodes.find(e => e.audioUrl === track.listenUrl)?.id : null;
  const isActive = (ep: PodcastEpisode) => playingId === ep.id && !!track;
  const isActuallyPlaying = (ep: PodcastEpisode) => isActive(ep) && ctxIsPlaying;
  
  // We shouldn't duplicate tracking RAF, the MusicPlayer component polls the elapsed time.
  // Wait, PodcastDetailScreen needs `currentTime` to render the progress bar!
  // We can just use a generic interval or rely on PlayerContext.elapsed.
  const { elapsed: ctxElapsed } = usePlayer();

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setLoading(true);
      try {
        const p = await podcastService.getPodcastById(id);
        setPodcast(p);
        setEpisodes(p.allEpisodes ?? []);
      } catch {
        setError("Không thể tải thông tin podcast.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    const fillMissingDurations = async () => {
      const missing = episodes.filter(
        (ep) =>
          !!ep.audioUrl &&
          (ep.duration ?? 0) <= 0 &&
          !resolvedDurationsRef.current[ep.id],
      );

      for (const ep of missing) {
        const duration = await new Promise<number>((resolve) => {
          const audio = new Audio();
          audio.preload = "metadata";
          audio.src = ep.audioUrl!;

          const done = (value: number) => {
            audio.onloadedmetadata = null;
            audio.onerror = null;
            resolve(value);
          };

          audio.onloadedmetadata = () =>
            done(Math.max(0, Math.floor(audio.duration || 0)));
          audio.onerror = () => done(0);
        });

        if (!cancelled && duration > 0) {
          resolvedDurationsRef.current = {
            ...resolvedDurationsRef.current,
            [ep.id]: duration,
          };
          setResolvedDurations(resolvedDurationsRef.current);
        }
      }
    };

    void fillMissingDurations();

    return () => {
      cancelled = true;
    };
  }, [episodes]);

  // Instead of stopTracking, we just use PlayerContext methods

  const stopPlayback = () => {
    if (!ctxAudioRef.current) return;
    ctxAudioRef.current.pause();
    ctxAudioRef.current.currentTime = 0;
    ctxAudioRef.current = null;
    setIsPlaying(false);
    setTrack(null);
  };

  const togglePlay = (ep: PodcastEpisode) => {
    if (!ep.audioUrl) return;

    if (playingId === ep.id) {
      // Same episode — toggle pause/resume
      if (ctxAudioRef.current) {
        if (ctxAudioRef.current.paused) {
          if (liveCtx.activeSessionId && !liveCtx.isMuted) {
            liveCtx.toggleMute();
          }
          ctxAudioRef.current.play()
            .then(() => setIsPlaying(true))
            .catch((e) => console.error("Resume failed:", e));
        } else {
          ctxAudioRef.current.pause();
          setIsPlaying(false);
        }
      }
      return;
    }

    // Play new podcast
    if (ctxAudioRef.current) {
      ctxAudioRef.current.pause();
      ctxAudioRef.current = null;
    }

    // Mute live session if playing so they don't overlap!
    if (liveCtx.activeSessionId && !liveCtx.isMuted) {
      liveCtx.toggleMute();
    }

    const audio = new Audio(ep.audioUrl);
    ctxAudioRef.current = audio;
    audio.volume = ctxVolume / 100;
    
    const baseDuration = resolvedDurations[ep.id] ?? ep.duration ?? 0;
    
    setTrack({
      title: ep.title,
      artist: "Podcast",
      artUrl: ep.thumbnailUrl || podcast?.banner || "",
      duration: baseDuration > 0 ? baseDuration : 0,
      elapsed: 0,
      listenUrl: ep.audioUrl,
    });

    audio.onloadedmetadata = () => {
      const d = Math.max(0, Math.floor(audio.duration || 0));
      if (d > 0 && d !== baseDuration) {
        setTrack({
          title: ep.title,
          artist: "Podcast",
          artUrl: ep.thumbnailUrl || podcast?.banner || "",
          duration: d,
          elapsed: 0,
          listenUrl: ep.audioUrl,
        });
      }
    };

    audio.onended = () => {
      setIsPlaying(false);
    };

    audio
      .play()
      .then(() => setIsPlaying(true))
      .catch((e) => console.error("Playback failed:", e));
  };

  // Handle Seek from Bar
  const isSeekingRef = useRef(false);
  const seekFromEvent = (
    e: React.MouseEvent<HTMLDivElement> | MouseEvent,
    bar: HTMLDivElement,
  ) => {
    if (!ctxAudioRef.current) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(
      0,
      Math.min(1, (e.clientX - rect.left) / rect.width),
    );
    const newTime = ratio * (ctxAudioRef.current.duration || 0);
    ctxAudioRef.current.currentTime = newTime;
  };

  const handleBarMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isSeekingRef.current = true;
    const bar = e.currentTarget;
    seekFromEvent(e, bar);

    const onMove = (me: MouseEvent) => seekFromEvent(me, bar);
    const onUp = () => {
      isSeekingRef.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  if (loading) {
    return (
      <div className="pdd">
        <div className="pdd-state">
          <Loader2 size={28} className="pdd-spin" />
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error || !podcast) {
    return (
      <div className="pdd">
        <div className="pdd-state">
          <Music2 size={28} />
          <p>{error || "Không tìm thấy podcast."}</p>
          <button className="pdd-back-btn" onClick={() => navigate("/podcast")}>
            <ArrowLeft size={14} />
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pdd">
      <section className="pdd-hero">
        <div className="pdd-hero-bg">
          {podcast.banner && <img src={podcast.banner} alt="" />}
          <div className="pdd-hero-overlay" />
        </div>

        <div className="pdd-hero-content">
          <button className="pdd-back" onClick={() => navigate("/podcast")}>
            <ArrowLeft size={16} />
            Tất cả podcast
          </button>

          <div className="pdd-hero-info">
            <div className="pdd-hero-cover">
              {podcast.banner ? (
                <img src={podcast.banner} alt={podcast.title} />
              ) : (
                <div className="pdd-hero-cover-fallback">
                  <Mic2 size={40} />
                </div>
              )}
            </div>

            <div className="pdd-hero-text">
              <span className="pdd-hero-badge">Podcast</span>
              <h1 className="pdd-hero-title">{podcast.title}</h1>

              <div className="pdd-hero-meta">
                {podcast.author && (
                  <span className="pdd-meta-item">
                    <User size={14} />
                    {podcast.author}
                  </span>
                )}
                <span className="pdd-meta-item">
                  <Headphones size={14} />
                  {episodes.length} tập
                </span>
              </div>

              {podcast.description && (
                <p className="pdd-hero-desc">{podcast.description}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="pdd-episodes">
        <h2 className="pdd-section-title">
          Danh sách tập
          <span className="pdd-section-count">{episodes.length}</span>
        </h2>

        {episodes.length === 0 ? (
          <div className="pdd-empty">
            <Music2 size={24} />
            <p>Podcast này chưa có tập nào.</p>
          </div>
        ) : (
          <div className="pdd-ep-list">
            {episodes.map((ep, i) => {
              const active = isActive(ep);
              const actuallyPlaying = isActuallyPlaying(ep);
              const epDuration = resolvedDurations[ep.id] ?? ep.duration ?? 0;
              const displayDuration = (active && track?.duration) ? track.duration : epDuration;
              const progress =
                active && displayDuration > 0
                  ? (ctxElapsed / displayDuration) * 100
                  : 0;

              return (
                <div
                  key={ep.id}
                  className={`pdd-ep${active ? " playing" : ""}`}
                  style={{ animationDelay: `${Math.min(i * 0.05, 0.5)}s` }}
                >
                  <button
                    className={`pdd-ep-play${active ? " active" : ""}`}
                    onClick={() => togglePlay(ep)}
                    disabled={!ep.audioUrl}
                    title={
                      ep.audioUrl
                        ? actuallyPlaying
                          ? "Tạm dừng"
                          : active
                            ? "Tiếp tục"
                            : "Phát"
                        : "Chưa có audio"
                    }
                  >
                    {actuallyPlaying ? (
                      <Pause size={18} fill="currentColor" />
                    ) : (
                      <Play size={18} fill="currentColor" />
                    )}
                  </button>

                  {active && (
                    <button
                      className="pdd-ep-stop"
                      onClick={stopPlayback}
                      title="Dừng phát"
                    >
                      <StopCircle size={18} fill="currentColor" />
                    </button>
                  )}

                  <div className="pdd-ep-thumb">
                    {ep.thumbnailUrl ? (
                      <img src={ep.thumbnailUrl} alt={ep.title} />
                    ) : (
                      <div className="pdd-ep-thumb-fallback">
                        <Mic2 size={16} />
                      </div>
                    )}
                  </div>

                  <div className="pdd-ep-info">
                    <div className="pdd-ep-top">
                      {ep.episodeNumber != null && (
                        <span className="pdd-ep-number">
                          Tập {ep.episodeNumber}
                        </span>
                      )}
                      <span className="pdd-ep-duration">
                        <Clock size={12} />
                        {fmtTime(displayDuration)}
                      </span>
                      {ep.publishDate && (
                        <span className="pdd-ep-date">
                          <Calendar size={12} />
                          {fmtDate(ep.publishDate)}
                        </span>
                      )}
                    </div>
                    <h3 className="pdd-ep-title">{ep.title}</h3>
                    {ep.description && (
                      <p className="pdd-ep-desc">{ep.description}</p>
                    )}

                    {active && (
                      <div className="pdd-ep-player">
                        <span className="pdd-ep-time">
                          {fmtTime(ctxElapsed)}
                        </span>
                        <div
                          className="pdd-ep-bar"
                          onMouseDown={handleBarMouseDown}
                        >
                          <div className="pdd-ep-bar-bg" />
                          <div
                            className="pdd-ep-bar-fill"
                            style={{ width: `${progress}%` }}
                          />
                          <div
                            className="pdd-ep-bar-knob"
                            style={{ left: `${progress}%` }}
                          />
                        </div>
                        <span className="pdd-ep-time">
                          {fmtTime(displayDuration)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
