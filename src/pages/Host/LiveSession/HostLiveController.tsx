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
  Plus,
  X,
} from 'lucide-react';
import { showToast } from '../../../utils/toast';
import { useLiveSession } from "../../../context/LiveSessionContext";
import { liveSessionApiService } from "../../../services/liveSessionApiService";
import type { LiveSessionResult, SongRequestResult, StationNowPlayingResult, ListenerStatsResult, StationResult } from "../../../services/liveSessionApiService";
import liveHubService from "../../../services/liveHubService";
import './HostLiveController.css';

function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

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
  const [nowPlaying, setNowPlaying] = useState<StationNowPlayingResult | null>(null);
  const [listenerStats, setListenerStats] = useState<ListenerStatsResult | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ sessionName: '', description: '', stationId: '' });
  const [creating, setCreating] = useState(false);
  const [stations, setStations] = useState<StationResult[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const npPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load session
  useEffect(() => {
    if (!sessionId) return;
    loadSession();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [sessionId]);

  // Poll requests every 5s when live (backup) + register real-time handler (primary)
  useEffect(() => {
    if (!sessionId) return;

    // Real-time: instantly add new requests when they come in via SignalR
    const offCreated = liveHubService.onSongRequestCreated((req) => {
      if (req.sessionId !== sessionId) return;
      setRequests(prev => [{
        id: req.requestId,
        liveSessionId: req.sessionId,
        mediaFileId: req.mediaFileId,
        requestedByUserId: req.requestedByUserId,
        status: 'Pending',
        reviewedByUserId: null,
        requestedAt: req.createdAt,
        reviewedAt: null,
        message: req.message,
        rejectReason: null,
        songTitle: req.songTitle,
        songArtist: req.songArtist,
        songAlbum: null,
      }, ...prev]);
      showToast.info(`Yêu cầu mới: "${req.songTitle}" từ ${req.requestedByUserName ?? 'người dùng'}`);
    });

    // Polling: also poll as a fallback (every 5s when live)
    if (isLive && sessionId) {
      void loadRequests();
      pollRef.current = setInterval(() => { void loadRequests(); }, 5000);
    } else if (pollRef.current) {
      clearInterval(pollRef.current);
    }

    return () => {
      offCreated();
      if (pollRef.current) clearInterval(pollRef.current);
    };
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

  // Poll now-playing + listener stats every 10s when session is live
  useEffect(() => {
    if (!sessionId) return;
    const pollNowPlaying = async () => {
      try {
        const [np, stats] = await Promise.all([
          liveSessionApiService.getNowPlaying(sessionId),
          liveSessionApiService.getListenerStats(sessionId),
        ]);
        setNowPlaying(np);
        setListenerStats(stats);
      } catch { /* silent — polling fallback */ }
    };
    if (isLive) {
      void pollNowPlaying();
      npPollRef.current = setInterval(() => { void pollNowPlaying(); }, 10000);
    } else {
      if (npPollRef.current) { clearInterval(npPollRef.current); npPollRef.current = null; }
      if (!isPaused) { setNowPlaying(null); setListenerStats(null); }
    }
    return () => { if (npPollRef.current) { clearInterval(npPollRef.current); npPollRef.current = null; } };
  }, [isLive, isPaused, sessionId]);

  const loadRequests = async () => {
    if (!sessionId) return;
    setLoadingRequests(true);
    try {
      const data = await liveSessionApiService.getSongRequests(sessionId);
      setRequests(data);
    } catch (err) {
      console.error('[HostLiveController] loadRequests error:', err);
      showToast.error('Không thể tải yêu cầu nhạc');
      setRequests([]);
    } finally { setLoadingRequests(false); }
  };

  // Load stations for create modal
  useEffect(() => {
    if (!showCreateModal) return;
    liveSessionApiService.getStations().then(setStations).catch(() => setStations([]));
  }, [showCreateModal]);

  const handleCreateSession = async () => {
    if (!createForm.sessionName.trim()) { showToast.error('Vui lòng nhập tên phiên'); return; }
    if (!createForm.stationId) { showToast.error('Vui lòng chọn đài phát'); return; }
    setCreating(true);
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      await liveSessionApiService.createLiveSession({
        hostUserId: userInfo.id,
        stationId: createForm.stationId,
        sessionName: createForm.sessionName.trim(),
        description: createForm.description.trim() || undefined,
      });
      setShowCreateModal(false);
      setCreateForm({ sessionName: '', description: '', stationId: '' });
      showToast.success('Tạo phiên thành công!');
      navigate('/host/sessions');
    } catch {
      showToast.error('Không thể tạo phiên phát sóng');
    } finally { setCreating(false); }
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
      await liveSessionApiService.reviewSongRequest(id, { action: 'approve' });
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'Approved' } : r));
      showToast.success('Yêu cầu đã được chấp nhận');
    } catch (err) {
      console.error('[HostLiveController] Approve failed:', err);
      showToast.error('Không thể duyệt yêu cầu');
    }
  };

  const handleRejectRequest = async (id: string) => {
    try {
      await liveSessionApiService.reviewSongRequest(id, {
        action: 'reject',
        rejectReason: 'Host từ chối',
      });
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'Rejected' } : r));
      showToast.success('Yêu cầu đã bị từ chối');
    } catch (err) {
      console.error('[HostLiveController] Reject failed:', err);
      showToast.error('Không thể từ chối yêu cầu');
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
          <button
            className="host-lc-create-btn"
            onClick={() => setShowCreateModal(true)}
            title="Tạo phiên mới"
          >
            <Plus size={14} />
            Tạo phiên mới
          </button>
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="host-lc-layout">
        {/* ── Left: Session Info ── */}
        <div className="host-lc-panel host-lc-panel--left">
          {/* Now Playing Panel */}
          {isLive && nowPlaying?.currentTrack && (
            <div className="host-lc-panel-card">
              <h3 className="host-lc-panel-title">
                <Disc3 size={16} />
                Đang phát
              </h3>
              {nowPlaying.currentTrack.artUrl && (
                <img
                  src={nowPlaying.currentTrack.artUrl}
                  className="host-lc-np-art"
                  alt="album art"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
              <div className="host-lc-np-title">{nowPlaying.currentTrack.title || nowPlaying.currentTrack.text}</div>
              <div className="host-lc-np-artist">{nowPlaying.currentTrack.artist || '—'}</div>
              {nowPlaying.currentTrack.duration > 0 && (
                <div className="host-lc-np-elapsed">
                  {formatDuration(nowPlaying.currentTrack.elapsed)} / {formatDuration(nowPlaying.currentTrack.duration)}
                </div>
              )}
            </div>
          )}

          {/* Listener Stats */}
          {isLive && listenerStats && (
            <div className="host-lc-panel-card">
              <h3 className="host-lc-panel-title">
                <Users size={16} />
                Thống kê người nghe
              </h3>
              <div className="host-lc-stat-row">
                <span>Hiện tại</span>
                <strong>{listenerStats.currentListeners}</strong>
              </div>
              <div className="host-lc-stat-row">
                <span>Đỉnh</span>
                <strong>{listenerStats.peakListeners}</strong>
              </div>
              <div className="host-lc-stat-row">
                <span>Tổng</span>
                <strong>{listenerStats.totalListeners}</strong>
              </div>
            </div>
          )}

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
                {requests.filter(r => r.status === 'Pending').length > 0 && (
                  <span className="host-lc-request-badge">
                    {requests.filter(r => r.status === 'Pending').length}
                  </span>
                )}
              </h3>
              <button className="host-lc-refresh-btn" onClick={() => void loadRequests()} disabled={loadingRequests}>
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
                      {req.message && (
                        <span className="host-lc-request-message">"{req.message}"</span>
                      )}
                      <span className="host-lc-request-user">từ {req.requestedByUserId || 'Khách'}</span>
                    </div>
                    <div className="host-lc-request-actions">
                      <button
                        className="host-lc-action-btn host-lc-action-btn--approve"
                        onClick={() => void handleApproveRequest(req.id)}
                        title="Duyệt"
                      >
                        <CheckCircle size={18} />
                      </button>
                      <button
                        className="host-lc-action-btn host-lc-action-btn--reject"
                        onClick={() => void handleRejectRequest(req.id)}
                        title="Từ chối"
                      >
                        <Square size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

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

      {/* Create Session Modal */}
      {showCreateModal && (
        <div className="host-lc-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="host-lc-modal" onClick={(e) => e.stopPropagation()}>
            <div className="host-lc-modal-header">
              <h2>Tạo phiên phát sóng mới</h2>
              <button className="host-lc-modal-close" onClick={() => setShowCreateModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="host-lc-modal-body">
              <div className="host-lc-form-group">
                <label>Tên phiên *</label>
                <input
                  className="host-lc-form-input"
                  placeholder="VD: Ca live cuối tuần"
                  value={createForm.sessionName}
                  onChange={(e) => setCreateForm({ ...createForm, sessionName: e.target.value })}
                />
              </div>
              <div className="host-lc-form-group">
                <label>Đài phát *</label>
                <select
                  className="host-lc-form-input"
                  value={createForm.stationId}
                  onChange={(e) => setCreateForm({ ...createForm, stationId: e.target.value })}
                >
                  <option value="">— Chọn đài —</option>
                  {stations.map((st) => (
                    <option key={st.id} value={st.id}>{st.stationName}</option>
                  ))}
                </select>
              </div>
              <div className="host-lc-form-group">
                <label>Mô tả</label>
                <textarea
                  className="host-lc-form-input host-lc-form-textarea"
                  placeholder="Mô tả ngắn cho phiên phát sóng..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                />
              </div>
            </div>
            <div className="host-lc-modal-footer">
              <button className="host-lc-modal-cancel" onClick={() => setShowCreateModal(false)}>
                Hủy
              </button>
              <button
                className="host-lc-modal-submit"
                onClick={handleCreateSession}
                disabled={creating}
              >
                {creating ? <RefreshCw size={14} className="host-lc-spin" /> : null}
                {creating ? 'Đang tạo...' : 'Tạo phiên'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
