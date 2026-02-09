import { 
  X,
  Upload,
  Image as ImageIcon,
  Save,
  Check,
  AlertCircle,
  Copy,
  ExternalLink,
  Music,
  Plus
} from 'lucide-react';
import { useState } from 'react';
import './MusicCatalog.css';

// Modal Base Component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
}

function Modal({ isOpen, onClose, title, children, size = 'medium' }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className={`modal-content ${size}`}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button onClick={onClose} className="modal-close-btn">
            <X size={20} style={{ color: '#64748b' }} />
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}

// Add Track Modal
export function AddTrackModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    album: '',
    genre: 'Cổ Điển',
    duration: '',
    audioFile: null as File | null,
    coverImage: null as File | null,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Adding track:', formData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Thêm Bài Hát Mới">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Ảnh Bìa</label>
          <div className="upload-area">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFormData({ ...formData, coverImage: e.target.files?.[0] || null })}
              className="upload-input"
              id="coverImage"
            />
            <label htmlFor="coverImage" style={{ cursor: 'pointer' }}>
              <ImageIcon size={40} className="upload-area-icon" />
              <p className="upload-area-title">
                Kéo thả hoặc click để tải ảnh lên
              </p>
              <p className="upload-area-subtitle">
                PNG, JPG (tối đa 5MB)
              </p>
            </label>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">File Nhạc *</label>
          <div className="upload-area">
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setFormData({ ...formData, audioFile: e.target.files?.[0] || null })}
              className="upload-input"
              id="audioFile"
              required
            />
            <label htmlFor="audioFile" style={{ cursor: 'pointer' }}>
              <Music size={40} className="upload-area-icon" />
              <p className="upload-area-title">
                Kéo thả hoặc click để tải file nhạc lên
              </p>
              <p className="upload-area-subtitle">
                MP3, WAV, FLAC (tối đa 50MB)
              </p>
            </label>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Tên Bài Hát *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="form-input"
            placeholder="Nhập tên bài hát"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Nghệ Sĩ *</label>
          <input
            type="text"
            value={formData.artist}
            onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
            className="form-input"
            placeholder="Nhập tên nghệ sĩ"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Album</label>
          <input
            type="text"
            value={formData.album}
            onChange={(e) => setFormData({ ...formData, album: e.target.value })}
            className="form-input"
            placeholder="Nhập tên album"
          />
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Thể Loại *</label>
            <select
              value={formData.genre}
              onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
              className="form-select"
              required
            >
              <option>Cổ Điển</option>
              <option>Jazz</option>
              <option>Acoustic</option>
              <option>EDM</option>
              <option>Nhạc Việt</option>
              <option>Rock</option>
              <option>Podcast</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Thời Lượng</label>
            <input
              type="text"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              className="form-input"
              placeholder="VD: 4:25"
            />
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Hủy
          </button>
          <button type="submit" className="btn btn-primary">
            <Save size={16} />
            Thêm Bài Hát
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Edit Track Modal
export function EditTrackModal({ 
  isOpen, 
  onClose, 
  track 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  track: any 
}) {
  if (!track) return null;

  const [formData, setFormData] = useState({
    title: track.title || '',
    artist: track.artist || '',
    album: track.album || '',
    genre: track.genre || 'Cổ Điển',
    duration: track.duration || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Updating track:', formData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chỉnh Sửa Bài Hát">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Tên Bài Hát *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Nghệ Sĩ *</label>
          <input
            type="text"
            value={formData.artist}
            onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Album</label>
          <input
            type="text"
            value={formData.album}
            onChange={(e) => setFormData({ ...formData, album: e.target.value })}
            className="form-input"
          />
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Thể Loại *</label>
            <select
              value={formData.genre}
              onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
              className="form-select"
              required
            >
              <option>Cổ Điển</option>
              <option>Jazz</option>
              <option>Acoustic</option>
              <option>EDM</option>
              <option>Nhạc Việt</option>
              <option>Rock</option>
              <option>Podcast</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Thời Lượng</label>
            <input
              type="text"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              className="form-input"
            />
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Hủy
          </button>
          <button type="submit" className="btn btn-primary">
            <Save size={16} />
            Lưu Thay Đổi
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Delete Confirmation Modal
export function DeleteConfirmModal({ 
  isOpen, 
  onClose, 
  count,
  onConfirm 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  count: number;
  onConfirm: () => void;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Xác Nhận Xóa" size="small">
      <div className="alert-box">
        <div className="alert-icon-wrapper">
          <AlertCircle size={24} className="alert-icon" />
        </div>
        <div className="alert-text">
          <p className="alert-title">
            Bạn có chắc chắn muốn xóa {count} bài hát đã chọn?
          </p>
          <p className="alert-description">
            Hành động này không thể hoàn tác. Tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn.
          </p>
        </div>
      </div>

      <div className="modal-footer">
        <button onClick={onClose} className="btn btn-secondary">
          Hủy
        </button>
        <button onClick={onConfirm} className="btn btn-danger">
          Xóa Bài Hát
        </button>
      </div>
    </Modal>
  );
}

// Create Playlist Modal
export function CreatePlaylistModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating playlist:', formData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tạo Playlist Mới" size="medium">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Tên Playlist *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="form-input"
            placeholder="Nhập tên playlist"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Mô Tả</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="form-textarea"
            rows={3}
            placeholder="Mô tả ngắn về playlist"
          />
        </div>

        <div className="form-checkbox-wrapper">
          <input
            type="checkbox"
            id="isPublic"
            checked={formData.isPublic}
            onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
            className="form-checkbox"
          />
          <label htmlFor="isPublic" className="form-checkbox-label">
            Công khai playlist này
          </label>
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Hủy
          </button>
          <button type="submit" className="btn btn-primary">
            <Plus size={16} />
            Tạo Playlist
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Add to Playlist Modal
export function AddToPlaylistModal({ 
  isOpen, 
  onClose, 
  trackCount 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  trackCount: number;
}) {
  const mockPlaylists = [
    { id: 1, name: 'Aethereal Flow', tracks: 24, gradient: 'gradient-1' },
    { id: 2, name: 'Celestial Waves', tracks: 18, gradient: 'gradient-2' },
    { id: 3, name: 'Đêm Cổ Điển', tracks: 32, gradient: 'gradient-3' },
    { id: 4, name: 'Jazz Collection', tracks: 45, gradient: 'gradient-4' },
    { id: 5, name: 'Acoustic Vibes', tracks: 27, gradient: 'gradient-5' },
  ];

  const [selectedPlaylist, setSelectedPlaylist] = useState<number | null>(null);

  const handleAdd = () => {
    if (selectedPlaylist) {
      console.log('Adding tracks to playlist:', selectedPlaylist);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Thêm ${trackCount} bài hát vào Playlist`} size="medium">
      <div className="playlist-selection-list">
        {mockPlaylists.map((playlist) => (
          <button
            key={playlist.id}
            onClick={() => setSelectedPlaylist(playlist.id)}
            className={`playlist-selection-item ${selectedPlaylist === playlist.id ? 'selected' : ''}`}
          >
            <div className="playlist-selection-content">
              <div className={`playlist-selection-cover ${playlist.gradient}`}>
                <Music size={20} style={{ color: 'white' }} />
              </div>
              <div>
                <p className="playlist-selection-name">{playlist.name}</p>
                <p className="playlist-selection-tracks">{playlist.tracks} bài hát</p>
              </div>
            </div>
            {selectedPlaylist === playlist.id && (
              <Check size={20} className="playlist-selection-check" />
            )}
          </button>
        ))}
      </div>

      <button onClick={onClose} className="create-playlist-btn">
        <Plus size={20} />
        <span className="create-playlist-text">Tạo Playlist Mới</span>
      </button>

      <div className="modal-footer">
        <button onClick={onClose} className="btn btn-secondary">
          Hủy
        </button>
        <button
          onClick={handleAdd}
          disabled={!selectedPlaylist}
          className="btn btn-primary"
        >
          Thêm Vào Playlist
        </button>
      </div>
    </Modal>
  );
}

// Advanced Filter Modal
export function AdvancedFilterModal({ 
  isOpen, 
  onClose, 
  onApply 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onApply: (filters: any) => void;
}) {
  const [filters, setFilters] = useState({
    genres: [] as string[],
    minPlays: '',
    maxPlays: '',
    minLikes: '',
    maxLikes: '',
    uploadDateFrom: '',
    uploadDateTo: '',
  });

  const genres = ['Cổ Điển', 'Jazz', 'Acoustic', 'EDM', 'Nhạc Việt', 'Rock', 'Podcast'];

  const toggleGenre = (genre: string) => {
    setFilters(prev => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre]
    }));
  };

  const handleApply = () => {
    onApply(filters);
  };

  const handleReset = () => {
    setFilters({
      genres: [],
      minPlays: '',
      maxPlays: '',
      minLikes: '',
      maxLikes: '',
      uploadDateFrom: '',
      uploadDateTo: '',
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Lọc Nâng Cao">
      <div className="form-group">
        <label className="form-label">Thể Loại</label>
        <div className="genre-filters">
          {genres.map((genre) => (
            <button
              key={genre}
              type="button"
              onClick={() => toggleGenre(genre)}
              className={`genre-filter-btn ${filters.genres.includes(genre) ? 'active' : ''}`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Lượt Nghe</label>
        <div className="grid-2">
          <input
            type="number"
            value={filters.minPlays}
            onChange={(e) => setFilters({ ...filters, minPlays: e.target.value })}
            className="form-input"
            placeholder="Từ"
          />
          <input
            type="number"
            value={filters.maxPlays}
            onChange={(e) => setFilters({ ...filters, maxPlays: e.target.value })}
            className="form-input"
            placeholder="Đến"
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Lượt Thích</label>
        <div className="grid-2">
          <input
            type="number"
            value={filters.minLikes}
            onChange={(e) => setFilters({ ...filters, minLikes: e.target.value })}
            className="form-input"
            placeholder="Từ"
          />
          <input
            type="number"
            value={filters.maxLikes}
            onChange={(e) => setFilters({ ...filters, maxLikes: e.target.value })}
            className="form-input"
            placeholder="Đến"
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Ngày Tải Lên</label>
        <div className="grid-2">
          <input
            type="date"
            value={filters.uploadDateFrom}
            onChange={(e) => setFilters({ ...filters, uploadDateFrom: e.target.value })}
            className="form-input"
          />
          <input
            type="date"
            value={filters.uploadDateTo}
            onChange={(e) => setFilters({ ...filters, uploadDateTo: e.target.value })}
            className="form-input"
          />
        </div>
      </div>

      <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
        <button onClick={handleReset} className="btn btn-secondary">
          Đặt Lại
        </button>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onClose} className="btn btn-secondary">
            Hủy
          </button>
          <button onClick={handleApply} className="btn btn-primary">
            Áp Dụng
          </button>
        </div>
      </div>
    </Modal>
  );
}

// Import CSV Modal
export function ImportCSVModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  const handleImport = () => {
    if (file) {
      setImporting(true);
      setTimeout(() => {
        setImporting(false);
        onClose();
      }, 2000);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import CSV" size="medium">
      <div className="upload-area" style={{ marginBottom: '24px' }}>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="upload-input"
          id="csvFile"
        />
        <label htmlFor="csvFile" style={{ cursor: 'pointer' }}>
          <Upload size={48} className="upload-area-icon" />
          <p className="upload-area-title" style={{ fontSize: '16px' }}>
            {file ? file.name : 'Kéo thả hoặc click để tải file CSV'}
          </p>
          <p className="upload-area-subtitle">
            File CSV phải có các cột: Title, Artist, Album, Genre, Duration
          </p>
        </label>
      </div>

      <div className="warning-box">
        <p className="warning-title">Lưu ý quan trọng:</p>
        <ul className="warning-list">
          <li>Đảm bảo file CSV có đúng định dạng</li>
          <li>Dữ liệu trùng lặp sẽ được bỏ qua</li>
          <li>File âm thanh cần được tải lên riêng sau khi import</li>
        </ul>
      </div>

      <div className="modal-footer">
        <button onClick={onClose} disabled={importing} className="btn btn-secondary">
          Hủy
        </button>
        <button
          onClick={handleImport}
          disabled={!file || importing}
          className="btn btn-primary"
        >
          {importing ? (
            <>
              <div className="spinner" />
              Đang Import...
            </>
          ) : (
            <>
              <Upload size={16} />
              Import CSV
            </>
          )}
        </button>
      </div>
    </Modal>
  );
}

// Share Modal
export function ShareModal({ 
  isOpen, 
  onClose, 
  track 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  track: any;
}) {
  if (!track) return null;

  const shareUrl = `https://listentogether.com/track/${track.id}`;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chia Sẻ Bài Hát" size="small">
      <div className="share-track-info">
        <div className="share-track-header">
          <div className="share-track-cover">
            <Music size={20} style={{ color: '#55c5f1' }} />
          </div>
          <div className="share-track-details">
            <p className="share-track-title">{track.title}</p>
            <p className="share-track-artist">{track.artist}</p>
          </div>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Link Chia Sẻ</label>
        <div className="share-url-wrapper">
          <input
            type="text"
            value={shareUrl}
            readOnly
            className="share-url-input"
          />
          <button onClick={handleCopy} className="btn btn-primary">
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Đã sao' : 'Sao chép'}
          </button>
        </div>
      </div>

      <div className="share-social-grid">
        <button className="share-social-btn">
          <div className="share-social-icon facebook">
            <ExternalLink size={20} />
          </div>
          <span className="share-social-name">Facebook</span>
        </button>
        <button className="share-social-btn">
          <div className="share-social-icon twitter">
            <ExternalLink size={20} />
          </div>
          <span className="share-social-name">Twitter</span>
        </button>
        <button className="share-social-btn">
          <div className="share-social-icon whatsapp">
            <ExternalLink size={20} />
          </div>
          <span className="share-social-name">WhatsApp</span>
        </button>
      </div>
    </Modal>
  );
}
