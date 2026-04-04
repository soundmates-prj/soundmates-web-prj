import { useState } from 'react';
import { Mic, Search, CheckCircle, XCircle, Clock, User, Play, RefreshCw } from 'lucide-react';
import { showSuccess } from "../../../components/common/toastUtils";
import './PodcastRequestsScreen.css';

const podcastRequests = [
  { id: 1, title: 'Tech Talk Episode 5', creator: 'PodcastFan', requestedAt: '2024-01-15 09:00', status: 'pending', category: 'Technology', duration: '45:30', description: 'Discussion about AI and future tech' },
  { id: 2, title: 'Daily News Briefing', creator: 'NewsJunkie', requestedAt: '2024-01-15 10:30', status: 'approved', category: 'News', duration: '15:20', description: 'Morning news summary' },
  { id: 3, title: 'Wellness Wednesday', creator: 'HealthGuru', requestedAt: '2024-01-15 11:45', status: 'pending', category: 'Health', duration: '30:15', description: 'Mental health and wellness tips' },
  { id: 4, title: 'Business Insights', creator: 'BizPro', requestedAt: '2024-01-15 13:00', status: 'approved', category: 'Business', duration: '52:40', description: 'Startup success stories' },
];

export function PodcastRequestsScreen() {
  const [requests, setRequests] = useState(podcastRequests);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  const filteredRequests = requests.filter(req => {
    const matchesFilter = filter === 'all' || req.status === filter;
    const matchesSearch = req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         req.creator.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  const handleApprove = (id: number) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
    showSuccess("Thành công", "Yêu cầu podcast đã được duyệt");
  };

  const handleReject = (id: number) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
    showSuccess("Thành công", "Yêu cầu podcast đã bị từ chối");
  };

  return (
    <div className="podcast-requests-screen">
      <div className="requests-header">
        <div>
          <h1 className="requests-title">Yêu cầu Podcast</h1>
          <p className="requests-subtitle">Duyệt và quản lý yêu cầu podcast từ người dùng</p>
        </div>
        <button className="lm-btn lm-btn--outline">
          <RefreshCw size={14} />
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
            placeholder="Tìm theo tên podcast hoặc người tạo..."
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

      <div className="podcast-grid">
        {filteredRequests.map((request) => (
          <div key={request.id} className="podcast-card">
            <div className="podcast-card-header">
              <div className="podcast-icon"><Mic size={24} /></div>
              <span className={`status-badge ${request.status}`}>
                {request.status === 'approved' && <CheckCircle size={14} />}
                {request.status === 'rejected' && <XCircle size={14} />}
                {request.status === 'pending' && <Clock size={14} />}
                {request.status === 'approved' ? 'Đã duyệt' : request.status === 'rejected' ? 'Từ chối' : 'Đang chờ'}
              </span>
            </div>

            <h3 className="podcast-title">{request.title}</h3>
            <p className="podcast-description">{request.description}</p>

            <div className="podcast-meta">
              <div className="meta-item"><User size={14} /><span>{request.creator}</span></div>
              <div className="meta-item"><Clock size={14} /><span>{request.duration}</span></div>
            </div>

            <div className="podcast-category">
              <span className="category-badge">{request.category}</span>
            </div>

            <div className="podcast-footer">
              <button className="preview-btn" onClick={() => setSelectedRequest(request)}>
                <Play size={16} />
                Xem trước
              </button>
              {request.status === 'pending' && (
                <div className="action-buttons">
                  <button className="action-btn approve" onClick={() => handleApprove(request.id)}>
                    <CheckCircle size={16} />
                  </button>
                  <button className="action-btn reject" onClick={() => handleReject(request.id)}>
                    <XCircle size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedRequest && (
        <div className="preview-modal-overlay" onClick={() => setSelectedRequest(null)}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="preview-modal-header">
              <h3>{selectedRequest.title}</h3>
              <button className="modal-close" onClick={() => setSelectedRequest(null)}>×</button>
            </div>
            <div className="preview-modal-body">
              <div className="preview-info">
                <div className="info-row">
                  <span className="info-label">Người tạo:</span>
                  <span className="info-value">{selectedRequest.creator}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Thể loại:</span>
                  <span className="info-value">{selectedRequest.category}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Thời lượng:</span>
                  <span className="info-value">{selectedRequest.duration}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Mô tả:</span>
                  <span className="info-value">{selectedRequest.description}</span>
                </div>
              </div>
              <div className="audio-player">
                <Play size={32} />
                <span>Audio Player Placeholder</span>
              </div>
            </div>
            <div className="preview-modal-footer">
              <button className="modal-btn reject" onClick={() => { handleReject(selectedRequest.id); setSelectedRequest(null); }}>Từ chối</button>
              <button className="modal-btn approve" onClick={() => { handleApprove(selectedRequest.id); setSelectedRequest(null); }}>Duyệt</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
