import { useState } from 'react';
import { Mic, Search, CheckCircle, XCircle, Clock, User, Play } from 'lucide-react';
import './PodcastRequestsScreen.css';

const podcastRequests = [
  { id: 1, title: 'Tech Talk Episode 5', creator: 'PodcastFan', requestedAt: '2024-01-15 09:00', status: 'pending', category: 'Technology', duration: '45:30', description: 'Discussion about AI and future tech' },
  { id: 2, title: 'Daily News Briefing', creator: 'NewsJunkie', requestedAt: '2024-01-15 10:30', status: 'approved', category: 'News', duration: '15:20', description: 'Morning news summary' },
  { id: 3, title: 'Wellness Wednesday', creator: 'HealthGuru', requestedAt: '2024-01-15 11:45', status: 'pending', category: 'Health', duration: '30:15', description: 'Mental health and wellness tips' },
  { id: 4, title: 'Business Insights', creator: 'BizPro', requestedAt: '2024-01-15 13:00', status: 'approved', category: 'Business', duration: '52:40', description: 'Startup success stories' },
  { id: 5, title: 'Comedy Hour', creator: 'FunnyGuy', requestedAt: '2024-01-15 14:15', status: 'rejected', category: 'Comedy', duration: '60:00', description: 'Stand-up comedy special' },
];

export function PodcastRequestsScreen() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  const filteredRequests = podcastRequests.filter(req => {
    const matchesFilter = filter === 'all' || req.status === filter;
    const matchesSearch = req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         req.creator.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: podcastRequests.length,
    pending: podcastRequests.filter(r => r.status === 'pending').length,
    approved: podcastRequests.filter(r => r.status === 'approved').length,
    rejected: podcastRequests.filter(r => r.status === 'rejected').length,
  };

  return (
    <div className="podcast-requests-screen">
      <div className="requests-header">
        <div>
          <h1 className="requests-title">Podcast Requests</h1>
          <p className="requests-subtitle">Review and manage podcast submissions from creators</p>
        </div>
      </div>

      <div className="requests-stats">
        <div className="stat-item">
          <Mic size={20} />
          <div>
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Requests</span>
          </div>
        </div>
        <div className="stat-item pending">
          <Clock size={20} />
          <div>
            <span className="stat-value">{stats.pending}</span>
            <span className="stat-label">Pending</span>
          </div>
        </div>
        <div className="stat-item approved">
          <CheckCircle size={20} />
          <div>
            <span className="stat-value">{stats.approved}</span>
            <span className="stat-label">Approved</span>
          </div>
        </div>
        <div className="stat-item rejected">
          <XCircle size={20} />
          <div>
            <span className="stat-value">{stats.rejected}</span>
            <span className="stat-label">Rejected</span>
          </div>
        </div>
      </div>

      <div className="requests-filters">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by title or creator..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-tabs">
          <button
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending ({stats.pending})
          </button>
          <button
            className={`filter-tab ${filter === 'approved' ? 'active' : ''}`}
            onClick={() => setFilter('approved')}
          >
            Approved ({stats.approved})
          </button>
          <button
            className={`filter-tab ${filter === 'rejected' ? 'active' : ''}`}
            onClick={() => setFilter('rejected')}
          >
            Rejected ({stats.rejected})
          </button>
        </div>
      </div>

      <div className="podcast-grid">
        {filteredRequests.map((request) => (
          <div key={request.id} className="podcast-card">
            <div className="podcast-card-header">
              <div className="podcast-icon">
                <Mic size={24} />
              </div>
              <span className={`status-badge ${request.status}`}>
                {request.status === 'approved' && <CheckCircle size={14} />}
                {request.status === 'rejected' && <XCircle size={14} />}
                {request.status === 'pending' && <Clock size={14} />}
                {request.status}
              </span>
            </div>

            <h3 className="podcast-title">{request.title}</h3>
            <p className="podcast-description">{request.description}</p>

            <div className="podcast-meta">
              <div className="meta-item">
                <User size={14} />
                <span>{request.creator}</span>
              </div>
              <div className="meta-item">
                <Clock size={14} />
                <span>{request.duration}</span>
              </div>
            </div>

            <div className="podcast-category">
              <span className="category-badge">{request.category}</span>
            </div>

            <div className="podcast-footer">
              <button className="preview-btn" onClick={() => setSelectedRequest(request)}>
                <Play size={16} />
                Preview
              </button>
              {request.status === 'pending' && (
                <div className="action-buttons">
                  <button className="action-btn approve">
                    <CheckCircle size={16} />
                  </button>
                  <button className="action-btn reject">
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
                  <span className="info-label">Creator:</span>
                  <span className="info-value">{selectedRequest.creator}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Category:</span>
                  <span className="info-value">{selectedRequest.category}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Duration:</span>
                  <span className="info-value">{selectedRequest.duration}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Description:</span>
                  <span className="info-value">{selectedRequest.description}</span>
                </div>
              </div>
              <div className="audio-player">
                <Play size={32} />
                <span>Audio Player Placeholder</span>
              </div>
            </div>
            <div className="preview-modal-footer">
              <button className="modal-btn reject">Reject</button>
              <button className="modal-btn approve">Approve</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
