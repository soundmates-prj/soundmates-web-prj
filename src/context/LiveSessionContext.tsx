/**
 * LiveSessionContext — Web equivalent of mobile AudioPlayerContext
 *
 * Owns the HTMLAudioElement and all SignalR handlers for the active live
 * session so that audio continues playing when the user navigates away
 * from LiveRoomPage (just like the mobile mini-player pattern).
 *
 * Pattern mirrors: AudioPlayerContext.tsx (mobile)
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import {
  liveHubService,
  type ChatMessage,
  type LiveSessionEvent,
  type NowPlayingUpdatedEvent,
} from "../services/liveHubService";
import { liveSessionApiService, type LiveSessionResult } from "../services/liveSessionApiService";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TrackInfo {
  shId: number;
  title: string;
  artist: string;
  album: string;
  artUrl: string;
  duration: number;
  elapsed: number;
  isRequest: boolean;
  lyrics?: string | null;
  playedAt?: number;
}

export interface LiveNowPlaying {
  currentTrack: TrackInfo | null;
  playingNext: TrackInfo | null;
  songHistory: TrackInfo[];
  totalListeners: number;
  isLive: boolean;
  isOnline: boolean;
  listenUrl: string;
  stationName: string;
}

interface LiveSessionContextValue {
  // ── State (readable by LiveRoomPage, MusicPlayer, etc.) ──────────────────
  activeSessionId: string | null;
  activeSession: LiveSessionResult | null;
  nowPlaying: LiveNowPlaying | null;
  chatMessages: ChatMessage[];
  listeners: number;
  isConnected: boolean;
  isPlaying: boolean;
  isLoading: boolean;
  isMuted: boolean;
  displayElapsed: number;
  sessionEnded: boolean;
  /** Seconds the guest has been listening (0 for authenticated users) */
  guestListeningTime: number;
  /** Max guest listening seconds (120 = 2 min) */
  guestTimeLimit: number;

  // ── Actions ───────────────────────────────────────────────────────────────
  /** Listener joins a live room (loads audio + SignalR) */
  joinLiveRoom: (sessionId: string, userId?: string | null) => Promise<void>;
  /** Completely stop audio + leave SignalR + clear state */
  leaveLiveRoom: () => void;
  /** Play / Pause the stream */
  toggleAudio: () => void;
  toggleMute: () => void;
  setVolume: (v: number) => void;
  volume: number;
  sendChat: (sessionId: string, userId: string, message: string, userName?: string, avatarUrl?: string) => void;
  deleteChat: (sessionId: string, chatId: string, requestUserId: string, role: string) => void;

  // ── Host-only actions (kept for backward compat with host pages) ──────────
  startSession: (sessionId: string) => Promise<void>;
  pauseSession: (sessionId: string) => Promise<void>;
  resumeSession: (sessionId: string) => Promise<void>;
  stopSession: (sessionId: string) => Promise<void>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function proxyUrl(url: string | undefined | null): string {
  if (!url) return "";
  return url.replace(/host\.docker\.internal/gi, "localhost");
}

function tryParseJwtUserId(token: string | null): string | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const payload = JSON.parse(atob(padded));
    const sub = String(payload?.sub ?? "").trim();
    return GUID_REGEX.test(sub) ? sub : null;
  } catch {
    return null;
  }
}

function getCurrentUserId(): string | null {
  try {
    const raw = localStorage.getItem("userInfo");
    if (raw) {
      const parsed = JSON.parse(raw);
      const id = String(parsed?.id ?? parsed?.userId ?? "").trim();
      if (GUID_REGEX.test(id)) return id;
    }
  } catch { /* ignore */ }
  return tryParseJwtUserId(localStorage.getItem("accessToken"));
}

function mapTrack(raw: any): TrackInfo | null {
  if (!raw) return null;
  let playedAtSec = 0;
  if (typeof raw.playedAt === "number") {
    playedAtSec = raw.playedAt > 1_000_000_000_000 ? raw.playedAt / 1000 : raw.playedAt;
  } else if (typeof raw.playedAt === "string" && raw.playedAt) {
    playedAtSec = new Date(raw.playedAt).getTime() / 1000;
  }
  return {
    shId: raw.shId ?? raw.id ?? 0,
    title: raw.title || raw.text || "—",
    artist: raw.artist || "—",
    album: raw.album || "",
    artUrl: proxyUrl(raw.artUrl),
    duration: raw.duration ?? 0,
    elapsed: raw.elapsed ?? 0,
    isRequest: raw.isRequest ?? false,
    playedAt: playedAtSec,
    lyrics: raw.lyrics ?? null,
  };
}

