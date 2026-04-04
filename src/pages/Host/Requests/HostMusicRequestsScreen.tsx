import { useState, useEffect, useCallback } from 'react';
import { Music, Search, CheckCircle, XCircle, Clock, User, Calendar, RefreshCw } from 'lucide-react';
import { liveSessionApiService } from '../../../services/liveSessionApiService';
import type { SongRequestResult, LiveSessionResult } from '../../../services/liveSessionApiService';
import { showToast } from '../../../utils/toast';
import './HostMusicRequestsScreen.css';

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

export function HostMusicRequestsScreen() {
  const [allRequests, setAllRequests] = useState<SongRequestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      // Get all live sessions first
      const sessionsRes = await liveSessionApiService.getLiveSessions({ pageSize: 50, pageNumber: 1 });
      const sessions: LiveSessionResult[] = sessionsRes.items;

      // Fetch song requests for each session
      const requestsArr: SongRequestResult[] = [];
      for (const session of sessions) {
        try {
          const reqs = await liveSessionApiService.getSongRequests(session.id);
          requestsArr.push(...reqs);
        } catch {
          // Session might have no requests — skip
        }
      }

      setAllRequests(requestsArr);
    } catch {
      setAllRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

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
      setAllRequests(prev =>
        prev.map(r => r.id === id ? { ...r, status: 'Approved' } : r)
      );
      showToast.success('Đã duyệt — Yêu cầu bài hát đã được chấp nhận');
    } catch {
      showToast.error('Lỗi — Không thể duyệt yêu cầu. Vui lòng thử lại.');
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Lý do từ chối (tùy chọn):') || 'Host từ chối';
    try {
      await liveSessionApiService.reviewSongRequest(id, {
        action: 'reject',
        rejectReason: reason,
      });
      setAllRequests(prev =>
        prev.map(r => r.id === id ? { ...r, status: 'Rejected' } : r)
      );
      showToast.success('Đã từ chối — Yêu cầu đã bị từ chối');
    } catch {
      showToast.error('Lỗi — Không thể từ chối yêu cầu. Vui lòng thử lại.');
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'Đã duyệt';
      case 'rejected': return 'Từ chối';
      case 'pending': return 'Đang chờ';
      default: return status;
    }
  };

  return (
    <div className="host-mr-page">
      <div className="requests-header">
        <div>
          <h1 className="requests-title">Yêu cầu nhạc</h1>
          <p className="requests-subtitle">Xem và duyệt yêu cầu nhạc từ người nghe trong phiên của bạn</p>
        </div>
        <button
          className="refresh-btn"
          onClick={() => void fetchRequests()}
          disabled={loading}
        >
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
            <span className="stat-label">�ang chờ</span>
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
                        {request.songAlbum && (
                          <span className="song-album">{request.songAlbum}</span>
                        )}
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
                    <span className={`status-badge ${request.status?.toLowerCase()}`}>
                      {request.status?.toLowerCase() === 'approved' && <CheckCircle size={14} />}
                      {request.status?.toLowerCase() === 'rejected' && <XCircle size={14} />}
                      {request.status?.toLowerCase() === 'pending' && <Clock size={14} />}
                      {getStatusLabel(request.status || '')}
                    </span>
                    {request.message && (
                      <div className="request-message">"{request.message}"</div>
                    )}
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
                          onClick={() => void handleReject(request.id)}
                        >
                          <XCircle size={16} />
                          Từ chối
                        </button>
                      </div>
                    )}
                    {request.status?.toLowerCase() === 'rejected' && request.rejectReason && (
                      <span className="reject-reason">Lý do: {request.rejectReason}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
