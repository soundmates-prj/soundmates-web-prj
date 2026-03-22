import { 
  Music, 
  RefreshCw,
  Plus,
  TrendingUp
} from 'lucide-react';
import './MusicCatalog.css';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend?: { value: string; positive: boolean };
}

function StatCard({ icon, label, value, trend }: StatCardProps) {
  return (
    <div className="lm-stat-card">
      <div className="lm-stat-icon">
        {icon}
      </div>
      <div className="lm-stat-content">
        <span className="lm-stat-label">{label}</span>
        <span className="lm-stat-value">{value}</span>
        {trend && (
          <div className={`lm-stat-change ${trend.positive ? 'positive' : 'negative'}`}>
            <TrendingUp size={12} />
            <span>{trend.value}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function MusicCatalogScreen() {
  return (
    <div className="lm-page">
      {/* Header */}
      <div className="lm-header">
        <div className="lm-header-left">
          <h1>Thư viện nhạc</h1>
          <p>Quản lý bài hát, album và playlist</p>
        </div>
        <div className="lm-header-actions">
          <button className="lm-btn lm-btn--outline">
            <RefreshCw size={15} />
            Làm mới
          </button>
          <button className="lm-btn lm-btn--primary">
            <Plus size={15} />
            Thêm bài hát
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="lm-stats-grid">
        <StatCard
          icon={<Music size={20} />}
          label="Tổng bài hát"
          value="0"
        />
        <StatCard
          icon={<Music size={20} />}
          label="Album"
          value="0"
        />
        <StatCard
          icon={<Music size={20} />}
          label="Playlist"
          value="0"
        />
        <StatCard
          icon={<Music size={20} />}
          label="Nghệ sĩ"
          value="0"
        />
      </div>

      {/* Empty state */}
      <div className="lm-empty">
        <Music size={48} />
        <p>Chưa có API backend cho Music Catalog</p>
        <p style={{ fontSize: '12px', marginTop: '8px', color: '#64748b' }}>
          Vui lòng implement API backend trước
        </p>
      </div>
    </div>
  );
}
