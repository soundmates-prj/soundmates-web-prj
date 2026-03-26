import { useEffect, useMemo, useState } from "react";
import { Activity, ListMusic, Radio, RefreshCw, Signal, TowerControl } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { liveSessionApiService, type StaffDashboardOverviewResult } from "../../../services/liveSessionApiService";
import { showError } from "../../../components/common/toastUtils";
import "./LiveOps.css";

type DashboardStats = {
  activeSessions: number;
  listeners: number;
  stations: number;
  playlists: number;
  media: number;
};

const emptyOverview: StaffDashboardOverviewResult = {
  totalStations: 0,
  stationsCreatedToday: 0,
  totalSessions: 0,
  liveSessions: 0,
  listenersToday: 0,
  dailyListeners: [],
};

export default function DashboardPage() {
  const [overview, setOverview] = useState<StaffDashboardOverviewResult>(emptyOverview);
  const [stats, setStats] = useState<DashboardStats>({
    activeSessions: 0,
    listeners: 0,
    stations: 0,
    playlists: 0,
    media: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [overviewData, stations, media, activeSessions] = await Promise.all([
        liveSessionApiService.getStaffDashboardOverview(7),
        liveSessionApiService.getStations(),
        liveSessionApiService.getAllMusic(),
        liveSessionApiService.getActiveSessions(),
      ]);

      const playlistsPerStation = await Promise.all(
        stations.map((station) => liveSessionApiService.getStationPlaylists(station.id).catch(() => []))
      );

      const playlists = playlistsPerStation.reduce((acc, items) => acc + items.length, 0);

      setOverview(overviewData);
      setStats({
        activeSessions: activeSessions.length,
        listeners: overviewData.listenersToday,
        stations: stations.length,
        playlists,
        media: media.length,
      });
    } catch {
      showError("Lỗi tải Dashboard", "Không thể lấy dữ liệu tổng quan từ live-session-service");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const chartData = useMemo(
    () => overview.dailyListeners.map((item) => ({ day: item.date, listeners: item.listenerCount })),
    [overview.dailyListeners]
  );

  return (
    <div className="ops-page">
      <div className="ops-header">
        <div>
          <h1 className="ops-title">Tổng quan Dashboard</h1>
          <p className="ops-subtitle">Tổng quan vận hành realtime từ Live Session Service</p>
        </div>
        <div className="ops-actions">
          <button className="ops-btn ops-btn--ghost" onClick={loadDashboard} disabled={loading}>
            <RefreshCw size={15} className={loading ? "staff-spin" : ""} />
            Làm mới
          </button>
        </div>
      </div>

      <div className="ops-grid" style={{ marginBottom: 14 }}>
        <div className="ops-card">
          <p className="ops-card-title">Phiên đang hoạt động</p>
          <div className="ops-stat-value">{stats.activeSessions}</div>
          <span className="ops-badge"><Radio size={12} /> Đang hoạt động</span>
        </div>
        <div className="ops-card">
          <p className="ops-card-title">Người nghe hôm nay</p>
          <div className="ops-stat-value">{stats.listeners}</div>
          <span className="ops-badge"><Activity size={12} /> Theo ngày</span>
        </div>
        <div className="ops-card">
          <p className="ops-card-title">Đài phát</p>
          <div className="ops-stat-value">{stats.stations}</div>
          <span className="ops-badge"><TowerControl size={12} /> Kênh phát</span>
        </div>
        <div className="ops-card">
          <p className="ops-card-title">Playlists</p>
          <div className="ops-stat-value">{stats.playlists}</div>
          <span className="ops-badge"><ListMusic size={12} /> Tổng playlist</span>
        </div>
        <div className="ops-card">
          <p className="ops-card-title">Số lượng media</p>
          <div className="ops-stat-value">{stats.media}</div>
          <span className="ops-badge"><Signal size={12} /> File nhạc</span>
        </div>
      </div>

      <div className="ops-card">
        <h3 className="ops-card-title">Xu hướng người nghe 7 ngày</h3>
        {loading ? (
          <div className="ops-stack">
            <div className="ops-skeleton" />
            <div className="ops-skeleton" />
            <div className="ops-skeleton" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="ops-empty">Chưa có dữ liệu listeners</div>
        ) : (
          <div className="ops-kpi-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="day" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Line type="monotone" dataKey="listeners" stroke="#0ea5e9" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
