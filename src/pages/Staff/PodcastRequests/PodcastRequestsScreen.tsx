import { useState, useEffect, useCallback } from 'react';
import { Mic, Search, CheckCircle, XCircle, Clock, User, Play, RefreshCw, X } from 'lucide-react';
import { showSuccess, showError } from '../../../components/common/toastUtils';
import { liveSessionApiService, type PodcastRequestResult } from '../../../services/liveSessionApiService';
import './PodcastRequestsScreen.css';

type FilterTab = 'all' | 'pending' | 'approved' | 'rejected';

export function PodcastRequestsScreen() {
  const [requests, setRequests] = useState<PodcastRequestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<PodcastRequestResult | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params: { status?: string; search?: string } = {};
      if (filter !== 'all') params.status = filter;
      if (searchQuery.trim()) params.search = searchQuery;
      const data = await liveSessionApiService.getPodcastRequests(params);
      setRequests(data);
    } catch (err: any) {
      showError('Lỗi', err?.response?.data?.message || 'Không thể tải yêu cầu podcast');
    } finally {
      setLoading(false);
    }
  }, [filter, searchQuery]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'Pending').length,
    approved: requests.filter(r => r.status === 'Approved').length,
    rejected: requests.filter(r => r.status === 'Rejected').length,
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const updated = await liveSessionApiService.reviewPodcastRequest(id, { action: 'approve' });
      setRequests(prev => prev.map(r => r.id === id ? updated : r));
      if (selectedRequest?.id === id) setSelectedRequest(updated);
      showSuccess('Thành công', 'Yêu cầu podcast đã được duyệt');
    } catch (err: any) {
      showError('Lỗi', err?.response?.data?.message || 'Không thể duyệt yêu cầu');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Lý do từ chối (bắt buộc):');
    if (!reason?.trim()) return;
    setActionLoading(id);
    try {
      const updated = await liveSessionApiService.reviewPodcastRequest(id, {
        action: 'reject',
        rejectReason: reason.trim(),
      });
      setRequests(prev => prev.map(r => r.id === id ? updated : r));
      if (selectedRequest?.id === id) setSelectedRequest(updated);
      showSuccess('Thành công', 'Yêu cầu podcast đã bị từ chối');
    } catch (err: any) {
      showError('Lỗi', err?.response?.data?.message || 'Không thể từ chối yêu cầu');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'Approved': return 'Đã duyệt';
      case 'Rejected': return 'Từ chối';
      case 'Pending': return 'Đang chờ';
      case 'Cancelled': return 'Đã hủy';
      case 'Played': return 'Đã phát';
      default: return status;
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'Approved': return <CheckCircle size={14} />;
      case 'Rejected': return <XCircle size={14} />;
      default: return <Clock size={14} />;
    }
  };

  return (
    <div className="podcast-requests-screen">
      <div className="requests-header">
        <div>
          <h1 className="requests-title">Yêu cầu Podcast</h1>
          <p className="requests-subtitle">Duyệt và quản lý yêu cầu podcast từ người dùng</p>
        </div>
        <button className="lm-btn lm-btn--outline" onClick={fetchRequests} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          Làm mới
        </button>
      </div>

      <div className="requests-stats">
        <div className="stat-item">
          <Mic size={20} />
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
            placeholder="Tìm theo tiêu đề podcast hoặc tên giọng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-tabs">
          <button className={`filter-tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Tất cả</button>
          <button className={`filter-tab ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>Đang chờ ({stats.pending})</button>
          <button className={`filter-tab ${filter === 'approved' ? 'active' : ''}`} onClick={() => setFilter('approved')}>Đã duyệt ({stats.approved})</button>
          <button className={`filter-tab ${filter === 'rejected' ? 'active' : ''}`} onClick={() => setFilter('rejected')}>Từ chối ({stats.rejected})</button>
        </div>
      </div>

      {loading ? (
        <div className="requests-loading">
          <div className="spinner" />
          <span>Đang tải yêu cầu podcast...</span>
        </div>
      ) : requests.length === 0 ? (
        <div className="requests-empty">
          <Mic size={48} />
          <p>Không có yêu cầu podcast nào</p>
        </div>
      ) : (
        <div className="podcast-grid">
          {requests.map((request) => (
            <div key={request.id} className="podcast-card">
              <div className="podcast-card-header">
                <div className="podcast-icon"><Mic size={24} /></div>
                <span className={`status-badge ${request.status.toLowerCase()}`}>
                  {statusIcon(request.status)}
                  {statusLabel(request.status)}
                </span>
              </div>

              <h3 className="podcast-title">{request.title}</h3>
              {request.description && (
                <p className="podcast-description">{request.description}</p>
              )}

              <div className="podcast-meta">
                <div className="meta-item">
                  <User size={14} />
                  <span>{request.authorInfo?.name || request.requestedByUsername || request.requestedByUserId}</span>
                </div>
              </div>

              {request.type && (
                <div className="podcast-category">
                  <span className="category-badge">🏷️ {request.type}</span>
                </div>
              )}

              {request.isPaid && (
                <div className="podcast-category" style={{marginTop: '4px'}}>
                  <span className="category-badge" style={{color: '#10b981', borderColor: '#10b981', background: 'rgba(16, 185, 129, 0.1)'}}>
                    💰 {request.price?.toLocaleString()}đ
                  </span>
                </div>
              )}

              {request.rejectReason && request.status === 'Rejected' && (
                <div className="reject-reason">
                  <XCircle size={12} />
                  <span>{request.rejectReason}</span>
                </div>
              )}

              <div className="podcast-footer">
                <button className="preview-btn" onClick={() => setSelectedRequest(request)}>
                  <Play size={16} />
                  Xem chi tiết
                </button>
                {request.status === 'Pending' && (
                  <div className="action-buttons">
                    <button
                      className="action-btn approve"
                      onClick={() => handleApprove(request.id)}
                      disabled={actionLoading === request.id}
                      title="Duyệt"
                    >
                      {actionLoading === request.id ? (
                        <div className="btn-spinner" />
                      ) : (
                        <CheckCircle size={16} />
                      )}
                    </button>
                    <button
                      className="action-btn reject"
                      onClick={() => handleReject(request.id)}
                      disabled={actionLoading === request.id}
                      title="Từ chối"
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedRequest && (
        <div className="preview-modal-overlay" onClick={() => setSelectedRequest(null)}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="preview-modal-header">
              <h3>{selectedRequest.title}</h3>
              <button className="modal-close" onClick={() => setSelectedRequest(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="preview-modal-body">
              {selectedRequest.banner && (
                <div style={{ marginBottom: 16, borderRadius: 8, overflow: 'hidden' }}>
                  <img src={selectedRequest.banner} alt="Banner" style={{ width: '100%', maxHeight: 200, objectFit: 'cover' }} />
                </div>
              )}
              <div className="preview-info">
                <div className="info-row">
                  <span className="info-label">Người tạo:</span>
                  <span className="info-value">{selectedRequest.authorInfo?.name || selectedRequest.requestedByUsername || selectedRequest.requestedByUserId}</span>
                </div>
                {selectedRequest.type && (
                  <div className="info-row">
                    <span className="info-label">Chủ đề:</span>
                    <span className="info-value">{selectedRequest.type}</span>
                  </div>
                )}
                <div className="info-row">
                  <span className="info-label">Phí:</span>
                  <span className="info-value">{selectedRequest.isPaid ? `${selectedRequest.price?.toLocaleString()}đ` : 'Miễn phí'}</span>
                </div>
                {selectedRequest.description && (
                  <div className="info-row">
                    <span className="info-label">Mô tả:</span>
                    <span className="info-value">{selectedRequest.description}</span>
                  </div>
                )}
                {selectedRequest.rejectReason && (
                  <div className="info-row reject">
                    <span className="info-label">Lý do từ chối:</span>
                    <span className="info-value">{selectedRequest.rejectReason}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="preview-modal-footer">
              <button className="modal-btn reject" onClick={() => { handleReject(selectedRequest.id); setSelectedRequest(null); }}>
                Từ chối
              </button>
              <button className="modal-btn approve" onClick={() => { handleApprove(selectedRequest.id); setSelectedRequest(null); }}>
                Duyệt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}