import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Download } from 'lucide-react';
import './AudioPlayer.css';

interface AudioPlayerProps {
  audioUrl: string;
  title?: string;
  autoPlay?: boolean;
  downloadUrl?: string;
}

export function AudioPlayer({ audioUrl, title, autoPlay = false, downloadUrl }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load audio when URL changes
  useEffect(() => {
    if (audioRef.current && audioUrl) {
      setIsLoading(true);
      setError(null);
      audioRef.current.load();
    }
  }, [audioUrl]);

  // Auto play if enabled
  useEffect(() => {
    if (autoPlay && audioRef.current && !error) {
      audioRef.current.play().catch((err) => {
        console.error('Auto play failed:', err);
      });
    }
  }, [autoPlay, error]);

  // Handle audio loaded
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setIsLoading(false);
    }
  };

  // Handle time update
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  // Handle play/pause
  const togglePlay = () => {
    if (!audioRef.current || error) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.error('Play failed:', err);
          setError('Không thể phát audio');
        });
    }
  };

  // Handle seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  // Handle audio error
  const handleError = () => {
    setError('Không thể tải audio. Vui lòng thử tải xuống.');
    setIsLoading(false);
  };

  // Handle audio ended
  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Format time (seconds to mm:ss)
  const formatTime = (seconds: number): string => {
    if (!seconds || seconds <= 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const displayVolume = isMuted ? 0 : volume;

  return (
    <div className="audio-player">
      <audio
        ref={audioRef}
        src={audioUrl}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onError={handleError}
        onEnded={handleEnded}
      />

      {title && <div className="audio-player-title">{title}</div>}

      {error && (
        <div className="audio-player-error">
          <span>{error}</span>
          {downloadUrl && (
            <a href={downloadUrl} download className="audio-player-download-link">
              Tải xuống
            </a>
          )}
        </div>
      )}

      {!error && (
        <>
          {/* Progress Bar */}
          <div className="audio-player-progress-section">
            <span className="audio-player-time">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="audio-player-progress-bar"
              disabled={isLoading || !duration}
              style={{
                background: `linear-gradient(to right, var(--audio-progress-fill) 0%, var(--audio-progress-fill) ${progressPercent}%, var(--audio-progress-bg) ${progressPercent}%, var(--audio-progress-bg) 100%)`,
              }}
            />
            <span className="audio-player-time">
              {duration > 0 ? formatTime(duration) : '--:--'}
            </span>
          </div>

          {/* Controls */}
          <div className="audio-player-controls">
            {/* Play/Pause Button */}
            <button
              className="audio-player-play-btn"
              onClick={togglePlay}
              disabled={isLoading || !duration}
              title={isPlaying ? 'Tạm dừng' : 'Phát'}
            >
              {isPlaying ? (
                <Pause size={20} strokeWidth={2} />
              ) : (
                <Play size={20} strokeWidth={2} style={{ marginLeft: 2 }} />
              )}
            </button>

            {/* Volume Controls */}
            <div className="audio-player-volume-section">
              <button
                className="audio-player-volume-btn"
                onClick={toggleMute}
                title={isMuted ? 'Bật tiếng' : 'Tắt tiếng'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX size={18} strokeWidth={1.8} />
                ) : (
                  <Volume2 size={18} strokeWidth={1.8} />
                )}
              </button>

              <input
                type="range"
                min="0"
                max="100"
                value={displayVolume}
                onChange={handleVolumeChange}
                className="audio-player-volume-slider"
                style={{
                  background: `linear-gradient(to right, var(--audio-volume-fill) 0%, var(--audio-volume-fill) ${displayVolume}%, var(--audio-volume-bg) ${displayVolume}%, var(--audio-volume-bg) 100%)`,
                }}
              />
            </div>

            {/* Download Button */}
            {downloadUrl && (
              <a
                href={downloadUrl}
                download
                className="audio-player-download-btn"
                title="Tải xuống"
              >
                <Download size={18} strokeWidth={1.8} />
              </a>
            )}
          </div>
        </>
      )}
    </div>
  );
}
