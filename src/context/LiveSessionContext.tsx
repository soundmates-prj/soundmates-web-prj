import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { liveHubService, type ChatMessage, type LiveSessionEvent } from "../services/liveHubService";
import { liveSessionApiService } from "../services/liveSessionApiService";

interface LiveSession {
  id: string;
  sessionName: string;
  description?: string;
  status: string;
  stationName?: string;
  startedAt?: string;
  streamUrl?: string;
}

interface LiveSessionContextValue {
  session: LiveSession | null;
  isLive: boolean;
  isPaused: boolean;
  listeners: number;
  chatMessages: ChatMessage[];
  isConnected: boolean;
  startSession: (sessionId: string) => Promise<void>;
  pauseSession: (sessionId: string) => Promise<void>;
  resumeSession: (sessionId: string) => Promise<void>;
  stopSession: (sessionId: string) => Promise<void>;
  leaveSession: (sessionId: string) => void;
  sendChat: (sessionId: string, userId: string, message: string, userName?: string, avatarUrl?: string) => void;
  deleteChat: (sessionId: string, chatId: string, requestUserId: string, role: string) => void;
}

const LiveSessionContext = createContext<LiveSessionContextValue | null>(null);

const GUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
  } catch {
    // ignore
  }
  return tryParseJwtUserId(localStorage.getItem("accessToken"));
}

export function LiveSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<LiveSession | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [listeners, setListeners] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const currentSessionIdRef = useRef<string | null>(null);
  // Store per-listener unsubscribe functions
  const listenersUnsubscribeRef = useRef<(() => void) | null>(null);
  const chatUnsubscribeRef = useRef<(() => void) | null>(null);
  const sessionStartedUnsubscribeRef = useRef<(() => void) | null>(null);
  const sessionEndedUnsubscribeRef = useRef<(() => void) | null>(null);

  // Start hub connection once on mount
  useEffect(() => {
    liveHubService.start().then(() => {
      setIsConnected(true);
    }).catch(() => {
      setIsConnected(false);
    });
  }, []);

  // Register per-session event listeners whenever currentSessionId changes
  useEffect(() => {
    const sessionId = currentSessionIdRef.current;

    // Clean up previous session listeners — each unsubscribe fn handles its own event
    listenersUnsubscribeRef.current?.();
    chatUnsubscribeRef.current?.();
    sessionStartedUnsubscribeRef.current?.();
    sessionEndedUnsubscribeRef.current?.();

    if (!sessionId) return;

    // Listener count — authoritative from hub
    listenersUnsubscribeRef.current = liveHubService.onListenersUpdated((sid, count) => {
      if (sid === currentSessionIdRef.current) {
        setListeners(count);
      }
    });

    // Chat messages
    chatUnsubscribeRef.current = liveHubService.onReceiveChat((msg: ChatMessage) => {
      if (msg.liveSessionId === currentSessionIdRef.current) {
        setChatMessages(prev => [...prev.slice(-99), msg]);
      }
    });

    const chatHistoryUnsubscribe = liveHubService.onChatHistory((history: ChatMessage[]) => {
      setChatMessages(history);
    });

    const chatDeletedUnsubscribe = liveHubService.onChatDeleted((chatId: string) => {
      setChatMessages(prev => prev.map(m => m.id === chatId ? { ...m, isDeleted: true } : m));
    });

    // Session started
    sessionStartedUnsubscribeRef.current = liveHubService.onSessionStarted((evt: LiveSessionEvent) => {
      if (evt.id === currentSessionIdRef.current) {
        setSession(prev =>
          prev ? { ...prev, status: evt.status, startedAt: evt.startedAt ?? undefined } : prev
        );
        setIsLive(true);
        setIsPaused(false);
      }
    });

    // Session ended
    sessionEndedUnsubscribeRef.current = liveHubService.onSessionEnded((evt: LiveSessionEvent) => {
      if (evt.id === currentSessionIdRef.current) {
        setIsLive(false);
        setIsPaused(false);
      }
    });

    return () => {
      listenersUnsubscribeRef.current?.();
      chatUnsubscribeRef.current?.();
      chatHistoryUnsubscribe();
      chatDeletedUnsubscribe();
      sessionStartedUnsubscribeRef.current?.();
      sessionEndedUnsubscribeRef.current?.();
    };
  }, [currentSessionId]);

  // Global cleanup on unmount — leave session but do NOT call offAll()
  // (other components share the hub connection)
  useEffect(() => {
    return () => {
      if (currentSessionIdRef.current) {
        const sid = currentSessionIdRef.current;
        const uid = getCurrentUserId();
        void liveHubService.leaveSession(sid, uid);
      }
      // Do NOT call offAll() — per-session effect above already cleaned up
      // this provider's listeners. offAll() would destroy listeners for
      // every other component sharing the hub.
    };
  }, []);

  // ─── Session actions ───────────────────────────────────────────────────────

  const startSession = useCallback(async (sessionId: string) => {
    // API first — fail fast before touching any state
    await liveSessionApiService.startSession(sessionId);

    setCurrentSessionId(sessionId);
    currentSessionIdRef.current = sessionId;

    const userId = getCurrentUserId();
    await liveHubService.joinSession(sessionId, userId);

    const sess = await liveSessionApiService.getLiveSession(sessionId);
    setSession({
      id: sess.id,
      sessionName: sess.sessionName,
      description: sess.description ?? undefined,
      status: sess.status,
      stationName: sess.stationName ?? undefined,
      streamUrl: sess.streamUrl ?? undefined,
    });
    setIsLive(sess.status?.toLowerCase() === "live");
    setIsPaused(sess.status?.toLowerCase() === "paused");
  }, []);

  const pauseSession = useCallback(async (sessionId: string) => {
    const result = await liveSessionApiService.pauseSession(sessionId);
    setIsPaused(result.status?.toLowerCase() === "paused");
  }, []);

  const resumeSession = useCallback(async (sessionId: string) => {
    const result = await liveSessionApiService.resumeSession(sessionId);
    setIsPaused(result.status?.toLowerCase() === "paused");
  }, []);

  const stopSession = useCallback(async (sessionId: string) => {
    const result = await liveSessionApiService.stopSession(sessionId);
    setIsLive(result.status?.toLowerCase() === "live");
    setIsPaused(result.status?.toLowerCase() === "paused");
    const uid = getCurrentUserId();
    await liveHubService.leaveSession(sessionId, uid);
  }, []);

  const leaveSession = useCallback((sessionId: string) => {
    const uid = getCurrentUserId();
    void liveHubService.leaveSession(sessionId, uid);
    currentSessionIdRef.current = null;
    setCurrentSessionId(null);
    setSession(null);
    setIsLive(false);
    setIsPaused(false);
    setListeners(0);
    setChatMessages([]);
  }, []);

  const sendChat = useCallback((sessionId: string, userId: string, message: string, userName?: string, avatarUrl?: string) => {
    void liveHubService.sendChat(sessionId, userId, message, userName, avatarUrl);
  }, []);

  const deleteChat = useCallback((sessionId: string, chatId: string, requestUserId: string, role: string) => {
    void liveHubService.deleteChat(sessionId, chatId, requestUserId, role);
  }, []);

  return (
    <LiveSessionContext.Provider
      value={{
        session,
        isLive,
        isPaused,
        listeners,
        chatMessages,
        isConnected,
        startSession,
        pauseSession,
        resumeSession,
        stopSession,
        leaveSession,
        sendChat,
        deleteChat,
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
