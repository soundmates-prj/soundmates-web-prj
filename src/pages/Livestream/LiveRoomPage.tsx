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

function parseLyrics(lrc: string | null | undefined): LyricLine[] {
  if (!lrc) return [];
  const lines = lrc.split("\n");
  const result: LyricLine[] = [];
  const timeReg = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;
  for (const line of lines) {
    const match = timeReg.exec(line);
    if (match) {
      const min = parseInt(match[1], 10);
      const sec = parseInt(match[2], 10);
      const ms = parseInt(match[3], 10);
      const time = min * 60 + sec + (match[3].length === 2 ? ms / 100 : ms / 1000);
      const text = line.replace(timeReg, "").trim();
      if (text) {
        result.push({ time, text });
      }
    }
  }
  return result;
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

function getCurrentUserId(): string | null {
  try {
    const raw = localStorage.getItem("userInfo");
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed.id || parsed.userId || null;
    }
  } catch { /* ignore */ }
  return null;
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
  // playedAt: API returns Unix seconds (number), SignalR returns ISO string → normalize to Unix seconds
  let playedAtMs = 0;
  if (typeof raw.playedAt === 'number') {
    playedAtMs = raw.playedAt * 1000; // Unix seconds → ms
  } else if (typeof raw.playedAt === 'string' && raw.playedAt) {
    playedAtMs = new Date(raw.playedAt).getTime();
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
    playedAt: Math.floor(playedAtMs / 1000), // store as Unix seconds
    lyrics: raw.lyrics ?? null,
  } as any;
}

