import { useState, useEffect } from "react";
import {
  Radio,
  ListMusic,
  Disc3,
  Users,
  RefreshCw,
  TrendingUp,
  Clock,
  Zap,
} from "lucide-react";
import { liveSessionApiService } from "../../../services/liveSessionApiService";
import type {
  StationResult,
  LiveSessionResult,
} from "../../../services/liveSessionApiService";
import { showError } from "../../../components/common/toastUtils";
import "./StaffDashboard.css";

interface QuickStat {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

export function StaffDashboard() {
  const [stations, setStations] = useState<StationResult[]>([]);
  const [recentSessions, setRecentSessions] = useState<LiveSessionResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [stationsData, sessionsData] = await Promise.allSettled([
        liveSessionApiService.getStations(),
        liveSessionApiService.getLiveSessions({ pageSize: 5 }),
      ]);
      if (stationsData.status === "fulfilled") setStations(stationsData.value);
      if (sessionsData.status === "fulfilled") setRecentSessions(sessionsData.value.items);
    } catch {
      showError("Lỗi", "Không thể tải dữ liệu dashboard");
    } finally {
      setLoading(false);
    }
  };

  const liveSessions = recentSessions.filter((s) => s.status === "Live");
  const totalListeners = liveSessions.reduce((sum, s) => sum + s.totalListeners, 0);

  const quickStats: QuickStat[] = [
    {
      label: "Stations",
      value: stations.length,
      icon: <Radio size={22} />,
      color: "#7C5CFC",
    },
    {
      label: "Đang phát sóng",
      value: liveSessions.length,
      icon: <Disc3 size={22} />,
      color: "#34D399",
    },
    {
      label: "Tổng sessions",
      value: recentSessions.length,
      icon: <ListMusic size={22} />,
      color: "#F59E0B",
    },
    {
      label: "Listeners",
      value: totalListeners,
      icon: <Users size={22} />,
      color: "#55C5F1",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Live":
        return <span className="staff-badge staff-badge--live">LIVE</span>;
      case "Scheduled":
        return <span className="staff-badge staff-badge--scheduled">Scheduled</span>;
      case "Ended":
        return <span className="staff-badge staff-badge--ended">Ended</span>;
      default:
        return <span className="staff-badge staff-badge--draft">{status}</span>;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="staff-loading">
        <RefreshCw size={24} className="staff-spin" />
        <p>Đang tải dashboard...</p>
      </div>
    );
  }

  return (
    <div className="staff-dashboard">
      {/* Header */}
      <div className="staff-page-header">
        <div>
          <h1 className="staff-page-title">Xin chào! 👋</h1>
          <p className="staff-page-subtitle">
            Đây là tổng quan hệ thống phát sóng của bạn hôm nay
          </p>
        </div>
        <button className="staff-btn staff-btn--outline" onClick={loadDashboard}>
          <RefreshCw size={16} />
          Làm mới
        </button>
      </div>

      {/* Quick Stats */}
      <div className="staff-stats-grid">
        {quickStats.map((stat) => (
          <div className="staff-stat-card" key={stat.label}>
            <div
              className="staff-stat-icon"
              style={{ background: `${stat.color}18`, color: stat.color }}
            >
              {stat.icon}
            </div>
            <div className="staff-stat-content">
              <span className="staff-stat-value">{stat.value}</span>
              <span className="staff-stat-label">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Two-column grid */}
      <div className="staff-dashboard-grid">
        {/* Stations */}
        <div className="staff-card">
          <div className="staff-card-header">
            <h3>
              <Radio size={18} /> Stations
            </h3>
          </div>
          <div className="staff-card-body">
            {stations.length === 0 ? (
              <p className="staff-empty">Chưa có station nào. Hãy Sync từ AzuraCast.</p>
            ) : (
              stations.map((s) => (
                <div className="staff-list-item" key={s.id}>
                  <div className="staff-list-dot" style={{ background: s.isEnabled ? "#34D399" : "#94a3b8" }} />
                  <div className="staff-list-info">
                    <span className="staff-list-title">{s.stationName}</span>
                    <span className="staff-list-sub">
                      {s.stationShortcode || "No shortcode"} · {s.syncStatus}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="staff-card">
          <div className="staff-card-header">
            <h3>
              <Clock size={18} /> Sessions gần đây
            </h3>
          </div>
          <div className="staff-card-body">
            {recentSessions.length === 0 ? (
              <p className="staff-empty">Chưa có session nào</p>
            ) : (
              recentSessions.map((s) => (
                <div className="staff-list-item" key={s.id}>
                  {getStatusBadge(s.status)}
                  <div className="staff-list-info">
                    <span className="staff-list-title">{s.sessionName}</span>
                    <span className="staff-list-sub">
                      {s.stationName || "Unknown"} · {formatDate(s.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="staff-card">
        <div className="staff-card-header">
          <h3>
            <Zap size={18} /> Thao tác nhanh
          </h3>
        </div>
        <div className="staff-quick-actions">
          <a href="/staff/stations" className="staff-action-btn">
            <Radio size={20} />
            <span>Quản lý Stations</span>
            <TrendingUp size={14} className="staff-action-arrow" />
          </a>
          <a href="/staff/playlists" className="staff-action-btn">
            <ListMusic size={20} />
            <span>Quản lý Playlists</span>
            <TrendingUp size={14} className="staff-action-arrow" />
          </a>
          <a href="/staff/sessions" className="staff-action-btn">
            <Disc3 size={20} />
            <span>Tạo Live Session</span>
            <TrendingUp size={14} className="staff-action-arrow" />
          </a>
        </div>
      </div>
    </div>
  );
}

export default StaffDashboard;
