import { 
  X,
  Upload,

  Save,
  Check,
  AlertCircle,
  Copy,
  ExternalLink,
  Music,
  Plus,
  Trash2,
  ChevronDown
} from 'lucide-react';
import { useState } from 'react';
import './MusicCatalog.css';
import type { MusicTrack } from '../../../services/musicCatalogService';

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

// Add Track Modal - New Multiple Upload Version
export function AddTrackModal({ 
  isOpen, 
  onClose,
  onSubmit,
  uploading
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onSubmit?: (files: File[]) => Promise<MusicTrack[]>;
  uploading?: boolean;
}) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{[fileName: string]: number}>({});
  const [uploadedTracks, setUploadedTracks] = useState<MusicTrack[]>([]);
  const [expandedTracks, setExpandedTracks] = useState<Set<number>>(new Set());
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const audioFiles = files.filter(file => {
      const validTypes = ['audio/mpeg', 'audio/mp4', 'audio/flac', 'audio/ogg', 'audio/wav', 'audio/x-wav', 'audio/wave'];
      const validExtensions = ['.mp3', '.mp4', '.m4a', '.flac', '.ogg', '.wav'];
      return validTypes.includes(file.type) || validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    });
    
    console.log('Selected files:', audioFiles.map(f => f.name));
    setSelectedFiles(audioFiles);
    setUploadProgress({});
    setUploadedTracks([]);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      alert('Vui lòng chọn ít nhất một file nhạc!');
      return;
    }

    setIsUploading(true);
    
    try {
      if (onSubmit) {
        const uploadedTracks = await onSubmit(selectedFiles);
        console.log('Upload completed, got tracks:', uploadedTracks);
        
        // Show the uploaded tracks with real metadata
        setUploadedTracks(uploadedTracks);
        setSelectedFiles([]); // Clear selected files
        setUploadProgress({});
        
        // Don't close modal immediately, let user review uploaded tracks
        alert('Upload thành công! Xem thông tin bài hát bên dưới.');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert(`Upload thất bại: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (fileToRemove: File) => {
    setSelectedFiles(prev => prev.filter(file => file !== fileToRemove));
  };

  const toggleTrackExpansion = (trackId: number) => {
    setExpandedTracks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(trackId)) {
        newSet.delete(trackId);
      } else {
        newSet.add(trackId);
      }
      return newSet;
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const extractMetadataFromFilename = (filename: string) => {
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
    const match = nameWithoutExt.match(/^(.+?)\s*[-]\s*(.+)$/);
    
    if (match) {
      return { artist: match[1].trim(), title: match[2].trim() };
    }
    
    return { artist: 'Unknown Artist', title: nameWithoutExt };
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Thêm Bài Hát Mới">
      <div className="add-track-modal">
        {/* File Upload Area */}
        <div className="form-group">
          <label className="form-label">Chọn File Nhạc *</label>
          <div className="upload-area" style={{ minHeight: '120px', position: 'relative' }}>
            <input
              type="file"
              accept="audio/*"
              multiple
              onChange={handleFileSelect}
              className="upload-input"
              id="audioFiles"
              disabled={isUploading || uploading}
            />
            <label htmlFor="audioFiles" style={{ cursor: isUploading ? 'not-allowed' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Music size={40} className="upload-area-icon" />
              <p className="upload-area-title" style={{ margin: '8px 0' }}>
                {selectedFiles.length === 0 
                  ? 'Kéo thả hoặc click để chọn nhiều file nhạc'
                  : `Đã chọn ${selectedFiles.length} file(s)`
                }
              </p>
              <p className="upload-area-subtitle" style={{ margin: 0 }}>
                MP3, WAV, FLAC, OGG (có thể chọn nhiều file)
              </p>
            </label>
          </div>
        </div>

        {/* Selected Files List */}
        {selectedFiles.length > 0 && (
          <div className="selected-files-list" style={{ marginTop: '20px' }}>
            <h4 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '600' }}>
              Danh sách file đã chọn:
            </h4>
            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
              {selectedFiles.map((file, index) => {
                const metadata = extractMetadataFromFilename(file.name);
                return (
                  <div key={index} style={{ 
                    padding: '12px', 
                    borderBottom: index < selectedFiles.length - 1 ? '1px solid #f3f4f6' : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#fafafa'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', fontSize: '14px', marginBottom: '2px' }}>
                        {metadata.title}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '2px' }}>
                        {metadata.artist} • {formatFileSize(file.size)}
                      </div>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                        {file.name}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(file)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      disabled={isUploading}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {Object.keys(uploadProgress).length > 0 && (
          <div className="upload-progress" style={{ marginTop: '20px' }}>
            <h4 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '600' }}>
              Tiến trình upload:
            </h4>
            {Object.entries(uploadProgress).map(([fileName, progress]) => (
              <div key={fileName} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#374151' }}>{fileName}</span>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>
                    {progress === -1 ? 'Lỗi' : `${Math.round(progress)}%`}
                  </span>
                </div>
                <div style={{ 
                  width: '100%', 
                  height: '6px', 
                  backgroundColor: '#e5e7eb', 
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    width: `${progress === -1 ? 100 : progress}%`, 
                    height: '100%', 
                    backgroundColor: progress === -1 ? '#ef4444' : progress === 100 ? '#10b981' : '#3b82f6',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Uploaded Tracks */}
        {uploadedTracks.length > 0 && (
          <div className="uploaded-tracks" style={{ marginTop: '20px' }}>
            <h4 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '600', color: '#10b981' }}>
              ✅ Đã upload thành công:
            </h4>
            {uploadedTracks.map((track) => (
              <div key={track.id} style={{ marginBottom: '8px' }}>
                <div
                  onClick={() => toggleTrackExpansion(track.id)}
                  style={{
                    padding: '12px',
                    backgroundColor: '#f0f9ff',
                    border: '1px solid #e0f2fe',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '500', fontSize: '14px' }}>{track.title}</div>
                    <div style={{ fontSize: '12px', color: '#0369a1' }}>{track.artist}</div>
                  </div>
                  <ChevronDown 
                    size={16} 
                    style={{ 
                      transform: expandedTracks.has(track.id) ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease'
                    }} 
                  />
                </div>
                
                {expandedTracks.has(track.id) && (
                  <div style={{
                    marginTop: '4px',
                    padding: '16px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #e0f2fe',
                    borderRadius: '6px',
                    fontSize: '13px'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div><strong>Tiêu đề:</strong> {track.title}</div>
                      <div><strong>Nghệ sĩ:</strong> {track.artist}</div>
                      <div><strong>Album:</strong> {track.album}</div>
                      <div><strong>Thể loại:</strong> {track.genre}</div>
                      <div><strong>Thời lượng:</strong> {track.duration}</div>
                      <div><strong>Ngày tải:</strong> {track.uploadDate}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="modal-footer" style={{ marginTop: '24px' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            {uploadedTracks.length > 0 ? 'Đóng' : 'Hủy'}
          </button>
          <button 
            type="button" 
            onClick={handleUpload}
            className="btn btn-primary" 
            disabled={selectedFiles.length === 0 || isUploading || uploading}
          >
            <Save size={16} />
            {isUploading || uploading ? 'Đang tải lên...' : `Upload ${selectedFiles.length} file(s)`}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// Edit Track Modal
export function EditTrackModal({ 
  isOpen, 
  onClose, 
  track,
  onSubmit
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  track: any;
  onSubmit?: (trackId: number, updates: any) => Promise<void>;
}) {
  if (!track) return null;

  const [formData, setFormData] = useState({
    title: track.title || '',
    artist: track.artist || '',
    album: track.album || '',
    genre: track.genre || 'Cổ Điển',
    duration: track.duration || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit && track?.id) {
      try {
        await onSubmit(track.id, {
          title: formData.title,
          artist: formData.artist,
          album: formData.album,
          genre: formData.genre,
          duration: formData.duration,
        });
        onClose();
      } catch (error) {
        console.error('Failed to update track:', error);
      }
    } else {
      console.log('Updating track:', formData);
      onClose();
    }
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
export function CreatePlaylistModal({ 
  isOpen, 
  onClose,
  onSubmit
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onSubmit?: (data: { name: string; description?: string; isPublic?: boolean; }) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      try {
        await onSubmit({
          name: formData.name,
          description: formData.description || undefined,
          isPublic: formData.isPublic,
        });
        setFormData({ name: '', description: '', isPublic: true });
        onClose();
      } catch (error) {
        console.error('Failed to create playlist:', error);
      }
    } else {
      console.log('Creating playlist:', formData);
      onClose();
    }
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
  trackCount,
  playlists,
  onSubmit
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  trackCount: number;
  playlists?: Array<{ id: number; name: string; tracks: number; gradient?: string; }>;
  onSubmit?: (playlistId: number) => Promise<void>;
}) {
  const mockPlaylists = [
    { id: 1, name: 'Aethereal Flow', tracks: 24, gradient: 'gradient-1' },
    { id: 2, name: 'Celestial Waves', tracks: 18, gradient: 'gradient-2' },
    { id: 3, name: 'Đêm Cổ Điển', tracks: 32, gradient: 'gradient-3' },
    { id: 4, name: 'Jazz Collection', tracks: 45, gradient: 'gradient-4' },
    { id: 5, name: 'Acoustic Vibes', tracks: 27, gradient: 'gradient-5' },
  ];

  const playlistsToShow = playlists || mockPlaylists;
  const [selectedPlaylist, setSelectedPlaylist] = useState<number | null>(null);

  const handleAdd = async () => {
    if (selectedPlaylist && onSubmit) {
      try {
        await onSubmit(selectedPlaylist);
        setSelectedPlaylist(null);
        onClose();
      } catch (error) {
        console.error('Failed to add tracks to playlist:', error);
      }
    } else if (selectedPlaylist) {
      console.log('Adding tracks to playlist:', selectedPlaylist);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Thêm ${trackCount} bài hát vào Playlist`} size="medium">
      <div className="playlist-selection-list">
        {playlistsToShow.map((playlist) => (
          <button
            key={playlist.id}
            onClick={() => setSelectedPlaylist(playlist.id)}
            className={`playlist-selection-item ${selectedPlaylist === playlist.id ? 'selected' : ''}`}
          >
            <div className="playlist-selection-content">
              <div className={`playlist-selection-cover ${playlist.gradient || `gradient-${((playlist.id % 5) + 1)}`}`}>
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