export function LiveRoomPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const player = usePlayer();

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
  // Separate lyrics string state — only changes when the actual lyrics content changes.
  // This prevents parsedLyrics from re-computing when only elapsed/sync data changes.
  const [currentLyricsStr, setCurrentLyricsStr] = useState<string | null>(null);
  const [lyricsOffset, setLyricsOffset] = useState(() => {
    const saved = localStorage.getItem("lyricsOffset");
    return saved ? parseFloat(saved) : 0;
  });

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestSearch, setRequestSearch] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestableSongs, setRequestableSongs] = useState<RequestSongItem[]>([]);
  const [requestedSongIds, setRequestedSongIds] = useState<Set<string>>(new Set());

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const lyricsContainerRef = useRef<HTMLDivElement | null>(null);
  const elapsedRef = useRef<number>(0);
  const lyricsOffsetRef = useRef<number>(0); // mirror lyricsOffset into ref to avoid stale closures

  const parsedLyrics = useMemo(() => {
    return parseLyrics(currentLyricsStr);
  }, [currentLyricsStr]);

  const activeLyricIndex = useMemo(() => {
    if (!parsedLyrics.length) return -1;
    let idx = -1;
    // Áp dụng lyricsOffset để người dùng tự chỉnh độ lệch lyrics vs audio (-10s → +10s)
    const adjustedElapsed = elapsed - lyricsOffset;
    for (let i = 0; i < parsedLyrics.length; i++) {
      if (adjustedElapsed >= parsedLyrics[i].time) {
        idx = i;
      } else {
        break;
      }
    }
    return idx;
  }, [parsedLyrics, elapsed, lyricsOffset]);

  // Sync lyricsOffset → ref để useMemo không bị stale closure
  useEffect(() => {
    lyricsOffsetRef.current = lyricsOffset;
  }, [lyricsOffset]);

  // Save lyricsOffset to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("lyricsOffset", String(lyricsOffset));
  }, [lyricsOffset]);

  // Scroll lyrics into view
  useEffect(() => {
    if (activeLyricIndex >= 0 && lyricsContainerRef.current) {
      const activeEl = lyricsContainerRef.current.querySelector(".lr-lyric-line.active") as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [activeLyricIndex]);

  // ─── Elapsed Timer (PRIMARY DRIVER): real-time elapsed from playedAt ─────
  // playedAt = Unix seconds when track started on server
  // elapsed = now - playedAt — pure wall-clock, no staleness from API polling
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isPlaying || !nowPlaying?.currentTrack) return;
      const playedAt = (nowPlaying.currentTrack as any).playedAt as number | undefined;
      if (typeof playedAt !== 'number' || playedAt <= 0) return;

      const nextElapsed = Math.max(0, Math.floor(Date.now() / 1000) - playedAt);
      setElapsed(nextElapsed);
      elapsedRef.current = nextElapsed;
      player.setElapsed(nextElapsed);
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, nowPlaying?.currentTrack?.shId, player]);

  // Dùng chung để dừng audio ở mọi nơi: navigate, session end, cleanup
  const cleanupAudio = useCallback(() => {
    player.leaveSession();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; audioRef.current = null; }
    setIsPlaying(false);
    setElapsed(0);
    elapsedRef.current = 0;
    player.setElapsed(0);
  }, []);

  const prevTrackIdRef = useRef<number | undefined>(undefined);
  const prevTrackDataRef = useRef<TrackInfo | null>(null);
  const sessionIdRef = useRef<string | undefined>(sessionId);
  const joinedRef = useRef(false);
  const nowPlayingPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nowPlayingRef = useRef<NowPlayingData | null>(null); // avoid stale closure in pollNowPlaying
  const stationIdRef = useRef<string | undefined>(undefined);
  const autoPlayRef = useRef(false); // chỉ auto-play lần đầu

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
    setCurrentLyricsStr(null);
    elapsedRef.current = 0;
    setElapsed(0);
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

        prevTrackIdRef.current = newShId;
        elapsedRef.current = track.elapsed ?? 0;
        setElapsed(track.elapsed ?? 0);
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
            userName:
              chat.userId === userId
                ? getCurrentUserName()
                : `User-${(chat.userId || "?").slice(0, 6)}`,
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
        setListeners(sessionData.listenersCount ?? 0);
        stationIdRef.current = String(sessionData.stationId);

        await liveHubService.start();

        try {
          // Trì hoãn việc gọi JoinSession 1 chút để tránh race condition khi SignalR mới connected
          setTimeout(async () => {
            try {
              await liveHubService.joinSession(sessionId, userId || undefined);
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
            totalListeners: nowPlayingData.totalListeners ?? sessionData.listenersCount ?? 0,
            isLive: nowPlayingData.isLive ?? true,
            isOnline: nowPlayingData.isOnline ?? true,
            listenUrl,
            stationName: nowPlayingData.stationName || sessionData.stationName || "Live Station",
          };
          setNowPlaying(npData);
          nowPlayingRef.current = npData;
          if (track) {
            prevTrackIdRef.current = track.shId;
            elapsedRef.current = track.elapsed ?? 0;
            setElapsed(track.elapsed ?? 0);
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
                await audioRef.current!.play();
                setIsPlaying(true);
                player.setIsPlaying(true);
              } catch {
                try {
                  if (audioRef.current) {
                    audioRef.current.muted = true;
                    await audioRef.current.play();
                    player.toggleMute();
                    setIsPlaying(true);
                    player.setIsPlaying(true);
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
            totalListeners: sessionData.listenersCount ?? 0,
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

    // ─── Poll now-playing (Chỉ chạy 15s/lần để backup, data chính đã lấy từ SignalR) ───────────────────────────
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

          elapsedRef.current = track.elapsed ?? 0;
          setElapsed(track.elapsed ?? 0);
        } else {
          // Song same — DO NOT call setNowPlaying (would re-render lyrics every 3s).
          // elapsed is already updated smoothly every 1s by the wall-clock timer.
          // No need to override it with API values — that would cause visible jumps.
          if (data.listenersCount !== undefined) {
            setListeners(data.listenersCount);
          }
        }
      } catch { /* silent */ }
    };
    nowPlayingPollRef.current = setInterval(pollNowPlaying, 3000);

    return () => {
      offNowPlayingUpdated();
      offListeners();
      offChat();
      offJoined();
      offLeft();
      offEnded();
      if (nowPlayingPollRef.current) clearInterval(nowPlayingPollRef.current);
      void liveHubService.stop();
      cleanupAudio();
    };
  }, [sessionId, ended]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Sync bottom MusicPlayer ─────────────────────────────────────────────
  useEffect(() => {
    const track = nowPlaying?.currentTrack;
    if (!track) return;

    player.setTrack({
      title: track.title,
      artist: track.artist,
      album: track.album,
      artUrl: track.artUrl,
      duration: track.duration,
      elapsed: track.elapsed,
      listenUrl: nowPlaying?.listenUrl || session?.streamUrl || undefined,
      lyrics: track.lyrics ?? null,
    });
    player.setIsPlaying(isPlaying);
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
      if (player.isPlaying) {
        if (audioRef.current) {
          audioRef.current.play().then(() => setIsPlaying(true)).catch(() => void playStream());
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
  }, [player.isPlaying]);
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

  // ─── Audio playback ────────────────────────────────────────────────────
  const playStream = useCallback(async () => {
    const url = nowPlaying?.listenUrl || session?.streamUrl;
    if (!url) return;

    const srcChanged = !audioRef.current || audioRef.current.src !== url;
    if (srcChanged) {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
      audioRef.current = new Audio(url);
      // Áp dụng âm lượng từ player context nếu có, thay vì dùng volume state cũ
      audioRef.current.volume = player.isMuted ? 0 : (player.volume / 100);
    }
    try {
      if (!audioRef.current) return;

      // Nếu player đang tắt tiếng do autoplay policy trước đó, đồng bộ lại
      audioRef.current.muted = player.isMuted;

      await audioRef.current.play();
      setIsPlaying(true);
      player.setIsPlaying(true);
    } catch {
      try {
        if (audioRef.current) {
          audioRef.current.muted = true;
          await audioRef.current.play();
          if (!player.isMuted) {
            player.toggleMute();
          }
          setIsPlaying(true);
          player.setIsPlaying(true);
        }
      } catch { /* ignore autoplay blocked */ }
    }
  }, [nowPlaying?.listenUrl, session?.streamUrl, player]);

  const togglePlay = () => {
    if (!audioRef.current) { void playStream(); return; }
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      player.setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        player.setIsPlaying(true);
      }).catch(() => void playStream());
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
    const sid = sessionIdRef.current;
    if (!sid) return;
    try {
      await liveSessionApiService.createSongRequest(sid, {
        mediaFileId: song.id,
      });
      setRequestedSongIds(prev => new Set([...prev, song.id]));
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
    } catch (err) {
      console.error("[LiveRoomPage] requestSong failed:", err);
      showToast.error("Không thể gửi yêu cầu. Vui lòng thử lại.");
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
      await liveHubService.sendChat(sessionIdRef.current, userId, chatInput.trim());
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
                    className={`lr-lyric-sync-line ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      if (elapsed > 0) {
                        const newOffset = elapsed - line.time;
                        setLyricsOffset(newOffset);
                        localStorage.setItem("lyricsOffset", String(newOffset));
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
    </div>
  );
}

export default LiveRoomPage;
