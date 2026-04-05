import * as signalR from "@microsoft/signalr";

const LIVE_HUB_URL =
  import.meta.env.VITE_SIGNALR_HUB_URL ??
  "http://localhost:8003/hubs/live-session";

export interface ChatMessage {
  id: string;
  liveSessionId: string;
  userId: string;
  message: string;
  createdAt: string;
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

class LiveHubService {
  private connection: signalR.HubConnection | null = null;
  private reconnectAttempt = 0;

  getConnection(): signalR.HubConnection {
    if (!this.connection) {
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(LIVE_HUB_URL, {
          skipNegotiation: true,
          transport: signalR.HttpTransportType.WebSockets,
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(signalR.LogLevel.Warning)
        .build();

      this.connection.onreconnecting(() => {
        this.reconnectAttempt++;
        console.log(`[LiveHub] Reconnecting... attempt ${this.reconnectAttempt}`);
      });
      this.connection.onreconnected(() => {
        console.log("[LiveHub] Reconnected");
        this.reconnectAttempt = 0;
      });
    }
    return this.connection;
  }

  async start(): Promise<void> {
    const conn = this.getConnection();
    if (conn.state === signalR.HubConnectionState.Disconnected) {
      try {
        await conn.start();
        console.log("[LiveHub] Connected");
        this.reconnectAttempt = 0;
      } catch (err) {
        console.error("[LiveHub] Connection failed:", err);
      }
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
    if (conn.state === signalR.HubConnectionState.Connected) {
      await conn.invoke("JoinSession", sessionId, userId ?? null);
    }
  }

  // Backend: LeaveSession(sessionId, userId?, anonymousIdentifier?)
  async leaveSession(sessionId: string, userId?: string | null): Promise<void> {
    const conn = this.getConnection();
    if (conn.state === signalR.HubConnectionState.Connected) {
      await conn.invoke("LeaveSession", sessionId, userId ?? null);
    }
  }

  async sendChat(sessionId: string, userId: string, message: string): Promise<void> {
    const conn = this.getConnection();
    if (conn.state !== signalR.HubConnectionState.Connected) {
      throw new Error("Mất kết nối — không thể gửi tin nhắn");
    }
    await conn.invoke("SendChat", sessionId, userId, message);
  }

  // ─── Event handlers ───────────────────────────────────────────────────────
  // Backend sends lowercase event names: sessionstarted, sessionended, userjoined, userleft

  onSessionStarted(callback: (session: LiveSessionEvent) => void): () => void {
    const conn = this.getConnection();
    conn.on("sessionstarted", callback);
    return () => conn.off("sessionstarted", callback);
  }

  onSessionEnded(callback: (session: LiveSessionEvent) => void): () => void {
    const conn = this.getConnection();
    conn.on("sessionended", callback);
    return () => conn.off("sessionended", callback);
  }

  onUserJoined(
    callback: (sessionId: string, userId: string | null, count: number) => void,
  ): () => void {
    const conn = this.getConnection();
    conn.on("userjoined", callback);
    return () => conn.off("userjoined", callback);
  }

  onUserLeft(
    callback: (sessionId: string, userId: string | null, count: number) => void,
  ): () => void {
    const conn = this.getConnection();
    conn.on("userleft", callback);
    return () => conn.off("userleft", callback);
  }

  onReceiveChat(callback: (chat: ChatMessage) => void): () => void {
    const conn = this.getConnection();
    conn.on("ReceiveChat", callback);
    return () => conn.off("ReceiveChat", callback);
  }

  onListenersUpdated(callback: (sessionId: string, count: number) => void): () => void {
    const conn = this.getConnection();
    conn.on("ListenersUpdated", callback);
    return () => conn.off("ListenersUpdated", callback);
  }

  onSongChanged(callback: (song: SongChangedEvent) => void): () => void {
    const conn = this.getConnection();
    conn.on("SongChanged", callback);
    return () => conn.off("SongChanged", callback);
  }

  onSongRequestCreated(callback: (req: SongRequestCreatedEvent) => void): () => void {
    const conn = this.getConnection();
    conn.on("SongRequestCreated", callback);
    return () => conn.off("SongRequestCreated", callback);
  }

  offAll(): void {
    const conn = this.getConnection();
    conn.off("sessionstarted");
    conn.off("sessionended");
    conn.off("userjoined");
    conn.off("userleft");
    conn.off("ReceiveChat");
    conn.off("ListenersUpdated");
    conn.off("SongChanged");
    conn.off("SongRequestCreated");
  }
}

export const liveHubService = new LiveHubService();
export default liveHubService;
