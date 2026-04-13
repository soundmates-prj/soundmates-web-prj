import { useState, useEffect, useCallback, useRef } from 'react';
import { Music, Search, CheckCircle, XCircle, Clock, User, Calendar, RefreshCw } from 'lucide-react';
import { liveSessionApiService } from '../../../services/liveSessionApiService';
import type { SongRequestResult, LiveSessionResult } from '../../../services/liveSessionApiService';
import { showToast } from '../../../utils/toast';
import { RejectReasonModal } from '../../../components/common/RejectReasonModal';
import './HostMusicRequestsScreen.css';

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

function getCurrentUserId(): string | null {
  try {
    const raw = localStorage.getItem("userInfo");
    if (raw) return JSON.parse(raw).id || JSON.parse(raw).userId || null;
  } catch { /* ignore */ }
  return null;
}

function getStatusLabel(status: string) {
  switch (status?.toLowerCase()) {
    case 'approved': return 'Đã duyệt';
    case 'rejected': return 'Từ chối';
    case 'pending': return 'Đang chờ';
    default: return status;
  }
}

export function HostMusicRequestsScreen() {
  const [allRequests, setAllRequests] = useState<SongRequestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  // Reject modal state
  const [rejectModal, setRejectModal] = useState<{ isOpen: boolean; requestId: string; songTitle: string }>({
    isOpen: false,
    requestId: '',
    songTitle: '',
  });

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      // Get sessions belonging to THIS host only
      const currentUserId = getCurrentUserId();
      const sessionsRes = await liveSessionApiService.getLiveSessions({ pageSize: 50, pageNumber: 1 });
      const allSessions: LiveSessionResult[] = sessionsRes.items;
      // Filter to only this host's sessions
      const mySessions = currentUserId
        ? allSessions.filter(s => s.userId === currentUserId)
        : allSessions;

      if (mySessions.length === 0) {
        setAllRequests([]);
        return;
      }

      // FIX: Parallel fetch instead of sequential N+1
      const results = await Promise.allSettled(
        mySessions.map(session => liveSessionApiService.getSongRequests(session.id))
      );

      const requestsArr: SongRequestResult[] = [];
      for (const result of results) {
        if (result.status === 'fulfilled') requestsArr.push(...result.value);
      }

      setAllRequests(requestsArr);
    } catch {
      setAllRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchRequests(); }, [fetchRequests]);

  // Stats
  const stats = {
    total: allRequests.length,
    pending: allRequests.filter(r => r.status?.toLowerCase() === 'pending').length,
    approved: allRequests.filter(r => r.status?.toLowerCase() === 'approved').length,
    rejected: allRequests.filter(r => r.status?.toLowerCase() === 'rejected').length,
  };

  // Filtered
  const filteredRequests = allRequests.filter(req => {
    const statusMatch = filter === 'all' || req.status?.toLowerCase() === filter;
    const searchLower = searchQuery.toLowerCase();
    const searchMatch =
      !searchQuery ||
      (req.songTitle || '').toLowerCase().includes(searchLower) ||
      (req.songArtist || '').toLowerCase().includes(searchLower) ||
      (req.requestedByUserId || '').toLowerCase().includes(searchLower);
    return statusMatch && searchMatch;
  });

  const handleApprove = async (id: string) => {
    try {
      await liveSessionApiService.reviewSongRequest(id, { action: 'approve' });
      setAllRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'Approved' } : r));
      showToast.success('Yêu cầu bài hát đã được chấp nhận');
    } catch {
      showToast.error('Không thể duyệt yêu cầu. Vui lòng thử lại.');
    }
  };

  const openRejectModal = (id: string, title: string) => {
    setRejectModal({ isOpen: true, requestId: id, songTitle: title });
  };

  const handleRejectConfirm = async (reason: string) => {
    try {
      await liveSessionApiService.reviewSongRequest(rejectModal.requestId, {
        action: 'reject',
        rejectReason: reason,
      });
      setAllRequests(prev => prev.map(r => r.id === rejectModal.requestId ? { ...r, status: 'Rejected', rejectReason: reason } : r));
      showToast.success('Yêu cầu đã bị từ chối');
    } catch {
      showToast.error('Không thể từ chối yêu cầu. Vui lòng thử lại.');
    } finally {
      setRejectModal(prev => ({ ...prev, isOpen: false }));
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return dateStr; }
  };

  return (
    <div className="host-mr-page">
      <div className="requests-header">
        <div>
          <h1 className="requests-title">Yêu cầu nhạc</h1>
          <p className="requests-subtitle">Xem và duyệt yêu cầu nhạc từ người nghe trong phiên của bạn</p>
        </div>
        <button className="refresh-btn" onClick={() => void fetchRequests()} disabled={loading}>
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
          Làm mới
        </button>
      </div>

      <div className="requests-stats">
        <div className="stat-item">
          <Music size={20} />
          <div>
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Tổng yêu cầu</span>
          </div>
        </div>
        <div className="stat-item pending">
          <Clock size={20} />
          <div>
            <span className="stat-value">{stats.pending}</span>
            <span className="stat-label">Đang chờ</span>
          </div>
        </div>
        <div className="stat-item approved">
          <CheckCircle size={20} />
          <div>
            <span className="stat-value">{stats.approved}</span>
            <span className="stat-label">Đã duyệt</span>
          </div>
        </div>
        <div className="stat-item rejected">
          <XCircle size={20} />
          <div>
            <span className="stat-value">{stats.rejected}</span>
            <span className="stat-label">Từ chối</span>
          </div>
        </div>
      </div>

      <div className="requests-filters">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Tìm theo tên bài hát, nghệ sĩ hoặc người yêu cầu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-tabs">
          {(['all', 'pending', 'approved', 'rejected'] as FilterStatus[]).map(f => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'Tất cả' : f === 'pending' ? 'Đang chờ' : f === 'approved' ? 'Đã duyệt' : 'Từ chối'}
              {f === 'pending' && stats.pending > 0 && <span className="filter-count">{stats.pending}</span>}
            </button>
          ))}
        </div>
      </div>

      {loading && allRequests.length === 0 ? (
        <div className="requests-loading">
          <RefreshCw size={32} className="spin" />
          <p>Đang tải yêu cầu nhạc...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="requests-empty">
          <Music size={48} />
          <h3>Không có yêu cầu nào</h3>
          <p>
            {filter === 'all'
              ? 'Chưa có yêu cầu nhạc nào được gửi đến các phiên của bạn.'
              : `Không có yêu cầu nào ở trạng thái "${getStatusLabel(filter)}".`}
          </p>
        </div>
      ) : (
        <div className="requests-table-card">
          <table className="requests-table">
            <thead>
              <tr>
                <th>Bài hát</th>
                <th>Nghệ sĩ</th>
                <th>Người yêu cầu</th>
                <th>Ngày</th>
                <th>Lời nhắn member</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request) => (
                <tr key={request.id}>
                  <td>
                    <div className="song-cell">
                      <div className="song-icon"><Music size={16} /></div>
                      <div className="song-info">
                        <span className="song-title">{request.songTitle}</span>
                        {request.songAlbum && <span className="song-album">{request.songAlbum}</span>}
                      </div>
                    </div>
                  </td>
                  <td>{request.songArtist || '—'}</td>
                  <td>
                    <div className="user-cell">
                      <User size={14} />
                      {request.requestedByUserId || 'Khách'}
                    </div>
                  </td>
                  <td>
                    <div className="date-cell">
                      <Calendar size={14} />
                      {formatDate(request.requestedAt)}
                    </div>
                  </td>
                  <td>
                    {request.message ? (
                      <div className="request-message" title={request.message}>{request.message}</div>
                    ) : (
                      <span className="request-message-empty">Không có lời nhắn</span>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge ${request.status?.toLowerCase()}`}>
                      {request.status?.toLowerCase() === 'approved' && <CheckCircle size={14} />}
                      {request.status?.toLowerCase() === 'rejected' && <XCircle size={14} />}
                      {request.status?.toLowerCase() === 'pending' && <Clock size={14} />}
                      {getStatusLabel(request.status || '')}
                    </span>
                  </td>
                  <td>
                    {request.status?.toLowerCase() === 'pending' && (
                      <div className="action-buttons">
                        <button
                          className="action-btn approve"
                          onClick={() => void handleApprove(request.id)}
                        >
                          <CheckCircle size={16} />
                          Duyệt
                        </button>
                        <button
                          className="action-btn reject"
                          onClick={() => openRejectModal(request.id, request.songTitle)}
                        >
                          <XCircle size={16} />
                          Từ chối
                        </button>
                      </div>
                    )}
                    {request.status?.toLowerCase() === 'rejected' && request.rejectReason && (
                      <span className="reject-reason">Lý do từ chối: {request.rejectReason}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject modal — replaces browser prompt() */}
      <RejectReasonModal
        isOpen={rejectModal.isOpen}
        songTitle={rejectModal.songTitle}
        onConfirm={handleRejectConfirm}
        onCancel={() => setRejectModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
