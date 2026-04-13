import { useCallback, useEffect, useRef, useState } from "react";
import {
  CloudUpload,
  Music,
  RefreshCw,
  Trash2,
  Upload,
  X,
  Check,
  AlertCircle,
} from "lucide-react";
import {
  liveSessionApiService,
  type MusicResult,
  type BulkUploadMusicResult,
} from "../../../services/liveSessionApiService";
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

  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {},
  );
  const [bulkResult, setBulkResult] = useState<BulkUploadMusicResult | null>(
    null,
  );

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
    void loadTracks();

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
    const extAllowed = ALLOWED_AUDIO_EXTENSIONS.includes(
      ext as (typeof ALLOWED_AUDIO_EXTENSIONS)[number],
    );

    if (
      !extAllowed &&
      !ALLOWED_AUDIO_MIME_TYPES.includes(
        input.type as (typeof ALLOWED_AUDIO_MIME_TYPES)[number],
      )
    ) {
      showError("File không hợp lệ", "Chỉ hỗ trợ MP3, FLAC, WAV, OGG");
      return false;
    }

    if (input.size > MAX_UPLOAD_SIZE_BYTES) {
      showError("File quá lớn", "Dung lượng tối đa 100MB");
      return false;
    }

    return true;
  }, []);

  const handleFileSelect = useCallback(
    (input: File | null) => {
      if (!input) return;
      if (!validateFile(input)) return;
      setFiles((prev) => {
        if (prev.some((f) => f.name === input.name)) return prev;
        return [...prev, input];
      });
    },
    [validateFile],
  );

  const handleMultiFileSelect = useCallback(
    (inputFiles: FileList | null) => {
      if (!inputFiles || inputFiles.length === 0) return;
      const validFiles: File[] = [];
      for (const file of Array.from(inputFiles)) {
        if (validateFile(file)) {
          validFiles.push(file);
        }
      }
      if (validFiles.length === 0) return;
      setFiles((prev) => {
        const existing = new Set(prev.map((f) => f.name));
        const newFiles = validFiles.filter((f) => !existing.has(f.name));
        return [...prev, ...newFiles];
      });
    },
    [validateFile],
  );

  const removeFile = useCallback((fileName: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== fileName));
  }, []);

  const clearAllFiles = useCallback(() => {
    setFiles([]);
    setBulkResult(null);
    setUploadProgress({});
  }, []);

  const handleUpload = useCallback(async () => {
    if (files.length === 0) {
      showError("Thiếu dữ liệu", "Vui lòng chọn ít nhất 1 file nhạc");
      return;
    }

    // Initialize progress for all files
    const initialProgress: Record<string, number> = {};
    for (const f of files) initialProgress[f.name] = 0;
    setUploadProgress(initialProgress);
    setUploading(true);

    // Simulate per-file progress
    const intervals: Record<string, ReturnType<typeof setInterval>> = {};
    for (const f of files) {
      let progress = 0;
      intervals[f.name] = setInterval(() => {
        progress = Math.min(progress + Math.floor(Math.random() * 15) + 5, 90);
        setUploadProgress((prev) => ({ ...prev, [f.name]: progress }));
      }, 300);
    }

    try {
      const result = await liveSessionApiService.bulkUploadMusic(
        undefined, // Admin uploads to System Media — no station
        files,
      );

      // Mark all as 100%
      setUploadProgress((prev) => {
        const done: Record<string, number> = {};
        for (const f of files) done[f.name] = 100;
        return done;
      });

      setBulkResult(result);

      if (result.isSuccess) {
        showSuccess(
          "Upload thành công",
          `${result.successCount} file đã được thêm vào catalog`,
        );
      } else {
        showError(
          "Upload hoàn tất (một phần)",
          `${result.successCount}/${result.totalFiles} file thành công`,
        );
      }

      await loadTracks();
    } catch {
      showError("Upload thất bại", "Không thể upload file lên server");
      setUploadProgress((prev) => {
        const failed: Record<string, number> = {};
        for (const f of files) failed[f.name] = -1;
        return failed;
      });
    } finally {
      Object.values(intervals).forEach(clearInterval);
      setUploading(false);
    }
  }, [files, loadTracks]);

  const handleCloseUpload = useCallback(() => {
    setShowUpload(false);
    setFiles([]);
    setBulkResult(null);
    setUploadProgress({});
  }, []);

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
          <h1 className="ops-title">Kho Nhạc Hệ Thống</h1>
          <p className="ops-subtitle">
            Quản lý System Media (kho nhạc hệ thống)
          </p>
        </div>
        <div className="ops-actions">
          <button
            className="ops-btn ops-btn--ghost"
            onClick={handleRefreshClick}
          >
            <RefreshCw size={15} />
            Làm mới
          </button>
          <button
            className="ops-btn ops-btn--primary"
            onClick={() => setShowUpload(true)}
          >
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
                  <th>Ảnh bìa</th>
                  <th>Tiêu đề</th>
                  <th>Nghệ sĩ</th>
                  <th>Thời lượng</th>
                  <th>Kích thước</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {tracks.map((track) => (
                  <tr key={track.id}>
                    <td>
                      {track.artworkUrl ? (
                        <img
                          src={track.artworkUrl}
                          alt={track.title}
                          width={40}
                          height={40}
                          style={{ borderRadius: 8, objectFit: "cover" }}
                        />
                      ) : (
                        <span className="ops-badge">
                          <Music size={12} /> Không có ảnh
                        </span>
                      )}
                    </td>
                    <td>{track.title}</td>
                    <td>{track.artist}</td>
                    <td>{formatDuration(track.duration)}</td>
                    <td>{formatFileSize(track.fileSize)}</td>
                    <td>
                      <button
                        className="ops-btn ops-btn--ghost"
                        onClick={() => void handleDelete(track.id)}
                      >
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
        <div
          className="ops-modal-overlay"
          onClick={() => !uploading && handleCloseUpload()}
        >
          <div
            className="ops-modal"
            style={{ maxWidth: 560 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ops-modal-head">
              <h3 style={{ margin: 0 }}>Tải Lên Nhiều File Nhạc</h3>
            </div>
            <div className="ops-modal-body">
              {/* Drop Zone */}
              {!uploading && !bulkResult && (
                <div
                  className="ops-dropzone"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleMultiFileSelect(e.dataTransfer.files);
                  }}
                >
                  <div>
                    <CloudUpload
                      size={36}
                      style={{ marginBottom: 8, color: "#1a9fd4" }}
                    />
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>
                      Chọn nhiều file nhạc cùng lúc
                    </p>
                    <p
                      style={{
                        margin: "6px 0 0",
                        fontSize: 12,
                        color: "#94a3b8",
                      }}
                    >
                      MP3, FLAC, WAV, OGG, M4A • Tối đa 100 file • Mỗi file tối
                      đa 100MB
                    </p>

                    {/* Primary button to open file picker */}
                    <button
                      type="button"
                      style={{
                        marginTop: 14,
                        padding: "10px 24px",
                        background: "linear-gradient(135deg, #1a9fd4, #55c5f1)",
                        color: "#fff",
                        border: "none",
                        borderRadius: 10,
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        boxShadow: "0 4px 16px rgba(124, 58, 237, 0.35)",
                      }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload size={16} />
                      Chọn file nhạc
                    </button>
                    <p style={{ marginTop: 8, fontSize: 12, color: "#94a3b8" }}>
                      ✨ Giữ <strong style={{ color: "#1a9fd4" }}>Shift</strong>{" "}
                      hoặc <strong style={{ color: "#1a9fd4" }}>Ctrl</strong> để
                      chọn nhiều file cùng lúc
                    </p>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                style={{ display: "none" }}
                accept=".mp3,.flac,.wav,.ogg,.m4a,audio/*"
                multiple
                onChange={(e) => handleMultiFileSelect(e.target.files)}
              />

              {/* File List */}
              {files.length > 0 && !bulkResult && (
                <div style={{ marginTop: 12 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#1a9fd4",
                      }}
                    >
                      {files.length} file(s) •{" "}
                      {formatFileSize(files.reduce((s, f) => s + f.size, 0))}
                    </span>
                    <button
                      type="button"
                      style={{
                        fontSize: 12,
                        color: "#94a3b8",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      + Thêm file
                    </button>
                  </div>

                  <div
                    style={{
                      maxHeight: 240,
                      overflowY: "auto",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 10,
                    }}
                  >
                    {files.map((f, i) => {
                      const progress = uploadProgress[f.name] ?? 0;
                      const isFailed = progress === -1;
                      const isDone = progress === 100;
                      return (
                        <div
                          key={f.name + i}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "8px 12px",
                            borderBottom:
                              i < files.length - 1
                                ? "1px solid rgba(255,255,255,0.04)"
                                : "none",
                            background: isFailed
                              ? "rgba(239,68,68,0.06)"
                              : isDone
                                ? "rgba(16,185,129,0.04)"
                                : "transparent",
                          }}
                        >
                          <div style={{ color: "#1a9fd4" }}>
                            <Music size={18} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 500,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {f.name}
                            </div>
                            <div
                              style={{
                                display: "flex",
                                gap: 8,
                                fontSize: 11,
                                color: "#94a3b8",
                                marginTop: 2,
                              }}
                            >
                              <span>{formatFileSize(f.size)}</span>
                              {isFailed && (
                                <span
                                  style={{ color: "#ef4444", fontWeight: 600 }}
                                >
                                  Thất bại
                                </span>
                              )}
                              {isDone && (
                                <span
                                  style={{ color: "#10b981", fontWeight: 600 }}
                                >
                                  Hoàn tất
                                </span>
                              )}
                              {!isFailed && !isDone && progress > 0 && (
                                <span
                                  style={{ color: "#1a9fd4", fontWeight: 600 }}
                                >
                                  {progress}%
                                </span>
                              )}
                            </div>
                            {!isFailed && !isDone && progress >= 0 && (
                              <div
                                style={{
                                  height: 4,
                                  background: "rgba(124,58,237,0.15)",
                                  borderRadius: 2,
                                  marginTop: 4,
                                }}
                              >
                                <div
                                  style={{
                                    height: "100%",
                                    width: `${progress}%`,
                                    background:
                                      "linear-gradient(90deg, #1a9fd4, #55c5f1)",
                                    borderRadius: 2,
                                    transition: "width 0.3s",
                                  }}
                                />
                              </div>
                            )}
                          </div>
                          {!uploading && (
                            <button
                              type="button"
                              style={{
                                background: "none",
                                border: "none",
                                color: "#94a3b8",
                                cursor: "pointer",
                                padding: 4,
                              }}
                              onClick={() => removeFile(f.name)}
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Upload Result */}
              {bulkResult && (
                <div style={{ marginTop: 12 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: 16,
                      borderRadius: 10,
                      background: bulkResult.isSuccess
                        ? "rgba(16,185,129,0.1)"
                        : "rgba(234,179,8,0.1)",
                      border: `1px solid ${bulkResult.isSuccess ? "rgba(16,185,129,0.2)" : "rgba(234,179,8,0.2)"}`,
                      color: bulkResult.isSuccess ? "#10b981" : "#eab308",
                      marginBottom: 12,
                    }}
                  >
                    {bulkResult.isSuccess ? (
                      <Check size={28} />
                    ) : (
                      <AlertCircle size={28} />
                    )}
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>
                        {bulkResult.isSuccess
                          ? "Tải lên thành công!"
                          : "Upload hoàn tất (một phần)"}
                      </div>
                      <div style={{ fontSize: 12, opacity: 0.85 }}>
                        {bulkResult.successCount}/{bulkResult.totalFiles} file
                        thành công
                        {bulkResult.failedCount > 0 &&
                          ` • ${bulkResult.failedCount} file thất bại`}
                      </div>
                    </div>
                  </div>

                  {bulkResult.uploadedFiles.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#10b981",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          marginBottom: 6,
                        }}
                      >
                        <Check size={14} /> Đã upload (
                        {bulkResult.uploadedFiles.length})
                      </div>
                      <div style={{ maxHeight: 120, overflowY: "auto" }}>
                        {bulkResult.uploadedFiles.map((f) => (
                          <div
                            key={f.id}
                            style={{
                              fontSize: 12,
                              color: "#10b981",
                              padding: "3px 0",
                              display: "flex",
                              gap: 6,
                            }}
                          >
                            <Music size={12} style={{ marginTop: 2 }} />
                            <span style={{ fontWeight: 500 }}>{f.title}</span>
                            <span style={{ opacity: 0.7 }}>— {f.artist}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {bulkResult.failedFiles.length > 0 && (
                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#ef4444",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          marginBottom: 6,
                        }}
                      >
                        <X size={14} /> Thất bại (
                        {bulkResult.failedFiles.length})
                      </div>
                      {bulkResult.failedFiles.map((f) => (
                        <div
                          key={f.fileName}
                          style={{
                            fontSize: 12,
                            color: "#ef4444",
                            padding: "3px 0",
                          }}
                        >
                          • {f.fileName}: {f.errorMessage}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="ops-modal-foot">
              <button
                className="ops-btn ops-btn--ghost"
                onClick={handleCloseUpload}
                disabled={uploading}
              >
                {bulkResult ? "Đóng" : "Hủy"}
              </button>
              {!bulkResult && (
                <button
                  className="ops-btn ops-btn--primary"
                  onClick={() => void handleUpload()}
                  disabled={files.length === 0 || uploading}
                >
                  {uploading ? (
                    <>Đang tải lên...</>
                  ) : (
                    <>
                      <Upload size={15} />
                      Tải lên {files.length > 0 ? `(${files.length})` : ""}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
