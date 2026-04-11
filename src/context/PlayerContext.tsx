import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
} from "react";
import { normalizeMediaUrl } from "../utils/mediaUrl";

export interface TrackData {
  title: string;
  artist: string;
  album?: string;
  artUrl: string;
  duration: number;
  elapsed?: number;
  listenUrl?: string;
  lyrics?: string | null;
}

export interface PlayerTrack extends TrackData {
  elapsed: number;
}

interface PlayerContextValue {
  track: PlayerTrack | null;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  elapsed: number;
  setTrack: (track: TrackData | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setVolume: (v: number) => void;
  setElapsed: (e: number) => void;
  toggle: () => void;
  toggleMute: () => void;
  leaveSession: () => void;
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [track, setTrackState] = useState<PlayerTrack | null>(null);
  const [isPlaying, setIsPlayingState] = useState(false);
  const [volume, setVolumeState] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [elapsed, setElapsedState] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const setTrack = useCallback((newTrack: TrackData | null) => {
    if (!newTrack) {
      setTrackState(null);
      setElapsedState(0);
      return;
    }
    const playerTrack: PlayerTrack = { 
      ...newTrack,
      artUrl: normalizeMediaUrl(newTrack.artUrl),
      elapsed: newTrack.elapsed || 0,
    };
    setTrackState(playerTrack);
    if (newTrack.elapsed !== undefined) {
      setElapsedState(newTrack.elapsed);
    }
    if (audioRef.current && playerTrack.listenUrl) {
      const nextSrc = playerTrack.listenUrl.replace(/^https?:\/\/[^/]+/, "");
      if (audioRef.current.src !== window.location.origin + nextSrc) {
        audioRef.current.pause();
        audioRef.current = null;
        setIsPlaying(false);
      }
    }
  }, []);

  const setIsPlaying = useCallback((playing: boolean) => {
    setIsPlayingState(playing);
  }, []);

  const setElapsed = useCallback((e: number) => {
    setElapsedState(e);
  }, []);

  const toggle = useCallback(() => {
    if (!track?.listenUrl) return;

    if (!audioRef.current) {
      // Lần đầu: kết nối stream và phát
      const src = track.listenUrl.replace(/^https?:\/\/[^/]+/, "");
      audioRef.current = new Audio(src);
      audioRef.current.volume = volume / 100;
      audioRef.current.play().catch(console.error);
      setIsPlayingState(true);
      setIsMuted(false);
    } else {
      // Stream đang chạy — toggle mute
      const next = !isMuted;
      setIsMuted(next);
      audioRef.current.volume = next ? 0 : volume / 100;
    }
  }, [track, isMuted, volume]);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    // Kéo volume về 0 → tắt tiếng (nút play đổi sang icon Play)
    setIsMuted(v === 0);
    if (audioRef.current) audioRef.current.volume = v / 100;
  }, []);

  const toggleMute = useCallback(() => {
    const next = !isMuted;
    setIsMuted(next);
    if (audioRef.current) audioRef.current.volume = next ? 0 : volume / 100;
  }, [isMuted, volume]);

  /* -------- LEAVE SESSION: dừng hẳn + xoá track -------- */
  const leaveSession = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlayingState(false);
    setIsMuted(false);
    setElapsedState(0);
    setTrackState(null);
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        track,
        isPlaying,
        volume,
        isMuted,
        elapsed,
        setTrack,
        setIsPlaying,
        setVolume,
        setElapsed,
        toggle,
        toggleMute,
        leaveSession,
        audioRef,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside PlayerProvider");
  return ctx;
};
