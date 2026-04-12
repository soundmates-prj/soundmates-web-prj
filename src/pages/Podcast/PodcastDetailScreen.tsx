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
  User,
} from "lucide-react";
import podcastService from "../../services/podcastService";
import type { PodcastItem, PodcastEpisode } from "../../types/podcast";
import "./PodcastDetailScreen.css";

/* ── helpers ── */

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
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
};

/* ══════════════════════════════════════════════
   PodcastDetailScreen
   ══════════════════════════════════════════════ */

export default function PodcastDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [podcast, setPodcast] = useState<PodcastItem | null>(null);
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [playingId, setPlayingId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);

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

  /* ── Audio time tracking via RAF ── */

  const startTracking = useCallback(() => {
    const tick = () => {
      if (audioRef.current && !isSeeking) {
        setCurrentTime(audioRef.current.currentTime);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [isSeeking]);

  const stopTracking = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  /* ── Toggle play / pause ── */

  const togglePlay = (ep: PodcastEpisode) => {
    if (!ep.audioUrl) return;

    if (playingId === ep.id) {
      audioRef.current?.pause();
      stopTracking();
      setPlayingId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      stopTracking();
    }

    const audio = new Audio(ep.audioUrl);

    audio.onloadedmetadata = () => {
      setAudioDuration(audio.duration);
    };

    audio.onended = () => {
      setPlayingId(null);
      setCurrentTime(0);
      setAudioDuration(0);
      stopTracking();
    };

    audio.play().catch(() => {});
    audioRef.current = audio;
    setPlayingId(ep.id);
    setCurrentTime(0);
    setAudioDuration(0);
    startTracking();
  };

  /* ── Seek handlers ── */

  const seekFromEvent = (
    e: React.MouseEvent<HTMLDivElement> | MouseEvent,
    bar: HTMLDivElement,
  ) => {
    if (!audioRef.current) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(
      0,
      Math.min(1, (e.clientX - rect.left) / rect.width),
    );
    const newTime = ratio * (audioRef.current.duration || 0);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleBarMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsSeeking(true);
    const bar = e.currentTarget;
    seekFromEvent(e, bar);

    const onMove = (me: MouseEvent) => seekFromEvent(me, bar);
    const onUp = () => {
      setIsSeeking(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  /* ── Cleanup ── */

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      stopTracking();
    };
  }, [stopTracking]);

  /* ── Render ── */

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
            Tất cả Podcast
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
              const isPlaying = playingId === ep.id;
              const progress =
                isPlaying && audioDuration > 0
                  ? (currentTime / audioDuration) * 100
                  : 0;

              return (
                <div
                  key={ep.id}
                  className={`pdd-ep${isPlaying ? " playing" : ""}`}
                  style={{ animationDelay: `${Math.min(i * 0.05, 0.5)}s` }}
                >
                  <button
                    className={`pdd-ep-play${isPlaying ? " active" : ""}`}
                    onClick={() => togglePlay(ep)}
                    disabled={!ep.audioUrl}
                    title={
                      ep.audioUrl
                        ? isPlaying
                          ? "Tạm dừng"
                          : "Phát"
                        : "Chưa có audio"
                    }
                  >
                    {isPlaying ? (
                      <Pause size={18} fill="currentColor" />
                    ) : (
                      <Play size={18} fill="currentColor" />
                    )}
                  </button>

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
                      {ep.publishDate && (
                        <span className="pdd-ep-date">
                          <Calendar size={12} />
                          {fmtDate(ep.publishDate)}
                        </span>
                      )}
                      {(ep as any).duration != null &&
                        (ep as any).duration > 0 && (
                          <span className="pdd-ep-duration">
                            <Clock size={12} />
                            {fmtTime((ep as any).duration)}
                          </span>
                        )}
                    </div>
                    <h3 className="pdd-ep-title">{ep.title}</h3>
                    {ep.description && (
                      <p className="pdd-ep-desc">{ep.description}</p>
                    )}

                    {/* ── Audio progress bar ── */}
                    {isPlaying && (
                      <div className="pdd-ep-player">
                        <span className="pdd-ep-time">
                          {fmtTime(currentTime)}
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
                          {fmtTime(audioDuration)}
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
