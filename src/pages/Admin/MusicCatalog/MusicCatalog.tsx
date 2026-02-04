import { 
  Music, 
  Search, 
  Plus, 
  Filter,
  MoreVertical,
  Play,
  Heart,
  Upload,
  List,
  Grid,
  TrendingUp,
  Clock,
  Eye
} from 'lucide-react';
import { useState } from 'react';
import './MusicCatalog.css';

interface MusicTrack {
  id: number;
  title: string;
  artist: string;
  album: string;
  duration: string;
  genre: string;
  plays: number;
  likes: number;
  uploadDate: string;
  coverUrl?: string;
}

const mockTracks: MusicTrack[] = [
  { id: 1, title: 'Moonlight Sonata', artist: 'Ludwig van Beethoven', album: 'Classical Essentials', duration: '5:23', genre: 'Cổ Điển', plays: 12847, likes: 3421, uploadDate: '15/01/2026' },
  { id: 2, title: 'Autumn Leaves', artist: 'Bill Evans', album: 'Portrait in Jazz', duration: '4:47', genre: 'Jazz', plays: 9876, likes: 2678, uploadDate: '14/01/2026' },
  { id: 3, title: 'Wonderwall', artist: 'Oasis', album: 'Acoustic Sessions', duration: '4:18', genre: 'Acoustic', plays: 8934, likes: 2234, uploadDate: '13/01/2026' },
  { id: 4, title: 'Neon Lights', artist: 'DJ Shadow', album: 'Electronic Dreams', duration: '6:12', genre: 'EDM', plays: 7621, likes: 1876, uploadDate: '12/01/2026' },
  { id: 5, title: 'Em Của Ngày Hôm Qua', artist: 'Sơn Tùng MTP', album: 'Vietnamese Hits', duration: '3:55', genre: 'Nhạc Việt', plays: 15234, likes: 4567, uploadDate: '11/01/2026' },
  { id: 6, title: 'Blue in Green', artist: 'Miles Davis', album: 'Kind of Blue', duration: '5:37', genre: 'Jazz', plays: 6543, likes: 1654, uploadDate: '10/01/2026' },
  { id: 7, title: 'Clair de Lune', artist: 'Claude Debussy', album: 'Suite Bergamasque', duration: '4:52', genre: 'Cổ Điển', plays: 11234, likes: 3012, uploadDate: '09/01/2026' },
  { id: 8, title: 'The Scientist', artist: 'Coldplay', album: 'A Rush of Blood', duration: '5:09', genre: 'Acoustic', plays: 9421, likes: 2456, uploadDate: '08/01/2026' },
];

const genres = ['Tất cả', 'Cổ Điển', 'Jazz', 'Acoustic', 'EDM', 'Nhạc Việt', 'Rock', 'Podcast'];

const playlists = [
  { id: 1, name: 'Aethereal Flow', tracks: 24, cover: 'gradient-1' },
  { id: 2, name: 'Celestial Waves', tracks: 18, cover: 'gradient-2' },
  { id: 3, name: 'Đêm Cổ Điển', tracks: 32, cover: 'gradient-3' },
  { id: 4, name: 'Jazz Collection', tracks: 45, cover: 'gradient-4' },
  { id: 5, name: 'Acoustic Vibes', tracks: 27, cover: 'gradient-5' },
];

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <div className="music-stat-card">
      <div className={`music-stat-icon ${color}`}>
        {icon}
      </div>
      <div className="music-stat-content">
        <p className="music-stat-label">{label}</p>
        <p className="music-stat-value">{value}</p>
      </div>
    </div>
  );
}

