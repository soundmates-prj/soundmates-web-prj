import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Radio, Users, Clock, Disc3, RefreshCw, Headphones } from "lucide-react";
import { liveSessionApiService } from "../../services/liveSessionApiService";
import type { LiveSessionResult } from "../../services/liveSessionApiService";
import "./LiveSessionsPage.css";

export function LiveSessionsPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<LiveSessionResult[]>([]);
  const [loading, setLoading] = useState(true);

  const loadActiveSessions = useCallback(async () => {
    try {
      const data = await liveSessionApiService.getActiveSessions();
      setSessions(data);
    } catch (err) {
      console.error("Failed to load active sessions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActiveSessions();
  }, [loadActiveSessions]);

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  };

  const handleJoin = (sessionId: string) => {
    navigate(`/live/${sessionId}`);
  };

  if (loading) {
    return (
      <div className="lsp-loading">
        <RefreshCw size={28} className="lsp-spin" />
        <p>Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="lsp-page">
      <div className="lsp-header">
        <h1>Phát sóng trực tiếp</h1>
        <p>Tham gia các phiên phát sóng đang diễn ra</p>
      </div>

      {sessions.length === 0 ? (
        <div className="lsp-empty">
          <div className="lsp-empty-icon">
            <Radio size={36} />
          </div>
          <h3>Chưa có phiên phát sóng nào</h3>
          <p>Hiện tại không có phiên phát sóng trực tiếp. Hãy quay lại sau nhé!</p>
        </div>
      ) : (
        <div className="lsp-grid">
          {sessions.map((session) => (
            <div
              className="lsp-card"
              key={session.id}
              onClick={() => handleJoin(session.id)}
            >
              <div className="lsp-card-thumb">
                {session.thumbnailUrl ? (
                  <img src={session.thumbnailUrl} alt={session.sessionName} />
                ) : (
                  <Disc3 size={48} className="lsp-thumb-icon" />
                )}
                <span className="lsp-live-badge">LIVE</span>
                <span className="lsp-listeners-badge">
                  <Users size={12} />
                  {session.listenersCount}
                </span>
                {session.genre && (
                  <span className="lsp-genre">{session.genre}</span>
                )}
              </div>

              <div className="lsp-card-body">
                <h3 className="lsp-card-name">{session.sessionName}</h3>
                {session.description && (
                  <p className="lsp-card-desc">{session.description}</p>
                )}

                <div className="lsp-card-footer">
                  <div className="lsp-card-meta">
                    <span className="lsp-meta">
                      <Radio size={12} />
                      {session.stationName || "Station"}
                    </span>
                    {session.startedAt && (
                      <span className="lsp-meta">
                        <Clock size={12} />
                        {formatTime(session.startedAt)}
                      </span>
                    )}
                  </div>
                  <button
                    className="lsp-join-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleJoin(session.id);
                    }}
                  >
                    <Headphones size={13} />
                    Tham gia
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default LiveSessionsPage;
