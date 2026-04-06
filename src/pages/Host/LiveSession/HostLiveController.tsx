import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Play,
  Pause,
  Square,
  Users,
  MessageSquare,
  Music,
  Send,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Disc3,
} from 'lucide-react';
import { showToast } from '../../../utils/toast';
import { useLiveSession } from "../../../context/LiveSessionContext";
import { liveSessionApiService } from "../../../services/liveSessionApiService";
import type { LiveSessionResult, SongRequestResult } from "../../../services/liveSessionApiService";
import './HostLiveController.css';

export function HostLiveController() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { session, isLive, isPaused, listeners, chatMessages, isConnected,
    startSession, pauseSession, resumeSession, stopSession, leaveSession, sendChat } = useLiveSession();

  const [sessionData, setSessionData] = useState<LiveSessionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [requests, setRequests] = useState<SongRequestResult[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load session
  useEffect(() => {
    if (!sessionId) return;
    loadSession();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [sessionId]);

  // Poll requests every 5s when live
  useEffect(() => {
    if (isLive && sessionId) {
      loadRequests();
      pollRef.current = setInterval(loadRequests, 5000);
    } else if (pollRef.current) {
      clearInterval(pollRef.current);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [isLive, sessionId]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const loadSession = async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const session = await liveSessionApiService.getLiveSession(sessionId);
      setSessionData(session);
      // Guard: if session already ended, show error
      if (session.status?.toLowerCase() === 'ended') {
        showToast.error('Phiên đã kết thúc — Phiên này đã được kết thúc trước đó.');
      }
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 404) {
        showToast.error('Không tìm thấy phiên — Phiên phát sóng không tồn tại.');
      } else {
        showToast.error('Lỗi — Không thể tải thông tin phiên phát sóng.');
      }
      console.error('[HostLiveController] loadSession error:', err);
    } finally { setLoading(false); }
  };

  const loadRequests = async () => {
    if (!sessionId) return;
    setLoadingRequests(true);
    try {
      const data = await liveSessionApiService.getSongRequests(sessionId);
      setRequests(data);
    } catch {
      setRequests([]);
    } finally { setLoadingRequests(false); }
  };

  const handleStart = async () => {
    if (!sessionId) return;
    try {
      await startSession(sessionId);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 409) {
        const msg = err?.response?.data?.message || '';
        if (msg.includes('already active') || msg.includes('already started')) {
          showToast.error('Phiên đã được bắt đầu — Phiên này đã đang chạy. Vui lòng làm mới trang.');
        } else if (msg.includes('ended')) {
          showToast.error('Phiên đã kết thúc — Không thể bắt đầu phiên đã kết thúc.');
        } else if (msg.includes('cancelled')) {
          showToast.error('Phiên đã bị hủy — Không thể bắt đầu phiên đã bị hủy.');
        } else {
          showToast.error('Không thể bắt đầu — ' + (msg || 'Trạng thái phiên không hợp lệ để bắt đầu.'));
        }
      } else {
        showToast.error('Lỗi — Không thể bắt đầu phiên phát sóng.');
      }
    }
  };

  const handlePause = async () => {
    if (!sessionId) return;
    await pauseSession(sessionId);
  };

  const handleResume = async () => {
    if (!sessionId) return;
    await resumeSession(sessionId);
  };

  const handleStop = async () => {
    if (!sessionId) return;
    const confirm = window.confirm('Bạn có chắc muốn kết thúc phiên phát sóng?');
    if (!confirm) return;
    await stopSession(sessionId);
    navigate('/host/sessions');
  };

  const handleSendChat = () => {
    if (!sessionId || !chatInput.trim()) return;
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    sendChat(sessionId, userInfo.id, chatInput.trim());
    setChatInput('');
  };

  const handleApproveRequest = async (id: string) => {
    try {
      await liveSessionApiService.reviewSongRequest(id, {
        action: 'approve',
      });
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'Approved' } : r));
    } catch (err) {
      console.error('[HostLiveController] Approve request failed:', err);
    }
  };

  const handleRejectRequest = async (id: string) => {
    try {
      await liveSessionApiService.reviewSongRequest(id, {
        action: 'reject',
        rejectReason: 'Host từ chối',
      });
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'Rejected' } : r));
    } catch (err) {
      console.error('[HostLiveController] Reject request failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="host-lc-loading">
        <RefreshCw size={32} className="host-lc-spin" />
        <p>Đang tải phiên phát sóng...</p>
      </div>
    );
  }

  const s = sessionData;

  return (
    <div className="host-lc-page">
      {/* Header */}
      <div className="host-lc-header">
        <div className="host-lc-header-left">
          <button className="host-lc-back-btn" onClick={() => navigate('/host/sessions')}>
            ← Quay lại
          </button>
          <div>
            <h1 className="host-lc-title">{s?.sessionName || 'Phiên phát sóng'}</h1>
            <p className="host-lc-subtitle">{s?.stationName || '—'} • {s?.description || ''}</p>
          </div>
        </div>
        <div className="host-lc-status-pills">
          <span className={`host-lc-status ${isLive ? 'live' : isPaused ? 'paused' : 'idle'}`}>
            {isLive ? <span className="live-dot" /> : null}
            {isLive ? 'LIVE' : isPaused ? 'TẠM DỪNG' : 'CHƯA BẮT ĐẦU'}
          </span>
          {!isConnected && (
            <span className="host-lc-status offline">
              <AlertCircle size={12} />
              Offline
            </span>
          )}
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="host-lc-layout">
        {/* ── Left: Session Info ── */}
        <div className="host-lc-panel host-lc-panel--left">
          <div className="host-lc-panel-card">
            <h3 className="host-lc-panel-title">Thông tin phiên</h3>

            <div className="host-lc-stat">
              <Users size={18} />
              <div>
                <span className="host-lc-stat-label">Người nghe</span>
                <span className="host-lc-stat-value">{listeners}</span>
              </div>
            </div>

            <div className="host-lc-stat">
              <Disc3 size={18} />
              <div>
                <span className="host-lc-stat-label">Đài phát</span>
                <span className="host-lc-stat-value">{s?.stationName || '—'}</span>
              </div>
            </div>

            <div className="host-lc-stat">
              <Clock size={18} />
              <div>
                <span className="host-lc-stat-label">Bắt đầu lúc</span>
                <span className="host-lc-stat-value">
                  {s?.startedAt ? new Date(s.startedAt).toLocaleTimeString('vi-VN') : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="host-lc-panel-card">
            <h3 className="host-lc-panel-title">Điều khiển</h3>
            <div className="host-lc-controls">
              {!isLive && !isPaused && (
                <button className="host-lc-ctrl-btn host-lc-ctrl-btn--start" onClick={handleStart}>
                  <Play size={20} />
                  Bắt đầu
                </button>
              )}
              {isLive && !isPaused && (
                <button className="host-lc-ctrl-btn host-lc-ctrl-btn--pause" onClick={handlePause}>
                  <Pause size={20} />
                  Tạm dừng
                </button>
              )}
              {isPaused && (
                <button className="host-lc-ctrl-btn host-lc-ctrl-btn--resume" onClick={handleResume}>
                  <Play size={20} />
                  Tiếp tục
                </button>
              )}
              {(isLive || isPaused) && (
                <button className="host-lc-ctrl-btn host-lc-ctrl-btn--stop" onClick={handleStop}>
                  <Square size={20} />
                  Kết thúc
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Center: Request Queue ── */}
        <div className="host-lc-panel host-lc-panel--center">
          <div className="host-lc-panel-card host-lc-panel-card--fill">
            <div className="host-lc-section-header">
              <h3 className="host-lc-panel-title">
                <Music size={18} />
                Yêu cầu nhạc
              </h3>
              <button className="host-lc-refresh-btn" onClick={loadRequests} disabled={loadingRequests}>
                <RefreshCw size={14} className={loadingRequests ? 'host-lc-spin' : ''} />
              </button>
            </div>

            <div className="host-lc-request-list">
              {requests.filter(r => r.status === 'Pending').length === 0 ? (
                <div className="host-lc-empty-queue">
                  <Music size={32} />
                  <p>Không có yêu cầu nào đang chờ</p>
                </div>
              ) : (
                requests.filter(r => r.status === 'Pending').map(req => (
                  <div key={req.id} className="host-lc-request-item">
                    <div className="host-lc-request-info">
                      <span className="host-lc-request-title">{req.songTitle}</span>
                      <span className="host-lc-request-artist">{req.songArtist || '—'}</span>
                      <span className="host-lc-request-user">từ {req.requestedByUserId || 'Khách'}</span>
                    </div>
                    <div className="host-lc-request-actions">
                      <button
                        className="host-lc-action-btn host-lc-action-btn--approve"
                        onClick={() => handleApproveRequest(req.id)}
                        title="Duyệt"
                      >
                        <CheckCircle size={18} />
                      </button>
                      <button
                        className="host-lc-action-btn host-lc-action-btn--reject"
                        onClick={() => handleRejectRequest(req.id)}
                        title="Từ chối"
                      >
                        <Square size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Approved queue */}
            {requests.filter(r => r.status === 'Approved').length > 0 && (
              <div className="host-lc-approved-section">
                <h4 className="host-lc-subtitle-label">Đã duyệt</h4>
                {requests.filter(r => r.status === 'Approved').map(req => (
                  <div key={req.id} className="host-lc-request-item host-lc-request-item--approved">
                    <div className="host-lc-request-info">
                      <span className="host-lc-request-title">{req.songTitle}</span>
                      <span className="host-lc-request-artist">{req.songArtist || '—'}</span>
                    </div>
                    <CheckCircle size={16} className="host-lc-approved-icon" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Chat ── */}
        <div className="host-lc-panel host-lc-panel--right">
          <div className="host-lc-panel-card host-lc-panel-card--fill">
            <h3 className="host-lc-panel-title">
              <MessageSquare size={18} />
              Chat
            </h3>

            <div className="host-lc-chat-messages">
              {chatMessages.length === 0 ? (
                <div className="host-lc-empty-chat">
                  <MessageSquare size={28} />
                  <p>Tin nhắn chat sẽ hiển thị ở đây khi phiên đang live</p>
                </div>
              ) : (
                chatMessages.map((msg, idx) => (
                  <div key={idx} className="host-lc-chat-msg">
                    <span className="host-lc-chat-user">{msg.userId}</span>
                    <span className="host-lc-chat-text">{msg.message}</span>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {isLive && (
              <div className="host-lc-chat-input-row">
                <input
                  className="host-lc-chat-input"
                  type="text"
                  placeholder="Nhập tin nhắn..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSendChat(); }}
                />
                <button className="host-lc-chat-send" onClick={handleSendChat} disabled={!chatInput.trim()}>
                  <Send size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
