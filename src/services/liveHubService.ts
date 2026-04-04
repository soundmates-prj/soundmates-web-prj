import * as signalR from "@microsoft/signalr";

const LIVE_HUB_URL = "http://localhost:8003/hubs/live-session";

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

class LiveHubService {
  private connection: signalR.HubConnection | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

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
    }
    return this.connection;
  }

  async start(): Promise<void> {
    const conn = this.getConnection();
    if (conn.state === signalR.HubConnectionState.Disconnected) {
      try {
        await conn.start();
        console.log("[LiveHub] Connected");
      } catch (err) {
        console.error("[LiveHub] Connection failed:", err);
        this.scheduleReconnect();
      }
    }
  }

  async stop(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.connection && this.connection.state !== signalR.HubConnectionState.Disconnected) {
      await this.connection.stop();
      console.log("[LiveHub] Disconnected");
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      await this.start();
    }, 5000);
  }

  async joinSession(sessionId: string, userId?: string): Promise<void> {
    const conn = this.getConnection();
    if (conn.state === signalR.HubConnectionState.Connected) {
      await conn.invoke("JoinSession", sessionId, userId ?? null, null);
    }
  }

  async leaveSession(sessionId: string, userId?: string): Promise<void> {
    const conn = this.getConnection();
    if (conn.state === signalR.HubConnectionState.Connected) {
      await conn.invoke("LeaveSession", sessionId, userId ?? null, null);
    }
  }

  async sendChat(sessionId: string, userId: string, message: string): Promise<void> {
    const conn = this.getConnection();
    if (conn.state === signalR.HubConnectionState.Connected) {
      await conn.invoke("SendChat", sessionId, userId, message);
    }
  }

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

  onUserJoined(callback: (sessionId: string, userId: string | null, count: number) => void): () => void {
    const conn = this.getConnection();
    conn.on("UserJoined", callback);
    conn.on("userjoined", callback);
    return () => { conn.off("UserJoined", callback); conn.off("userjoined", callback); };
  }

  onUserLeft(callback: (sessionId: string, userId: string | null, count: number) => void): () => void {
    const conn = this.getConnection();
    conn.on("UserLeft", callback);
    conn.on("userleft", callback);
    return () => { conn.off("UserLeft", callback); conn.off("userleft", callback); };
  }

  onReceiveChat(callback: (chat: ChatMessage) => void): () => void {
    const conn = this.getConnection();
    conn.on("ReceiveChat", callback);
    conn.on("receivechat", callback);
    return () => { conn.off("ReceiveChat", callback); conn.off("receivechat", callback); };
  }

  onListenersUpdated(callback: (sessionId: string, count: number) => void): () => void {
    const conn = this.getConnection();
    conn.on("ListenersUpdated", callback);
    conn.on("listenersupdated", callback);
    return () => { conn.off("ListenersUpdated", callback); conn.off("listenersupdated", callback); };
  }

  offAll(): void {
    const conn = this.getConnection();
    conn.off("SessionStarted");
    conn.off("SessionEnded");
    conn.off("UserJoined");
    conn.off("UserLeft");
    conn.off("ReceiveChat");
    conn.off("ListenersUpdated");
    conn.off("sessionstarted");
    conn.off("sessionended");
    conn.off("userjoined");
    conn.off("userleft");
    conn.off("receivechat");
    conn.off("listenersupdated");
  }
}

export const liveHubService = new LiveHubService();
export default liveHubService;
