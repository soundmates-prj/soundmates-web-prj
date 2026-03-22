import { useCallback, useEffect, useRef, useState } from "react";
import { CloudUpload, Music, RefreshCw, Trash2, Upload } from "lucide-react";
import { liveSessionApiService, type MusicResult } from "../../../services/liveSessionApiService";
import { showError, showSuccess } from "../../../components/common/toastUtils";
import {
  ALLOWED_AUDIO_EXTENSIONS,
  ALLOWED_AUDIO_MIME_TYPES,
  MAX_UPLOAD_SIZE_BYTES,
} from "./liveSessionConstants";
import "./LiveOps.css";

export default function MusicCatalogPage() {
  const [tracks, setTracks] = useState<MusicResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [album, setAlbum] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isMountedRef = useRef(true);

  const loadTracks = useCallback(async () => {
    setLoading(true);
    try {
      const mediaFiles = await liveSessionApiService.getAllMusic();
      if (!isMountedRef.current) {
        return;
      }
      setTracks(mediaFiles.filter((item) => item.sourceType === "system"));
    } catch {
      showError("Lỗi", "Không thể tải danh sách music catalog");
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    const init = async () => {
      try {
        await loadTracks();
      } catch {
        setLoading(false);
      }
    };

    void init();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
    return `${(bytes / 1024).toFixed(2)} KB`;
  };

  const validateFile = useCallback((input: File) => {
    const ext = input.name.split(".").pop()?.toLowerCase() || "";
    const extAllowed = ALLOWED_AUDIO_EXTENSIONS.includes(ext as (typeof ALLOWED_AUDIO_EXTENSIONS)[number]);

    if (!extAllowed && !ALLOWED_AUDIO_MIME_TYPES.includes(input.type as (typeof ALLOWED_AUDIO_MIME_TYPES)[number])) {
      showError("File không hợp lệ", "Chỉ hỗ trợ MP3, FLAC, WAV, OGG");
      return false;
    }

    if (input.size > MAX_UPLOAD_SIZE_BYTES) {
      showError("File quá lớn", "Dung lượng tối đa 100MB");
      return false;
    }

    return true;
  }, []);

  const handleFileSelect = useCallback((input: File | null) => {
    if (!input) {
      return;
    }
    if (!validateFile(input)) {
      return;
    }
    setFile(input);
  }, [validateFile]);

  const handleUpload = useCallback(async () => {
    if (!file) {
      showError("Thiếu dữ liệu", "Vui lòng chọn file nhạc");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      await liveSessionApiService.uploadMusic(
        undefined,
        file,
        { title: title || undefined, artist: artist || undefined, album: album || undefined },
        setUploadProgress
      );
      showSuccess("Upload thành công", "Media file đã được thêm vào catalog");
      setShowUpload(false);
      setFile(null);
      setTitle("");
      setArtist("");
      setAlbum("");
      await loadTracks();
    } catch {
      showError("Upload thất bại", "Không thể upload file lên server");
    } finally {
      setUploading(false);
    }
  }, [album, artist, file, loadTracks, title]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await liveSessionApiService.deleteMusic(id);
      setTracks((prev) => prev.filter((t) => t.id !== id));
      showSuccess("Đã xóa", "Media file đã được xóa khỏi catalog");
    } catch {
      showError("Xóa thất bại", "Không thể xóa media file");
    }
  }, []);

  const handleRefreshClick = useCallback(() => {
    void loadTracks();
  }, [loadTracks]);

  return (
    <div className="ops-page">
      <div className="ops-header">
        <div>
          <h1 className="ops-title">MusicCatalog Page</h1>
          <p className="ops-subtitle">Admin quản lý System Media (kho nhạc hệ thống), không gắn trực tiếp station</p>
        </div>
        <div className="ops-actions">
          <button className="ops-btn ops-btn--ghost" onClick={handleRefreshClick}>
            <RefreshCw size={15} />
            Làm mới
          </button>
          <button className="ops-btn ops-btn--primary" onClick={() => setShowUpload(true)}>
            <Upload size={15} />
            Upload media
          </button>
        </div>
      </div>

      <div className="ops-card">
        <h3 className="ops-card-title">Danh sách System Media</h3>

        {loading ? (
          <div className="ops-stack">
            <div className="ops-skeleton" />
            <div className="ops-skeleton" />
            <div className="ops-skeleton" />
            <div className="ops-skeleton" />
          </div>
        ) : tracks.length === 0 ? (
          <div className="ops-empty">Chưa có media file</div>
        ) : (
          <div className="ops-table-wrap">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Artwork</th>
                  <th>Title</th>
                  <th>Artist</th>
                  <th>Duration</th>
                  <th>File size</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {tracks.map((track) => (
                  <tr key={track.id}>
                    <td>
                      {track.artworkUrl ? (
                        <img src={track.artworkUrl} alt={track.title} width={40} height={40} style={{ borderRadius: 8, objectFit: "cover" }} />
                      ) : (
                        <span className="ops-badge"><Music size={12} /> No art</span>
                      )}
                    </td>
                    <td>{track.title}</td>
                    <td>{track.artist}</td>
                    <td>{formatDuration(track.duration)}</td>
                    <td>{formatFileSize(track.fileSize)}</td>
                    <td>
                      <button className="ops-btn ops-btn--ghost" onClick={() => void handleDelete(track.id)}>
                        <Trash2 size={14} />
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showUpload ? (
        <div className="ops-modal-overlay" onClick={() => setShowUpload(false)}>
          <div className="ops-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ops-modal-head">
              <h3 style={{ margin: 0 }}>Upload media file</h3>
            </div>
            <div className="ops-modal-body">
              <div
                className="ops-dropzone"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFileSelect(e.dataTransfer.files?.[0] || null);
                }}
              >
                <div>
                  <CloudUpload size={30} style={{ marginBottom: 8 }} />
                  <p style={{ margin: 0, fontWeight: 700 }}>Kéo & thả file hoặc click để chọn</p>
                  <p style={{ margin: "6px 0 0", fontSize: 12 }}>Hỗ trợ MP3/FLAC/WAV/OGG, tối đa 100MB</p>
                  {file ? <p style={{ marginTop: 10, fontWeight: 600 }}>{file.name}</p> : null}
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                style={{ display: "none" }}
                accept=".mp3,.flac,.wav,.ogg,audio/*"
                onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
              />

              {file ? (
                <div className="ops-stack" style={{ marginTop: 12 }}>
                  <div className="ops-inline-row">
                    <span style={{ fontWeight: 700 }}>File preview:</span>
                    <span>{file.name}</span>
                    <span className="ops-badge">{formatFileSize(file.size)}</span>
                  </div>
                </div>
              ) : null}

              {uploading ? (
                <div className="ops-progress">
                  <div className="ops-progress-bar" style={{ width: `${uploadProgress}%` }} />
                </div>
              ) : null}

              <div className="ops-stack" style={{ marginTop: 14 }}>
                <input className="ops-input" placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
                <input className="ops-input" placeholder="Artist (optional)" value={artist} onChange={(e) => setArtist(e.target.value)} />
                <input className="ops-input" placeholder="Album (optional)" value={album} onChange={(e) => setAlbum(e.target.value)} />
              </div>
            </div>
            <div className="ops-modal-foot">
              <button className="ops-btn ops-btn--ghost" onClick={() => setShowUpload(false)} disabled={uploading}>
                Hủy
              </button>
              <button className="ops-btn ops-btn--primary" onClick={() => void handleUpload()} disabled={!file || uploading}>
                {uploading ? `Đang upload ${uploadProgress}%` : "Upload"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
