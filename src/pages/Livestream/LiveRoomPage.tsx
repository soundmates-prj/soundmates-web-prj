import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Radio,
  Users,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Send,
  Disc3,
  RefreshCw,
  MessageSquare,
  Music,
  X,
  Search,
  History,
  Clock,
} from "lucide-react";
import { showToast } from "../../utils/toast";
import { liveSessionApiService } from "../../services/liveSessionApiService";
import type { LiveSessionResult, SongRequestResult } from "../../services/liveSessionApiService";
import liveHubService from "../../services/liveHubService";
import type { ChatMessage, NowPlayingUpdatedEvent } from "../../services/liveHubService";
import { usePlayer } from "../../context/PlayerContext";
import "./LiveRoomPage.css";

interface TrackInfo {
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

interface NowPlayingData {
  currentTrack: TrackInfo | null;
  playingNext: TrackInfo | null;
  songHistory: TrackInfo[];
  totalListeners: number;
  isLive: boolean;
  isOnline: boolean;
  listenUrl: string;
  stationName: string;
}

interface DisplayChat {
  id: string;
  userId: string;
  userName: string;
  message: string;
  createdAt: string;
  isSystem?: boolean;
}

interface RequestSongItem {
  id: string;
  title: string;
  artist: string;
  album?: string | null;
  artUrl?: string | null;
}

interface LyricLine {
  time: number;
  text: string;
}

type AuthPopupMode = "guestLimit" | "requestSong";

function parseLyrics(lrc: string | null | undefined): LyricLine[] {
  if (!lrc) return [];
  const result: LyricLine[] = [];
  for (const rawLine of lrc.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;

    const matches = Array.from(
      line.matchAll(/\[(\d{2}):(\d{2})(?:\.(\d{1,3}))?\]/g),
    );
    if (!matches.length) continue;

    const text = line
      .replace(/\[(\d{2}):(\d{2})(?:\.(\d{1,3}))?\]/g, "")
      .trim();
    if (!text) continue;

    for (const match of matches) {
      const min = parseInt(match[1], 10);
      const sec = parseInt(match[2], 10);
      const fraction = match[3] ?? "";
      // Parse → milliseconds (ms) for sub-second precision
      const ms = fraction
        ? parseInt(fraction.padEnd(3, "0").slice(0, 3), 10)
        : 0;
      const timeMs = min * 60 * 1000 + sec * 1000 + ms;
      result.push({ time: timeMs, text });
    }
  }

  return result.sort((a, b) => a.time - b.time);
}

interface SystemMusicItem {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  artUrl?: string | null;
  artworkUrl?: string | null;
}

// Proxy Docker-internal hostnames to localhost for browser access
// AzuraCast returns host.docker.internal:5000 for stream and host.docker.internal:5000/api/... for artwork
const proxyUrl = (url: string | undefined | null): string => {
  if (!url) return "";
  return url.replace(/host\.docker\.internal/gi, "localhost");
};

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const GUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const GUEST_ID_KEY = "liveGuestIdentifier";
// Live radio streams usually arrive slightly behind server time due to buffering.
const LIVE_STREAM_LATENCY_COMPENSATION_MS = 1500; // buffer độ trễ thực của stream (ms)
// Keep default lyric offset neutral; users can still calibrate by clicking lyric lines.
const DEFAULT_LYRICS_OFFSET_SEC = 1; // Offset mặc định (user tự chỉnh bằng click vào lyric line)
const ELAPSED_DRIFT_RESYNC_THRESHOLD_SEC = 1.5; // Nếu server elapsed trôi dạt hơn 1.2s so với local projected elapsed, thực hiện resync (đồng bộ lại server elapsed, bỏ qua các drift nhỏ hơn để tránh re-sync liên tục)

function toSafeListenerCount(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function tryParseJwtUserId(token: string | null): string | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = atob(padded);
    const payload = JSON.parse(json);
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
      if (GUID_REGEX.test(id)) {
        return id;
      }
    }
  } catch { /* ignore */ }
  return tryParseJwtUserId(localStorage.getItem("accessToken"));
}

function getCurrentUserName(): string {
  try {
    const raw = localStorage.getItem("userInfo");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.firstName && parsed.lastName) return `${parsed.lastName} ${parsed.firstName}`;
      return parsed.username || parsed.email || "Ẩn danh";
    }
  } catch { /* ignore */ }
  return "Ẩn danh";
}

function mapTrack(raw: any, proxy: (u: string) => string): TrackInfo | null {
  if (!raw) return null;
  // playedAt: backend sends double seconds (with fractional part) from AzuraCast.
  // Store as fractional Unix seconds — do NOT floor to preserve sub-second precision.
  let playedAtSec = 0;
  if (typeof raw.playedAt === 'number') {
    // raw.playedAt is in SECONDS — divide by 1000 to convert to ms for Date, divide back to get seconds with fraction
    playedAtSec = raw.playedAt > 1_000_000_000_000
      ? raw.playedAt / 1000        // milliseconds → seconds (with fraction)
      : raw.playedAt;               // already seconds (double with fraction)
  } else if (typeof raw.playedAt === 'string' && raw.playedAt) {
    playedAtSec = new Date(raw.playedAt).getTime() / 1000; // ISO → fractional seconds
  }
  return {
    shId: raw.shId ?? raw.id ?? 0,
    title: raw.title || raw.text || "—",
    artist: raw.artist || "—",
    album: raw.album || "",
    artUrl: proxy(raw.artUrl),
    duration: raw.duration ?? 0,
    elapsed: raw.elapsed ?? 0,
    isRequest: raw.isRequest ?? false,
    playedAt: playedAtSec, // fractional Unix seconds — NOT floored
    lyrics: raw.lyrics ?? null,
  } as any;
}

