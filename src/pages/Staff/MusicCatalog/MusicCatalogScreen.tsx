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
} from "lucide-react";
import { liveSessionApiService } from "../../../services/liveSessionApiService";
import type { StationResult, MusicResult } from "../../../services/liveSessionApiService";
import { showError, showSuccess } from "../../../components/common/toastUtils";
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

  /* ── Checkbox selection for system media ── */
  const toggleSystemSelection = useCallback((id: string) => {
    setSelectedSystemIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const selectAllSystem = useCallback(() => {
    setSelectedSystemIds(systemMusic.map((m) => m.id));
  }, [systemMusic]);

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

          {/* Import button only shown in System Media tab */}
          {activeTab === "system" && (
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
                    const checked = selectedSystemIds.includes(m.id);
                    return (
                      <tr
                        key={m.id}
                        style={
                          checked
                            ? { background: "rgba(124, 58, 237, 0.07)" }
                            : {}
                        }
                      >
                        <td>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSystemSelection(m.id)}
                            style={{ width: 16, height: 16, cursor: "pointer" }}
                          />
                        </td>
                        <td>
                          <div className="mc-track-title">
                            <Music size={16} color="#4338ca" />
                            {m.title}
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
    </div>
  );
}