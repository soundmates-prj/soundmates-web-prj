import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { Database, HardDrive, Radio, Music, ChevronLeft, ChevronRight, RefreshCw, AlertTriangle, Eye, BarChart3, Users } from 'lucide-react';
import liveSessionApiService, { type StaffAnalyticsOverview, type SongRequestResult, type HostAnalyticsOverviewResult } from '../../../services/liveSessionApiService';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import './StaffAnalyticsScreen.css';
import { UserNameResolver } from '../../../components/UserNameResolver';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}

function MetricCard({ title, value, icon }: MetricCardProps) {
  return (
    <div className="staff-an-card">
      <div className="staff-an-icon">{icon}</div>
      <div className="staff-an-content">
        <span className="staff-an-label">{title}</span>
        <span className="staff-an-value">{value}</span>
      </div>
    </div>
  );
}

export function StaffAnalyticsScreen() {
  const navigate = useNavigate();
  const [data, setData] = useState<StaffAnalyticsOverview | null>(null);
  const [liveData, setLiveData] = useState<HostAnalyticsOverviewResult | null>(null);
  const [loading, setLoading] = useState(true);

  // Pagination state for pending requests
  const [pendingRequests, setPendingRequests] = useState<SongRequestResult[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [staffRes, hostRes] = await Promise.all([
        liveSessionApiService.getStaffAnalyticsOverview(7),
        liveSessionApiService.getHostAnalyticsOverview(7).catch(() => null)
      ]);
      if (staffRes.success && staffRes.data) {
        setData(staffRes.data);
      }
      if (hostRes) {
        setLiveData(hostRes);
      }
    } catch (error) {
      console.error("Failed to fetch analytics", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequests = async (currentPage: number) => {
    try {
      setLoadingRequests(true);
      const res = await liveSessionApiService.getAllSongRequests('Pending', currentPage, 5);
      if (res.success && res.data) {
        setPendingRequests(res.data.content);
        setTotalPages(res.data.totalPages || 1);
      }
    } catch (error) {
      console.error("Failed to fetch pending requests", error);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  useEffect(() => {
    void fetchPendingRequests(page);
  }, [page]);

  if (loading || !data) {
    return <div className="staff-an-page">Đang tải phân tích...</div>;
  }

  // Format chart data
  const growthData = data.contentGrowthChart.map(d => ({
    ...d,
    dayFormatted: format(parseISO(d.date), 'dd/MM', { locale: vi })
  }));

  const modData = data.moderationChart.map(d => ({
    ...d,
    dayFormatted: format(parseISO(d.date), 'dd/MM', { locale: vi })
  }));

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="staff-an-page">
      <div className="staff-an-header">
        <div>
          <h1>Hậu cần & Điều hành</h1>
          <p>Kiểm soát tài nguyên hệ thống và khối lượng công việc kiểm duyệt</p>
        </div>
        <button className="lm-btn lm-btn--outline" onClick={fetchData}>
          <RefreshCw size={15} />
          Làm mới
        </button>
      </div>

      <div className="staff-an-stats-grid">
        <MetricCard title="Kho nhạc hệ thống" value={data.totalSystemMusic} icon={<Database size={20} />} />
        <MetricCard title="Dung lượng lưu trữ" value={formatBytes(data.totalStorageBytes)} icon={<HardDrive size={20} />} />
        <MetricCard title="Trạm phát sóng" value={data.totalStations} icon={<Radio size={20} />} />
        <MetricCard title="Yêu cầu đang chờ duyệt" value={data.pendingSongRequests} icon={<AlertTriangle size={20} />} />
      </div>

      <div className="staff-an-charts-row">
        <div className="staff-an-chart-card">
          <h3>Tăng trưởng tài nguyên (Nhạc hệ thống)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis dataKey="dayFormatted" stroke="#64748b" />
              <YAxis stroke="#64748b" allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="newMusicCount" fill="#1a9fd4" radius={[8,8,0,0]} name="Bài hát mới" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="staff-an-chart-card">
          <h3>Khối lượng kiểm duyệt yêu cầu nhạc</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={modData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis dataKey="dayFormatted" stroke="#64748b" />
              <YAxis stroke="#64748b" allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="pendingCount" stroke="#dc2626" strokeWidth={3}
                dot={{ r: 4, fill: '#dc2626' }} name="Đang chờ duyệt" />
              <Line type="monotone" dataKey="resolvedCount" stroke="#16a34a" strokeWidth={3}
                dot={{ r: 4, fill: '#16a34a' }} name="Đã xử lý" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {liveData && (
        <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--neutral-800)' }}>Phân tích Phiên phát sóng (Live)</h2>
          
          <div className="staff-an-stats-grid" style={{ marginBottom: '1.5rem' }}>
            <MetricCard title="Phiên đã phát" value={liveData.totalSessions.toString()} icon={<Radio size={20} />} />
            <MetricCard title="Tổng người nghe" value={liveData.totalListeners.toLocaleString()} icon={<Users size={20} />} />
            <MetricCard title="Lượt xem cao nhất" value={liveData.peakListeners.toLocaleString()} icon={<Eye size={20} />} />
            <MetricCard title="Yêu cầu nhạc" value={liveData.totalMusicRequests.toLocaleString()} icon={<Music size={20} />} />
          </div>

          <div className="staff-an-charts-row">
            <div className="staff-an-chart-card">
              <h3>Người nghe & Yêu cầu nhạc theo ngày</h3>
              <div style={{ height: '280px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={liveData.chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                    <XAxis dataKey="date" stroke="#64748b" tickFormatter={(val) => val.split("-").slice(1).join("/")} />
                    <YAxis stroke="#64748b" allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="listenersCount" fill="#1a9fd4" radius={[8, 8, 0, 0]} name="Người nghe" />
                    <Bar dataKey="requestsCount" fill="#a855f7" radius={[8, 8, 0, 0]} name="Yêu cầu nhạc" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="staff-an-chart-card">
              <h3>Tương tác chat theo ngày</h3>
              <div style={{ height: '280px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={liveData.chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                    <XAxis dataKey="date" stroke="#64748b" tickFormatter={(val) => val.split("-").slice(1).join("/")} />
                    <YAxis stroke="#64748b" allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="chatCount" stroke="#1a9fd4" strokeWidth={3} dot={{ r: 4, fill: "#1a9fd4" }} name="Tin nhắn chat" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="staff-an-top-section">
        <div className="staff-an-top-card">
          <h3>Cần xử lý gấp (Yêu cầu gửi gần đây)</h3>
          
          {loadingRequests ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--neutral-500)' }}>
              Đang tải danh sách...
            </div>
          ) : pendingRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--neutral-500)' }}>
              Không có yêu cầu nào đang chờ xử lý.
            </div>
          ) : (
            <>
              {pendingRequests.map((item, index) => (
                <div key={item.id} className="staff-an-top-item">
                  <span className="staff-an-top-rank">#{(page - 1) * 5 + index + 1}</span>
                  <span className="staff-an-top-type music">
                    <Music size={12} />
                  </span>
                  <span className="staff-an-top-title">{item.songTitle}</span>
                  <span className="staff-an-top-count" style={{color: '#f59e0b', fontSize: '0.85rem'}}>
                    Gửi bởi: <UserNameResolver userId={item.requestedByUserId} />
                  </span>
                </div>
              ))}
              
              <div className="staff-an-pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                <button 
                  disabled={page <= 1} 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  style={{ background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '0.25rem 0.5rem', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.5 : 1 }}
                >
                  <ChevronLeft size={16} />
                </button>
                <span style={{ fontSize: '0.85rem', color: 'var(--neutral-400)' }}>
                  Trang {page} / {totalPages}
                </span>
                <button 
                  disabled={page >= totalPages} 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  style={{ background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '0.25rem 0.5rem', cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.5 : 1 }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {liveData && (
        <div className="staff-an-table-section">
          <h3 className="staff-an-table-title">
            Phân tích phiên phát sóng đã kết thúc
          </h3>
          <div className="staff-an-table-wrapper">
            <table className="staff-an-table">
              <thead>
                <tr>
                  <th>Tên phiên</th>
                  <th>Kết thúc lúc</th>
                  <th>Thời lượng</th>
                  <th>Người nghe</th>
                  <th>Yêu cầu nhạc</th>
                  <th style={{ textAlign: "right" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {liveData.endedSessionsAnalysis.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="no-data-msg"
                      style={{ textAlign: "center", padding: "2rem" }}
                    >
                      Chưa có phiên phát sóng nào kết thúc trong khoảng thời gian
                      này.
                    </td>
                  </tr>
                ) : (
                  liveData.endedSessionsAnalysis.map((session) => (
                    <tr key={session.sessionId}>
                      <td className="font-medium text-white">
                        {session.sessionName}
                      </td>
                      <td>
                        {session.endedAt
                          ? format(
                              new Date(session.endedAt),
                              "HH:mm dd/MM/yyyy",
                              { locale: vi },
                            )
                          : "N/A"}
                      </td>
                      <td>
                        {Math.floor(session.totalDurationMinutes / 60)}h{Math.floor(session.totalDurationMinutes % 60).toString().padStart(2, "0")}m
                      </td>
                      <td>{session.totalListeners}</td>
                      <td>{session.musicRequestsCount}</td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          className="lm-btn lm-btn--outline"
                          style={{ padding: "4px 12px", fontSize: "0.85rem" }}
                          onClick={() =>
                            navigate(`/staff/analytics/${session.sessionId}`)
                          }
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