function resolveEffectiveElapsed(track: TrackInfo | null): number {
  if (!track) return 0;
  const rawElapsed = Math.max(0, Number.isFinite(track.elapsed) ? track.elapsed : 0);
  if (track.playedAt && track.playedAt > 0) {
    const fromPlayedAt = Math.max(0, Date.now() / 1000 - track.playedAt);
    const effective = Math.max(rawElapsed, fromPlayedAt);
    return track.duration > 0 ? Math.min(effective, track.duration) : effective;
  }
  return track.duration > 0 ? Math.min(rawElapsed, track.duration) : rawElapsed;
}

function toSafeListenerCount(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const LiveSessionContext = createContext<LiveSessionContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function LiveSessionProvider({ children }: { children: ReactNode }) {
  // ── Shared state (both host and listener) ────────────────────────────────
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<LiveSessionResult | null>(null);
  const [nowPlaying, setNowPlaying] = useState<LiveNowPlaying | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [listeners, setListeners] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolumeState] = useState(80);
  const [hostMusicMultiplier, setHostMusicMultiplier] = useState(1.0);
  const [displayElapsed, setDisplayElapsed] = useState(0);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [guestListeningTime, setGuestListeningTime] = useState(() => {
    return Number(localStorage.getItem("guestLiveTime") || 0);
  });
  const GUEST_TIME_LIMIT = 120; // seconds

  // ── Refs (survive re-renders, no closures) ───────────────────────────────
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeSessionIdRef = useRef<string | null>(null);
  const nowPlayingRef = useRef<LiveNowPlaying | null>(null);
  const prevTrackIdRef = useRef<number | undefined>(undefined);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Baseline refs for wall-clock elapsed projection (same as LiveRoomPage logic)
  const baseServerElapsedRef = useRef(0);
  const serverElapsedSyncedAtMsRef = useRef(Date.now());
  const isPlayingRef = useRef(false);
  const volumeRef = useRef(80);
  const hostMusicMultiplierRef = useRef(1.0);
  const isMutedRef = useRef(false);
  // Cancel token: incremented on each createAndPlay call and on stopAudio.
  // Any in-flight audio.play() checks this after awaiting to self-abort if stale.
  const audioLoadTokenRef = useRef(0);
  // Cleanup function from last registerSignalRHandlers() call.
  // MUST be called before re-registering to prevent duplicate message handlers.
  const signalRCleanupRef = useRef<(() => void) | null>(null);
  const guestTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const guestListeningTimeRef = useRef(Number(localStorage.getItem("guestLiveTime") || 0));

  // Keep refs in sync
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { volumeRef.current = volume; }, [volume]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  // ── Global guest listening timer ──────────────────────────────────────────
  // Runs in context (not in LiveRoomPage) so it works even after navigation.
  // Only counts for unauthenticated users while audio is actively playing.
  useEffect(() => {
    const isGuest = !localStorage.getItem("accessToken");

    if (!isPlaying || !isGuest || !activeSessionId) {
      // Clear timer when not playing or user is authenticated
      if (guestTimerRef.current) {
        clearInterval(guestTimerRef.current);
        guestTimerRef.current = null;
      }
      return;
    }

    // Start counting
    guestTimerRef.current = setInterval(() => {
      guestListeningTimeRef.current += 1;
      setGuestListeningTime(guestListeningTimeRef.current);
      localStorage.setItem("guestLiveTime", guestListeningTimeRef.current.toString());

      if (guestListeningTimeRef.current >= GUEST_TIME_LIMIT) {
        // Time's up — stop audio
        if (guestTimerRef.current) {
          clearInterval(guestTimerRef.current);
          guestTimerRef.current = null;
        }
        // Notify LiveRoomPage (if mounted) to show login popup
        window.dispatchEvent(new CustomEvent("guestLimitReached"));
        // Stop audio via leaveLiveRoom so mini-player disappears too
        // Use stopAudio only (not leave) so user can still log in and rejoin
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = "";
          audioRef.current = null;
          (window as any).__liveAudioRef = null;
        }
        audioLoadTokenRef.current++;
        setIsPlaying(false);
        isPlayingRef.current = false;
      }
    }, 1000);

    return () => {
      if (guestTimerRef.current) {
        clearInterval(guestTimerRef.current);
        guestTimerRef.current = null;
      }
    };
  }, [isPlaying, activeSessionId]);

  // ── Elapsed timer (same pattern as mobile: dep on shId + elapsed + duration) ──
  useEffect(() => {
    if (elapsedIntervalRef.current) {
      clearInterval(elapsedIntervalRef.current);
      elapsedIntervalRef.current = null;
    }

    const track = nowPlaying?.currentTrack;
    if (!track) {
      setDisplayElapsed(0);
      return;
    }

    const base = Math.max(0, track.elapsed || 0);
    const maxSec = Math.max(0, track.duration || 0);
    const syncedAt = Date.now();
    baseServerElapsedRef.current = base;
    serverElapsedSyncedAtMsRef.current = syncedAt;
    setDisplayElapsed(base);

    elapsedIntervalRef.current = setInterval(() => {
      if (!isPlayingRef.current) return;
      const delta = (Date.now() - syncedAt) / 1000;
      const next = base + delta;
      setDisplayElapsed(maxSec > 0 ? Math.min(next, maxSec) : next);
    }, 500);

    return () => {
      if (elapsedIntervalRef.current) clearInterval(elapsedIntervalRef.current);
    };
  }, [
    nowPlaying?.currentTrack?.shId,
    nowPlaying?.currentTrack?.elapsed,
    nowPlaying?.currentTrack?.duration,
  ]);

  // ── NowPlaying polling (fallback every 10s, primary = SignalR) ─────────────
  const startPolling = useCallback((sessionId: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    const poll = async () => {
      const sid = activeSessionIdRef.current;
      if (!sid) return;
      try {
        const data = await liveSessionApiService.getLiveSession(sid).catch(() => null);
        if (!data?.nowPlaying) return;
        const track = mapTrack(data.nowPlaying.currentTrack);
        const newShId = track?.shId;
        if (newShId !== prevTrackIdRef.current) {
          // New song detected via poll
          const next = mapTrack(data.nowPlaying.playingNext ?? (data.nowPlaying as any).nextSong);
          const history = (data.nowPlaying.songHistory || []).map((h: any) => mapTrack(h)).filter(Boolean) as TrackInfo[];
          const np: LiveNowPlaying = {
            ...(nowPlayingRef.current ?? {
              currentTrack: null, playingNext: null, songHistory: [],
              totalListeners: 0, isLive: true, isOnline: true, listenUrl: "", stationName: "Live Station",
            }),
            currentTrack: track,
            playingNext: next,
            songHistory: history,
            listenUrl: proxyUrl(data.nowPlaying.listenUrl ?? nowPlayingRef.current?.listenUrl ?? ""),
            totalListeners: toSafeListenerCount(data.listenersCount ?? data.totalListeners, nowPlayingRef.current?.totalListeners ?? 0),
          };
          setNowPlaying(np);
          nowPlayingRef.current = np;
          prevTrackIdRef.current = newShId;
          if (track) {
            baseServerElapsedRef.current = resolveEffectiveElapsed(track);
            serverElapsedSyncedAtMsRef.current = Date.now();
          }
        } else {
          // Same song: refresh listener count and resync elapsed time
          const latestCount = data.listenersCount ?? data.totalListeners;
          if (latestCount !== undefined) setListeners(toSafeListenerCount(latestCount));

          if (track && nowPlayingRef.current) {
            // Update elapsed sync point
            baseServerElapsedRef.current = resolveEffectiveElapsed(track);
            serverElapsedSyncedAtMsRef.current = Date.now();

            // Reassign track with latest data to trigger React effects (like lyrics reset)
            const updated = {
              ...nowPlayingRef.current,
              currentTrack: track,
              totalListeners: latestCount ?? nowPlayingRef.current.totalListeners
            };
            nowPlayingRef.current = updated;
            setNowPlaying(updated);
          }
        }
      } catch { /* silent */ }
    };

    void poll();
    pollIntervalRef.current = setInterval(poll, 10000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // ── Internal audio helpers ────────────────────────────────────────────────
  const createAndPlay = useCallback(async (url: string) => {
    // Increment token before any async work
    const myToken = ++audioLoadTokenRef.current;
    setIsLoading(true);
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
      const audio = new Audio(url);
      audio.volume = isMutedRef.current ? 0 : (volumeRef.current / 100) * hostMusicMultiplierRef.current;
      audio.muted = isMutedRef.current;
      (window as any).__liveAudioRef = audio;
      audioRef.current = audio;

      try {
        await audio.play();
      } catch {
        // Autoplay blocked — retry muted
        try {
          audio.muted = true;
          // VERY IMPORTANT: Sync the UI so the user sees the "Muted" icon
          // Set this BEFORE await audio.play() so it applies even if play() hangs or aborts
          setIsMuted(true);
          isMutedRef.current = true;
          await audio.play();
        } catch { /* ignore */ }
      }

      // CRITICAL: Check if a newer load started (or leaveLiveRoom cleared the token)
      // while we were awaiting play(). If so, abort this zombie.
      if (myToken !== audioLoadTokenRef.current || audioRef.current !== audio) {
        audio.pause();
        audio.src = "";
        return;
      }

      setIsPlaying(true);
      isPlayingRef.current = true;
    } finally {
      if (myToken === audioLoadTokenRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const stopAudio = useCallback(() => {
    // Bump token so any in-flight createAndPlay aborts itself
    audioLoadTokenRef.current++;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    (window as any).__liveAudioRef = null;
    setIsPlaying(false);
    isPlayingRef.current = false;
    setDisplayElapsed(0);
  }, []);

  // ── SignalR handler registration ─────────────────────────────────────────
  // Returns cleanup function
  const registerSignalRHandlers = useCallback((sessionId: string) => {
    const offNowPlayingUpdated = liveHubService.onNowPlayingUpdated((data: NowPlayingUpdatedEvent) => {
      if (!data.currentTrack) return;
      const track = data.currentTrack;
      const newShId = track.shId;
      const prevShId = prevTrackIdRef.current;

      if (newShId !== prevShId) {
        // Song changed
        const current: TrackInfo = {
          shId: track.shId, title: track.title ?? "—", artist: track.artist ?? "—",
          album: track.album ?? "", artUrl: proxyUrl(track.artUrl ?? ""),
          duration: track.duration, elapsed: track.elapsed,
          isRequest: track.isRequest, lyrics: track.lyrics ?? null,
          playedAt: track.playedAt,
        };
        const np: LiveNowPlaying = {
          ...(nowPlayingRef.current ?? {
            currentTrack: null, playingNext: null, songHistory: [],
            totalListeners: 0, isLive: true, isOnline: true, listenUrl: "", stationName: "Live Station",
          }),
          currentTrack: current,
          playingNext: nowPlayingRef.current?.currentTrack ?? null,
          songHistory: nowPlayingRef.current?.currentTrack
            ? [nowPlayingRef.current.currentTrack, ...(nowPlayingRef.current?.songHistory ?? [])].slice(0, 20)
            : nowPlayingRef.current?.songHistory ?? [],
          listenUrl: proxyUrl(data.listenUrl ?? nowPlayingRef.current?.listenUrl ?? ""),
          totalListeners: data.totalListeners ?? nowPlayingRef.current?.totalListeners ?? 0,
        };
        setNowPlaying(np);
        nowPlayingRef.current = np;
        prevTrackIdRef.current = newShId;
      } else {
        // Same song — refresh listeners and resync elapsed time
        if (data.totalListeners !== undefined && data.totalListeners !== null) {
          setListeners(toSafeListenerCount(data.totalListeners));
        }

        // Always resync track elapsed to maintain tight lyric sync
        const current: TrackInfo = {
          shId: track.shId, title: track.title ?? "—", artist: track.artist ?? "—",
          album: track.album ?? "", artUrl: proxyUrl(track.artUrl ?? ""),
          duration: track.duration, elapsed: track.elapsed,
          isRequest: track.isRequest, lyrics: track.lyrics ?? null,
          playedAt: track.playedAt,
        };
        baseServerElapsedRef.current = resolveEffectiveElapsed(current);
        serverElapsedSyncedAtMsRef.current = Date.now();

        if (nowPlayingRef.current) {
          const updated = {
            ...nowPlayingRef.current,
            currentTrack: current,
            totalListeners: data.totalListeners ?? nowPlayingRef.current.totalListeners
          };
          nowPlayingRef.current = updated;
          setNowPlaying(updated);
        }
      }
    });

    const offListeners = liveHubService.onListenersUpdated((sid, count) => {
      if (sid === activeSessionIdRef.current) setListeners(count);
    });

    const offChat = liveHubService.onReceiveChat((msg: ChatMessage) => {
      if (msg.liveSessionId === activeSessionIdRef.current) {
        setChatMessages(prev => [...prev.slice(-99), msg]);
      }
    });

    const offChatHistory = liveHubService.onChatHistory((history: ChatMessage[]) => {
      setChatMessages(history);
    });

    const offChatDeleted = liveHubService.onChatDeleted((chatId: string) => {
      setChatMessages(prev => prev.map(m => m.id === chatId ? { ...m, isDeleted: true } : m));
    });

    const offSessionStarted = liveHubService.onSessionStarted((evt: LiveSessionEvent) => {
      if (evt.id === activeSessionIdRef.current) setSessionEnded(false);
    });

    const offSessionEnded = liveHubService.onSessionEnded((evt: LiveSessionEvent) => {
      if (evt.id === activeSessionIdRef.current) {
        setSessionEnded(true);
        stopAudio();
      }
    });

    const offSongChanged = liveHubService.onSongChanged((event) => {
      if (event.sessionId !== activeSessionIdRef.current) return;
      // Fast-path: trigger an immediate poll
      if (activeSessionIdRef.current) startPolling(activeSessionIdRef.current);
    });

    const offGlobalVol = liveHubService.onGlobalVolumeUpdated((mult: number) => {
      console.log("[LiveSession] GlobalVolumeUpdated event received:", mult);
      hostMusicMultiplierRef.current = mult;
      setHostMusicMultiplier(mult);
      if (audioRef.current && !isMutedRef.current) {
        audioRef.current.volume = (volumeRef.current / 100) * mult;
      }
    });

    return () => {
      offNowPlayingUpdated();
      offListeners();
      offChat();
      offChatHistory();
      offChatDeleted();
      offSessionStarted();
      offSessionEnded();
      offSongChanged();
      offGlobalVol();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopAudio, startPolling]);

  // ── Public: joinLiveRoom ──────────────────────────────────────────────────
  const joinLiveRoom = useCallback(async (sessionId: string, userId?: string | null) => {
    // Guard: already joined this session AND audio is actively playing
    if (activeSessionIdRef.current === sessionId && audioRef.current && isPlayingRef.current) return;

    // CRITICAL: Stop any existing audio IMMEDIATELY to prevent double-play
    // This covers: switching sessions, re-mounting LiveRoomPage, podcast → live
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
      (window as any).__liveAudioRef = null;
      setIsPlaying(false);
      isPlayingRef.current = false;
    }

    setIsLoading(true);
    setSessionEnded(false);
    setChatMessages([]);
    prevTrackIdRef.current = undefined;

    try {
      const sessionData = await liveSessionApiService.getLiveSession(sessionId);
      if (
        sessionData.status?.toLowerCase() === "ended" ||
        sessionData.status?.toLowerCase() === "cancelled"
      ) {
        setSessionEnded(true);
        setIsLoading(false);
        return;
      }

      setActiveSession(sessionData);
      setActiveSessionId(sessionId);
      activeSessionIdRef.current = sessionId;
      setListeners(toSafeListenerCount(sessionData.listenersCount ?? sessionData.totalListeners, 0));

      // Parse initial nowPlaying
      const npRaw = sessionData.nowPlaying;
      let listenUrl = "";
      if (npRaw) {
        const current = mapTrack(npRaw.currentTrack);
        const next = mapTrack(npRaw.playingNext ?? (npRaw as any).nextSong);
        const history = (npRaw.songHistory || []).map((h: any) => mapTrack(h)).filter(Boolean) as TrackInfo[];
        listenUrl = proxyUrl(npRaw.listenUrl ?? sessionData.streamUrl ?? "");
        const np: LiveNowPlaying = {
          currentTrack: current, playingNext: next, songHistory: history,
          totalListeners: toSafeListenerCount(sessionData.listenersCount ?? sessionData.totalListeners ?? npRaw.totalListeners, 0),
          isLive: npRaw.isLive ?? true, isOnline: npRaw.isOnline ?? true,
          listenUrl, stationName: npRaw.stationName || sessionData.stationName || "Live Station",
        };
        setNowPlaying(np);
        nowPlayingRef.current = np;
        if (current) prevTrackIdRef.current = current.shId;
      } else {
        listenUrl = proxyUrl(sessionData.streamUrl ?? "");
        const np: LiveNowPlaying = {
          currentTrack: null, playingNext: null, songHistory: [],
          totalListeners: toSafeListenerCount(sessionData.listenersCount ?? sessionData.totalListeners, 0),
          isLive: sessionData.status?.toLowerCase() === "live", isOnline: true,
          listenUrl, stationName: sessionData.stationName || "Live Station",
        };
        setNowPlaying(np);
        nowPlayingRef.current = np;
      }

      // Start SignalR
      await liveHubService.start();
      setIsConnected(true);

      const validUserId = userId && GUID_REGEX.test(userId) ? userId : (getCurrentUserId() ?? undefined);
      setTimeout(async () => {
        try {
          await liveHubService.joinSession(sessionId, validUserId);
        } catch (err: any) {
          const msg = err?.message ?? "";
          if (msg.includes("not active") || msg.includes("Session has ended") || msg.includes("not found")) {
            setSessionEnded(true);
          }
        }
      }, 500);

      // Unregister old SignalR handlers BEFORE registering new ones
      // to prevent the same message being delivered multiple times.
      if (signalRCleanupRef.current) {
        signalRCleanupRef.current();
        signalRCleanupRef.current = null;
      }
      signalRCleanupRef.current = registerSignalRHandlers(sessionId);

      // Start polling (falls back every 10s)
      startPolling(sessionId);

      // Auto-play stream
      if (listenUrl) {
        await createAndPlay(listenUrl);
      }
    } catch (err) {
      console.error("[LiveSessionContext] joinLiveRoom error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [createAndPlay, registerSignalRHandlers, startPolling]);

  // ── Public: leaveLiveRoom ─────────────────────────────────────────────────
  const leaveLiveRoom = useCallback(() => {
    const sid = activeSessionIdRef.current;
    if (sid) {
      const uid = getCurrentUserId();
      void liveHubService.leaveSession(sid, uid);
    }
    // Remove all SignalR handlers before clearing state
    if (signalRCleanupRef.current) {
      signalRCleanupRef.current();
      signalRCleanupRef.current = null;
    }
    stopAudio();
    stopPolling();
    activeSessionIdRef.current = null;
    setActiveSessionId(null);
    setActiveSession(null);
    setNowPlaying(null);
    nowPlayingRef.current = null;
    setChatMessages([]);
    setListeners(0);
    setDisplayElapsed(0);
    setSessionEnded(false);
    prevTrackIdRef.current = undefined;
  }, [stopAudio, stopPolling]);

  // ── Public: toggleAudio ───────────────────────────────────────────────────
  const toggleAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      // Re-create stream from listenUrl
      const url = nowPlayingRef.current?.listenUrl;
      if (url) void createAndPlay(url);
      return;
    }
    if (isPlayingRef.current) {
      audio.pause();
      setIsPlaying(false);
      isPlayingRef.current = false;
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
        isPlayingRef.current = true;
      }).catch(() => {
        void createAndPlay(audio.src || nowPlayingRef.current?.listenUrl || "");
      });
    }
  }, [createAndPlay]);

  // ── Public: toggleMute ────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    const newMuted = !isMutedRef.current;
    setIsMuted(newMuted);
    isMutedRef.current = newMuted;
    if (audioRef.current) {
      audioRef.current.muted = newMuted;
      audioRef.current.volume = newMuted ? 0 : (volumeRef.current / 100) * hostMusicMultiplierRef.current;
      // If unmuting while supposedly playing, force the browser to evaluate the gesture
      // This fixes cases where background unmuting doesn't restore sound without pausing/playing
      if (!newMuted && isPlayingRef.current) {
        audioRef.current.play().catch(() => { });
      }
    }
  }, []);

  // ── Public: setVolume ─────────────────────────────────────────────────────
  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    volumeRef.current = v;
    const muted = v === 0;
    setIsMuted(muted);
    isMutedRef.current = muted;
    if (audioRef.current) {
      audioRef.current.volume = (v / 100) * hostMusicMultiplierRef.current;
      audioRef.current.muted = muted;

      // If unmuting while supposedly playing, force the browser to evaluate the gesture
      if (!muted && isPlayingRef.current) {
        audioRef.current.play().catch(() => { });
      }
    }
  }, []);

  // ── Chat ─────────────────────────────────────────────────────────────────
  const sendChat = useCallback((sessionId: string, userId: string, message: string, userName?: string, avatarUrl?: string) => {
    void liveHubService.sendChat(sessionId, userId, message, userName, avatarUrl);
  }, []);

  const deleteChat = useCallback((sessionId: string, chatId: string, requestUserId: string, role: string) => {
    void liveHubService.deleteChat(sessionId, chatId, requestUserId, role);
  }, []);

  // ── Host-only actions ─────────────────────────────────────────────────────
  const startSession = useCallback(async (sessionId: string) => {
    await liveSessionApiService.startSession(sessionId);
    await joinLiveRoom(sessionId);
  }, [joinLiveRoom]);

  const pauseSession = useCallback(async (sessionId: string) => {
    await liveSessionApiService.pauseSession(sessionId);
  }, []);

  const resumeSession = useCallback(async (sessionId: string) => {
    await liveSessionApiService.resumeSession(sessionId);
  }, []);

  const stopSession = useCallback(async (sessionId: string) => {
    await liveSessionApiService.stopSession(sessionId);
    const uid = getCurrentUserId();
    await liveHubService.leaveSession(sessionId, uid);
    leaveLiveRoom();
  }, [leaveLiveRoom]);

  // ── Start hub once on mount ───────────────────────────────────────────────
  useEffect(() => {
    liveHubService.start().then(() => setIsConnected(true)).catch(() => setIsConnected(false));
  }, []);

  // ── Stop live audio when user logs out or token expires ───────────────────
  // Uses a ref so the handler always captures the latest leaveLiveRoom function.
  const leaveLiveRoomRef = useRef(leaveLiveRoom);
  useEffect(() => { leaveLiveRoomRef.current = leaveLiveRoom; }, [leaveLiveRoom]);

  useEffect(() => {
    const handleAuthChange = () => {
      const hasToken = !!localStorage.getItem("accessToken");
      // Only stop if actively in a session AND user is now unauthenticated
      if (!hasToken && activeSessionIdRef.current) {
        leaveLiveRoomRef.current();
      }
    };
    window.addEventListener("authChange", handleAuthChange);
    // Also catch tab-cross storage events (e.g. logout from another tab)
    window.addEventListener("storage", handleAuthChange);
    return () => {
      window.removeEventListener("authChange", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, []); // empty deps — handler uses refs

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      // NOTE: Do NOT call leaveLiveRoom() here — provider lives for the
      // entire app lifetime and should only clean up if explicitly called.
      stopPolling();
    };
  }, [stopPolling]);

  return (
    <LiveSessionContext.Provider
      value={{
        activeSessionId,
        activeSession,
        nowPlaying,
        chatMessages,
        listeners,
        isConnected,
        isPlaying,
        isLoading,
        isMuted,
        volume,
        displayElapsed,
        sessionEnded,
        guestListeningTime,
        guestTimeLimit: GUEST_TIME_LIMIT,
        joinLiveRoom,
        leaveLiveRoom,
        toggleAudio,
        toggleMute,
        setVolume,
        sendChat,
        deleteChat,
        startSession,
        pauseSession,
        resumeSession,
        stopSession,
      }}
    >
      {children}
    </LiveSessionContext.Provider>
  );
}

export function useLiveSession() {
  const ctx = useContext(LiveSessionContext);
  if (!ctx) throw new Error("useLiveSession must be used within LiveSessionProvider");
  return ctx;
}
