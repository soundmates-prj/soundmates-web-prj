import React, { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
  ArrowDownToLine,
  Trash2,
  Pencil,
  X,
  FileMusic,
  Music,
  ListMusic,
  CloudUpload,
  Upload,
  Check,
  AlertCircle,
} from "lucide-react";
import { liveSessionApiService } from "../../../services/liveSessionApiService";
import type {
  StationResult,
  MusicResult,
  BulkUploadMusicResult,
} from "../../../services/liveSessionApiService";
import { showError, showSuccess } from "../../../components/common/toastUtils";
import {
  ALLOWED_AUDIO_EXTENSIONS,
  ALLOWED_AUDIO_MIME_TYPES,
  MAX_UPLOAD_SIZE_BYTES,
  MAX_CLOUDINARY_AUDIO_SIZE_BYTES,
} from "../../Admin/LiveOps/liveSessionConstants";
import "./MusicCatalogScreen.css";

export function MusicCatalogScreen() {
  const [stations, setStations] = useState<StationResult[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<string>("");
  const [loadingStations, setLoadingStations] = useState(false);

  // Station music: synced from Station
  const [stationMusic, setStationMusic] = useState<MusicResult[]>([]);
  // System music: uploaded by Admin to SoundMates backend
  const [systemMusic, setSystemMusic] = useState<MusicResult[]>([]);

  const [loadingStation, setLoadingStation] = useState(false);
  const [loadingSystem, setLoadingSystem] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // "station" tab = music already in station
  // "system" tab = browse system media, pick & import
  const [activeTab, setActiveTab] = useState<"station" | "system">("station");

  // Import state
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedSystemIds, setSelectedSystemIds] = useState<string[]>([]);
  const [importTargetStationId, setImportTargetStationId] = useState<string>("");
  const [importing, setImporting] = useState(false);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Edit station metadata state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMusic, setEditingMusic] = useState<MusicResult | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editArtist, setEditArtist] = useState("");
  const [editAlbum, setEditAlbum] = useState("");
  const [editLyrics, setEditLyrics] = useState("");
  const [updatingMetadata, setUpdatingMetadata] = useState(false);
  
  // Bulk upload state
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [bulkResult, setBulkResult] = useState<BulkUploadMusicResult | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  /* ── Load stations on mount ── */
  useEffect(() => {
    void (async () => {
      setLoadingStations(true);
      try {
        const res = await liveSessionApiService.getStations();
        setStations(res);
        if (res.length > 0 && !selectedStationId) {
          setSelectedStationId(res[0].id);
          setImportTargetStationId(res[0].id);
        }
      } catch {
        showError("Lỗi", "Không thể tải danh sách station");
      } finally {
        setLoadingStations(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Load station music whenever the selected station changes ── */
  useEffect(() => {
    if (!selectedStationId) return;
    void (async () => {
      setLoadingStation(true);
      try {
        const res = await liveSessionApiService.getStationMusic(selectedStationId);
        setStationMusic(res);
      } catch {
        showError("Lỗi", "Không thể tải danh sách nhạc station");
      } finally {
        setLoadingStation(false);
      }
    })();
  }, [selectedStationId]);

  /* ── Load system music once ── */
  useEffect(() => {
    void (async () => {
      setLoadingSystem(true);
      try {
        const all = await liveSessionApiService.getAllMusic();
        setSystemMusic(all.filter((m) => m.sourceType === "system"));
      } catch {
        showError("Lỗi", "Không thể tải danh sách System Media");
      } finally {
        setLoadingSystem(false);
      }
    })();
  }, []);

  /* ── Sync music from Station to local DB ── */
  const handleSync = useCallback(async () => {
    if (!selectedStationId) return;
    setSyncing(true);
    try {
      const res = await liveSessionApiService.syncStationMusic(selectedStationId);
      showSuccess(
        "Thành công",
        `Đã đồng bộ ${res.created} file mới, cập nhật ${res.updated} file.`,
      );
      const refreshed = await liveSessionApiService.getStationMusic(selectedStationId);
      setStationMusic(refreshed);
    } catch {
      showError("Lỗi", "Đồng bộ nhạc thất bại");
    } finally {
      setSyncing(false);
    }
  }, [selectedStationId]);

  const restartStation = async () => {
    if (!selectedStationId) return;
    try {
      await liveSessionApiService.restartStation(selectedStationId);
      showSuccess("Đã yêu cầu Restart Broadcasting");
    } catch {
      showError("Restart thất bại");
    }
  };

  const reloadStation = async () => {
    if (!selectedStationId) return;
    try {
      await liveSessionApiService.reloadStation(selectedStationId);
      showSuccess("Đã yêu cầu Reload Config");
    } catch {
      showError("Reload thất bại");
    }
  };

  /* ── Checkbox selection for system media ── */
  const toggleSystemSelection = useCallback((id: string) => {
    setSelectedSystemIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const selectAllSystem = useCallback(() => {
    const nonImportedIds = systemMusic
      .filter((m) => !stationMusic.some((sm) => sm.id === m.id))
      .map((m) => m.id);
    setSelectedSystemIds(nonImportedIds);
  }, [systemMusic, stationMusic]);

  const clearSelectionSystem = useCallback(() => {
    setSelectedSystemIds([]);
  }, []);

  /* ── Import selected system media into chosen station ── */
  const handleImportToStation = useCallback(async () => {
    if (!importTargetStationId || selectedSystemIds.length === 0) return;
    setImporting(true);
    try {
      const result = await liveSessionApiService.importSystemMediaBatch(
        importTargetStationId,
        selectedSystemIds,
      );
      if (result.failedCount > 0) {
        showError(
          "Import hoàn tất (một phần)",
          `${result.importedCount} thành công, ${result.failedCount} thất bại`,
        );
      } else {
        showSuccess(
          "Import thành công",
          `Đã import ${result.importedCount} bài vào station "${stations.find((s) => s.id === importTargetStationId)?.stationName}"`,
        );
      }
      setShowImportModal(false);
      setSelectedSystemIds([]);
      // Refresh station music for the import target
      if (importTargetStationId === selectedStationId) {
        const refreshed = await liveSessionApiService.getStationMusic(importTargetStationId);
        setStationMusic(refreshed);
      }
    } catch {
      showError("Lỗi", "Không thể import System Media vào station");
    } finally {
      setImporting(false);
    }
  }, [importTargetStationId, selectedSystemIds, stations, selectedStationId]);

  /* ── Delete a music item ── */
  const handleDeleteMusic = useCallback(
    async (musicId: string) => {
      if (
        !window.confirm(
          "Bạn có chắc chắn muốn xóa bài hát này không? Hành động này không thể hoàn tác.",
        )
      ) {
        return;
      }
      setDeletingId(musicId);
      try {
        await liveSessionApiService.deleteMusic(musicId);
        showSuccess("Thành công", "Đã xóa bài hát");
        // Refresh the list we're currently viewing
        if (activeTab === "station") {
          const refreshed = await liveSessionApiService.getStationMusic(selectedStationId);
          setStationMusic(refreshed);
        } else {
          const all = await liveSessionApiService.getAllMusic();
          setSystemMusic(all.filter((m) => m.sourceType === "system"));
        }
      } catch {
        showError("Lỗi", "Xóa bài hát thất bại");
      } finally {
        setDeletingId(null);
      }
    },
    [activeTab, selectedStationId],
  );

  const openEditStationMusicModal = useCallback((music: MusicResult) => {
    setEditingMusic(music);
    setEditTitle(music.title ?? "");
    setEditArtist(music.artist ?? "");
    setEditAlbum(music.album ?? "");
    setEditLyrics(music.lyrics ?? "");
    setShowEditModal(true);
  }, []);

  const closeEditStationMusicModal = useCallback(() => {
    if (updatingMetadata) {
      return;
    }

    setShowEditModal(false);
    setEditingMusic(null);
  }, [updatingMetadata]);

  const handleUpdateStationMusicMetadata = useCallback(async () => {
    if (!selectedStationId || !editingMusic) {
      return;
    }

    if (!editTitle.trim()) {
      showError("Thiếu dữ liệu", "Tên bài hát không được để trống");
      return;
    }

    setUpdatingMetadata(true);
    try {
      await liveSessionApiService.updateStationMusicMetadata(selectedStationId, editingMusic.id, {
        title: editTitle.trim(),
        artist: editArtist.trim() || null,
        album: editAlbum.trim() || null,
        lyrics: editLyrics.trim() || null,
      });

      const refreshed = await liveSessionApiService.getStationMusic(selectedStationId);
      setStationMusic(refreshed);

      showSuccess("Cập nhật thành công", "Đã đồng bộ metadata và lyrics lên AzuraCast");
      setShowEditModal(false);
      setEditingMusic(null);
    } catch (error: any) {
      showError(
        "Lỗi",
        error?.response?.data?.message || "Không thể cập nhật metadata bài hát",
      );
    } finally {
      setUpdatingMetadata(false);
    }
  }, [
    selectedStationId,
    editingMusic,
    editTitle,
    editArtist,
    editAlbum,
    editLyrics,
  ]);

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

  /* ── Bulk Upload Logic ── */
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

    if (input.size > MAX_CLOUDINARY_AUDIO_SIZE_BYTES) {
      showError(
        "File vượt giới hạn Cloudinary",
        `File không được vượt quá 10MB (Cloudinary). File "${input.name}" có dung lượng ${formatFileSize(input.size)}.`,
      );
      return false;
    }

    return true;
  }, []);

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
      setUploadFiles((prev) => {
        const existing = new Set(prev.map((f) => f.name));
        const newFiles = validFiles.filter((f) => !existing.has(f.name));
        return [...prev, ...newFiles];
      });
    },
    [validateFile],
  );

  const removeUploadFile = useCallback((fileName: string) => {
    setUploadFiles((prev) => prev.filter((f) => f.name !== fileName));
  }, []);

  const handleBulkUpload = useCallback(async () => {
    if (uploadFiles.length === 0) return;

    const initialProgress: Record<string, number> = {};
    for (const f of uploadFiles) initialProgress[f.name] = 0;
    setUploadProgress(initialProgress);
    setUploading(true);

    const intervals: Record<string, any> = {};
    for (const f of uploadFiles) {
      let progress = 0;
      intervals[f.name] = setInterval(() => {
        progress = Math.min(progress + Math.floor(Math.random() * 15) + 5, 90);
        setUploadProgress((prev) => ({ ...prev, [f.name]: progress }));
      }, 300);
    }

    try {
      // Staff upload to System Media — no stationId
      const result = await liveSessionApiService.bulkUploadMusic(undefined, uploadFiles);
      
      setUploadProgress((prev) => {
        const done: Record<string, number> = {};
        for (const f of uploadFiles) done[f.name] = 100;
        return done;
      });
      setBulkResult(result);

      if (result.isSuccess) {
        showSuccess("Thành công", `Đã thêm ${result.successCount} bài vào hệ thống`);
        // Refresh system music
        const all = await liveSessionApiService.getAllMusic();
        setSystemMusic(all.filter((m) => m.sourceType === "system"));
      } else {
        showError("Hoàn tất (một phần)", `${result.successCount}/${result.totalFiles} thành công`);
      }
    } catch {
      showError("Lỗi", "Không thể upload nhạc lên hệ thống");
    } finally {
      Object.values(intervals).forEach(clearInterval);
      setUploading(false);
    }
  }, [uploadFiles]);

  const closeBulkUpload = useCallback(() => {
    if (uploading) return;
    setShowBulkUpload(false);
    setUploadFiles([]);
    setBulkResult(null);
    setUploadProgress({});
  }, [uploading]);

  const displayStationMusic = stationMusic.filter(
    (m) => m.sourceType === "station",
  );

  return (
    <div className="staff-dashboard">
      {/* ── Page Header ── */}
      <div className="staff-page-header">
        <div>
          <h1 className="staff-page-title">Kho Nhạc (Music Catalog)</h1>
          <p className="staff-page-subtitle">
            Quản lý nhạc trên Station &amp; Import từ System Media
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            className="staff-btn staff-btn--outline"
            onClick={handleSync}
            disabled={!selectedStationId || syncing}
          >
            <RefreshCw
              size={16}
              className={syncing ? "staff-spin" : ""}
            />
            {syncing ? "Đang đồng bộ..." : "Đồng bộ Station"}
          </button>

          <button
            className="staff-btn staff-btn--outline"
            onClick={reloadStation}
            disabled={!selectedStationId}
            title="Reload AzuraCast config mà không rớt mạng"
          >
            Reload Config
          </button>

          <button
            className="staff-btn staff-btn--outline"
            onClick={restartStation}
            disabled={!selectedStationId}
            title="Khởi động lại toàn bộ trạm phát sóng"
          >
            Restart Broadcast
          </button>

          {/* Import button only shown in System Media tab */}
          {activeTab === "system" && (
            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="staff-btn staff-btn--outline"
                onClick={() => setShowBulkUpload(true)}
              >
                <Upload size={16} />
                Thêm nhạc vào System
              </button>
              <button
                className="staff-btn staff-btn--primary"
                onClick={() => {
                  if (selectedSystemIds.length === 0) {
                    showError("Chưa chọn", "Vui lòng chọn ít nhất 1 bài để import");
                    return;
                  }
                  setShowImportModal(true);
                }}
              >
                <ArrowDownToLine size={16} />
                Import vào Station
                {selectedSystemIds.length > 0 &&
                  ` (${selectedSystemIds.length})`}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Station Selector Tabs ── */}
      <div className="mc-tabs">
        {stations.map((st) => (
          <button
            key={st.id}
            className={`mc-tab ${selectedStationId === st.id ? "active" : ""}`}
            onClick={() => setSelectedStationId(st.id)}
          >
            {st.stationName}
          </button>
        ))}
      </div>

      {/* ── Main Content Card ── */}
      <div className="mc-layout">
        {/* Header row: tab switcher + count */}
        <div className="mc-header">
          <div style={{ display: "flex", gap: 12 }}>
            <button
              className={`staff-btn ${
                activeTab === "station"
                  ? "staff-btn--primary"
                  : "staff-btn--outline"
              }`}
              style={{ padding: "6px 14px", fontSize: 13 }}
              onClick={() => setActiveTab("station")}
            >
              <ListMusic size={14} style={{ marginRight: 5 }} />
              Station Media ({displayStationMusic.length})
            </button>
            <button
              className={`staff-btn ${
                activeTab === "system"
                  ? "staff-btn--primary"
                  : "staff-btn--outline"
              }`}
              style={{ padding: "6px 14px", fontSize: 13 }}
              onClick={() => setActiveTab("system")}
            >
              <Music size={14} style={{ marginRight: 5 }} />
              System Media ({systemMusic.length})
            </button>
          </div>

          {activeTab === "system" && systemMusic.length > 0 && (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>
                {selectedSystemIds.length}/{systemMusic.length} được chọn
              </span>
              <button
                className="staff-btn staff-btn--outline"
                style={{ padding: "4px 10px", fontSize: 12 }}
                onClick={selectAllSystem}
              >
                Chọn tất cả
              </button>
              <button
                className="staff-btn staff-btn--outline"
                style={{ padding: "4px 10px", fontSize: 12 }}
                onClick={clearSelectionSystem}
              >
                Bỏ chọn
              </button>
            </div>
          )}
        </div>

        {/* ── Station Media Tab ── */}
        {activeTab === "station" ? (
          loadingStation ? (
            <div className="staff-loading">
              <RefreshCw size={24} className="staff-spin" />
              <p>Đang tải nhạc Station...</p>
            </div>
          ) : displayStationMusic.length === 0 ? (
            <div
              style={{
                padding: 60,
                textAlign: "center",
                color: "#64748b",
              }}
            >
              <FileMusic
                size={48}
                style={{ margin: "0 auto 16px", opacity: 0.5 }}
              />
              <p>
                Chưa có nhạc nào trong station này.
                <br />
                Nhấn <strong>Đồng bộ Station</strong> để tải nhạc từ station hoặc
                chuyển sang tab{" "}
                <strong>System Media</strong> để import nhạc.
              </p>
            </div>
          ) : (
            <div className="mc-table-container">
              <table className="mc-table">
                <thead>
                  <tr>
                    <th>Bài hát</th>
                    <th>Nguồn</th>
                    <th>Thời lượng</th>
                    <th>Loại file</th>
                    <th>Ngày thêm</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {displayStationMusic.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <div className="mc-track-title">
                          <FileMusic size={16} color="#7C5CFC" />
                          {m.title}
                        </div>
                        <div className="mc-track-artist">
                          {m.artist}
                          {m.album ? ` - ${m.album}` : ""}
                        </div>
                      </td>
                      <td>
                        <span className="mc-badge station">Station</span>
                      </td>
                      <td>{formatDuration(m.duration)}</td>
                      <td
                        style={{
                          textTransform: "uppercase",
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#94a3b8",
                        }}
                      >
                        {m.fileType}
                      </td>
                      <td>
                        {new Date(m.uploadedAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td>
                        <button
                          className="mc-btn-icon mc-btn-icon--edit"
                          title="Sửa thông tin và lyrics"
                          onClick={() => openEditStationMusicModal(m)}
                          disabled={deletingId === m.id}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="mc-btn-icon"
                          title="Xóa bài hát"
                          onClick={() => void handleDeleteMusic(m.id)}
                          disabled={deletingId === m.id}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : /* ── System Media Tab ── */ loadingSystem ? (
          <div className="staff-loading">
            <RefreshCw size={24} className="staff-spin" />
            <p>Đang tải System Media...</p>
          </div>
        ) : systemMusic.length === 0 ? (
          <div
            style={{
              padding: 60,
              textAlign: "center",
              color: "#64748b",
            }}
          >
            <Music
              size={48}
              style={{ margin: "0 auto 16px", opacity: 0.5 }}
            />
            <p>
              Chưa có System Media nào trong hệ thống.
              <br />
              Admin cần{" "}
              <strong>upload nhạc vào Kho Nhạc Hệ Thống</strong> trước.
            </p>
          </div>
        ) : (
          <>
            {/* Hint bar */}
            <div
              style={{
                padding: "10px 24px",
                fontSize: 13,
                color: "#7C5CFC",
                background: "rgba(124, 58, 237, 0.05)",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Music size={14} />
              <strong>System Media</strong> — nhạc do Admin upload lên SoundMates.
              Chọn bài và nhấn{" "}
              <strong style={{ color: "#1a9fd4" }}>Import vào Station</strong>
            </div>

            <div className="mc-table-container">
              <table className="mc-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}></th>
                    <th>Bài hát</th>
                    <th>Nghệ sĩ</th>
                    <th>Thời lượng</th>
                    <th>Ngày thêm</th>
                    <th>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {systemMusic.map((m) => {
                    const alreadyInStation = stationMusic.some((sm) => sm.id === m.id);
                    const checked = selectedSystemIds.includes(m.id);
                    return (
                      <tr
                        key={m.id}
                        style={
                          alreadyInStation
                            ? { opacity: 0.8, background: "rgba(0,0,0,0.02)" }
                            : checked
                            ? { background: "rgba(124, 58, 237, 0.07)" }
                            : {}
                        }
                      >
                        <td>
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={alreadyInStation}
                            onChange={() => toggleSystemSelection(m.id)}
                            style={{
                              width: 16,
                              height: 16,
                              cursor: alreadyInStation ? "not-allowed" : "pointer",
                            }}
                          />
                        </td>
                        <td>
                          <div className="mc-track-title">
                            <Music size={16} color="#4338ca" />
                            {m.title}
                            {alreadyInStation && (
                              <span
                                style={{
                                  fontSize: 10,
                                  padding: "2px 6px",
                                  borderRadius: 4,
                                  background: "#ecfdf5",
                                  color: "#059669",
                                  marginLeft: 8,
                                  fontWeight: 700,
                                  textTransform: "uppercase",
                                }}
                              >
                                Đã có
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="mc-track-artist">{m.artist}</td>
                        <td>{formatDuration(m.duration)}</td>
                        <td>
                          {new Date(m.uploadedAt).toLocaleDateString("vi-VN")}
                        </td>
                        <td>
                          <button
                            className="mc-btn-icon"
                            title="Xóa khỏi System Media"
                            onClick={() => void handleDeleteMusic(m.id)}
                            disabled={deletingId === m.id}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ── Edit Station Music Modal ── */}
      {showEditModal && editingMusic && (
        <div
          className="staff-modal-overlay"
          onClick={closeEditStationMusicModal}
        >
          <div className="staff-modal mc-edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="staff-modal-header">
              <h3>
                <Pencil size={18} style={{ marginRight: 8, color: "#0ea5e9" }} />
                Cập nhật bài hát trên Station
              </h3>
              <button
                className="staff-modal-close"
                onClick={closeEditStationMusicModal}
                disabled={updatingMetadata}
              >
                <X size={18} />
              </button>
            </div>

            <div className="staff-modal-body">
              <label className="mc-edit-label">Tên bài hát</label>
              <input
                className="staff-input"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                disabled={updatingMetadata}
                placeholder="Nhập tên bài hát"
                autoFocus
              />

              <label className="mc-edit-label">Nghệ sĩ</label>
              <input
                className="staff-input"
                value={editArtist}
                onChange={(e) => setEditArtist(e.target.value)}
                disabled={updatingMetadata}
                placeholder="Unknown Artist"
              />

              <label className="mc-edit-label">Album</label>
              <input
                className="staff-input"
                value={editAlbum}
                onChange={(e) => setEditAlbum(e.target.value)}
                disabled={updatingMetadata}
                placeholder="Tên album (tuỳ chọn)"
              />

              <label className="mc-edit-label">Lyrics</label>
              <textarea
                className="staff-input mc-edit-textarea"
                value={editLyrics}
                onChange={(e) => setEditLyrics(e.target.value)}
                disabled={updatingMetadata}
                placeholder="Nhập lời bài hát (LRC hoặc plain text)"
              />
            </div>

            <div className="staff-modal-footer">
              <button
                className="staff-btn staff-btn--outline"
                onClick={closeEditStationMusicModal}
                disabled={updatingMetadata}
              >
                Hủy
              </button>
              <button
                className="staff-btn staff-btn--primary"
                onClick={() => void handleUpdateStationMusicMetadata()}
                disabled={updatingMetadata || !editTitle.trim()}
              >
                {updatingMetadata ? (
                  <>
                    <RefreshCw size={14} className="staff-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Pencil size={14} />
                    Lưu và sync AzuraCast
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Import Confirmation Modal ── */}
      {showImportModal && (
        <div
          className="staff-modal-overlay"
          onClick={() => !importing && setShowImportModal(false)}
        >
          <div className="staff-modal" onClick={(e) => e.stopPropagation()}>
            <div className="staff-modal-header">
              <h3>
                <ArrowDownToLine
                  size={18}
                  style={{ marginRight: 8, color: "#7C5CFC" }}
                />
                Import System Media vào Station
              </h3>
              <button
                className="staff-modal-close"
                onClick={() => setShowImportModal(false)}
                disabled={importing}
              >
                <X size={18} />
              </button>
            </div>

            <div className="staff-modal-body">
              {/* Station selector */}
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: 8,
                    fontWeight: 600,
                    fontSize: 13,
                    color: "#475569",
                  }}
                >
                  Chọn Station đích
                </label>
                <select
                  className="staff-input"
                  value={importTargetStationId}
                  onChange={(e) => setImportTargetStationId(e.target.value)}
                  disabled={importing}
                  style={{ padding: "10px 12px" }}
                >
                  {stations.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.stationName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Summary */}
              <div
                style={{
                  padding: 12,
                  borderRadius: 10,
                  background: "rgba(124,58,237,0.07)",
                  border: "1px solid rgba(124,58,237,0.15)",
                  marginBottom: 16,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    color: "#1e293b",
                  }}
                >
                  Sẽ import{" "}
                  <strong style={{ color: "#7C5CFC" }}>
                    {selectedSystemIds.length} bài
                  </strong>{" "}
                  từ System Media vào station{" "}
                  <strong>
                    "
                    {
                      stations.find((s) => s.id === importTargetStationId)
                        ?.stationName
                    }
                    "
                  </strong>
                  .
                </p>
              </div>

              {/* Preview list */}
              <div
                style={{
                  maxHeight: 200,
                  overflowY: "auto",
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  background: "#f8fafc",
                }}
              >
                {selectedSystemIds.slice(0, 30).map((id) => {
                  const track = systemMusic.find((m) => m.id === id);
                  return track ? (
                    <div
                      key={id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "7px 12px",
                        borderBottom: "1px solid #f1f5f9",
                      }}
                    >
                      <Music size={13} color="#4338ca" />
                      <span style={{ fontSize: 13, fontWeight: 500 }}>
                        {track.title}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          color: "#94a3b8",
                          marginLeft: "auto",
                        }}
                      >
                        {track.artist}
                      </span>
                    </div>
                  ) : null;
                })}
                {selectedSystemIds.length > 30 && (
                  <div
                    style={{
                      padding: "8px 12px 4px",
                      fontSize: 12,
                      color: "#94a3b8",
                      textAlign: "center",
                    }}
                  >
                    ... và {selectedSystemIds.length - 30} bài khác
                  </div>
                )}
              </div>
            </div>

            <div className="staff-modal-footer">
              <button
                className="staff-btn staff-btn--outline"
                onClick={() => setShowImportModal(false)}
                disabled={importing}
              >
                Hủy
              </button>
              <button
                className="staff-btn staff-btn--primary"
                onClick={() => void handleImportToStation()}
                disabled={importing}
              >
                {importing ? (
                  <>
                    <RefreshCw size={14} className="staff-spin" />
                    Đang import...
                  </>
                ) : (
                  <>
                    <ArrowDownToLine size={14} />
                    Import {selectedSystemIds.length} bài
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Upload Modal ── */}
      {showBulkUpload && (
        <div
          className="staff-modal-overlay"
          onClick={closeBulkUpload}
        >
          <div
            className="staff-modal mc-upload-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="staff-modal-header">
              <h3>
                <CloudUpload
                  size={18}
                  style={{ marginRight: 8, color: "#1a9fd4" }}
                />
                Tải lên nhạc vào Hệ Thống
              </h3>
              <button
                className="staff-modal-close"
                onClick={closeBulkUpload}
                disabled={uploading}
              >
                <X size={18} />
              </button>
            </div>

            <div className="staff-modal-body">
              {!uploading && !bulkResult && (
                <div
                  className="file-drop-area"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleMultiFileSelect(e.dataTransfer.files);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <CloudUpload
                    size={40}
                    style={{ marginBottom: 12, color: "#1a9fd4", opacity: 0.8 }}
                  />
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>
                    Chọn hoặc thả file nhạc tại đây
                  </p>
                  <p style={{ margin: "8px 0 0", fontSize: 12, color: "#94a3b8" }}>
                    MP3, FLAC, WAV, OGG • Tối đa 100MB • Mỗi file giới hạn 10MB
                  </p>
                  <button className="staff-btn staff-btn--outline" style={{ marginTop: 16 }}>
                    Chọn file âm thanh
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                style={{ display: "none" }}
                accept=".mp3,.flac,.wav,.ogg,audio/*"
                multiple
                onChange={(e) => handleMultiFileSelect(e.target.files)}
              />

              {uploadFiles.length > 0 && !bulkResult && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#1a9fd4" }}>
                      Số lượng: {uploadFiles.length} file
                    </span>
                    <button
                      className="staff-btn staff-btn--ghost"
                      style={{ padding: "4px 8px", fontSize: 12 }}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      + Thêm file
                    </button>
                  </div>

                  <div className="mc-upload-list">
                    {uploadFiles.map((f, i) => {
                      const progress = uploadProgress[f.name] ?? 0;
                      const isDone = progress === 100;
                      return (
                        <div key={f.name + i} className={`mc-upload-item ${isDone ? "done" : ""}`}>
                          <Music size={16} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="mc-upload-name">{f.name}</div>
                            <div className="mc-upload-meta">
                              {formatFileSize(f.size)}
                              {progress > 0 && progress < 100 && (
                                <span style={{ marginLeft: 8, color: "#1a9fd4" }}>{progress}%</span>
                              )}
                              {isDone && (
                                <span style={{ marginLeft: 8, color: "#10b981", fontWeight: 700 }}>
                                  Hoàn tất
                                </span>
                              )}
                            </div>
                            {progress > 0 && progress < 100 && (
                              <div className="mc-upload-progress">
                                <div
                                  className="mc-upload-progress-bar"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            )}
                          </div>
                          {!uploading && (
                            <button className="mc-upload-remove" onClick={() => removeUploadFile(f.name)}>
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {bulkResult && (
                <div className="mc-bulk-result">
                  <div className={`mc-result-header ${bulkResult.isSuccess ? "success" : "partial"}`}>
                    {bulkResult.isSuccess ? <Check size={24} /> : <AlertCircle size={24} />}
                    <div>
                      <div className="mc-result-title">
                        {bulkResult.isSuccess ? "Tải lên thành công" : "Hoàn tất một phần"}
                      </div>
                      <div className="mc-result-desc">
                        {bulkResult.successCount}/{bulkResult.totalFiles} file thành công
                      </div>
                    </div>
                  </div>

                  {bulkResult.uploadedFiles.length > 0 && (
                    <div className="mc-result-list">
                      <p className="mc-result-label success">Đã thêm vào catalog:</p>
                      {bulkResult.uploadedFiles.slice(0, 10).map((f) => (
                        <div key={f.id} className="mc-result-item">
                          <Check size={12} /> {f.title} — {f.artist}
                        </div>
                      ))}
                      {bulkResult.uploadedFiles.length > 10 && (
                        <p className="mc-result-more">... và {bulkResult.uploadedFiles.length - 10} bài khác</p>
                      )}
                    </div>
                  )}

                  {bulkResult.failedFiles.length > 0 && (
                    <div className="mc-result-list">
                      <p className="mc-result-label error">Lỗi upload:</p>
                      {bulkResult.failedFiles.map((f, i) => (
                        <div key={i} className="mc-result-item error">
                          <X size={12} /> {f.fileName}: {f.errorMessage}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="staff-modal-footer">
              <button
                className="staff-btn staff-btn--outline"
                onClick={closeBulkUpload}
                disabled={uploading}
              >
                {bulkResult ? "Đóng" : "Hủy"}
              </button>
              {!bulkResult && (
                <button
                  className="staff-btn staff-btn--primary"
                  onClick={() => void handleBulkUpload()}
                  disabled={uploadFiles.length === 0 || uploading}
                >
                  {uploading ? (
                    <>
                      <RefreshCw size={14} className="staff-spin" />
                      Đang tải lên...
                    </>
                  ) : (
                    <>
                      <Upload size={14} />
                      Tải lên {uploadFiles.length > 0 ? `(${uploadFiles.length})` : ""}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}