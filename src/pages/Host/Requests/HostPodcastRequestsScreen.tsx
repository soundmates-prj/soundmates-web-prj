import { useState, useEffect, useCallback } from 'react';
import { Mic, Search, CheckCircle, XCircle, Clock, User, Play, RefreshCw, Eye } from 'lucide-react';
import { liveSessionApiService } from '../../../services/liveSessionApiService';
import type { PodcastResult } from '../../../services/liveSessionApiService';
import { showToast } from '../../../utils/toast';
import './HostPodcastRequestsScreen.css';

type FilterStatus = 'all' | 'pendingreview' | 'published' | 'archived' | 'draft';

export function HostPodcastRequestsScreen() {
  const [podcasts, setPodcasts] = useState<PodcastResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('pendingreview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPodcast, setSelectedPodcast] = useState<PodcastResult | null>(null);

  const fetchPodcasts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await liveSessionApiService.getPodcasts();
      setPodcasts(data);
    } catch {
      setPodcasts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPodcasts();
  }, [fetchPodcasts]);

  // Stats
  const stats = {
    total: podcasts.length,
    draft: podcasts.filter(r => r.status === 'Draft').length,
    pendingReview: podcasts.filter(r => r.status === 'PendingReview').length,
    published: podcasts.filter(r => r.status === 'Published').length,
    archived: podcasts.filter(r => r.status === 'Archived').length,
  };

  // Filtered
  const filteredPodcasts = podcasts.filter(pod => {
    const statusMatch = filter === 'all' || pod.status?.toLowerCase() === filter;
    const searchLower = searchQuery.toLowerCase();
    const searchMatch =
      !searchQuery ||
      (pod.title || '').toLowerCase().includes(searchLower) ||
      (pod.author || '').toLowerCase().includes(searchLower) ||
      (pod.description || '').toLowerCase().includes(searchLower);
    return statusMatch && searchMatch;
  });

  const handlePublish = async (id: string) => {
    try {
      await liveSessionApiService.updatePodcast(id, { status: 'Published' });
      setPodcasts(prev => prev.map(p => p.id === id ? { ...p, status: 'Published' } : p));
      if (selectedPodcast?.id === id) setSelectedPodcast(null);
      showToast.success('Đã xuất bản — Podcast đã được phát hành thành công');
    } catch {
      showToast.error('Lỗi — Không thể xuất bản podcast. Vui lòng thử lại.');
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await liveSessionApiService.updatePodcast(id, { status: 'Archived' });
      setPodcasts(prev => prev.map(p => p.id === id ? { ...p, status: 'Archived' } : p));
      if (selectedPodcast?.id === id) setSelectedPodcast(null);
      showToast.success('Đã lưu trữ — Podcast đã được lưu trữ');
    } catch {
      showToast.error('Lỗi — Không thể lưu trữ podcast. Vui lòng thử lại.');
    }
  };

  const handleRestoreDraft = async (id: string) => {
    try {
      await liveSessionApiService.updatePodcast(id, { status: 'Draft' });
      setPodcasts(prev => prev.map(p => p.id === id ? { ...p, status: 'Draft' } : p));
      if (selectedPodcast?.id === id) setSelectedPodcast(null);
      showToast.success('Đã khôi phục — Podcast đã được khôi phục về bản nháp');
    } catch {
      showToast.error('Lỗi — Không thể khôi phục podcast. Vui lòng thử lại.');
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'draft': return 'Bản nháp';
      case 'pendingreview': return 'Chờ duyệt';
      case 'published': return 'Đã xuất bản';
      case 'archived': return 'Đã lưu trữ';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'draft': return <Clock size={14} />;
      case 'pendingreview': return <Clock size={14} />;
      case 'published': return <CheckCircle size={14} />;
      case 'archived': return <XCircle size={14} />;
      default: return null;
    }
  };

  const filterTabs: { value: FilterStatus; label: string; count: number }[] = [
    { value: 'pendingreview', label: 'Chờ duyệt', count: stats.pendingReview },
    { value: 'published', label: 'Đã xuất bản', count: stats.published },
    { value: 'draft', label: 'Bản nháp', count: stats.draft },
    { value: 'archived', label: 'Đã lưu trữ', count: stats.archived },
    { value: 'all', label: 'Tất cả', count: stats.total },
  ];

  return (
    <div className="host-pr-page">
      <div className="requests-header">
        <div>
          <h1 className="requests-title">Yêu cầu Podcast</h1>
          <p className="requests-subtitle">Xem và quản lý podcast trong hệ thống</p>
        </div>
        <button
          className="refresh-btn"
          onClick={() => void fetchPodcasts()}
          disabled={loading}
        >
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
          Làm mới
        </button>
      </div>

      <div className="requests-stats">
        {filterTabs.map(tab => (
          <div
            key={tab.value}
            className={`stat-item ${tab.value === 'pendingreview' ? 'pending' : tab.value === 'published' ? 'approved' : tab.value === 'archived' ? 'rejected' : ''}`}
          >
            <Mic size={20} />
            <div>
              <span className="stat-value">{tab.count}</span>
              <span className="stat-label">{tab.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="requests-filters">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Tìm theo tiêu đề, tác giả hoặc mô tả..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-tabs">
          {filterTabs.map(tab => (
            <button
              key={tab.value}
              className={`filter-tab ${filter === tab.value ? 'active' : ''}`}
              onClick={() => setFilter(tab.value)}
            >
              {tab.label}
              {tab.count > 0 && <span className="filter-count">{tab.count}</span>}
            </button>
          ))}
        </div>
      </div>

      {loading && podcasts.length === 0 ? (
        <div className="requests-loading">
          <RefreshCw size={32} className="spin" />
          <p>Đang tải podcast...</p>
        </div>
      ) : filteredPodcasts.length === 0 ? (
        <div className="requests-empty">
          <Mic size={48} />
          <h3>Không có podcast nào</h3>
          <p>
            {filter === 'all'
              ? 'Chưa có podcast nào trong hệ thống.'
              : `Không có podcast nào ở trạng thái "${getStatusLabel(filter)}".`}
          </p>
        </div>
      ) : (
        <div className="podcast-grid">
          {filteredPodcasts.map((podcast) => (
            <div key={podcast.id} className="podcast-card">
              <div className="podcast-card-header">
                <div className="podcast-icon">
                  <Mic size={24} />
                </div>
                <span className={`status-badge ${podcast.status?.toLowerCase()}`}>
                  {getStatusIcon(podcast.status || '')}
                  {getStatusLabel(podcast.status || '')}
                </span>
              </div>

              <h3 className="podcast-title">{podcast.title}</h3>
              {podcast.description && (
                <p className="podcast-description">{podcast.description}</p>
              )}

              <div className="podcast-meta">
                {podcast.author && (
                  <div className="meta-item">
                    <User size={14} />
                    <span>{podcast.author}</span>
                  </div>
                )}
                {podcast.episodeCount > 0 && (
                  <div className="meta-item">
                    <Play size={14} />
                    <span>{podcast.episodeCount} tập</span>
                  </div>
                )}
              </div>

              <div className="podcast-footer">
                <button
                  className="preview-btn"
                  onClick={() => setSelectedPodcast(podcast)}
                >
                  <Eye size={16} />
                  Chi tiết
                </button>

                {podcast.status === 'PendingReview' && (
                  <div className="action-buttons">
                    <button
                      className="action-btn approve"
                      onClick={() => void handlePublish(podcast.id)}
                      title="Xuất bản"
                    >
                      <CheckCircle size={16} />
                    </button>
                    <button
                      className="action-btn reject"
                      onClick={() => void handleArchive(podcast.id)}
                      title="Từ chối / Lưu trữ"
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                )}

                {podcast.status === 'Published' && (
                  <div className="action-buttons">
                    <button
                      className="action-btn reject"
                      onClick={() => void handleArchive(podcast.id)}
                      title="Lưu trữ"
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                )}

                {podcast.status === 'Archived' && (
                  <div className="action-buttons">
                    <button
                      className="action-btn approve"
                      onClick={() => void handleRestoreDraft(podcast.id)}
                      title="Khôi phục"
                    >
                      <RefreshCw size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedPodcast && (
        <div className="preview-modal-overlay" onClick={() => setSelectedPodcast(null)}>
          <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="preview-modal-header">
              <h3>{selectedPodcast.title}</h3>
              <button className="modal-close" onClick={() => setSelectedPodcast(null)}>×</button>
            </div>
            <div className="preview-modal-body">
              <div className="preview-info">
                <div className="info-row">
                  <span className="info-label">Trạng thái:</span>
                  <span className={`status-badge ${selectedPodcast.status?.toLowerCase()}`}>
                    {getStatusIcon(selectedPodcast.status || '')}
                    {getStatusLabel(selectedPodcast.status || '')}
                  </span>
                </div>
                {selectedPodcast.author && (
                  <div className="info-row">
                    <span className="info-label">Tác giả:</span>
                    <span className="info-value">{selectedPodcast.author}</span>
                  </div>
                )}
                {selectedPodcast.type && (
                  <div className="info-row">
                    <span className="info-label">Loại:</span>
                    <span className="info-value">{selectedPodcast.type}</span>
                  </div>
                )}
                {selectedPodcast.episodeCount > 0 && (
                  <div className="info-row">
                    <span className="info-label">Số tập:</span>
                    <span className="info-value">{selectedPodcast.episodeCount}</span>
                  </div>
                )}
                <div className="info-row">
                  <span className="info-label">Ngày tạo:</span>
                  <span className="info-value">
                    {new Date(selectedPodcast.createdAt).toLocaleDateString('vi-VN', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                    })}
                  </span>
                </div>
                {selectedPodcast.description && (
                  <div className="info-row">
                    <span className="info-label">Mô tả:</span>
                    <span className="info-value">{selectedPodcast.description}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="preview-modal-footer">
              {selectedPodcast.status === 'PendingReview' && (
                <>
                  <button
                    className="modal-btn reject"
                    onClick={() => void handleArchive(selectedPodcast.id)}
                  >
                    Từ chối
                  </button>
                  <button
                    className="modal-btn approve"
                    onClick={() => void handlePublish(selectedPodcast.id)}
                  >
                    Xuất bản
                  </button>
                </>
              )}
              {selectedPodcast.status === 'Published' && (
                <button
                  className="modal-btn reject"
                  onClick={() => void handleArchive(selectedPodcast.id)}
                >
                  Lưu trữ
                </button>
              )}
              {selectedPodcast.status === 'Archived' && (
                <button
                  className="modal-btn approve"
                  onClick={() => void handleRestoreDraft(selectedPodcast.id)}
                >
                  Khôi phục
                </button>
              )}
              <button className="modal-btn secondary" onClick={() => setSelectedPodcast(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
