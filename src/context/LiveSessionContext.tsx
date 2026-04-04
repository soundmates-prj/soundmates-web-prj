import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react";
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
  sendChat: (sessionId: string, userId: string, message: string) => void;
}

const LiveSessionContext = createContext<LiveSessionContextValue | null>(null);

export function LiveSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<LiveSession | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [listeners, setListeners] = useState(0);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Ref to avoid stale closure in event listeners
  const currentSessionIdRef = useRef<string | null>(null);
  // Refs to store unsubscribe functions from per-session listeners
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

    // Clean up previous session listeners
    listenersUnsubscribeRef.current?.();
    chatUnsubscribeRef.current?.();
    sessionStartedUnsubscribeRef.current?.();
    sessionEndedUnsubscribeRef.current?.();

    if (!sessionId) return;

    // Listener count
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

    // Session started
    sessionStartedUnsubscribeRef.current = liveHubService.onSessionStarted((evt: LiveSessionEvent) => {
      if (evt.id === currentSessionIdRef.current) {
        setSession(prev => prev ? { ...prev, status: evt.status, startedAt: evt.startedAt ?? undefined } : prev);
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
      sessionStartedUnsubscribeRef.current?.();
      sessionEndedUnsubscribeRef.current?.();
    };
  }, [currentSessionId]);

  // Global cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentSessionIdRef.current) {
        liveHubService.leaveSession(currentSessionIdRef.current);
      }
      liveHubService.offAll();
    };
  }, []);

  const startSession = useCallback(async (sessionId: string) => {
    try {
      await liveSessionApiService.startSession(sessionId);
    } catch (err) {
      // Re-throw so caller (HostLiveController) can handle the error
      throw err;
    }
    setCurrentSessionId(sessionId);
    currentSessionIdRef.current = sessionId;
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const userId = userInfo?.id || userInfo?.userId || null;
    await liveHubService.joinSession(sessionId, userId);

    const session = await liveSessionApiService.getLiveSession(sessionId);
    setSession({
      id: session.id,
      sessionName: session.sessionName,
      description: session.description ?? undefined,
      status: session.status,
      stationName: session.stationName ?? undefined,
      streamUrl: session.streamUrl ?? undefined,
    });
    setIsLive(session.status?.toLowerCase() === 'live');
    setIsPaused(session.status?.toLowerCase() === 'paused');
  }, []);

  const pauseSession = useCallback(async (sessionId: string) => {
    try {
      await liveSessionApiService.pauseSession(sessionId);
      setIsPaused(true);
    } catch (err) {
      console.error("Không thể tạm dừng phiên:", err);
    }
  }, []);

  const resumeSession = useCallback(async (sessionId: string) => {
    try {
      await liveSessionApiService.resumeSession(sessionId);
      setIsPaused(false);
    } catch (err) {
      console.error("Không thể tiếp tục phiên:", err);
    }
  }, []);

  const stopSession = useCallback(async (sessionId: string) => {
    try {
      await liveSessionApiService.stopSession(sessionId);
      setIsLive(false);
      setIsPaused(false);
      liveHubService.leaveSession(sessionId);
    } catch (err) {
      console.error("Không thể dừng phiên:", err);
    }
  }, []);

  const leaveSession = useCallback((sessionId: string) => {
    liveHubService.leaveSession(sessionId);
    currentSessionIdRef.current = null;
    setCurrentSessionId(null);
    setSession(null);
    setIsLive(false);
    setIsPaused(false);
    setListeners(0);
    setChatMessages([]);
  }, []);

  const sendChat = useCallback((sessionId: string, userId: string, message: string) => {
    liveHubService.sendChat(sessionId, userId, message);
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
