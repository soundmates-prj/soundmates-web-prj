import { useState, useEffect, useCallback } from 'react';
import { Mic, Search, CheckCircle, XCircle, Clock, User, Play, RefreshCw, X, FileAudio } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { liveSessionApiService, type PodcastEpisodeRequestResult, type PodcastResult } from '../../../services/liveSessionApiService';
import { showSuccess, showError } from '../../../components/common/toastUtils';
import '../LiveOps/LiveOps.css';

type FilterTab = 'all' | 'pending' | 'approved' | 'rejected';

export function EpisodeRequestsPage() {
  const [requests, setRequests] = useState<PodcastEpisodeRequestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterTab>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<PodcastEpisodeRequestResult | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Optional: Cache for podcast info
  const [podcastsCache, setPodcastsCache] = useState<Record<string, PodcastResult>>({});

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params: { status?: string; search?: string } = {};
      if (filter !== 'all') params.status = filter;
      if (searchQuery.trim()) params.search = searchQuery;
      const data = await liveSessionApiService.getPodcastEpisodeRequests(params);
      setRequests(data);
    } catch (err: any) {
      showError('Lỗi', err?.response?.data?.message || 'Không thể tải yêu cầu tập mới');
    } finally {
      setLoading(false);
    }
  }, [filter, searchQuery]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const loadPodcastInfo = async (podcastId: string) => {
    if (!podcastId || podcastsCache[podcastId]) return;
    try {
      const p = await liveSessionApiService.getPodcast(podcastId);
      setPodcastsCache(prev => ({ ...prev, [podcastId]: p }));
    } catch (e) {
      console.error("Failed to load podcast info", e);
    }
  };

  const openDetail = (request: PodcastEpisodeRequestResult) => {
    setSelectedRequest(request);
    if (request.podcastId) {
      loadPodcastInfo(request.podcastId);
    }
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const updated = await liveSessionApiService.reviewPodcastEpisodeRequest(id, { isApproved: true });
      setRequests(prev => prev.map(r => r.id === id ? updated : r));
      if (selectedRequest?.id === id) setSelectedRequest(updated);
      showSuccess('Thành công', 'Yêu cầu tập mới đã được duyệt');
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
      const updated = await liveSessionApiService.reviewPodcastEpisodeRequest(id, {
        isApproved: false,
        rejectReason: reason.trim(),
      });
      setRequests(prev => prev.map(r => r.id === id ? updated : r));
      if (selectedRequest?.id === id) setSelectedRequest(updated);
      showSuccess('Thành công', 'Yêu cầu tập mới đã bị từ chối');
    } catch (err: any) {
      showError('Lỗi', err?.response?.data?.message || 'Không thể từ chối yêu cầu');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return "0:00";
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

  // Compute stats safely
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'Pending').length,
    approved: requests.filter(r => r.status === 'Approved').length,
    rejected: requests.filter(r => r.status === 'Rejected').length,
  };

  return (
    <div className="ops-page">
      <div className="ops-header">
        <div>
          <h1 className="ops-title">Yêu cầu Tập mới</h1>
          <p className="ops-subtitle">Duyệt và quản lý yêu cầu tạo tập podcast mới từ người dùng</p>
        </div>
        <button className="ops-btn ops-btn--ghost" onClick={fetchRequests} disabled={loading}>
          <RefreshCw size={15} className={loading ? 'pe-spin' : ''} />
          Làm mới
        </button>
      </div>

      <div className="ops-card pod-requests-toolbar-card" style={{ marginBottom: 20 }}>
        <div className="pod-requests-toolbar">
          <div className="pod-search-wrap">
            <Search size={16} className="pod-search-icon" />
            <input
              className="ops-input pod-search-input"
              placeholder="Tìm theo tên tập..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  fetchRequests();
                }
              }}
            />
          </div>

          <select
            className="ops-select pod-filter-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterTab)}
          >
            <option value="pending">Chờ duyệt</option>
            <option value="approved">Đã duyệt</option>
            <option value="rejected">Đã từ chối</option>
            <option value="all">Tất cả trạng thái</option>
          </select>

          <button
            className="ops-btn ops-btn--ghost"
            type="button"
            onClick={fetchRequests}
          >
            <Search size={14} />
            Tìm
          </button>
        </div>
      </div>

      <div className="pod-request-list">
        {loading ? (
          <div className="ops-card">
            <div className="ops-stack">
              <div className="ops-skeleton" />
              <div className="ops-skeleton" />
            </div>
          </div>
        ) : requests.length === 0 ? (
          <div className="ops-card">
            <div className="ops-empty">Không có yêu cầu tập mới nào phù hợp.</div>
          </div>
        ) : (
          requests.map((request) => (
            <div key={request.id} className="ops-card pod-request-card">
              <div className="pod-request-cover">
                {request.thumbnailUrl ? (
                  <img src={request.thumbnailUrl} alt={request.title} />
                ) : (
                  <div className="pod-request-cover-placeholder">
                    <FileAudio size={28} />
                  </div>
                )}
              </div>

              <div className="pod-request-content">
                <div className="pod-request-top">
                  <div className="pod-request-headings">
                    <h3 className="pod-request-title">{request.title}</h3>
                    <p className="pod-request-desc">
                      {request.description || "Chưa có mô tả cho tập này."}
                    </p>
                  </div>

                  <div className="pod-request-badges">
                    <span className={`ops-badge ops-badge--${request.status === 'Approved' ? 'good' : request.status === 'Rejected' ? 'danger' : 'warn'}`}>
                      {statusLabel(request.status)}
                    </span>
                  </div>
                </div>

                <div className="pod-request-meta">
                  <div className="pod-request-meta-item">
                    <User size={14} />
                    <span>
                      <strong>{request.authorInfo?.Name || request.requestedByUserId || "Người dùng ẩn"}</strong>
                    </span>
                  </div>
                  <div className="pod-request-meta-item">
                    <Clock size={14} />
                    <span>Thời lượng: {formatDuration(request.duration)}</span>
                  </div>
                </div>

                <div className="pod-request-actions">
                  <button
                    className="ops-btn ops-btn--primary"
                    onClick={() => openDetail(request)}
                  >
                    <Play size={14} />
                    Xem chi tiết
                  </button>

                  {request.status === 'Pending' && (
                    <>
                      <button
                        className="ops-btn pe-confirm-approve"
                        onClick={() => handleApprove(request.id)}
                        disabled={actionLoading === request.id}
                      >
                        {actionLoading === request.id ? <div className="spinner" style={{width: 14, height: 14, borderWidth: 2}} /> : <CheckCircle size={14} />}
                        Duyệt
                      </button>
                      <button
                        className="ops-btn pe-confirm-delete"
                        onClick={() => handleReject(request.id)}
                        disabled={actionLoading === request.id}
                      >
                        <XCircle size={14} />
                        Từ chối
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedRequest && (
        <div className="ops-modal-overlay" onClick={() => setSelectedRequest(null)}>
          <div className="ops-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="ops-modal-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                Chi tiết Tập Podcast
              </h3>
              <button
                className="ops-btn ops-btn--ghost"
                onClick={() => setSelectedRequest(null)}
                style={{ height: 30, padding: "0 6px" }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="ops-modal-body">
              {selectedRequest.thumbnailUrl && (
                <div style={{ marginBottom: 16, borderRadius: 8, overflow: 'hidden' }}>
                  <img src={selectedRequest.thumbnailUrl} alt="Thumbnail" style={{ width: '100%', maxHeight: 250, objectFit: 'cover' }} />
                </div>
              )}
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <strong>Tên tập:</strong> <span style={{ marginLeft: 8 }}>{selectedRequest.title}</span>
                </div>
                
                {selectedRequest.podcastId && (
                  <div>
                    <strong>Podcast gốc:</strong> 
                    <span style={{ marginLeft: 8 }}>
                      {podcastsCache[selectedRequest.podcastId] 
                        ? podcastsCache[selectedRequest.podcastId].title 
                        : "Đang tải..."}
                    </span>
                  </div>
                )}
                
                <div>
                  <strong>Người yêu cầu:</strong> <span style={{ marginLeft: 8 }}>{selectedRequest.authorInfo?.Name || selectedRequest.requestedByUserId}</span>
                </div>
                
                {selectedRequest.description && (
                  <div>
                    <strong>Mô tả:</strong> 
                    <p style={{ marginTop: 4, color: 'var(--text-muted, #64748b)' }}>{selectedRequest.description}</p>
                  </div>
                )}

                {selectedRequest.rejectReason && (
                  <div style={{ padding: 12, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: 8, marginTop: 8 }}>
                    <strong>Lý do từ chối:</strong> {selectedRequest.rejectReason}
                  </div>
                )}

                {selectedRequest.audioUrl && (
                  <div style={{ marginTop: 16 }}>
                    <strong style={{ display: 'block', marginBottom: 8 }}>Nghe thử:</strong>
                    <audio 
                      controls 
                      src={selectedRequest.audioUrl} 
                      style={{ width: '100%' }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="ops-modal-foot">
              <button className="ops-btn ops-btn--ghost" onClick={() => setSelectedRequest(null)}>
                Đóng
              </button>
              
              {selectedRequest.status === 'Pending' && (
                <>
                  <button className="pe-confirm-delete" onClick={() => { handleReject(selectedRequest.id); setSelectedRequest(null); }}>
                    <XCircle size={14} /> Từ chối
                  </button>
                  <button className="pe-confirm-approve" onClick={() => { handleApprove(selectedRequest.id); setSelectedRequest(null); }}>
                    <CheckCircle size={14} /> Duyệt
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
