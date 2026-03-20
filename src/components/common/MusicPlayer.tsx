import { useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Heart, ListMusic } from 'lucide-react';
import { usePlayer } from "../../context/PlayerContext";
import './MusicPlayer.css';

export function MusicPlayer() {
  const { track, isPlaying, volume, isMuted, toggle, setVolume, toggleMute } = usePlayer();

<<<<<<< Updated upstream
  // ── Realtime elapsed counter ────────────────────────────────────────────
=======
  const location = useLocation();

  /* ── Pause khi navigate sang trang khác ──────────────────────────────── */
  useEffect(() => {
    const shouldPauseForAuthPage =
      location.pathname === "/login" || location.pathname === "/register";

    // Chỉ auto pause tại login/register, giữ nguyên nhạc ở các trang còn lại.
    if (shouldPauseForAuthPage && isPlaying && !isMuted) {
      toggleMute();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  /* ── Realtime elapsed counter ────────────────────────────────────────── */
>>>>>>> Stashed changes
  const [localElapsed, setLocalElapsed] = useState(0);

  // Sync when the API poll delivers a fresh elapsed value
  useEffect(() => {
    if (track?.elapsed !== undefined) {
      setLocalElapsed(track.elapsed);
    }
  }, [track?.elapsed]);

  // Tick every second while track is set — stream is always live, mute doesn't stop it
  useEffect(() => {
    if (!track) return;
    const id = setInterval(() => {
      setLocalElapsed(prev => {
        const max = track?.duration ?? 0;
        if (max > 0 && prev >= max) return prev;
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [track?.duration, track?.title]);

  const fmt = (s: number) => {
    if (!s || s <= 0) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const duration = track?.duration ?? 0;
  const progressPct = duration > 0 ? Math.min((localElapsed / duration) * 100, 100) : 0;
  // ────────────────────────────────────────────────────────────────────────

  // Fallback static data when no live stream track is set
  const title = track?.title ?? 'PIXELATED KISSES';
  const artist = track?.artist ?? 'Joji';
  const artUrl = track?.artUrl ?? '../../assets/images/playlist_cover_1.png';
  const displayVolume = isMuted ? 0 : volume;

  return (
    <div className="music-player">
      <div className="music-player-container">
        {/* Progress Bar Section */}
        <div className="progress-section">
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Main Player Content */}
        <div className="player-content">
          {/* Left Section - Album Art and Track Info */}
          <div className="left-section">
            <div className="album-art-container">
              <img src={artUrl} alt={title} className="album-art" />
            </div>

            <div className="track-info-container">
              <p className="track-title">{title}</p>
              <p className="track-artist">{artist}</p>
            </div>

            <div className="heart-icon-container" title="Yêu thích" style={{ cursor: 'pointer' }}>
              <Heart size={16} strokeWidth={1.8} color="#5F6EE0" />
            </div>
          </div>

          {/* Center Section - Play Controls */}
          <div className="center-section">
            <span className="time-display">{fmt(localElapsed)}</span>

            <button className="play-button-clean" onClick={toggle} title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}>
              {(!isPlaying || isMuted)
                ? <Play size={22} strokeWidth={2.2} style={{ marginLeft: 2 }} />
                : <Pause size={22} strokeWidth={2.2} />}
            </button>

            <span className="time-display">{duration > 0 ? fmt(duration) : '--:--'}</span>
          </div>

          {/* Right Section - Controls */}
          <div className="right-section">
            <div className="download-list-icon-container" title="Danh sách phát" style={{ cursor: 'pointer' }}>
              <ListMusic size={20} strokeWidth={1.8} color="#55C5F1" />
            </div>

            <div className="volume-icon-container" onClick={toggleMute} title={isMuted ? 'Bật tiếng' : 'Tắt tiếng'} style={{ cursor: 'pointer' }}>
              {isMuted
                ? <VolumeX size={20} strokeWidth={1.8} color="#9CA3AF" />
                : <Volume2 size={20} strokeWidth={1.8} color="#55C5F1" />}
            </div>

            <div className="volume-slider-container">
              <input
                type="range"
                min="0"
                max="100"
                value={displayVolume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="volume-slider"
                style={{
                  background: `linear-gradient(to right, #55C5F1 0%, #55C5F1 ${displayVolume}%, #D9D9D9 ${displayVolume}%, #D9D9D9 100%)`
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
