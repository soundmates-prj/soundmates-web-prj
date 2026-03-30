import { useState, useEffect } from 'react';
import { Radio, RefreshCw, Play, Clock, Users, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { liveSessionApiService } from "../../../services/liveSessionApiService";
import type { LiveSessionResult } from "../../../services/liveSessionApiService";
import './HostSessionDashboard.css';

const PAGE_SIZE = 12;

export function HostSessionDashboard() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<LiveSessionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => { loadSessions(filter, currentPage); }, [currentPage, filter]);

  const loadSessions = async (status: string, page: number) => {
    setLoading(true);
    try {
      // TODO: filter by current host user ID when backend supports it
      const res = await liveSessionApiService.getLiveSessions({ pageSize: PAGE_SIZE, pageNumber: page });
      setSessions(res.items);
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages);
    } catch {
      console.error("Không thể tải phiên phát sóng");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Live': return <span className="host-sd-badge host-sd-badge--live">● Đang phát</span>;
      case 'Scheduled': return <span className="host-sd-badge host-sd-badge--scheduled">Lên lịch</span>;
      case 'Ended': return <span className="host-sd-badge host-sd-badge--ended">Đã kết thúc</span>;
      case 'Paused': return <span className="host-sd-badge host-sd-badge--paused">Tạm dừng</span>;
      default: return <span className="host-sd-badge">{status}</span>;
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filterOptions = [
    { value: 'all', label: 'Tất cả' },
    { value: 'Live', label: 'Đang phát' },
    { value: 'Scheduled', label: 'Đã lên lịch' },
    { value: 'Created', label: 'Chưa phát' },
    { value: 'Ended', label: 'Đã kết thúc' },
  ];

  return (
    <div className="host-sd-page">
      <div className="host-sd-header">
        <div>
          <h1>Phiên phát sóng của tôi</h1>
          <p>Xem và quản lý các phiên phát sóng được phân công cho bạn</p>
        </div>
        <button className="host-sd-btn host-sd-btn--outline" onClick={() => loadSessions(filter, currentPage)}>
          <RefreshCw size={15} />
          Làm mới
        </button>
      </div>

      {/* Filters */}
      <div className="host-sd-filter-bar">
        <div className="host-sd-filter-tabs">
          {filterOptions.map(opt => (
            <button
              key={opt.value}
              className={`host-sd-filter-tab ${filter === opt.value ? 'active' : ''}`}
              onClick={() => { setFilter(opt.value); setCurrentPage(1); }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sessions Grid */}
      {loading ? (
        <div className="host-sd-loading">
          <RefreshCw size={32} className="host-sd-spin" />
          <p>Đang tải phiên phát sóng...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="host-sd-empty">
          <Radio size={48} />
          <h3>Chưa có phiên phát sóng nào</h3>
          <p>Các phiên được phân công sẽ hiển thị ở đây</p>
        </div>
      ) : (
        <>
          <div className="host-sd-grid">
            {sessions.map(session => (
              <div key={session.id} className="host-sd-card">
                <div className="host-sd-card-header">
                  <div className="host-sd-card-icon">
                    <Radio size={24} />
                  </div>
                  {getStatusBadge(session.status)}
                </div>

                <h3 className="host-sd-card-title">{session.sessionName}</h3>
                <p className="host-sd-card-desc">{session.description || 'Không có mô tả'}</p>

                <div className="host-sd-card-meta">
                  <div className="host-sd-meta-item">
                    <Radio size={14} />
                    <span>{session.stationName || '—'}</span>
                  </div>
                  {session.listenersCount !== undefined && session.listenersCount > 0 && (
                    <div className="host-sd-meta-item">
                      <Users size={14} />
                      <span>{session.listenersCount} người nghe</span>
                    </div>
                  )}
                </div>

                <div className="host-sd-card-footer">
                  {(session.status === 'Created' || session.status === 'Scheduled') && (
                    <button
                      className="host-sd-btn host-sd-btn--primary"
                      onClick={() => navigate(`/host/live/${session.id}`)}
                    >
                      <Play size={14} />
                      Bắt đầu
                    </button>
                  )}
                  {session.status === 'Live' && (
                    <button
                      className="host-sd-btn host-sd-btn--primary"
                      onClick={() => navigate(`/host/live/${session.id}`)}
                    >
                      <Play size={14} />
                      Điều khiển
                    </button>
                  )}
                  {session.status === 'Paused' && (
                    <button
                      className="host-sd-btn host-sd-btn--primary"
                      onClick={() => navigate(`/host/live/${session.id}`)}
                    >
                      Tiếp tục
                    </button>
                  )}
                  <button
                    className="host-sd-btn host-sd-btn--outline"
                    onClick={() => navigate(`/host/schedule`)}
                  >
                    <Clock size={14} />
                    Xem lịch
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="host-sd-pagination">
              <button
                className="host-sd-page-btn"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                ← Trang trước
              </button>
              <span className="host-sd-page-info">
                Trang {currentPage} / {totalPages}
              </span>
              <button
                className="host-sd-page-btn"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Trang sau →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