export default function MusicCatalog() {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedGenre, setSelectedGenre] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTracks, setSelectedTracks] = useState<number[]>([]);

  const filteredTracks = mockTracks.filter(track => {
    const matchesGenre = selectedGenre === 'Tất cả' || track.genre === selectedGenre;
    const matchesSearch = track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         track.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         track.album.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGenre && matchesSearch;
  });

  const toggleTrackSelection = (id: number) => {
    setSelectedTracks(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  return (
    <div className="music-catalog">
      {/* Header */}
      <div className="music-header">
        <div className="music-header-content">
          <div>
            <h2 className="music-title">
              Music Catalog
            </h2>
            <p className="music-subtitle">
              Quản lý thư viện nhạc, playlists và bài hát đề xuất
            </p>
          </div>
          <div className="music-header-actions">
            <button className="btn-secondary">
              <Upload size={16} />
              Import CSV
            </button>
            <button className="btn-primary">
              <Plus size={16} />
              Thêm Bài Hát
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="music-stats-grid">
        <StatCard
          icon={<Music size={20} />}
          label="Tổng Bài Hát"
          value="8,921"
          color="stat-blue"
        />
        <StatCard
          icon={<List size={20} />}
          label="Playlists"
          value="156"
          color="stat-blue"
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          label="Lượt Nghe Hôm Nay"
          value="45.8K"
          color="stat-yellow"
        />
        <StatCard
          icon={<Heart size={20} />}
          label="Lượt Thích"
          value="124K"
          color="stat-red"
        />
      </div>

      {/* Playlists Section */}
      <div className="playlists-section">
        <div className="section-header">
          <h3 className="section-title">Playlists Nổi Bật</h3>
          <button className="link-button">Quản lý tất cả</button>
        </div>
        <div className="playlists-grid">
          {playlists.map((playlist) => (
            <div key={playlist.id} className="playlist-card">
              <div className={`playlist-cover ${playlist.cover}`}>
                <Music size={32} className="playlist-cover-icon" />
                <div className="playlist-overlay">
                  <Play size={24} className="play-icon" />
                </div>
              </div>
              <h4 className="playlist-name">{playlist.name}</h4>
              <p className="playlist-tracks">{playlist.tracks} bài hát</p>
            </div>
          ))}
        </div>
      </div>

      {/* Music Library */}
      <div className="music-library">
        <div className="library-header">
          <h3 className="section-title">Thư Viện Nhạc</h3>
          <div className="view-mode-buttons">
            <button 
              onClick={() => setViewMode('list')}
              className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
            >
              <List size={16} />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
            >
              <Grid size={16} />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="search-filter-bar">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên bài hát, nghệ sĩ, album..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <button className="filter-button">
            <Filter size={16} />
            Lọc
          </button>
        </div>

        {/* Genre Filters */}
        <div className="genre-filters">
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`genre-btn ${selectedGenre === genre ? 'active' : ''}`}
            >
              {genre}
            </button>
          ))}
        </div>

        {/* Selected Actions */}
        {selectedTracks.length > 0 && (
          <div className="selected-actions">
            <span className="selected-count">
              Đã chọn {selectedTracks.length} bài hát
            </span>
            <div className="selected-action-buttons">
              <button className="action-btn">Thêm vào Playlist</button>
              <button className="action-btn">Xuất</button>
              <button className="action-btn delete">Xóa</button>
            </div>
          </div>
        )}

        {/* Music List */}
        {viewMode === 'list' ? (
          <div className="music-table-wrapper">
            <table className="music-table">
              <thead>
                <tr>
                  <th className="col-checkbox">
                    <input 
                      type="checkbox" 
                      className="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTracks(filteredTracks.map(t => t.id));
                        } else {
                          setSelectedTracks([]);
                        }
                      }}
                    />
                  </th>
                  <th className="col-track">Bài Hát</th>
                  <th className="col-artist">Nghệ Sĩ</th>
                  <th className="col-album">Album</th>
                  <th className="col-genre">Thể Loại</th>
                  <th className="col-duration">Thời Lượng</th>
                  <th className="col-plays">Lượt Nghe</th>
                  <th className="col-likes">Likes</th>
                  <th className="col-date">Ngày Tải Lên</th>
                  <th className="col-actions"></th>
                </tr>
              </thead>
              <tbody>
                {filteredTracks.map((track) => (
                  <tr key={track.id} className="track-row">
                    <td className="col-checkbox">
                      <input 
                        type="checkbox" 
                        checked={selectedTracks.includes(track.id)}
                        onChange={() => toggleTrackSelection(track.id)}
                        className="checkbox"
                      />
                    </td>
                    <td className="col-track">
                      <div className="track-info">
                        <div className="track-cover">
                          <Music size={16} className="track-cover-icon" />
                          <Play size={16} className="track-play-icon" />
                        </div>
                        <div>
                          <p className="track-title">{track.title}</p>
                        </div>
                      </div>
                    </td>
                    <td className="col-artist">
                      <p className="track-artist">{track.artist}</p>
                    </td>
                    <td className="col-album">
                      <p className="track-album">{track.album}</p>
                    </td>
                    <td className="col-genre">
                      <span className="genre-badge">{track.genre}</span>
                    </td>
                    <td className="col-duration">
                      <div className="duration-cell">
                        <Clock size={14} className="icon" />
                        <span>{track.duration}</span>
                      </div>
                    </td>
                    <td className="col-plays">
                      <div className="plays-cell">
                        <Eye size={14} className="icon" />
                        <span>{track.plays.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="col-likes">
                      <div className="likes-cell">
                        <Heart size={14} className="icon" />
                        <span>{track.likes.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="col-date">
                      <span className="track-date">{track.uploadDate}</span>
                    </td>
                    <td className="col-actions">
                      <button className="more-button">
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Grid View */
          <div className="music-grid">
            {filteredTracks.map((track) => (
              <div key={track.id} className="track-card">
                <div className="track-card-cover-wrapper">
                  <div className="track-card-cover">
                    <Music size={32} className="cover-icon" />
                  </div>
                  <button className="track-card-play">
                    <Play size={32} className="play-icon" />
                  </button>
                  <input 
                    type="checkbox" 
                    checked={selectedTracks.includes(track.id)}
                    onChange={() => toggleTrackSelection(track.id)}
                    className="track-card-checkbox"
                  />
                </div>
                <h4 className="track-card-title">{track.title}</h4>
                <p className="track-card-artist">{track.artist}</p>
                <div className="track-card-stats">
                  <span className="track-card-duration">{track.duration}</span>
                  <div className="track-card-metrics">
                    <div className="metric">
                      <Eye size={12} />
                      <span>{(track.plays / 1000).toFixed(1)}K</span>
                    </div>
                    <div className="metric">
                      <Heart size={12} />
                      <span>{(track.likes / 1000).toFixed(1)}K</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="pagination">
          <p className="pagination-info">
            Hiển thị {filteredTracks.length} trên tổng 8,921 bài hát
          </p>
          <div className="pagination-buttons">
            <button className="page-btn">Trước</button>
            <button className="page-btn active">1</button>
            <button className="page-btn">2</button>
            <button className="page-btn">3</button>
            <button className="page-btn">Sau</button>
          </div>
        </div>
      </div>
    </div>
  );
}
