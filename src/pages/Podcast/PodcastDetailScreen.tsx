import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
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

const fmtDate = (d?: string) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function PodcastDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [podcast, setPodcast] = useState<PodcastItem | null>(null);
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  const togglePlay = (ep: PodcastEpisode) => {
    if (!ep.audioUrl) return;

    if (playingId === ep.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(ep.audioUrl);
    audio.play().catch(() => {});
    audio.onended = () => setPlayingId(null);
    audioRef.current = audio;
    setPlayingId(ep.id);
  };

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

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
                    </div>
                    <h3 className="pdd-ep-title">{ep.title}</h3>
                    {ep.description && (
                      <p className="pdd-ep-desc">{ep.description}</p>
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
