import { useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Radio,
  Eye,
  RefreshCw,
  Music,
  CalendarDays,
  Clock3,
  Sparkles,
  ChevronDown,
  Search,
  X,
  Calendar,
  BarChart3,
  Activity,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "./HostAnalyticsScreen.css";

interface SessionItem {
  id: string;
  title: string;
  category: string;
  startedAt: string;
  endedAt: string;
  duration: string;
  viewers: number;
  peakViewers: number;
  requests: number;
  description: string;
  hostName: string;
  averageViewers: number;
  likes: number;
  comments: number;
}

const overviewSeries = [
  { day: "T2", viewers: 220 },
  { day: "T3", viewers: 310 },
  { day: "T4", viewers: 285 },
  { day: "T5", viewers: 420 },
  { day: "T6", viewers: 510 },
  { day: "T7", viewers: 690 },
  { day: "CN", viewers: 560 },
];

const endedSessions: SessionItem[] = [
  {
    id: "LS-001",
    title: "Chill Night Radio #23",
    category: "Chill • Lofi",
    startedAt: "31/05/2024 20:00",
    endedAt: "31/05/2024 22:15",
    duration: "2h 15m",
    viewers: 1248,
    peakViewers: 256,
    requests: 145,
    description:
      "Phiên live thư giãn buổi tối với các bản lofi chill, phù hợp để học tập và nghỉ ngơi.",
    hostName: "Linh Melody",
    averageViewers: 184,
    likes: 326,
    comments: 87,
  },
  {
    id: "LS-002",
    title: "Acoustic Vibes",
    category: "Acoustic • Live",
    startedAt: "28/05/2024 19:30",
    endedAt: "28/05/2024 21:30",
    duration: "2h 00m",
    viewers: 983,
    peakViewers: 198,
    requests: 112,
    description:
      "Một đêm acoustic nhẹ nhàng với những bản cover quen thuộc và tương tác cùng khán giả.",
    hostName: "Linh Melody",
    averageViewers: 151,
    likes: 245,
    comments: 64,
  },
  {
    id: "LS-003",
    title: "Jazz & Stories",
    category: "Jazz • Talkshow",
    startedAt: "26/05/2024 21:00",
    endedAt: "26/05/2024 23:10",
    duration: "2h 10m",
    viewers: 1102,
    peakViewers: 234,
    requests: 134,
    description:
      "Kết hợp âm nhạc jazz và chia sẻ câu chuyện đêm khuya, tạo cảm giác gần gũi và sâu lắng.",
    hostName: "Linh Melody",
    averageViewers: 167,
    likes: 281,
    comments: 73,
  },
  {
    id: "LS-004",
    title: "90s Retro Night",
    category: "Retro • Music",
    startedAt: "23/05/2024 20:15",
    endedAt: "23/05/2024 22:20",
    duration: "2h 05m",
    viewers: 862,
    peakViewers: 176,
    requests: 98,
    description:
      "Phiên live chủ đề hoài niệm với các ca khúc retro nổi bật của thập niên 90.",
    hostName: "Linh Melody",
    averageViewers: 132,
    likes: 214,
    comments: 51,
  },
  {
    id: "LS-005",
    title: "Rainy Lofi Session",
    category: "Lofi • Chill",
    startedAt: "21/05/2024 19:00",
    endedAt: "21/05/2024 21:05",
    duration: "2h 05m",
    viewers: 1336,
    peakViewers: 278,
    requests: 156,
    description:
      "Không gian âm nhạc lofi kết hợp visual mưa đêm, phù hợp cho người thích không khí yên tĩnh.",
    hostName: "Linh Melody",
    averageViewers: 196,
    likes: 352,
    comments: 92,
  },
];

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: React.ReactNode;
  tone?: "purple" | "blue" | "green" | "orange";
}

function MetricCard({
  title,
  value,
  change,
  isPositive,
  icon,
  tone = "purple",
}: MetricCardProps) {
  return (
    <div className={`host-an-card host-an-card--${tone}`}>
      <div className="host-an-card__icon">{icon}</div>
      <div className="host-an-card__content">
        <span className="host-an-card__label">{title}</span>
        <span className="host-an-card__value">{value}</span>
        <div
          className={`host-an-card__change ${isPositive ? "positive" : "negative"}`}
        >
          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span>{change} so với kỳ trước</span>
        </div>
      </div>
    </div>
  );
}

interface DetailModalProps {
  session: SessionItem | null;
  open: boolean;
  onClose: () => void;
}

