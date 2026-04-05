import { useState, useEffect } from 'react';
import { Music, Search, CheckCircle, XCircle, Clock, User, Calendar, RefreshCw } from 'lucide-react';
import { liveSessionApiService } from "../../../services/liveSessionApiService";
import type { SongRequestResult } from "../../../services/liveSessionApiService";
import { showSuccess, showError } from "../../../components/common/toastUtils";
import './MusicRequestsScreen.css';

type FilterStatus = 'All' | 'Pending' | 'Approved' | 'Rejected';

export function MusicRequestsScreen() {
  const [requests, setRequests] = useState<SongRequestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => { loadRequests(); }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      // Call with no sessionId to get ALL requests (Staff dashboard view)
      const data = await liveSessionApiService.getSongRequests();
      setRequests(data);
    } catch {
      showError("Lỗi", "Không thể tải yêu cầu nhạc");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await liveSessionApiService.reviewSongRequest(id, { action: "approve" });
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'Approved' } : r));
      showSuccess("Thành công", "Yêu cầu đã được duyệt");
    } catch {
      showError("Lỗi", "Không thể duyệt yêu cầu");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      await liveSessionApiService.reviewSongRequest(id, { action: "reject" });
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'Rejected' } : r));
      showSuccess("Thành công", "Yêu cầu đã bị từ chối");
    } catch {
      showError("Lỗi", "Không thể từ chối yêu cầu");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredRequests = requests.filter(req => {
    // FIX: use exact PascalCase to match API response ("Pending", "Approved", "Rejected")
    const matchFilter = filter === 'All' || req.status === filter;
    const matchSearch =
      !searchQuery.trim() ||
      (req.songTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (req.songArtist || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'Pending').length,
    approved: requests.filter(r => r.status === 'Approved').length,
    rejected: requests.filter(r => r.status === 'Rejected').length,
  };

  return (
    <div className="music-requests-screen">
      <div className="requests-header">
        <div>
          <h1 className="requests-title">Yêu cầu nhạc</h1>
          <p className="requests-subtitle">Duyệt và quản lý yêu cầu nhạc từ người dùng</p>
        </div>
        <button className="lm-btn lm-btn--outline" onClick={() => void loadRequests()} disabled={loading}>
          <RefreshCw size={14} />
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
            placeholder="Tìm theo tên bài hát hoặc nghệ sĩ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-tabs">
          <button className={`filter-tab ${filter === 'All' ? 'active' : ''}`} onClick={() => setFilter('All')}>Tất cả</button>
          <button className={`filter-tab ${filter === 'Pending' ? 'active' : ''}`} onClick={() => setFilter('Pending')}>Đang chờ ({stats.pending})</button>
          <button className={`filter-tab ${filter === 'Approved' ? 'active' : ''}`} onClick={() => setFilter('Approved')}>Đã duyệt ({stats.approved})</button>
          <button className={`filter-tab ${filter === 'Rejected' ? 'active' : ''}`} onClick={() => setFilter('Rejected')}>Từ chối ({stats.rejected})</button>
        </div>
      </div>

      {loading ? (
        <div className="lm-loading">
          <RefreshCw size={28} className="lm-spin" />
          <p>Đang tải yêu cầu nhạc...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="lm-empty">
          <Music size={40} />
          <p>Không có yêu cầu nào</p>
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
                <th>Tin nhắn / Lý do</th>
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
                      <span className="song-title">{request.songTitle || '—'}</span>
                    </div>
                  </td>
                  <td>{request.songArtist || '—'}</td>
                  <td>
                    <div className="user-cell">
                      <User size={14} />
                      {request.requestedByUserId || '—'}
                    </div>
                  </td>
                  <td>
                    <div className="date-cell">
                      <Calendar size={14} />
                      {request.requestedAt ? new Date(request.requestedAt).toLocaleDateString('vi-VN') : '—'}
                    </div>
                  </td>
                  <td>
                    {request.message && (
                      <div className="req-message-cell" title={request.message}>
                        "{request.message}"
                      </div>
                    )}
                    {request.rejectReason && (
                      <div className="req-reject-cell">{request.rejectReason}</div>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge ${request.status?.toLowerCase()}`}>
                      {request.status === 'Approved' && <CheckCircle size={14} />}
                      {request.status === 'Rejected' && <XCircle size={14} />}
                      {request.status === 'Pending' && <Clock size={14} />}
                      {request.status === 'Approved' ? 'Đã duyệt' : request.status === 'Rejected' ? 'Từ chối' : 'Đang chờ'}
                    </span>
                  </td>
                  <td>
                    {request.status === 'Pending' && (
                      <div className="action-buttons">
                        <button
                          className="action-btn approve"
                          disabled={actionLoading === request.id}
                          onClick={() => handleApprove(request.id)}
                        >
                          <CheckCircle size={14} />
                          Duyệt
                        </button>
                        <button
                          className="action-btn reject"
                          disabled={actionLoading === request.id}
                          onClick={() => handleReject(request.id)}
                        >
                          <XCircle size={14} />
                          Từ chối
                        </button>
                      </div>
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
