import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Clock, Calendar, Music, MessageSquare } from 'lucide-react';
import liveSessionApiService, {
  type LiveSessionStatisticsResult,
  type SongRequestResult,
  type LiveSessionChatResult
} from '../../../services/liveSessionApiService';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import './HostAnalyticsScreen.css'; // Reusing some base styles

export function HostSessionAnalyticsDetailScreen() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [sessionStats, setSessionStats] = useState<LiveSessionStatisticsResult | null>(null);
  const [songRequests, setSongRequests] = useState<SongRequestResult[]>([]);
  const [chats, setChats] = useState<LiveSessionChatResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const [
          statisticsData,
          requestsData,
          chatsData
        ] = await Promise.all([
          liveSessionApiService.getSessionStatistics(sessionId),
          liveSessionApiService.getSongRequests(sessionId),
          liveSessionApiService.getSessionChats(sessionId)
        ]);

        setSessionStats(statisticsData);
        setSongRequests(requestsData);
        setChats(chatsData);
      } catch (error) {
        console.error("Failed to fetch session analytics details", error);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [sessionId]);

  if (loading) {
    return <div className="host-an-page">Đang tải chi tiết phân tích...</div>;
  }

  if (!sessionStats) {
    return (
      <div className="host-an-page">
        <div style={{ marginBottom: '20px' }}>
          <button className="host-an-btn host-an-btn--outline" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Quay lại
          </button>
        </div>
        <p>Không tìm thấy thông tin phiên phát sóng.</p>
      </div>
    );
  }

  const durationMinutes = Math.round((sessionStats.totalDurationSeconds || 0) / 60);

  return (
    <div className="host-an-page">
      {/* Header */}
      <div className="host-an-header" style={{ marginBottom: '24px' }}>
        <div>
          <button 
            className="host-an-btn host-an-btn--outline" 
            style={{ marginBottom: '16px' }}
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={16} /> Quay lại phân tích
          </button>
          <h1>Phân tích chi tiết: {sessionStats.sessionName}</h1>
          <p>
            Trạng thái: <span style={{ fontWeight: 'bold', color: sessionStats.status === 'Ended' ? '#64748b' : '#10b981' }}>{sessionStats.status}</span>
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="host-an-stats-grid">
        <div className="host-an-card">
          <div className="host-an-icon"><Calendar size={20} /></div>
          <div className="host-an-content">
            <span className="host-an-label">Thời gian phát sóng</span>
            <span className="host-an-value" style={{ fontSize: '16px', marginTop: '4px' }}>
              {sessionStats.startedAt ? format(new Date(sessionStats.startedAt), 'HH:mm dd/MM', { locale: vi }) : '--'}
              {' - '}
              {sessionStats.endedAt ? format(new Date(sessionStats.endedAt), 'HH:mm dd/MM', { locale: vi }) : '--'}
            </span>
          </div>
        </div>

        <div className="host-an-card">
          <div className="host-an-icon"><Clock size={20} /></div>
          <div className="host-an-content">
            <span className="host-an-label">Tổng thời lượng</span>
            <span className="host-an-value">{durationMinutes} phút</span>
          </div>
        </div>

        <div className="host-an-card">
          <div className="host-an-icon"><Users size={20} /></div>
          <div className="host-an-content">
            <span className="host-an-label">Lượt xem đỉnh (Peak)</span>
            <span className="host-an-value">{sessionStats.peakConcurrentListeners || 0}</span>
          </div>
        </div>

        <div className="host-an-card">
          <div className="host-an-icon"><Users size={20} /></div>
          <div className="host-an-content">
            <span className="host-an-label">Tổng lượt xem (Unique)</span>
            <span className="host-an-value">{sessionStats.uniqueListeners || 0}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
        {/* Song Requests */}
        <div className="host-an-table-section" style={{ marginTop: 0 }}>
          <h3 className="host-an-table-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Music size={18} /> Yêu cầu nhạc ({songRequests.length})
          </h3>
          <div className="host-an-table-wrapper" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table className="host-an-table">
              <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr>
                  <th style={{ background: 'var(--bg-card, #fff)' }}>Thời gian</th>
                  <th style={{ background: 'var(--bg-card, #fff)' }}>Bài hát</th>
                  <th style={{ background: 'var(--bg-card, #fff)' }}>Người yêu cầu</th>
                </tr>
              </thead>
              <tbody>
                {songRequests.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="no-data-msg" style={{ textAlign: 'center', padding: '2rem' }}>
                      Không có yêu cầu nhạc nào trong phiên này.
                    </td>
                  </tr>
                ) : (
                  songRequests.map((req) => (
                    <tr key={req.id}>
                      <td>{format(new Date(req.requestedAt), 'HH:mm')}</td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{req.songTitle || 'Unknown Title'}</div>
                        <div style={{ fontSize: '12px', color: 'var(--neutral-500)' }}>{req.songArtist}</div>
                      </td>
                      <td>{req.requestedByUserId?.substring(0, 8)}...</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Chat History */}
        <div className="host-an-table-section" style={{ marginTop: 0 }}>
          <h3 className="host-an-table-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={18} /> Lịch sử Chat ({chats.length})
          </h3>
          <div className="host-an-table-wrapper" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table className="host-an-table">
              <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr>
                  <th style={{ background: 'var(--bg-card, #fff)' }}>Thời gian</th>
                  <th style={{ background: 'var(--bg-card, #fff)' }}>Người gửi</th>
                  <th style={{ background: 'var(--bg-card, #fff)' }}>Nội dung</th>
                </tr>
              </thead>
              <tbody>
                {chats.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="no-data-msg" style={{ textAlign: 'center', padding: '2rem' }}>
                      Không có đoạn chat nào trong phiên này.
                    </td>
                  </tr>
                ) : (
                  chats.map((chat) => (
                    <tr key={chat.id} style={{ opacity: chat.isDeleted ? 0.5 : 1 }}>
                      <td style={{ whiteSpace: 'nowrap' }}>{format(new Date(chat.createdAt), 'HH:mm:ss')}</td>
                      <td style={{ fontWeight: 500 }}>{chat.userName}</td>
                      <td>
                        {chat.isDeleted ? <i>[Đã bị xóa]</i> : chat.message}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