function DetailModal({ session, open, onClose }: DetailModalProps) {
  if (!open || !session) return null;

  return (
    <div className="host-an-modal-overlay" onClick={onClose}>
      <div
        className="host-an-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="host-an-modal__header">
          <div className="host-an-modal__title-wrap">
            <div className="host-an-modal__icon">
              <Radio size={18} />
            </div>
            <div>
              <h3>{session.title}</h3>
              <p>{session.category}</p>
            </div>
          </div>

          <button
            type="button"
            className="host-an-modal__close"
            onClick={onClose}
            aria-label="Đóng modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="host-an-modal__body">
          <div className="host-an-modal__intro">
            <div className="host-an-modal__status">Ended</div>
            <p>{session.description}</p>
          </div>

          <div className="host-an-detail-grid">
            <div className="host-an-detail-card">
              <div className="host-an-detail-card__label">
                <Calendar size={15} />
                Thời gian bắt đầu
              </div>
              <strong>{session.startedAt}</strong>
            </div>

            <div className="host-an-detail-card">
              <div className="host-an-detail-card__label">
                <Calendar size={15} />
                Thời gian kết thúc
              </div>
              <strong>{session.endedAt}</strong>
            </div>

            <div className="host-an-detail-card">
              <div className="host-an-detail-card__label">
                <Clock3 size={15} />
                Thời lượng
              </div>
              <strong>{session.duration}</strong>
            </div>

            <div className="host-an-detail-card">
              <div className="host-an-detail-card__label">
                <Users size={15} />
                Host
              </div>
              <strong>{session.hostName}</strong>
            </div>
          </div>

          <div className="host-an-modal-stats">
            <div className="host-an-modal-stat">
              <span className="host-an-modal-stat__icon purple">
                <Eye size={16} />
              </span>
              <div>
                <label>Total Views</label>
                <strong>{session.viewers.toLocaleString("en-US")}</strong>
              </div>
            </div>

            <div className="host-an-modal-stat">
              <span className="host-an-modal-stat__icon green">
                <BarChart3 size={16} />
              </span>
              <div>
                <label>Peak Viewers</label>
                <strong>{session.peakViewers.toLocaleString("en-US")}</strong>
              </div>
            </div>

            <div className="host-an-modal-stat">
              <span className="host-an-modal-stat__icon orange">
                <Music size={16} />
              </span>
              <div>
                <label>Total Requests</label>
                <strong>{session.requests.toLocaleString("en-US")}</strong>
              </div>
            </div>

            <div className="host-an-modal-stat">
              <span className="host-an-modal-stat__icon blue">
                <Activity size={16} />
              </span>
              <div>
                <label>Average Viewers</label>
                <strong>
                  {session.averageViewers.toLocaleString("en-US")}
                </strong>
              </div>
            </div>
          </div>

          <div className="host-an-modal-panels">
            <div className="host-an-modal-panel">
              <h4>Tương tác</h4>
              <div className="host-an-meta-list">
                <div className="host-an-meta-row">
                  <span>Lượt thích</span>
                  <strong>{session.likes.toLocaleString("en-US")}</strong>
                </div>
                <div className="host-an-meta-row">
                  <span>Bình luận</span>
                  <strong>{session.comments.toLocaleString("en-US")}</strong>
                </div>
                <div className="host-an-meta-row">
                  <span>Yêu cầu bài hát</span>
                  <strong>{session.requests.toLocaleString("en-US")}</strong>
                </div>
              </div>
            </div>

            <div className="host-an-modal-panel">
              <h4>Tóm tắt phiên live</h4>
              <div className="host-an-meta-list">
                <div className="host-an-meta-row">
                  <span>Mã phiên live</span>
                  <strong>{session.id}</strong>
                </div>
                <div className="host-an-meta-row">
                  <span>Chủ đề</span>
                  <strong>{session.category}</strong>
                </div>
                <div className="host-an-meta-row">
                  <span>Trạng thái</span>
                  <strong>Ended</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="host-an-modal__footer">
          <button
            type="button"
            className="host-an-btn host-an-btn--ghost"
            onClick={onClose}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export function HostAnalyticsScreen() {
  const [search, setSearch] = useState("");
  const [selectedSession, setSelectedSession] = useState<SessionItem | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredSessions = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return endedSessions.filter((item) => {
      return (
        item.title.toLowerCase().includes(keyword) ||
        item.category.toLowerCase().includes(keyword)
      );
    });
  }, [search]);

  const summary = useMemo(() => {
    const totalSessions = endedSessions.length;
    const totalViews = endedSessions.reduce(
      (sum, item) => sum + item.viewers,
      0,
    );
    const totalPeak = endedSessions.reduce(
      (sum, item) => sum + item.peakViewers,
      0,
    );
    const totalRequests = endedSessions.reduce(
      (sum, item) => sum + item.requests,
      0,
    );

    return {
      totalSessions,
      totalViews,
      totalPeak,
      totalRequests,
    };
  }, []);

  const handleViewDetail = (session: SessionItem) => {
    setSelectedSession(session);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSession(null);
  };

  return (
    <div className="host-an-page">
      <div className="host-an-shell">
        <div className="host-an-header">
          <div className="host-an-header__left">
            <div className="host-an-badge">
              <Sparkles size={14} />
              Host Analytics
            </div>
            <h1>Phân tích phiên live đã kết thúc</h1>
            <p>
              Theo dõi hiệu suất các phiên phát sóng gần đây với dữ liệu tổng
              quan và thống kê các session đã kết thúc.
            </p>
          </div>

          <div className="host-an-header__actions">
            <button className="host-an-btn host-an-btn--ghost">
              <CalendarDays size={16} />
              30 ngày gần nhất
              <ChevronDown size={14} />
            </button>

            <button className="host-an-btn host-an-btn--primary">
              <RefreshCw size={16} />
              Làm mới
            </button>
          </div>
        </div>

        <div className="host-an-stats-grid">
          <MetricCard
            title="Ended Sessions"
            value={String(summary.totalSessions)}
            change="+14.0%"
            isPositive={true}
            icon={<Radio size={20} />}
            tone="purple"
          />
          <MetricCard
            title="Total Views"
            value={summary.totalViews.toLocaleString("en-US")}
            change="+18.6%"
            isPositive={true}
            icon={<Eye size={20} />}
            tone="blue"
          />
          <MetricCard
            title="Peak Viewers"
            value={summary.totalPeak.toLocaleString("en-US")}
            change="+12.4%"
            isPositive={true}
            icon={<Users size={20} />}
            tone="green"
          />
          <MetricCard
            title="Total Requests"
            value={summary.totalRequests.toLocaleString("en-US")}
            change="+21.3%"
            isPositive={true}
            icon={<Music size={20} />}
            tone="orange"
          />
        </div>

        <div className="host-an-panel host-an-panel--compact-chart">
          <div className="host-an-panel__head">
            <div>
              <h3>Hiệu suất theo ngày</h3>
              <p>Lượt xem trong 7 ngày gần nhất</p>
            </div>
          </div>

          <div className="host-an-chart-wrap host-an-chart-wrap--compact">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={overviewSeries}>
                <defs>
                  <linearGradient id="hostAnArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(148, 163, 184, 0.16)"
                />
                <XAxis
                  dataKey="day"
                  stroke="#94a3b8"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="viewers"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  fill="url(#hostAnArea)"
                  name="Views"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="host-an-panel host-an-panel--table">
          <div className="host-an-panel__head host-an-panel__head--table">
            <div>
              <h3>Danh sách phiên live đã kết thúc</h3>
              <p>{filteredSessions.length} phiên phù hợp với bộ lọc hiện tại</p>
            </div>
          </div>

          <div className="host-an-table-toolbar">
            <div className="host-an-search-wrap">
              <Search size={16} className="host-an-search-icon" />
              <input
                type="text"
                className="host-an-search-input"
                placeholder="Tìm kiếm theo tên phiên live hoặc chủ đề..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="host-an-table-wrap">
            <table className="host-an-table">
              <thead>
                <tr>
                  <th>Live Session</th>
                  <th>Thời gian bắt đầu</th>
                  <th>Thời gian kết thúc</th>
                  <th>Thời lượng</th>
                  <th>Views</th>
                  <th>Peak</th>
                  <th>Requests</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="host-an-session-cell">
                        <div className="host-an-session-thumb">
                          <Radio size={16} />
                        </div>
                        <div className="host-an-session-meta">
                          <strong>{item.title}</strong>
                          <span>{item.category}</span>
                        </div>
                      </div>
                    </td>
                    <td>{item.startedAt}</td>
                    <td>{item.endedAt}</td>
                    <td>
                      <span className="host-an-duration">
                        <Clock3 size={14} />
                        {item.duration}
                      </span>
                    </td>
                    <td>{item.viewers.toLocaleString("en-US")}</td>
                    <td>{item.peakViewers.toLocaleString("en-US")}</td>
                    <td>{item.requests.toLocaleString("en-US")}</td>
                    <td>
                      <button
                        type="button"
                        className="host-an-action-btn"
                        onClick={() => handleViewDetail(item)}
                        title="Xem chi tiết"
                      >
                        <Eye size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredSessions.length === 0 && (
              <div className="host-an-empty">Không có dữ liệu phù hợp.</div>
            )}
          </div>
        </div>
      </div>

      <DetailModal
        open={isModalOpen}
        session={selectedSession}
        onClose={handleCloseModal}
      />
    </div>
  );
}
