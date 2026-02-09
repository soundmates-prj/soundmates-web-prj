import { 
  Music, 
  Search, 
  Plus, 
  Filter,
  MoreVertical,
  Play,
  Heart,
  Download,
  Share2,
  Edit,
  Trash2,
  Upload,
  List,
  Grid,
  TrendingUp,
  Clock,
  Eye,
  MoreHorizontal,
  FolderPlus,
  ArrowUpDown,
  Check
} from 'lucide-react';
import { useState } from 'react';
import './MusicCatalog.css';
import {
  AddTrackModal,
  EditTrackModal,
  DeleteConfirmModal,
  CreatePlaylistModal,
  AddToPlaylistModal,
  AdvancedFilterModal,
  ImportCSVModal,
  ShareModal
} from './MusicCatalogModals';

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

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-icon">
        {icon}
      </div>
      <div>
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}</p>
      </div>
    </div>
  );
}

export function MusicCatalogScreen() {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedGenre, setSelectedGenre] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTracks, setSelectedTracks] = useState<number[]>([]);
  
  // Modal states
  const [showAddTrackModal, setShowAddTrackModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  
  // Action menu state
  const [activeActionMenu, setActiveActionMenu] = useState<number | null>(null);
  
  // Edit track data
  const [editingTrack, setEditingTrack] = useState<MusicTrack | null>(null);
  
  // Sort state
  const [sortBy, setSortBy] = useState<'title' | 'plays' | 'likes' | 'uploadDate'>('uploadDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredTracks = mockTracks.filter(track => {
    const matchesGenre = selectedGenre === 'Tất cả' || track.genre === selectedGenre;
    const matchesSearch = track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         track.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         track.album.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGenre && matchesSearch;
  }).sort((a, b) => {
    const order = sortOrder === 'asc' ? 1 : -1;
    switch (sortBy) {
      case 'title':
        return order * a.title.localeCompare(b.title);
      case 'plays':
        return order * (a.plays - b.plays);
      case 'likes':
        return order * (a.likes - b.likes);
      case 'uploadDate':
        return order * (new Date(a.uploadDate.split('/').reverse().join('-')).getTime() - 
                       new Date(b.uploadDate.split('/').reverse().join('-')).getTime());
      default:
        return 0;
    }
  });

  const toggleTrackSelection = (id: number) => {
    setSelectedTracks(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleEdit = (track: MusicTrack) => {
    setEditingTrack(track);
    setShowEditModal(true);
    setActiveActionMenu(null);
  };

  const handleDelete = (trackId: number) => {
    setSelectedTracks([trackId]);
    setShowDeleteModal(true);
    setActiveActionMenu(null);
  };

  const handleBulkDelete = () => {
    setShowDeleteModal(true);
  };

  const handleAddToPlaylist = () => {
    setShowAddToPlaylistModal(true);
  };

  const handleExport = () => {
    const csvContent = filteredTracks
      .filter(t => selectedTracks.length === 0 || selectedTracks.includes(t.id))
      .map(t => `${t.title},${t.artist},${t.album},${t.genre},${t.duration},${t.plays},${t.likes}`)
      .join('\n');
    
    const blob = new Blob([`Title,Artist,Album,Genre,Duration,Plays,Likes\n${csvContent}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'music-catalog.csv';
    a.click();
  };

  const handleShare = (track: MusicTrack) => {
    setEditingTrack(track);
    setShowShareModal(true);
    setActiveActionMenu(null);
  };

  return (
    <div className="music-catalog">
      {/* Header */}
      <div className="music-catalog-header">
        <div className="music-catalog-header-content">
          <div>
            <h2 className="music-catalog-title">Music Catalog</h2>
            <p className="music-catalog-subtitle">
              Quản lý thư viện nhạc, playlists và bài hát đề xuất
            </p>
          </div>
          <div className="music-catalog-header-actions">
            <button 
              onClick={() => setShowImportModal(true)}
              className="btn btn-secondary"
            >
              <Upload size={16} />
              Import CSV
            </button>
            <button 
              onClick={() => setShowAddTrackModal(true)}
              className="btn btn-primary"
            >
              <Plus size={16} />
              Thêm Bài Hát
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatCard
          icon={<Music size={20} style={{ color: '#55c5f1' }} />}
          label="Tổng Bài Hát"
          value="8,921"
          color=""
        />
        <StatCard
          icon={<List size={20} style={{ color: '#8CC5FA' }} />}
          label="Playlists"
          value="156"
          color=""
        />
        <StatCard
          icon={<TrendingUp size={20} style={{ color: '#D8F51A' }} />}
          label="Lượt Nghe Hôm Nay"
          value="45.8K"
          color=""
        />
        <StatCard
          icon={<Heart size={20} style={{ color: '#FB2C36' }} />}
          label="Lượt Thích"
          value="124K"
          color=""
        />
      </div>

      {/* Playlists Section */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Playlists Nổi Bật</h3>
          <button 
            onClick={() => setShowPlaylistModal(true)}
            className="card-link"
          >
            <Plus size={16} />
            Tạo Playlist Mới
          </button>
        </div>
        <div className="playlists-grid">
          {playlists.map((playlist) => (
            <div key={playlist.id} className="playlist-card">
              <div className={`playlist-cover ${playlist.cover}`}>
                <Music size={32} className="playlist-cover-icon" />
                <div className="playlist-cover-overlay">
                  <Play size={24} className="playlist-cover-play" />
                </div>
              </div>
              <h4 className="playlist-name">{playlist.name}</h4>
              <p className="playlist-tracks">{playlist.tracks} bài hát</p>
            </div>
          ))}
        </div>
      </div>

      {/* Music Library */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Thư Viện Nhạc</h3>
          <div className="view-toggle">
            <button 
              onClick={() => setViewMode('list')}
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
            >
              <List size={16} />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
            >
              <Grid size={16} />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="search-filters-bar">
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
          <button 
            onClick={() => setShowFilterModal(true)}
            className="btn btn-secondary"
          >
            <Filter size={16} />
            Lọc Nâng Cao
          </button>
          <button 
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="btn btn-secondary"
          >
            <ArrowUpDown size={16} />
            Sắp Xếp
          </button>
        </div>

        {/* Genre Filters */}
        <div className="genre-filters">
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`genre-filter-btn ${selectedGenre === genre ? 'active' : ''}`}
            >
              {genre}
            </button>
          ))}
        </div>

        {/* Selected Actions */}
        {selectedTracks.length > 0 && (
          <div className="selected-actions-bar">
            <span className="selected-count">
              Đã chọn {selectedTracks.length} bài hát
            </span>
            <div className="selected-actions">
              <button 
                onClick={handleAddToPlaylist}
                className="selected-action-btn light"
              >
                Thêm vào Playlist
              </button>
              <button 
                onClick={handleExport}
                className="selected-action-btn light"
              >
                Xuất
              </button>
              <button 
                onClick={handleBulkDelete}
                className="selected-action-btn danger"
              >
                Xóa
              </button>
            </div>
          </div>
        )}

        {/* Music List/Grid */}
        {viewMode === 'list' ? (
          <div className="music-table-wrapper">
            <table className="music-table">
              <thead>
                <tr>
                  <th style={{ width: '48px' }}>
                    <input 
                      type="checkbox" 
                      className="form-checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTracks(filteredTracks.map(t => t.id));
                        } else {
                          setSelectedTracks([]);
                        }
                      }}
                      checked={selectedTracks.length === filteredTracks.length && filteredTracks.length > 0}
                    />
                  </th>
                  <th>Bài Hát</th>
                  <th>Nghệ Sĩ</th>
                  <th>Album</th>
                  <th className="center">Thể Loại</th>
                  <th className="center">Thời Lượng</th>
                  <th className="center">Lượt Nghe</th>
                  <th className="center">Likes</th>
                  <th className="center">Ngày Tải Lên</th>
                  <th style={{ width: '48px' }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredTracks.map((track) => (
                  <tr key={track.id}>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={selectedTracks.includes(track.id)}
                        onChange={() => toggleTrackSelection(track.id)}
                        className="form-checkbox"
                      />
                    </td>
                    <td>
                      <div className="track-info">
                        <div className="track-cover">
                          <Music size={16} className="track-cover-icon" />
                          <Play size={16} className="track-cover-play" />
                        </div>
                        <div>
                          <p className="track-title">{track.title}</p>
                        </div>
                      </div>
                    </td>
                    <td><p className="track-text">{track.artist}</p></td>
                    <td><p className="track-text">{track.album}</p></td>
                    <td className="center">
                      <span className="genre-badge">{track.genre}</span>
                    </td>
                    <td className="center">
                      <div className="stat-cell">
                        <Clock size={14} className="stat-cell-icon" />
                        <span className="stat-cell-value">{track.duration}</span>
                      </div>
                    </td>
                    <td className="center">
                      <div className="stat-cell">
                        <Eye size={14} className="stat-cell-icon" />
                        <span className="stat-cell-value">{track.plays.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="center">
                      <div className="stat-cell">
                        <Heart size={14} className="stat-cell-icon" />
                        <span className="stat-cell-value">{track.likes.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="center">
                      <span className="track-text-small">{track.uploadDate}</span>
                    </td>
                    <td>
                      <div className="action-menu-wrapper">
                        <button 
                          onClick={() => setActiveActionMenu(activeActionMenu === track.id ? null : track.id)}
                          className="btn-icon btn-secondary"
                        >
                          <MoreVertical size={16} />
                        </button>
                        
                        {activeActionMenu === track.id && (
                          <div className="action-menu-dropdown">
                            <button onClick={() => handleEdit(track)} className="action-menu-item">
                              <Edit size={16} className="action-menu-item-icon" />
                              <span className="action-menu-item-text">Chỉnh sửa</span>
                            </button>
                            <button onClick={() => handleShare(track)} className="action-menu-item">
                              <Share2 size={16} className="action-menu-item-icon" />
                              <span className="action-menu-item-text">Chia sẻ</span>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedTracks([track.id]);
                                handleAddToPlaylist();
                              }}
                              className="action-menu-item"
                            >
                              <FolderPlus size={16} className="action-menu-item-icon" />
                              <span className="action-menu-item-text">Thêm vào Playlist</span>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedTracks([track.id]);
                                handleExport();
                              }}
                              className="action-menu-item"
                            >
                              <Download size={16} className="action-menu-item-icon" />
                              <span className="action-menu-item-text">Tải xuống</span>
                            </button>
                            <div className="action-menu-divider"></div>
                            <button onClick={() => handleDelete(track.id)} className="action-menu-item danger">
                              <Trash2 size={16} className="action-menu-item-icon" />
                              <span className="action-menu-item-text">Xóa</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="music-grid">
            {filteredTracks.map((track) => (
              <div key={track.id} className="track-card">
                <div className="track-card-cover-wrapper">
                  <div className="track-card-cover">
                    <Music size={32} className="track-card-cover-icon" />
                  </div>
                  <button className="track-card-play-overlay">
                    <Play size={32} className="track-card-play-icon" />
                  </button>
                  <input 
                    type="checkbox" 
                    checked={selectedTracks.includes(track.id)}
                    onChange={() => toggleTrackSelection(track.id)}
                    className="track-card-checkbox"
                  />
                  <button
                    onClick={() => setActiveActionMenu(activeActionMenu === track.id ? null : track.id)}
                    className="track-card-menu-btn"
                  >
                    <MoreHorizontal size={14} />
                  </button>
                </div>
                <h4 className="track-card-title">{track.title}</h4>
                <p className="track-card-artist">{track.artist}</p>
                <div className="track-card-stats">
                  <span className="track-card-duration">{track.duration}</span>
                  <div className="track-card-metrics">
                    <div className="track-card-metric">
                      <Eye size={12} className="track-card-metric-icon" />
                      <span className="track-card-metric-value">
                        {(track.plays / 1000).toFixed(1)}K
                      </span>
                    </div>
                    <div className="track-card-metric">
                      <Heart size={12} className="track-card-metric-icon" />
                      <span className="track-card-metric-value">
                        {(track.likes / 1000).toFixed(1)}K
                      </span>
                    </div>
                  </div>
                </div>
                
                {activeActionMenu === track.id && (
                  <div className="action-menu-dropdown">
                    <button onClick={() => handleEdit(track)} className="action-menu-item">
                      <Edit size={16} className="action-menu-item-icon" />
                      <span className="action-menu-item-text">Chỉnh sửa</span>
                    </button>
                    <button onClick={() => handleShare(track)} className="action-menu-item">
                      <Share2 size={16} className="action-menu-item-icon" />
                      <span className="action-menu-item-text">Chia sẻ</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedTracks([track.id]);
                        handleAddToPlaylist();
                      }}
                      className="action-menu-item"
                    >
                      <FolderPlus size={16} className="action-menu-item-icon" />
                      <span className="action-menu-item-text">Thêm vào Playlist</span>
                    </button>
                    <div className="action-menu-divider"></div>
                    <button onClick={() => handleDelete(track.id)} className="action-menu-item danger">
                      <Trash2 size={16} className="action-menu-item-icon" />
                      <span className="action-menu-item-text">Xóa</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="pagination-wrapper">
          <p className="pagination-info">
            Hiển thị {filteredTracks.length} trên tổng 8,921 bài hát
          </p>
          <div className="pagination-buttons">
            <button className="pagination-btn">Trước</button>
            <button className="pagination-btn active">1</button>
            <button className="pagination-btn">2</button>
            <button className="pagination-btn">3</button>
            <button className="pagination-btn">Sau</button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddTrackModal 
        isOpen={showAddTrackModal} 
        onClose={() => setShowAddTrackModal(false)} 
      />
      
      <EditTrackModal 
        isOpen={showEditModal} 
        onClose={() => {
          setShowEditModal(false);
          setEditingTrack(null);
        }}
        track={editingTrack}
      />
      
      <DeleteConfirmModal 
        isOpen={showDeleteModal} 
        onClose={() => {
          setShowDeleteModal(false);
          if (selectedTracks.length === 1) setSelectedTracks([]);
        }}
        count={selectedTracks.length}
        onConfirm={() => {
          setShowDeleteModal(false);
          setSelectedTracks([]);
        }}
      />
      
      <CreatePlaylistModal 
        isOpen={showPlaylistModal} 
        onClose={() => setShowPlaylistModal(false)} 
      />
      
      <AddToPlaylistModal 
        isOpen={showAddToPlaylistModal} 
        onClose={() => {
          setShowAddToPlaylistModal(false);
        }}
        trackCount={selectedTracks.length}
      />
      
      <AdvancedFilterModal 
        isOpen={showFilterModal} 
        onClose={() => setShowFilterModal(false)}
        onApply={(filters) => {
          setShowFilterModal(false);
        }}
      />
      
      <ImportCSVModal 
        isOpen={showImportModal} 
        onClose={() => setShowImportModal(false)} 
      />
      
      <ShareModal 
        isOpen={showShareModal} 
        onClose={() => {
          setShowShareModal(false);
          setEditingTrack(null);
        }}
        track={editingTrack}
      />
    </div>
  );
}