function resolveEffectiveElapsed(rawTrack: any): number {
  if (!rawTrack) {
    return 0;
  }

  // Backend now sends double (fractional seconds) — preserve precision, no Math.floor
  const rawElapsed = Number(rawTrack.elapsed);
  let effectiveElapsed = Number.isFinite(rawElapsed) ? Math.max(0, rawElapsed) : 0;

  const rawPlayedAt = rawTrack.playedAt;
  let playedAtSec: number | null = null;

  if (typeof rawPlayedAt === "number" && Number.isFinite(rawPlayedAt) && rawPlayedAt > 0) {
    // Normalize: if > 1e12 treat as milliseconds → convert to fractional seconds
    playedAtSec = rawPlayedAt > 1_000_000_000_000
      ? rawPlayedAt / 1000
      : rawPlayedAt;
  } else if (typeof rawPlayedAt === "string" && rawPlayedAt.trim()) {
    const parsedMs = Date.parse(rawPlayedAt);
    if (Number.isFinite(parsedMs)) {
      playedAtSec = parsedMs / 1000; // milliseconds → fractional seconds
    }
  }

  if (playedAtSec && playedAtSec > 0) {
    // Use wall-clock with ms precision — Date.now() gives ms, divide to get fractional seconds
    const elapsedFromPlayedAt = Math.max(0, Date.now() / 1000 - playedAtSec);
    // Prefer the fresher value to avoid stale elapsed snapshots from API polling.
    effectiveElapsed = Math.max(effectiveElapsed, elapsedFromPlayedAt);
  }

  const rawDuration = Number(rawTrack.duration);
  if (Number.isFinite(rawDuration) && rawDuration > 0) {
    effectiveElapsed = Math.min(effectiveElapsed, rawDuration);
  }

  return effectiveElapsed;
}

