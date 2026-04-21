import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
} from "react";

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
  /** The Audio element used for non-session playback (podcasts, etc.). Null when in a live session. */
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
  /**
   * When in a live session, LiveRoomPage passes its own audio element here so that
   * MusicPlayer can read the real currentTime for progress/sync.
   * Set to null (or call clearLiveAudioRef) when leaving the session.
   */
  setLiveAudioRef: (ref: HTMLAudioElement | null) => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

const toAbsoluteAudioUrl = (url: string): string => {
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) return `${window.location.origin}${url}`;
  return `${window.location.origin}/${url}`;
};

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [track, setTrackState] = useState<PlayerTrack | null>(null);
  const [isPlaying, setIsPlayingState] = useState(false);
  const [volume, setVolumeState] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [elapsed, setElapsedState] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  /** Audio element owned by LiveRoomPage when in a live session. */
  const liveAudioRef = useRef<HTMLAudioElement | null>(null);

  const setTrack = useCallback((newTrack: TrackData | null) => {
    if (!newTrack) {
      setTrackState(null);
      setElapsedState(0);
      return;
    }
    const playerTrack: PlayerTrack = { ...newTrack, elapsed: newTrack.elapsed || 0 };
    setTrackState(playerTrack);
    if (newTrack.elapsed !== undefined) {
      setElapsedState(newTrack.elapsed);
    }
    if (audioRef.current && playerTrack.listenUrl) {
      const nextSrc = toAbsoluteAudioUrl(playerTrack.listenUrl);
      if (audioRef.current.src !== nextSrc) {
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
      const src = toAbsoluteAudioUrl(track.listenUrl);
      audioRef.current = new Audio(src);
      audioRef.current.volume = volume / 100;
      audioRef.current.play().catch(console.error);
      setIsPlayingState(true);
      setIsMuted(false);
    } else {
      // Toggle play/pause for podcasts
      if (audioRef.current.paused) {
        audioRef.current.play().catch(console.error);
        setIsPlayingState(true);
      } else {
        audioRef.current.pause();
        setIsPlayingState(false);
      }
    }
  }, [track, volume]);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    const muted = v === 0;
    setIsMuted(muted);
    if (audioRef.current) {
      audioRef.current.volume = v / 100;
      audioRef.current.muted = muted;
    }
  }, []);

  const toggleMute = useCallback(() => {
    const next = !isMuted;
    setIsMuted(next);
    if (audioRef.current) {
      audioRef.current.volume = next ? 0 : volume / 100;
      audioRef.current.muted = next;
    }
  }, [isMuted, volume]);

  /* -------- LEAVE SESSION: dừng hẳn + xoá track -------- */
  const leaveSession = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    liveAudioRef.current = null;
    setIsPlayingState(false);
    setIsMuted(false);
    setElapsedState(0);
    setTrackState(null);
  }, []);

  const setLiveAudioRef = useCallback((ref: HTMLAudioElement | null) => {
    liveAudioRef.current = ref;
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
        setLiveAudioRef,
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
