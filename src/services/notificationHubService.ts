/**
 * notificationHubService.ts
 *
 * Manages a persistent SignalR connection to the AccountContentService's
 * NotificationHub. Provides typed callbacks for:
 *  - ReceiveNotification  → personal notification (persist in DB, then pushed)
 *  - ReceiveBroadcastNotification → broadcast to all users (e.g. new schedule)
 */

import * as signalR from "@microsoft/signalr";

// ── Hub URL ─────────────────────────────────────────────────────────────────
// Points to AccountContentService NotificationHub (port 8004 by default)
const NOTIFICATION_HUB_URL =
  import.meta.env.VITE_NOTIFICATION_HUB_URL ??
  "http://localhost:8004/hubs/notifications";

// ── Payload types ───────────────────────────────────────────────────────────

export interface RealtimeNotification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: string;
  referenceId: string;
  isRead: boolean;
  createdAt: string;
}

export interface BroadcastNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  referenceId: string;
  isRead: boolean;
  createdAt: string;
}

// ── Service class ────────────────────────────────────────────────────────────

class NotificationHubService {
  private connection: signalR.HubConnection | null = null;
  private startPromise: Promise<void> | null = null;

  private buildConnection(token: string): signalR.HubConnection {
    return new signalR.HubConnectionBuilder()
      .withUrl(NOTIFICATION_HUB_URL, {
        accessTokenFactory: () => token,
        // Allow both WebSocket and LongPolling so Nginx negotiation works
        transport:
          signalR.HttpTransportType.WebSockets |
          signalR.HttpTransportType.LongPolling,
        skipNegotiation: false,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();
  }

  /** Start (or reuse) the connection. Must pass a valid JWT access token. */
  async start(token: string): Promise<void> {
    // If already connected, nothing to do
    if (
      this.connection &&
      this.connection.state === signalR.HubConnectionState.Connected
    ) {
      return;
    }

    // If a token changed or no connection yet, rebuild
    if (!this.connection) {
      this.connection = this.buildConnection(token);

      this.connection.onreconnecting(() => {
        console.log("[NotificationHub] Reconnecting...");
      });
      this.connection.onreconnected(() => {
        console.log("[NotificationHub] Reconnected");
      });
      this.connection.onclose((err) => {
        console.log("[NotificationHub] Connection closed", err);
        this.startPromise = null;
      });
    }

    if (this.startPromise) return this.startPromise;

    if (
      this.connection.state === signalR.HubConnectionState.Disconnected
    ) {
      this.startPromise = this.connection
        .start()
        .then(() => {
          console.log("[NotificationHub] Connected");
          this.startPromise = null;
        })
        .catch((err) => {
          console.error("[NotificationHub] Connection failed:", err);
          this.startPromise = null;
          throw err;
        });
      return this.startPromise;
    }
  }

  /** Gracefully stop the connection and clear it so next start() rebuilds. */
  async stop(): Promise<void> {
    if (
      this.connection &&
      this.connection.state !== signalR.HubConnectionState.Disconnected
    ) {
      await this.connection.stop();
    }
    this.connection = null;
    this.startPromise = null;
  }

  // ── Event subscriptions ────────────────────────────────────────────────────

  /**
   * Personal notification (stored in DB, pushed to specific user).
   * Used for: member requests song → host notified,
   *           host approves/rejects → member notified.
   */
  onReceiveNotification(
    callback: (notification: RealtimeNotification) => void
  ): () => void {
    if (!this.connection) return () => {};
    this.connection.on("ReceiveNotification", callback);
    return () => this.connection?.off("ReceiveNotification", callback);
  }

  /**
   * Broadcast notification (NOT stored per-user).
   * Used for: new broadcast schedule → all connected users notified.
   */
  onReceiveBroadcastNotification(
    callback: (notification: BroadcastNotification) => void
  ): () => void {
    if (!this.connection) return () => {};
    this.connection.on("ReceiveBroadcastNotification", callback);
    return () =>
      this.connection?.off("ReceiveBroadcastNotification", callback);
  }

  /** Remove all listeners (use on component unmount). */
  offAll(): void {
    this.connection?.off("ReceiveNotification");
    this.connection?.off("ReceiveBroadcastNotification");
    this.connection?.off("RemoveNotification");
  }

  /**
   * Remove a notification from UI real-time.
   */
  onRemoveNotification(
    callback: (data: { referenceId: string; type: string }) => void
  ): () => void {
    if (!this.connection) return () => {};
    this.connection.on("RemoveNotification", callback);
    return () => this.connection?.off("RemoveNotification", callback);
  }

  getState(): signalR.HubConnectionState {
    return this.connection?.state ?? signalR.HubConnectionState.Disconnected;
  }
}

export const notificationHubService = new NotificationHubService();
export default notificationHubService;