export function LiveRoomPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const player = usePlayer();
  const playerSetElapsed = player.setElapsed;
  const playerLeaveSession = player.leaveSession;
  const playerSetLiveAudioRef = player.setLiveAudioRef;
  const playerSetTrack = player.setTrack;
  const playerSetIsPlaying = player.setIsPlaying;
  const playerToggleMute = player.toggleMute;

  const [session, setSession] = useState<LiveSessionResult | null>(null);
  const [nowPlaying, setNowPlaying] = useState<NowPlayingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [listeners, setListeners] = useState(0);
  const [chats, setChats] = useState<DisplayChat[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [activeChatTab, setActiveChatTab] = useState<"chat" | "history" | "lyrics">("chat");
  const [upNextHistory, setUpNextHistory] = useState<TrackInfo[]>([]);
  const [playedHistory, setPlayedHistory] = useState<TrackInfo[]>([]);
  const [ended, setEnded] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [listeningTime, setListeningTime] = useState(0);
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [authPopupMode, setAuthPopupMode] = useState<AuthPopupMode>("guestLimit");
  // Separate lyrics string state — only changes when the actual lyrics content changes.
  // This prevents parsedLyrics from re-computing when only elapsed/sync data changes.
  const [currentLyricsStr, setCurrentLyricsStr] = useState<string | null>(null);
  const [lyricsOffset, setLyricsOffset] = useState(DEFAULT_LYRICS_OFFSET_SEC);

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestSearch, setRequestSearch] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestableSongs, setRequestableSongs] = useState<RequestSongItem[]>([]);
  const [requestedSongIds, setRequestedSongIds] = useState<Set<string>>(new Set());

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const lyricsContainerRef = useRef<HTMLDivElement | null>(null);
  const elapsedRef = useRef<number>(0);
  // Server timeline baseline for current song.
  // projectedElapsed = baseServerElapsed + (Date.now() - serverElapsedSyncedAtMs)/1000.
  const baseServerElapsedRef = useRef<number>(0);
  const serverElapsedSyncedAtMsRef = useRef<number>(Date.now());

  const syncElapsedFromServer = useCallback((serverElapsed: number | null | undefined) => {
    const parsed = Number(serverElapsed);
    if (!Number.isFinite(parsed)) {
      return;
    }
    const safeElapsed = Math.max(0, parsed);
    baseServerElapsedRef.current = safeElapsed;
    serverElapsedSyncedAtMsRef.current = Date.now();
    elapsedRef.current = safeElapsed;
    setElapsed(safeElapsed);
    playerSetElapsed(safeElapsed);
  }, [playerSetElapsed]);

  const maybeResyncElapsed = useCallback((serverElapsed: number | null | undefined) => {
    const parsed = Number(serverElapsed);
    if (!Number.isFinite(parsed)) {
      return;
    }

    const safeServerElapsed = Math.max(0, parsed);
    const projectedElapsed = Math.max(
      0,
      baseServerElapsedRef.current +
        (Date.now() - serverElapsedSyncedAtMsRef.current) / 1000,
    );

    // Only fast-forward when server is clearly ahead.
    // Do not pull back elapsed when server reports stale/lagging values.
    const serverAheadBySec = safeServerElapsed - projectedElapsed;
    if (serverAheadBySec >= ELAPSED_DRIFT_RESYNC_THRESHOLD_SEC) {
      syncElapsedFromServer(safeServerElapsed);
    }
  }, [syncElapsedFromServer]);

  const alignElapsedToPlaybackStart = useCallback(() => {
    // Keep server elapsed value, but start local projection from actual playback start time.
    serverElapsedSyncedAtMsRef.current = Date.now();
  }, []);

  const parsedLyrics = useMemo(() => {
    return parseLyrics(currentLyricsStr);
  }, [currentLyricsStr]);
  // Use wall-clock projection in milliseconds directly — no precision loss from Math.floor
  // projectedMs = baseServerElapsed_s * 1000 + (Date.now() - serverSyncedAtMs)
  const wallClockElapsedMs = Math.max(
    0,
    baseServerElapsedRef.current * 1000 + (Date.now() - serverElapsedSyncedAtMsRef.current),
  );
  const adjustedElapsedMs = Math.max(
    0,
    wallClockElapsedMs - LIVE_STREAM_LATENCY_COMPENSATION_MS - lyricsOffset * 1000,
  );

  const activeLyricIndex = useMemo(() => {
    if (!parsedLyrics.length) return -1;
    let idx = -1;
    for (let i = 0; i < parsedLyrics.length; i++) {
      if (adjustedElapsedMs >= parsedLyrics[i].time) {
        idx = i;
      } else {
        break;
      }
    }
    return idx;
  }, [parsedLyrics, adjustedElapsedMs]);

  // Scroll lyrics into view
  useEffect(() => {
    if (activeLyricIndex >= 0 && lyricsContainerRef.current) {
      const activeEl = lyricsContainerRef.current.querySelector(
        ".lr-lyric-sync-line.active, .lr-lyric-line.active",
      ) as HTMLElement | null;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [activeLyricIndex]);

  // ─── Elapsed Timer: wall-clock projection from last server elapsed sync ─────
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isPlaying) return;
      const projectedElapsed = Math.max(
        0,
        baseServerElapsedRef.current +
          (Date.now() - serverElapsedSyncedAtMsRef.current) / 1000,
      );
      const duration = nowPlayingRef.current?.currentTrack?.duration ?? 0;
      const nextElapsed = duration > 0
        ? Math.min(projectedElapsed, duration)
        : projectedElapsed;
      setElapsed(nextElapsed);
      elapsedRef.current = nextElapsed;
      playerSetElapsed(nextElapsed);
    }, 500); // 2×/s — smooth enough, avoids excessive re-renders

    return () => clearInterval(timer);
  }, [isPlaying, playerSetElapsed]);

  // Dùng chung để dừng audio ở mọi nơi: navigate, session end, cleanup
  const cleanupAudio = useCallback(() => {
    playerLeaveSession();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; audioRef.current = null; }
    (window as any).__liveAudioRef = null;
    playerSetLiveAudioRef(null);
    setIsPlaying(false);
    baseServerElapsedRef.current = 0;
    serverElapsedSyncedAtMsRef.current = Date.now();
    setElapsed(0);
    elapsedRef.current = 0;
    playerSetElapsed(0);
  }, [playerLeaveSession, playerSetElapsed, playerSetLiveAudioRef]);

  const prevTrackIdRef = useRef<number | undefined>(undefined);
  const prevTrackDataRef = useRef<TrackInfo | null>(null);
  const sessionIdRef = useRef<string | undefined>(sessionId);
  const joinedRef = useRef(false);
  const nowPlayingPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nowPlayingRef = useRef<NowPlayingData | null>(null); // avoid stale closure in pollNowPlaying
  const stationIdRef = useRef<string | undefined>(undefined);
  const autoPlayRef = useRef(false); // chỉ auto-play lần đầu
  const guestLimitReachedRef = useRef(false);

  useEffect(() => {
    // LiveRoom owns playback via local audioRef. Clear global player audio to avoid double stream playback.
    playerLeaveSession();
  }, [sessionId, playerLeaveSession]);

  // ─── Main load effect ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionId || ended) return;

    const userId = getCurrentUserId();

    // Reset per-session state
    setRequestedSongIds(new Set());
    setUpNextHistory([]);
    setPlayedHistory([]);
    setChats([]);
    setListeners(0);
    setListeningTime(0);
    setCurrentLyricsStr(null);
    setLyricsOffset(DEFAULT_LYRICS_OFFSET_SEC);
    baseServerElapsedRef.current = 0;
    serverElapsedSyncedAtMsRef.current = Date.now();
    elapsedRef.current = 0;
    setElapsed(0);
    playerSetElapsed(0);
    guestLimitReachedRef.current = false;
    prevTrackIdRef.current = undefined;
    prevTrackDataRef.current = null;
    joinedRef.current = false;
    autoPlayRef.current = true;

    // ─── Register SignalR handlers (luôn đăng ký, không phụ thuộc async) ───
    // NOTE: NowPlayingUpdated is broadcast via LiveSessionHub (live-session-{id} group)
    // from NowPlayingBroadcastService — NOT the old SongChanged event.
    // Only update state if ShId actually changed to avoid re-rendering lyrics every event.
    const offNowPlayingUpdated = liveHubService.onNowPlayingUpdated((data: NowPlayingUpdatedEvent) => {
      if (!data.currentTrack) return;
      const track = data.currentTrack;
      const newShId = track.shId;
      const prevShId = prevTrackIdRef.current;

      if (newShId !== prevShId) {
        // Song changed — full nowPlaying update (triggers lyrics re-parse + scroll)
        const current: TrackInfo = {
          shId: track.shId,
          title: track.title ?? "—",
          artist: track.artist ?? "—",
          album: track.album ?? "",
          artUrl: proxyUrl(track.artUrl ?? ""),
          duration: track.duration,
          elapsed: track.elapsed,
          isRequest: track.isRequest,
          lyrics: track.lyrics ?? null,
          playedAt: track.playedAt,
        };

        const newNowPlaying: NowPlayingData = {
          ...(nowPlayingRef.current ?? {
            currentTrack: null, playingNext: null, songHistory: [],
            totalListeners: 0, isLive: true, isOnline: true,
            listenUrl: "", stationName: "Live Station",
          }),
          currentTrack: current,
          playingNext: nowPlayingRef.current?.currentTrack ?? null,
          songHistory: nowPlayingRef.current?.currentTrack
            ? [nowPlayingRef.current.currentTrack, ...(nowPlayingRef.current?.songHistory ?? [])].slice(0, 20)
            : nowPlayingRef.current?.songHistory ?? [],
          listenUrl: proxyUrl(data.listenUrl ?? nowPlayingRef.current?.listenUrl ?? ""),
          totalListeners: data.totalListeners ?? nowPlayingRef.current?.totalListeners ?? 0,
        };

        setNowPlaying(newNowPlaying);
        nowPlayingRef.current = newNowPlaying;

        // Only update lyrics string when it actually changes — prevents re-parse on every event
        setCurrentLyricsStr(track.lyrics ?? null);
        setLyricsOffset(DEFAULT_LYRICS_OFFSET_SEC);

        prevTrackIdRef.current = newShId;
        syncElapsedFromServer(resolveEffectiveElapsed(track));
      } else {
        // Same song: keep local projected elapsed, do not force re-sync mid-song.
        maybeResyncElapsed(resolveEffectiveElapsed(track));

        if (data.totalListeners !== undefined && data.totalListeners !== null) {
          setListeners((prev) => toSafeListenerCount(data.totalListeners, prev));
        }
      }
    });

    const offListeners = liveHubService.onListenersUpdated((sid, count) => {
      if (sid === sessionIdRef.current) setListeners(count);
    });

    const offChat = liveHubService.onReceiveChat((chat: ChatMessage) => {
      if (chat.liveSessionId === sessionIdRef.current) {
        setChats(prev => [
          ...prev,
          {
            id: chat.id,
            userId: chat.userId || "",
            userName: chat.userName || `User-${(chat.userId || "?").slice(0, 6)}`,
            message: chat.message,
            createdAt: chat.createdAt,
          },
        ]);
      }
    });

    const offJoined = liveHubService.onUserJoined((sid) => {
      if (sid === sessionIdRef.current) setListeners(c => c + 1);
    });
    const offLeft = liveHubService.onUserLeft((sid) => {
      if (sid === sessionIdRef.current) setListeners(c => Math.max(0, c - 1));
    });

    const offEnded = liveHubService.onSessionEnded((evt) => {
      if (evt.id === sessionIdRef.current) setEnded(true);
    });

    let pollNowPlayingNow: (() => Promise<void>) | null = null;

    const offSongChanged = liveHubService.onSongChanged((event) => {
      if (event.sessionId !== sessionIdRef.current) {
        return;
      }

      // Fast path: don't wait for fallback interval when backend emits SongChanged.
      if (pollNowPlayingNow) {
        void pollNowPlayingNow();
      }
    });

    const offGuestLimitExceeded = liveHubService.onGuestViewLimitExceeded((event) => {
      if (event.sessionId === sessionIdRef.current) {
        if (guestLimitReachedRef.current) {
          return;
        }

        const currentUserId = getCurrentUserId();
        const isAuthenticated = !!(currentUserId && GUID_REGEX.test(currentUserId));
        if (isAuthenticated) {
          return;
        }

        const localGuestId = localStorage.getItem(GUEST_ID_KEY);
        // Backend broadcasts to whole session group; only handle event for this specific guest.
        if (!event.anonymousIdentifier || !localGuestId || event.anonymousIdentifier !== localGuestId) {
          return;
        }

        console.log("[LiveRoomPage] Guest view limit exceeded:", event);
        // Stop audio and show login popup
  guestLimitReachedRef.current = true;
        cleanupAudio();
        setIsPlaying(false);
        setAuthPopupMode("guestLimit");
        setShowAuthPopup(true);
        showToast.info("You've reached the 2-minute viewing limit. Please login to continue watching.");
      }
    });

    // When user logs in while on the page, re-join with their userId to upgrade from guest → authenticated
    const offAuthChange = () => {
      try {
        const newUserId = getCurrentUserId();
        const isValid = newUserId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(newUserId);
        if (isValid && joinedRef.current) {
          console.log("[LiveRoomPage] authChange fired — user logged in, re-joining session with userId:", newUserId);
          liveHubService.joinSession(sessionId, newUserId).catch((err) => {
            console.error("[LiveRoomPage] authChange joinSession failed:", err);
          });
        }
      } catch (e) {
        console.error("[LiveRoomPage] authChange handler error:", e);
      }
    };
    window.addEventListener("authChange", offAuthChange);

    // ─── Async load ─────────────────────────────────────────────────────────
    void (async () => {
      try {
        const sessionData = await liveSessionApiService.getLiveSession(sessionId);

        if (
          sessionData.status?.toLowerCase() === "ended" ||
          sessionData.status?.toLowerCase() === "cancelled"
        ) {
          setEnded(true);
          setLoading(false);
          return;
        }

        setSession(sessionData);
        setListeners(toSafeListenerCount(sessionData.listenersCount ?? sessionData.totalListeners, 0));
        stationIdRef.current = String(sessionData.stationId);

        await liveHubService.start();

        try {
          // Trì hoãn việc gọi JoinSession 1 chút để tránh race condition khi SignalR mới connected
          setTimeout(async () => {
            try {
              const validUserId = userId && GUID_REGEX.test(userId) ? userId : undefined;
              await liveHubService.joinSession(sessionId, validUserId);
              joinedRef.current = true;
            } catch (joinErr: any) {
              const msg = joinErr?.message ?? "";
              const fullMsg = joinErr?.toString?.() ?? JSON.stringify(joinErr);
              if (
                msg.includes("not active") ||
                msg.includes("not found") ||
                msg.includes("Session has ended") ||
                msg.includes("Session not found")
              ) {
                console.warn("[LiveRoomPage] Session is no longer active:", msg);
                setEnded(true);
              } else {
                // Log full detail so we can diagnose root cause
                console.warn("[LiveRoomPage] JoinSession failed:", msg);
                console.warn("[LiveRoomPage] Full joinErr:", fullMsg);
              }
            }
          }, 500);
        } catch (err: any) {
          console.warn("[LiveRoomPage] Failed to start signalR:", err);
        }

        const nowPlayingData = sessionData.nowPlaying;

        if (nowPlayingData) {
          const track = nowPlayingData.currentTrack;
          const current = mapTrack(track, proxyUrl);
          const next = mapTrack(nowPlayingData.playingNext || (nowPlayingData as any).nextSong, proxyUrl);
          const history = (nowPlayingData.songHistory || []).map((h: any) => mapTrack(h, proxyUrl)).filter(Boolean) as TrackInfo[];
          const listenUrl = proxyUrl(nowPlayingData.listenUrl ?? sessionData.streamUrl);
          const npData: NowPlayingData = {
            currentTrack: current,
            playingNext: next,
            songHistory: history,
            totalListeners: toSafeListenerCount(
              sessionData.listenersCount ?? sessionData.totalListeners ?? nowPlayingData.totalListeners,
              0,
            ),
            isLive: nowPlayingData.isLive ?? true,
            isOnline: nowPlayingData.isOnline ?? true,
            listenUrl,
            stationName: nowPlayingData.stationName || sessionData.stationName || "Live Station",
          };
          setNowPlaying(npData);
          nowPlayingRef.current = npData;
          if (track) {
            prevTrackIdRef.current = track.shId;
            syncElapsedFromServer(resolveEffectiveElapsed(track));
            setCurrentLyricsStr(track.lyrics ?? null);
          }
          // Auto-play lần đầu khi có track (inline để tránh ref)
          if (autoPlayRef.current && track && listenUrl) {
            autoPlayRef.current = false;
            const url = listenUrl;
            setTimeout(async () => {
              try {
                if (audioRef.current) {
                  audioRef.current.pause();
                }
                audioRef.current = new Audio(url);
                audioRef.current!.volume = player.isMuted ? 0 : (player.volume / 100);
                // Expose the live-session audio element so MusicPlayer can read its currentTime directly
                (window as any).__liveAudioRef = audioRef.current;
                playerSetLiveAudioRef(audioRef.current);
                await audioRef.current!.play();
                alignElapsedToPlaybackStart();
                setIsPlaying(true);
                playerSetIsPlaying(true);
              } catch {
                try {
                  if (audioRef.current) {
                    audioRef.current.muted = true;
                    await audioRef.current.play();
                    alignElapsedToPlaybackStart();
                    playerToggleMute();
                    setIsPlaying(true);
                    playerSetIsPlaying(true);
                  }
                } catch { /* autoplay blocked */ }
              }
            }, 50);
          }
        } else {
          const npData: NowPlayingData = {
            currentTrack: null,
            playingNext: null,
            songHistory: [],
            totalListeners: toSafeListenerCount(sessionData.listenersCount ?? sessionData.totalListeners, 0),
            isLive: sessionData.status?.toLowerCase() === "live",
            isOnline: true,
            listenUrl: proxyUrl(sessionData.streamUrl),
            stationName: sessionData.stationName || "Live Station",
          };
          setNowPlaying(npData);
          nowPlayingRef.current = npData;
        }
      } catch (err: any) {
        console.error("[LiveRoomPage] Load error:", err?.message ?? err);
      } finally {
        setLoading(false);
      }
    })();

    // ─── Poll now-playing (fallback nhẹ; realtime chính lấy từ SignalR) ───────────────────────────
    const pollNowPlaying = async () => {
      const sid = sessionIdRef.current;
      if (!sid) return;
      try {
        const data = await liveSessionApiService
          .getLiveSession(sid)
          .catch(() => null);
        if (!data || !data.nowPlaying) return;
        const track = data.nowPlaying.currentTrack;
        const current = mapTrack(track, proxyUrl);
        const newShId = current?.shId;
        // Use prevTrackIdRef (set by initial load + SignalR) to detect song changes.
        // This avoids calling setNowPlaying on every poll when the song is the same.
        const prevShId = prevTrackIdRef.current;

        if (newShId !== prevShId) {
          // Song changed — full nowPlaying update (triggers lyrics re-parse + scroll)
          const next = mapTrack(data.nowPlaying.playingNext || (data.nowPlaying as any).nextSong, proxyUrl);
          const history = (data.nowPlaying.songHistory || []).map((h: any) => mapTrack(h, proxyUrl)).filter(Boolean) as TrackInfo[];

          const newNowPlaying: NowPlayingData = {
            ...(nowPlayingRef.current ?? {
              currentTrack: null, playingNext: null, songHistory: [],
              totalListeners: 0, isLive: true, isOnline: true,
              listenUrl: "", stationName: "Live Station",
            }),
            currentTrack: current,
            playingNext: next,
            songHistory: history,
            listenUrl: proxyUrl(data.nowPlaying.listenUrl ?? nowPlayingRef.current?.listenUrl ?? ""),
          };

          setNowPlaying(newNowPlaying);
          nowPlayingRef.current = newNowPlaying;

          // Only update lyrics string when it actually changes
          setCurrentLyricsStr(track.lyrics ?? null);
          setLyricsOffset(DEFAULT_LYRICS_OFFSET_SEC);

          prevTrackIdRef.current = newShId;
          syncElapsedFromServer(resolveEffectiveElapsed(track));
        } else {
          // Song same: polling endpoint can be stale, so don't re-sync elapsed here.
          // Still refresh listeners from fallback polling.
          const latestListeners = data.listenersCount ?? data.totalListeners;
          if (latestListeners !== undefined && latestListeners !== null) {
            setListeners(toSafeListenerCount(latestListeners, 0));
          }
        }
      } catch { /* silent */ }
    };
    pollNowPlayingNow = pollNowPlaying;
    // SignalR is primary realtime source; keep 5s fallback polling for track-change detection/listeners.
    nowPlayingPollRef.current = setInterval(pollNowPlaying, 5000);

    return () => {
      offNowPlayingUpdated();
      offListeners();
      offChat();
      offJoined();
      offLeft();
      offEnded();
      offSongChanged();
      offGuestLimitExceeded();
      window.removeEventListener("authChange", offAuthChange);
      if (nowPlayingPollRef.current) clearInterval(nowPlayingPollRef.current);
      void liveHubService.stop();
      cleanupAudio();
    };
  }, [sessionId, ended, cleanupAudio, syncElapsedFromServer, maybeResyncElapsed]);

  // ─── Sync bottom MusicPlayer ─────────────────────────────────────────────
  useEffect(() => {
    const track = nowPlaying?.currentTrack;
    if (!track) return;

    playerSetTrack({
      title: track.title,
      artist: track.artist,
      album: track.album,
      artUrl: track.artUrl,
      duration: track.duration,
      elapsed: resolveEffectiveElapsed(track),
      listenUrl: nowPlaying?.listenUrl || session?.streamUrl || undefined,
      lyrics: track.lyrics ?? null,
    });
    playerSetIsPlaying(isPlaying);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nowPlaying?.currentTrack?.shId, nowPlaying?.listenUrl, session?.streamUrl, isPlaying]);

  // ─── Session ended → stop audio ────────────────────────────────────────
  useEffect(() => {
    if (!ended) return;
    cleanupAudio();
  }, [ended, cleanupAudio]);

  // Đồng bộ trạng thái volume và mute từ player context vào audio tag
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = player.isMuted ? 0 : (player.volume / 100);
      audioRef.current.muted = player.isMuted;
    }
  }, [player.volume, player.isMuted]);
  useEffect(() => {
    if (player.isPlaying !== isPlaying) {
      if (guestLimitReachedRef.current) {
        if (player.isPlaying) {
          player.setIsPlaying(false);
        }
        return;
      }

      if (player.isPlaying) {
        if (showAuthPopup) {
           player.setIsPlaying(false);
           return;
        }
        if (audioRef.current) {
          audioRef.current
            .play()
            .then(() => {
              alignElapsedToPlaybackStart();
              setIsPlaying(true);
            })
            .catch(() => void playStream());
        } else {
          void playStream();
        }
      } else {
        if (audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
      }
    }
  }, [player.isPlaying, showAuthPopup]);
  useEffect(() => {
    const current = nowPlaying?.currentTrack;
    const next = nowPlaying?.playingNext;
    const currentId = current?.shId;

    if (!current) return;

    const prevId = prevTrackIdRef.current;
    if (prevId !== currentId) {
      console.log(`[LiveRoomPage] Track changed: ${prevId} → ${currentId}`);

      // Đẩy track cũ vào playedHistory (dùng ref để lấy track cũ)
      if (prevId !== undefined) {
        const prevTrack = prevTrackDataRef.current;
        if (prevTrack) {
          setPlayedHistory(prev => [prevTrack, ...prev].slice(0, 10));
        }
      }

      // Cập nhật upNextHistory
      if (next) {
        setUpNextHistory([next]);
      } else {
        setUpNextHistory([]);
      }

      prevTrackIdRef.current = currentId;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nowPlaying?.currentTrack?.shId, nowPlaying?.playingNext?.shId]);

  // ─── Auto-scroll chat ─────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats]);

  // ─── Guest Preview Limit ──────────────────────────────────────────────
  useEffect(() => {
    // Only start timer for guests (no valid userId) — authenticated users are never kicked
    const userId = getCurrentUserId();
    const isValidUser = userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    let timer: any = null;
    if (isValidUser) {
      setListeningTime(0);
    }
    if (isPlaying && !isValidUser) {
      timer = setInterval(() => {
        setListeningTime((prev) => {
          return Math.min(prev + 1, 120);
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, cleanupAudio]);

  useEffect(() => {
    if (!isPlaying || listeningTime < 120 || showAuthPopup) {
      return;
    }

    if (guestLimitReachedRef.current) {
      return;
    }

    guestLimitReachedRef.current = true;
    cleanupAudio();
    setAuthPopupMode("guestLimit");
    setShowAuthPopup(true);
  }, [isPlaying, listeningTime, showAuthPopup, cleanupAudio]);

  // ─── Audio playback ────────────────────────────────────────────────────
  const playStream = useCallback(async () => {
    if (guestLimitReachedRef.current) {
      player.setIsPlaying(false);
      return;
    }

    if (showAuthPopup) {
      player.setIsPlaying(false);
      return;
    }
    const url = nowPlaying?.listenUrl || session?.streamUrl;
    if (!url) return;

    const srcChanged = !audioRef.current || audioRef.current.src !== url;

    if (srcChanged) {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
      audioRef.current = new Audio(url);
      // Áp dụng âm lượng từ player context nều có, thay vì dùng volume state cũ
      audioRef.current.volume = player.isMuted ? 0 : (player.volume / 100);
      // Expose the live-session audio element so MusicPlayer can read its currentTime directly
      (window as any).__liveAudioRef = audioRef.current;
      playerSetLiveAudioRef(audioRef.current);
    }

    try {
      if (!audioRef.current) return;

      // Nếu player đang tắt tiếng do autoplay policy trước đó, đồng bộ lại
      audioRef.current.muted = player.isMuted;

      await audioRef.current.play();
      alignElapsedToPlaybackStart();
      setIsPlaying(true);
      playerSetIsPlaying(true);
    } catch {
      try {
        if (audioRef.current) {
          audioRef.current.muted = true;
          await audioRef.current.play();
          alignElapsedToPlaybackStart();
          if (!player.isMuted) {
            playerToggleMute();
          }
          setIsPlaying(true);
          playerSetIsPlaying(true);
        }
      } catch { /* ignore autoplay blocked */ }
    }
  }, [
    nowPlaying?.listenUrl,
    player.isMuted,
    player.volume,
    session?.streamUrl,
    alignElapsedToPlaybackStart,
    playerSetIsPlaying,
    playerSetLiveAudioRef,
    playerToggleMute,
  ]);

  const togglePlay = () => {
    if (guestLimitReachedRef.current) {
      setAuthPopupMode("guestLimit");
      setShowAuthPopup(true);
      return;
    }

    if (!audioRef.current) { void playStream(); return; }
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      player.setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => {
          alignElapsedToPlaybackStart();
          setIsPlaying(true);
          player.setIsPlaying(true);
        })
        .catch(() => void playStream());
    }
  };

  // ─── Song request ─────────────────────────────────────────────────────
  const loadRequestableSongs = useCallback(async () => {
    if (!session?.stationId) return;
    setRequestLoading(true);
    try {
      const stationSongs = await liveSessionApiService.getStationMusic(String(session.stationId));
      const mapped: RequestSongItem[] = stationSongs.map((song: SystemMusicItem) => ({
        id: song.id,
        title: song.title,
        artist: song.artist,
        album: song.album,
        artUrl: song.artworkUrl || song.artUrl || null
      }));
      setRequestableSongs(mapped);
    } catch (err) {
      console.warn("[LiveRoomPage] loadRequestableSongs failed:", err);
      setRequestableSongs([]);
    } finally {
      setRequestLoading(false);
    }
  }, [session?.stationId]);

  const handleRequestSong = async (song: RequestSongItem) => {
    const userId = getCurrentUserId();
    const isValidUser = userId && GUID_REGEX.test(userId);
    if (!isValidUser) {
      // Guest trying to request — show login popup instead
      setAuthPopupMode("requestSong");
      setShowAuthPopup(true);
      return;
    }

    const sid = sessionIdRef.current;
    if (!sid) return;
    try {
      await liveSessionApiService.createSongRequest(sid, {
        mediaFileId: song.id,
        message: requestMessage.trim() || undefined,
      });
      setRequestedSongIds(prev => new Set([...prev, song.id]));
      setRequestMessage("");
      setChats(prev => [
        ...prev,
        {
          id: `req-${Date.now()}`,
          userId: "",
          userName: "",
          message: `Bạn vừa gửi request bài: ${song.title} — ${song.artist}`,
          createdAt: new Date().toISOString(),
          isSystem: true,
        },
      ]);
      showToast.success(`Đã gửi yêu cầu "${song.title}" - đang chờ host duyệt`);
    } catch (err: any) {
      console.error("[LiveRoomPage] requestSong failed:", err);
      // If backend returns 401, show login popup; otherwise generic error
      if (err?.response?.status === 401 || err?.status === 401) {
        setAuthPopupMode("requestSong");
        setShowAuthPopup(true);
      } else {
        showToast.error("Không thể gửi yêu cầu. Vui lòng thử lại.");
      }
    }
  };

  // ─── Chat ─────────────────────────────────────────────────────────────
  const handleSendChat = async () => {
    if (!chatInput.trim() || !sessionIdRef.current) return;
    const userId = getCurrentUserId();
    if (!userId) {
      setChats(prev => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          userId: "",
          userName: "",
          message: "Vui lòng đăng nhập để gửi tin nhắn",
          createdAt: new Date().toISOString(),
          isSystem: true,
        },
      ]);
      return;
    }
    try {
      await liveHubService.sendChat(sessionIdRef.current, userId, chatInput.trim(), getCurrentUserName());
      setChatInput("");
    } catch (err) {
      console.error("[LiveRoomPage] Send chat failed:", err);
      showToast.error("Không thể gửi tin nhắn. Vui lòng thử lại.");
    }
  };

  const handleChatKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (chatInput.trim()) {
        void handleSendChat();
        e.currentTarget.style.height = '40px';
      }
    }
  };

  const formatChatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

  const handleNavigate = (path: string) => {
    console.log(`[LiveRoomPage] Navigate to: ${path}, sessionId: ${sessionIdRef.current}`);
    cleanupAudio();
    navigate(path);
  };

  if (loading) {
    return (
      <div className="lr-page">
        <div className="lr-loading">
          <RefreshCw size={28} className="lr-spin" />
          <p>Đang tải phòng phát sóng...</p>
        </div>
      </div>
    );
  }

  if (ended || !session) {
    return (
      <div className="lr-page">
        <div className="lr-ended">
          <Radio size={56} />
          <h2>Phiên phát sóng đã kết thúc</h2>
          <p>Cảm ơn bạn đã tham gia! Hãy quay lại để khám phá các phiên mới.</p>
          <button className="lr-ended-btn" onClick={() => handleNavigate("/live")}>
            Quay lại danh sách Live
          </button>
        </div>
      </div>
    );
  }

  const track = nowPlaying?.currentTrack;
  const duration = track?.duration ?? 0;
  const progress = duration > 0 ? Math.min((elapsed / duration) * 100, 100) : 0;

  return (
    <div className="lr-page user-theme-wrapper">
      {/* Topbar */}
      <div className="lr-topbar">
        <div className="lr-topbar-left">
          <button className="lr-back-btn" onClick={() => handleNavigate("/live")}>
            <ArrowLeft size={18} />
          </button>
          <div className="lr-session-info">
            <h2 className="lr-session-title">{session.sessionName}</h2>
            <p className="lr-session-station">
              <Radio size={11} />
              {nowPlaying?.stationName || session.stationName || "Station"}
            </p>
          </div>
        </div>
        <div className="lr-topbar-right">
          <span className="lr-live-indicator">
            {session?.status?.toLowerCase() === "live" ? "LIVE" : "OFFLINE"}
          </span>
          <span className="lr-listeners-count">
            <Users size={13} />
            {listeners} đang nghe
          </span>
        </div>
      </div>

      {/* Main: Player + Chat */}
      <div className="lr-main">
        {/* Player Panel */}
        <div className="lr-player-panel">
          <div className="lr-artwork-section">
            <div className={`lr-artwork ${isPlaying ? "playing" : ""}`}>
              {track?.artUrl ? (
                <img src={track.artUrl} alt={track.title} />
              ) : (
                <Disc3 size={64} className="lr-artwork-icon" />
              )}
            </div>

            <div className="lr-track-info-card">
              <div className="lr-track-info-text">
                <h2 className="lr-track-name">{track?.title || "Đang tải..."}</h2>
                <p className="lr-track-artist">{track?.artist || ""}</p>
                {track?.album && <p className="lr-track-album">{track.album}</p>}
              </div>

              {/* Request nhạc */}
              <button
                className="lr-request-btn"
                onClick={() => {
                  const uid = getCurrentUserId();
                  const isValidUser = uid && GUID_REGEX.test(uid);
                  if (!isValidUser) {
                    setAuthPopupMode("requestSong");
                    setShowAuthPopup(true);
                    return;
                  }
                  setRequestMessage("");
                  setShowRequestModal(true);
                  void loadRequestableSongs();
                }}
              >
                <Music size={16} />
                Gửi Request Nhạc
              </button>
            </div>

            {/* Playing Next */}
            {nowPlaying?.playingNext && (
              <div className="lr-up-next-card">
                <div className="lr-up-next-left">
                  <span className="lr-up-next-label">
                    <Clock size={14} /> Tiếp theo
                  </span>
                  <div className="lr-up-next-info">
                    <div className="lr-up-next-title" title={nowPlaying.playingNext.title}>{nowPlaying.playingNext.title}</div>
                    <div className="lr-up-next-artist" title={nowPlaying.playingNext.artist}>{nowPlaying.playingNext.artist}</div>
                  </div>
                </div>
                {nowPlaying.playingNext.artUrl ? (
                  <img src={nowPlaying.playingNext.artUrl} alt={nowPlaying.playingNext.title} className="lr-up-next-art" />
                ) : (
                  <div className="lr-up-next-icon-wrap">
                    <Disc3 size={24} className="lr-up-next-icon" />
                  </div>
                )}
              </div>
            )}

            {/* Floating Lyrics */}
            {parsedLyrics.length > 0 && (
              <div className="lr-floating-lyrics" ref={lyricsContainerRef}>
                <div className="lr-floating-lyrics-content">
                  {activeLyricIndex >= 0 ? (
                    <div className="lr-lyric-line active" key={activeLyricIndex}>
                      {parsedLyrics[activeLyricIndex].text}
                    </div>
                  ) : (
                    <div className="lr-lyric-line waiting">
                      <Music size={16} className="lr-lyric-icon" /> Đang đợi lời bài hát...
                    </div>
                  )}
                  {/* Dòng tiếp theo (nhỏ hơn, mờ hơn) */}
                  {activeLyricIndex + 1 < parsedLyrics.length && (
                    <div className="lr-lyric-line next" key={activeLyricIndex + 1}>
                      {parsedLyrics[activeLyricIndex + 1].text}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat Panel */}
        <div className="lr-chat-panel">
          <div className="lr-chat-tabs">
            <button
              className={`lr-chat-tab ${activeChatTab === "chat" ? "active" : ""}`}
              onClick={() => setActiveChatTab("chat")}
            >
              <MessageSquare size={13} />
              Trò chuyện
            </button>
            <button
              className={`lr-chat-tab ${activeChatTab === "history" ? "active" : ""}`}
              onClick={() => setActiveChatTab("history")}
            >
              <History size={13} />
              Lịch sử nhạc
            </button>
            <button
              className={`lr-chat-tab ${activeChatTab === "lyrics" ? "active" : ""}`}
              onClick={() => setActiveChatTab("lyrics")}
            >
              <Music size={13} />
              Lyrics
            </button>
          </div>

          {activeChatTab === "chat" && (
            <>
              <div className="lr-chat-messages">
                {chats.length === 0 && (
                  <div className="lr-chat-welcome">
                    Chào mừng đến phòng phát sóng! Hãy gửi tin nhắn đầu tiên.
                  </div>
                )}
                {chats.map(chat =>
                  chat.isSystem ? (
                    <div key={chat.id} className="lr-chat-system">{chat.message}</div>
                  ) : (
                    <div key={chat.id} className="lr-chat-msg">
                      <div className="lr-chat-avatar">
                        {chat.userName.charAt(0).toUpperCase()}
                      </div>
                      <div className="lr-chat-bubble">
                        <div className="lr-chat-user">{chat.userName}</div>
                        <div className="lr-chat-text">{chat.message}</div>
                        <div className="lr-chat-time">{formatChatTime(chat.createdAt)}</div>
                      </div>
                    </div>
                  )
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="lr-chat-input-wrap">
                <textarea
                  className="lr-chat-input"
                  value={chatInput}
                  onChange={e => {
                    setChatInput(e.target.value);
                    e.target.style.height = '40px';
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 80)}px`;
                  }}
                  onKeyDown={handleChatKeyDown}
                  placeholder="Nhập tin nhắn..."
                  maxLength={500}
                  rows={1}
                />
                <button
                  className="lr-chat-send"
                  onClick={() => {
                    void handleSendChat();
                    // Reset height after send
                    const ta = document.querySelector('.lr-chat-input') as HTMLTextAreaElement;
                    if (ta) ta.style.height = '40px';
                  }}
                  disabled={!chatInput.trim()}
                >
                  <Send size={16} />
                </button>
              </div>
            </>
          )}

          {activeChatTab === "history" && (
            <div className="lr-music-history">
              {upNextHistory.length > 0 && (
                <div className="lr-history-section">
                  <div className="lr-history-section-title">
                    <Clock size={12} />
                    Sắp tới
                  </div>
                  {upNextHistory.map((t, i) => (
                    <div key={`next-${i}`} className="lr-history-item upcoming">
                      {t.artUrl ? (
                        <img src={t.artUrl} alt={t.title} className="lr-history-art" />
                      ) : (
                        <Disc3 size={16} className="lr-history-icon" />
                      )}
                      <div className="lr-history-info">
                        <div className="lr-history-title">{t.title}</div>
                        <div className="lr-history-artist">{t.artist}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {nowPlaying?.songHistory && nowPlaying.songHistory.length > 0 && (
                <div className="lr-history-section">
                  <div className="lr-history-section-title">
                    <History size={12} />
                    Đã chạy
                  </div>
                  {nowPlaying.songHistory.map((t, i) => (
                    <div key={`played-${i}`} className="lr-history-item played">
                      {t.artUrl ? (
                        <img src={t.artUrl} alt={t.title} className="lr-history-art" />
                      ) : (
                        <Disc3 size={16} className="lr-history-icon" />
                      )}
                      <div className="lr-history-info">
                        <div className="lr-history-title">{t.title}</div>
                        <div className="lr-history-artist">{t.artist}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {upNextHistory.length === 0 && (!nowPlaying?.songHistory || nowPlaying.songHistory.length === 0) && (
                <div className="lr-chat-welcome">Chưa có lịch sử nhạc nào.</div>
              )}
            </div>
          )}

          {activeChatTab === "lyrics" && parsedLyrics.length === 0 && (
            <div className="lr-chat-welcome">
              <Music size={28} />
              <p>Không có lời bài hát cho bài này.</p>
            </div>
          )}

          {activeChatTab === "lyrics" && parsedLyrics.length > 0 && (
            <div className="lr-lyrics-full-list" ref={lyricsContainerRef}>
              {parsedLyrics.map((line, i) => {
                const isActive = i === activeLyricIndex;
                return (
                  <button
                    key={i}
                    type="button"
                    className={`lr-lyric-sync-line ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      if (adjustedElapsedMs > 0) {
                        setLyricsOffset(
                          (adjustedElapsedMs - line.time) / 1000,
                        );
                      }
                    }}
                  >
                    {line.text}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Request Song Modal */}
      {showRequestModal && (
        <div className="lr-request-modal-overlay" onClick={() => setShowRequestModal(false)}>
          <div className="lr-request-modal" onClick={e => e.stopPropagation()}>
            <div className="lr-request-modal-header">
              <h3>Gửi Request Nhạc</h3>
              <button onClick={() => setShowRequestModal(false)} className="lr-request-close">
                <X size={16} />
              </button>
            </div>

            <div className="lr-request-search-wrap">
              <Search size={14} />
              <input
                value={requestSearch}
                onChange={e => setRequestSearch(e.target.value)}
                placeholder="Tìm bài hát hoặc nghệ sĩ..."
                className="lr-request-search"
              />
            </div>

            <div className="lr-request-message-wrap">
              <textarea
                value={requestMessage}
                onChange={e => setRequestMessage(e.target.value.slice(0, 300))}
                placeholder="Nhắn host (tuỳ chọn): ví dụ 'Cho mình nghe bài này tặng bạn A'"
                className="lr-request-message"
                rows={3}
                maxLength={300}
              />
              <div className="lr-request-message-count">{requestMessage.length}/300</div>
            </div>

            <div className="lr-request-list">
              {requestLoading ? (
                <div className="lr-request-empty">Đang tải danh sách...</div>
              ) : requestableSongs.length === 0 ? (
                <div className="lr-request-empty">Không có bài hát để request</div>
              ) : (
                requestableSongs
                  .filter(song => {
                    const q = requestSearch.toLowerCase();
                    return (
                      !q ||
                      song.title.toLowerCase().includes(q) ||
                      song.artist.toLowerCase().includes(q)
                    );
                  })
                  .map(song => (
                    <div key={song.id} className="lr-request-item">
                      <div className="lr-request-song-content">
                        {song.artUrl ? (
                          <img src={song.artUrl} alt={song.title} className="lr-request-song-art" />
                        ) : (
                          <div className="lr-request-song-art-placeholder">
                            <Music size={16} />
                          </div>
                        )}
                        <div className="lr-request-song-info">
                          <div className="lr-request-song-title">{song.title}</div>
                          <div className="lr-request-song-artist">
                            {song.artist}
                            {song.album ? ` • ${song.album}` : ""}
                          </div>
                        </div>
                      </div>
                      <button
                        className="lr-request-send"
                        disabled={requestedSongIds.has(song.id)}
                        onClick={() => void handleRequestSong(song)}
                      >
                        {requestedSongIds.has(song.id) ? "Đã gửi" : "Request"}
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
      {/* Auth Prompt Modal */}
      {showAuthPopup && (
        <div className="lr-request-modal-overlay">
          <div className="lr-request-modal" style={{ textAlign: "center", padding: "30px 20px" }}>
            <h3 style={{ marginBottom: 15, color: "var(--user-theme-text, var(--lr-title))" }}>
              {authPopupMode === "requestSong" ? "Hết thời gian nghe thử" : "Hết thời gian nghe thử"}
            </h3>
            <p style={{ color: "var(--user-theme-text, var(--lr-muted))", marginBottom: 25, fontSize: "14px" }}>
              {authPopupMode === "requestSong"
                ? "Bạn đã trải nghiệm 2 phút. Vui lòng đăng nhập hoặc đăng ký để tiếp tục tham gia Live Session và trò chuyện cùng mọi người nhé!"
                : "Bạn đã trải nghiệm 2 phút. Vui lòng đăng nhập hoặc đăng ký để tiếp tục tham gia Live Session và trò chuyện cùng mọi người nhé!"}
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button 
                onClick={() => navigate("/login")} 
                style={{ padding: "10px 20px", background: "var(--user-theme-primary, #5cc3f0)", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
              >
                Đăng nhập
              </button>
              <button 
                onClick={() => navigate("/register")} 
                style={{ padding: "10px 20px", background: "var(--lr-btn-soft-bg)", color: "var(--user-theme-text, var(--lr-text))", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
              >
                Đăng ký
              </button>
              <button 
                onClick={() => navigate("/")} 
                style={{ padding: "10px 20px", background: "transparent", color: "var(--user-theme-text, var(--lr-muted))", border: "1px solid var(--lr-border)", borderRadius: "8px", cursor: "pointer" }}
              >
                Về trang chủ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LiveRoomPage;
