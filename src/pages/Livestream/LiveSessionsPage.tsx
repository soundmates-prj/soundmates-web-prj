import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Radio, Users, Clock, Disc3, RefreshCw, Headphones,
  Music2, Mic2, Waves, Zap, Star, Flame,
} from "lucide-react";
import { liveSessionApiService } from "../../services/liveSessionApiService";
import type { LiveSessionResult } from "../../services/liveSessionApiService";
import { getLiveListenersCount } from "../../utils/listenerUtils";
import "./LiveSessionsPage.css";

// ── Fallback thumbnail themes (cycling by index) ──────────────────────────────
const LIVE_THEMES = [
  {
    gradient: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
    Icon: Disc3,
    pattern: "radial-gradient(circle at 80% 20%, rgba(255,255,255,.12) 0%, transparent 50%)",
  },
  {
    gradient: "linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)",
    Icon: Mic2,
    pattern: "radial-gradient(circle at 20% 80%, rgba(255,255,255,.14) 0%, transparent 50%)",
  },
  {
    gradient: "linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)",
    Icon: Waves,
    pattern: "radial-gradient(circle at 70% 70%, rgba(255,255,255,.10) 0%, transparent 55%)",
  },
  {
    gradient: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
    Icon: Flame,
    pattern: "radial-gradient(circle at 30% 30%, rgba(255,255,255,.13) 0%, transparent 50%)",
  },
  {
    gradient: "linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)",
    Icon: Star,
    pattern: "radial-gradient(circle at 60% 10%, rgba(255,255,255,.15) 0%, transparent 50%)",
  },
  {
    gradient: "linear-gradient(135deg, #06b6d4 0%, #10b981 100%)",
    Icon: Music2,
    pattern: "radial-gradient(circle at 10% 60%, rgba(255,255,255,.12) 0%, transparent 50%)",
  },
  {
    gradient: "linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%)",
    Icon: Zap,
    pattern: "radial-gradient(circle at 80% 80%, rgba(255,255,255,.10) 0%, transparent 55%)",
  },
];

export function LiveSessionsPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<LiveSessionResult[]>([]);
  const [loading, setLoading] = useState(true);

  const loadActiveSessions = useCallback(async () => {
    setLoading(true);
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

  return (
    <div className="lsp-page">
      <div className="lsp-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Phát sóng trực tiếp</h1>
          <p>Tham gia các phiên phát sóng đang diễn ra</p>
        </div>
        <button 
          onClick={loadActiveSessions} 
          className="lsp-refresh-btn"
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? "lsp-spin" : ""} />
          Làm mới
        </button>
      </div>

      {loading ? (
        <div className="lsp-loading">
          <RefreshCw size={28} className="lsp-spin" />
          <p>Đang tải...</p>
        </div>
      ) : sessions.length === 0 ? (
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
              {(() => {
                const theme = LIVE_THEMES[sessions.indexOf(session) % LIVE_THEMES.length];
                const ThemeIcon = theme.Icon;
                return (
                  <div
                    className="lsp-card-thumb"
                    style={!session.thumbnailUrl ? {
                      background: theme.gradient,
                    } : undefined}
                  >
                    {session.thumbnailUrl ? (
                      <img src={session.thumbnailUrl} alt={session.sessionName} />
                    ) : (
                      <>
                        {/* subtle radial highlight */}
                        <div className="lsp-thumb-pattern" style={{ background: theme.pattern }} />
                        {/* decorative rings */}
                        <div className="lsp-thumb-ring lsp-thumb-ring--1" />
                        <div className="lsp-thumb-ring lsp-thumb-ring--2" />
                        <ThemeIcon size={44} className="lsp-thumb-icon" />
                      </>
                    )}
                    <span className="lsp-live-badge">LIVE</span>
                    <span className="lsp-listeners-badge">
                      <Users size={12} />
                      {getLiveListenersCount(session, session.nowPlaying)}
                    </span>
                    {session.genre && (
                      <span className="lsp-genre">{session.genre}</span>
                    )}
                  </div>
                );
              })()}

              <div className="lsp-card-body">
                <h3 className="lsp-card-name">{session.sessionName}</h3>
                {session.description ? (
                  <p className="lsp-card-desc">{session.description}</p>
                ) : <></>}

                <div className="lsp-card-footer">
                  <div className="lsp-card-meta">
                    <span className="lsp-meta" title={session.stationName || "Station"}>
                      <Radio size={12} />
                      <span className="lsp-meta-text">{session.stationName || "Station"}</span>
                    </span>
                    {session.startedAt && (
                      <span className="lsp-meta" title={formatTime(session.startedAt)}>
                        <Clock size={12} />
                        <span className="lsp-meta-text">{formatTime(session.startedAt)}</span>
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
