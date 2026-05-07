import * as signalR from "@microsoft/signalr";

const LIVE_HUB_URL =
  import.meta.env.VITE_SIGNALR_HUB_URL ??
  "http://localhost:8003/hubs/live-session";

const GUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const GUEST_ID_KEY = "liveGuestIdentifier";

function normalizeGuid(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return GUID_REGEX.test(trimmed) ? trimmed : null;
}

function getOrCreateGuestIdentifier(): string {
  try {
    const existing = localStorage.getItem(GUEST_ID_KEY);
    if (existing && existing.trim()) return existing;

    const generated =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `guest-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    localStorage.setItem(GUEST_ID_KEY, generated);
    return generated;
  } catch {
    return `guest-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

function toListenerTuple(args: any[]): { sessionId: string; count: number } | null {
  if (args.length >= 2) {
    const sid = String(args[0] ?? "");
    const count = Number(args[1]);
    if (sid && Number.isFinite(count)) {
      return { sessionId: sid, count };
    }
  }

  const payload = args[0];
  if (payload && typeof payload === "object") {
    const sid = String(payload.sessionId ?? payload.SessionId ?? payload.id ?? payload.Id ?? "");
    const count = Number(
      payload.count ??
        payload.Count ??
        payload.listeners ??
        payload.Listeners ??
        payload.currentListeners ??
        payload.CurrentListeners ??
        payload.listenersCount ??
        payload.ListenersCount ??
        payload.totalListeners ??
        payload.TotalListeners,
    );

    if (sid && Number.isFinite(count)) {
      return { sessionId: sid, count };
    }
  }

  return null;
}

function toUserJoinTuple(args: any[]): { sessionId: string; userId: string | null; count: number } | null {
  if (args.length >= 3) {
    const sid = String(args[0] ?? "");
    const uid = args[1] == null ? null : String(args[1]);
    const count = Number(args[2]);
    if (sid && Number.isFinite(count)) {
      return { sessionId: sid, userId: uid, count };
    }
  }

  const payload = args[0];
  if (payload && typeof payload === "object") {
    const sid = String(payload.sessionId ?? payload.SessionId ?? payload.id ?? payload.Id ?? "");
    const uidRaw = payload.userId ?? payload.UserId ?? null;
    const uid = uidRaw == null ? null : String(uidRaw);
    const count = Number(
      payload.count ??
        payload.Count ??
        payload.listeners ??
        payload.Listeners ??
        payload.currentListeners ??
        payload.CurrentListeners ??
        payload.listenersCount ??
        payload.ListenersCount,
    );

    if (sid && Number.isFinite(count)) {
      return { sessionId: sid, userId: uid, count };
    }
  }

  return null;
}

export interface ChatMessage {
  id: string;
  liveSessionId: string;
  userId: string;
  userName?: string;
  avatarUrl?: string; // NEW
  message: string;
  createdAt: string;
  isDeleted?: boolean;
}

export interface LiveSessionEvent {
  id: string;
  userId: string;
  stationId: string;
  stationName: string | null;
  sessionName: string;
  description: string | null;
  status: string;
  startedAt: string | null;
  endedAt: string | null;
  streamUrl: string | null;
  thumbnailUrl: string | null;
  genre: string | null;
  listenersCount: number;
}

export interface NowPlayingUpdatedEvent {
  currentTrack: {
    shId: number;
    title: string | null;
    artist: string | null;
    album: string | null;
    artUrl: string | null;
    duration: number;
    elapsed: number;
    remaining: number;
    playedAt: number;
    isRequest: boolean;
    lyrics?: string | null;
  };
  playingNext: {
    shId: number;
    title: string | null;
    artist: string | null;
    album: string | null;
    artUrl: string | null;
    duration: number;
    elapsed: number;
    remaining: number;
    playedAt: number;
    isRequest: boolean;
    lyrics?: string | null;
  } | null;
  upcomingQueue?: any[];
  listenUrl: string | null;
  totalListeners: number;
}

export interface SongChangedEvent {
  sessionId: string;
  trackTitle: string;
  trackArtist: string | null;
  trackAlbum: string | null;
  artUrl: string | null;
  duration: number;
  elapsed: number;
  listenUrl: string | null;
  isRequest: boolean;
  playedAt: string;
  lyrics?: string | null;
}

export interface SongRequestCreatedEvent {
  requestId: string;
  sessionId: string;
  mediaFileId: string;
  songTitle: string;
  songArtist: string | null;
  requestedByUserId: string;
  requestedByUserName: string | null;
  message: string | null;
  createdAt: string;
}

// Podcast request event — mirrors PodcastRequestResult shape
export interface PodcastRequestCreatedEvent {
  id: string;
  liveSessionId: string;
  requestedByUserId: string;
  title: string;
  description: string | null;
  scriptText: string;
  audioUrl: string;
  durationSeconds: number;
  voiceCode: string;
  voiceDisplayName: string | null;
  status: string;
  requestedAt: string;
  sessionName: string | null;
}

export interface PodcastRequestReviewedEvent {
  id: string;
  liveSessionId: string;
  requestedByUserId: string;
  title: string;
  description: string | null;
  scriptText: string;
  audioUrl: string;
  durationSeconds: number;
  voiceCode: string;
  voiceDisplayName: string | null;
  azuraCastMediaId: string | null;
  status: string;
  reviewedByUserId: string | null;
  reviewedAt: string | null;
  rejectReason: string | null;
  requestedAt: string;
  sessionName: string | null;
}

export interface GuestViewLimitExceededEvent {
  sessionId: string;
  anonymousIdentifier: string | null;
  message: string;
  viewedDuration: number; // seconds
}

class LiveHubService {
  private connection: signalR.HubConnection | null = null;
  private reconnectAttempt = 0;
  private joinedSessions = new Map<string, { userId: string | null; anonymousIdentifier: string | null }>();
  private startPromise: Promise<void> | null = null;

  getConnection(): signalR.HubConnection {
    if (!this.connection) {
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(LIVE_HUB_URL)
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Debug)
        .build();

      this.connection.onreconnecting(() => {
        this.reconnectAttempt++;
        console.log(`[LiveHub] Reconnecting... attempt ${this.reconnectAttempt}`);
      });
      this.connection.onreconnected(() => {
        console.log("[LiveHub] Reconnected");
        this.reconnectAttempt = 0;
        // SignalR group membership is not guaranteed after reconnect.
        // Re-join all previously joined sessions to restore realtime events.
        for (const [sessionId, state] of this.joinedSessions.entries()) {
          void this.connection
            ?.invoke("JoinSession", sessionId, state.userId, state.anonymousIdentifier)
            .then(() => {
              console.log(`[LiveHub] Re-joined session after reconnect: ${sessionId}`);
            })
            .catch((err) => {
              console.warn(`[LiveHub] Failed to re-join session ${sessionId}:`, err);
            });
        }
      });
    }
    return this.connection;
  }

  async start(): Promise<void> {
    const conn = this.getConnection();

    if (conn.state === signalR.HubConnectionState.Connected) {
      return;
    }

    if (this.startPromise) {
      return this.startPromise;
    }

    if (conn.state === signalR.HubConnectionState.Disconnected) {
      this.startPromise = conn.start().then(() => {
        console.log("[LiveHub] Connected");
        this.reconnectAttempt = 0;
        this.startPromise = null;
      }).catch((err) => {
        console.error("[LiveHub] Connection failed:", err);
        this.startPromise = null;
        throw err;
      });
      return this.startPromise;
    }
  }

  async stop(): Promise<void> {
    if (this.connection && this.connection.state !== signalR.HubConnectionState.Disconnected) {
      await this.connection.stop();
      console.log("[LiveHub] Disconnected");
    }
  }

  // Backend: JoinSession(sessionId, userId?, anonymousIdentifier?)
  async joinSession(sessionId: string, userId?: string | null): Promise<void> {
    const conn = this.getConnection();
    if (!normalizeGuid(sessionId)) {
      throw new Error("Session ID is not a valid GUID");
    }

    if (conn.state !== signalR.HubConnectionState.Connected) {
      await this.start();
    }

    if (conn.state === signalR.HubConnectionState.Connected) {
      const normalizedUserId = normalizeGuid(userId);
      const anonymousIdentifier = normalizedUserId ? null : getOrCreateGuestIdentifier();
      try {
        await conn.invoke("JoinSession", sessionId, normalizedUserId, anonymousIdentifier);
        this.joinedSessions.set(sessionId, {
          userId: normalizedUserId,
          anonymousIdentifier,
        });
      } catch (err: any) {
        // SignalR v7 wraps HubException details in err.errorData
        // Format: { "error": "HubException", "message": "actual message", ... }
        const signalrMsg: string = err?.message ?? "";
        const errorData: any = err?.errorData ?? err?.error ?? null;
        const serverMsg: string =
          errorData?.message ??
          errorData?.Message ??
          (typeof errorData === "string" ? errorData : null) ??
          signalrMsg.replace(/^Failed to invoke 'JoinSession' due to an error on the server\.\s*/i, "") ??
          "";

        const finalMsg = serverMsg.trim() || signalrMsg || "JoinSession failed on server";

        console.error("[LiveHub] JoinSession error:", {
          signalrMsg,
          errorData,
          serverMsg: finalMsg,
          full: err,
        });
        throw new Error(finalMsg);
      }
    }
  }

  // Backend: LeaveSession(sessionId, userId?, anonymousIdentifier?)
  async leaveSession(sessionId: string, userId?: string | null): Promise<void> {
    const conn = this.getConnection();

    if (conn.state === signalR.HubConnectionState.Connected) {
      const normalizedUserId = normalizeGuid(userId);
      const anonymousIdentifier = normalizedUserId ? null : getOrCreateGuestIdentifier();
      await conn.invoke("LeaveSession", sessionId, normalizedUserId, anonymousIdentifier);
    }
    this.joinedSessions.delete(sessionId);
  }

  async sendChat(sessionId: string, userId: string, message: string, userName?: string, avatarUrl?: string): Promise<void> {
    const conn = this.getConnection();
    if (conn.state !== signalR.HubConnectionState.Connected) {
      throw new Error("Mất kết nối — không thể gửi tin nhắn");
    }
    await conn.invoke("SendChat", sessionId, userId, message, userName ?? null, avatarUrl ?? null);
  }

  async deleteChat(sessionId: string, chatId: string, requestUserId: string, role: string): Promise<void> {
    const conn = this.getConnection();
    if (conn.state === signalR.HubConnectionState.Connected) {
      await conn.invoke('DeleteChat', sessionId, chatId, requestUserId, role);
    }
  }

  // ─── WebRTC Signaling ─────────────────────────────────────────────────────

  /** Host: bắt đầu stream mic, gửi SDP Offer lên Hub */
  async startMicrophone(sessionId: string, sdpOffer: string): Promise<void> {
    const conn = this.getConnection();
    if (conn.state !== signalR.HubConnectionState.Connected) await this.start();
    await conn.invoke("StartMicrophone", sessionId, sdpOffer);
  }

  /** Host: dừng stream mic */
  async stopMicrophone(sessionId: string): Promise<void> {
    const conn = this.getConnection();
    if (conn.state === signalR.HubConnectionState.Connected) {
      await conn.invoke("StopMicrophone", sessionId);
    }
  }

  /** Listener: gửi SDP Offer đến Host để subscribe nhận audio */
  async listenerRequestMic(sessionId: string, sdpOffer: string): Promise<void> {
    const conn = this.getConnection();
    if (conn.state !== signalR.HubConnectionState.Connected) await this.start();
    await conn.invoke("ListenerRequestMic", sessionId, sdpOffer);
  }

  /** Host: gửi SDP Answer về cho 1 listener cụ thể */
  async hostAnswerListener(sessionId: string, listenerConnectionId: string, sdpAnswer: string): Promise<void> {
    const conn = this.getConnection();
    if (conn.state === signalR.HubConnectionState.Connected) {
      await conn.invoke("HostAnswerListener", sessionId, listenerConnectionId, sdpAnswer);
    }
  }

  /** Relay ICE candidate đến peer cụ thể */
  async iceCandidateRelay(sessionId: string, targetConnectionId: string, candidate: string): Promise<void> {
    const conn = this.getConnection();
    if (conn.state === signalR.HubConnectionState.Connected) {
      await conn.invoke("IceCandidateRelay", sessionId, targetConnectionId, candidate);
    }
  }

  /** Host: Cập nhật âm lượng nhạc nền cho tất cả Listeners */
  async updateGlobalVolume(sessionId: string, volume: number): Promise<void> {
    const conn = this.getConnection();
    if (conn.state === signalR.HubConnectionState.Connected) {
      await conn.invoke("HostUpdateGlobalVolume", sessionId, volume);
    }
  }

  // ─── WebRTC Event Handlers ────────────────────────────────────────────────

  /** Listener nhận event: Host bắt đầu broadcast mic */
  onHostMicStarted(callback: (sessionId: string) => void): () => void {
    const conn = this.getConnection();
    conn.on("HostMicStarted", callback);
    return () => conn.off("HostMicStarted", callback);
  }

  /** Listener nhận event: Host dừng broadcast mic */
  onHostMicStopped(callback: (sessionId: string) => void): () => void {
    const conn = this.getConnection();
    conn.on("HostMicStopped", callback);
    return () => conn.off("HostMicStopped", callback);
  }

  /** Host nhận event: 1 listener muốn subscribe → nhận SDP Offer từ listener */
  onListenerWantsToSubscribe(callback: (sessionId: string, listenerConnId: string, sdpOffer: string) => void): () => void {
    const conn = this.getConnection();
    conn.on("ListenerWantsToSubscribe", callback);
    return () => conn.off("ListenerWantsToSubscribe", callback);
  }

  /** Listener nhận SDP Answer từ Host */
  onReceiveHostAnswer(callback: (sessionId: string, sdpAnswer: string) => void): () => void {
    const conn = this.getConnection();
    conn.on("ReceiveHostAnswer", callback);
    return () => conn.off("ReceiveHostAnswer", callback);
  }

  /** Nhận ICE candidate từ peer (cả 2 chiều) */
  onReceiveIceCandidate(callback: (sessionId: string, candidate: string) => void): () => void {
    const conn = this.getConnection();
    conn.on("ReceiveIceCandidate", callback);
    return () => conn.off("ReceiveIceCandidate", callback);
  }

  /** Listener nhận lệnh thay đổi âm lượng nhạc nền chung từ Host */
  onGlobalVolumeUpdated(callback: (volume: number) => void): () => void {
    const conn = this.getConnection();
    conn.on("GlobalVolumeUpdated", callback);
    return () => conn.off("GlobalVolumeUpdated", callback);
  }

  // Backend sends lowercase event names: sessionstarted, sessionended, userjoined, userleft

  onSessionStarted(callback: (session: LiveSessionEvent) => void): () => void {
    const conn = this.getConnection();
    conn.on("SessionStarted", callback);
    return () => conn.off("SessionStarted", callback);
  }

  onSessionEnded(callback: (session: LiveSessionEvent) => void): () => void {
    const conn = this.getConnection();
    conn.on("SessionEnded", callback);
    return () => conn.off("SessionEnded", callback);
  }

  onUserJoined(
    callback: (sessionId: string, userId: string | null, count: number) => void,
  ): () => void {
    const conn = this.getConnection();
    const handler = (...args: any[]) => {
      const parsed = toUserJoinTuple(args);
      if (parsed) {
        callback(parsed.sessionId, parsed.userId, parsed.count);
      }
    };
    conn.on("UserJoined", handler);
    return () => conn.off("UserJoined", handler);
  }

  onUserLeft(
    callback: (sessionId: string, userId: string | null, count: number) => void,
  ): () => void {
    const conn = this.getConnection();
    const handler = (...args: any[]) => {
      const parsed = toUserJoinTuple(args);
      if (parsed) {
        callback(parsed.sessionId, parsed.userId, parsed.count);
      }
    };
    conn.on("UserLeft", handler);
    return () => conn.off("UserLeft", handler);
  }

  onReceiveChat(callback: (chat: ChatMessage) => void): () => void {
    const conn = this.getConnection();
    conn.on("ReceiveChat", callback);
    return () => conn.off("ReceiveChat", callback);
  }

  onChatHistory(callback: (chats: ChatMessage[]) => void): () => void {
    const conn = this.getConnection();
    conn.on("ChatHistory", callback);
    return () => conn.off("ChatHistory", callback);
  }

  onChatDeleted(callback: (chatId: string) => void): () => void {
    const conn = this.getConnection();
    conn.on("ChatDeleted", callback);
    return () => conn.off("ChatDeleted", callback);
  }

  onListenersUpdated(callback: (sessionId: string, count: number) => void): () => void {
    const conn = this.getConnection();
    const handler = (...args: any[]) => {
      const parsed = toListenerTuple(args);
      if (parsed) {
        callback(parsed.sessionId, parsed.count);
      }
    };
    conn.on("ListenersUpdated", handler);
    conn.on("listenersupdated", handler);
    return () => {
      conn.off("ListenersUpdated", handler);
      conn.off("listenersupdated", handler);
    };
  }

  onSongChanged(callback: (song: SongChangedEvent) => void): () => void {
    const conn = this.getConnection();
    conn.on("SongChanged", callback);
    return () => conn.off("SongChanged", callback);
  }

  // Listens for NowPlayingUpdated events broadcast from NowPlayingBroadcastService
  // via LiveSessionHub. Carries full now-playing data including remaining/elapsed.
  onNowPlayingUpdated(callback: (data: NowPlayingUpdatedEvent) => void): () => void {
    const conn = this.getConnection();
    conn.on("NowPlayingUpdated", callback);
    return () => conn.off("NowPlayingUpdated", callback);
  }

  onSongRequestCreated(callback: (req: SongRequestCreatedEvent) => void): () => void {
    const conn = this.getConnection();
    conn.on("SongRequestCreated", callback);
    return () => conn.off("SongRequestCreated", callback);
  }

  onPodcastRequestCreated(callback: (req: PodcastRequestCreatedEvent) => void): () => void {
    const conn = this.getConnection();
    conn.on("PodcastRequestCreated", callback);
    return () => conn.off("PodcastRequestCreated", callback);
  }

  onPodcastRequestReviewed(callback: (req: PodcastRequestReviewedEvent) => void): () => void {
    const conn = this.getConnection();
    conn.on("PodcastRequestReviewed", callback);
    return () => conn.off("PodcastRequestReviewed", callback);
  }

  onGuestViewLimitExceeded(callback: (event: GuestViewLimitExceededEvent) => void): () => void {
    const conn = this.getConnection();
    conn.on("GuestViewLimitExceeded", callback);
    return () => conn.off("GuestViewLimitExceeded", callback);
  }

  offAll(): void {
    const conn = this.getConnection();
    conn.off("SessionStarted");
    conn.off("SessionEnded");
    conn.off("UserJoined");
    conn.off("UserLeft");
    conn.off("sessionstarted");
    conn.off("sessionended");
    conn.off("userjoined");
    conn.off("userleft");
    conn.off("ReceiveChat");
    conn.off("ListenersUpdated");
    conn.off("SongChanged");
    conn.off("SongRequestCreated");
    conn.off("NowPlayingUpdated");
    conn.off("PodcastRequestCreated");
    conn.off("PodcastRequestReviewed");
    conn.off("GuestViewLimitExceeded");
  }
}

export const liveHubService = new LiveHubService();
export default liveHubService;
