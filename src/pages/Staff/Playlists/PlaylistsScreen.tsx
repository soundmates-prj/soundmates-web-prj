import { useState, useEffect, useCallback } from "react";
import {
  ListMusic,
  RefreshCw,
  Plus,
  Pencil,
  ChevronRight,
  ArrowDownToLine,
  Music,
  Trash2,
  X,
} from "lucide-react";
import { liveSessionApiService } from "../../../services/liveSessionApiService";
import type {
  StationResult,
  PlaylistResult,
  PlaylistMediaResult,
  MusicResult,
} from "../../../services/liveSessionApiService";
import { showSuccess, showError } from "../../../components/common/toastUtils";
import "../StaffShared.css";
import "./PlaylistsScreen.css";

export function PlaylistsScreen() {
  const [stations, setStations] = useState<StationResult[]>([]);
  const [selectedStation, setSelectedStation] = useState<StationResult | null>(null);
  const [playlists, setPlaylists] = useState<PlaylistResult[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistResult | null>(null);
  const [tracks, setTracks] = useState<PlaylistMediaResult[]>([]);
  const [stationMusic, setStationMusic] = useState<MusicResult[]>([]);
  const [systemMusic, setSystemMusic] = useState<MusicResult[]>([]);
  const [musicTab, setMusicTab] = useState<"station" | "system">("station");
  const [selectedSystemMediaIds, setSelectedSystemMediaIds] = useState<string[]>([]);
  const [musicActionLoading, setMusicActionLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddTracksModal, setShowAddTracksModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDesc, setNewPlaylistDesc] = useState("");
  const [editPlaylistName, setEditPlaylistName] = useState("");
  const [editIsAutoPlay, setEditIsAutoPlay] = useState(false);
  const [editIncludeInRequests, setEditIncludeInRequests] = useState(false);
  const [editIncludeInOnDemand, setEditIncludeInOnDemand] = useState(false);
  const [editIsEnabled, setEditIsEnabled] = useState(true);

  useEffect(() => {
    loadStations();
  }, []);

  const loadStations = async () => {
    setLoading(true);
    try {
      const data = await liveSessionApiService.getStations();
      setStations(data);
      if (data.length > 0 && !selectedStation) {
        handleSelectStation(data[0]);
      }
    } catch {
      showError("Lỗi", "Không thể tải stations");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStation = useCallback(async (station: StationResult) => {
    setSelectedStation(station);
    setSelectedPlaylist(null);
    setTracks([]);
    try {
      const data = await liveSessionApiService.getStationPlaylists(station.id);
      setPlaylists(data);
    } catch {
      setPlaylists([]);
    }
  }, []);

  const handleSelectPlaylist = async (pl: PlaylistResult) => {
    setSelectedPlaylist(pl);
    setLoadingTracks(true);
    try {
      const data = await liveSessionApiService.getPlaylistTracks(pl.id);
      setTracks(data);
    } catch {
      setTracks([]);
    } finally {
      setLoadingTracks(false);
    }
  };

  const handleSyncPlaylists = async () => {
    if (!selectedStation) return;
    setSyncing(true);
    try {
      const result = await liveSessionApiService.syncStationPlaylists(selectedStation.id);
      showSuccess("Đồng bộ thành công!", `${result.created} tạo, ${result.updated} cập nhật`);
      const data = await liveSessionApiService.getStationPlaylists(selectedStation.id);
      setPlaylists(data);
    } catch {
      showError("Đồng bộ thất bại", "Không thể đồng bộ playlists");
    } finally {
      setSyncing(false);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!selectedStation || !newPlaylistName.trim()) return;
    try {
      await liveSessionApiService.createPlaylist({
        stationId: selectedStation.id,
        playlistName: newPlaylistName.trim(),
        description: newPlaylistDesc.trim() || undefined,
        isAutoPlay: false,
      });
      showSuccess("Tạo thành công!", `Playlist "${newPlaylistName}" đã được tạo`);
      setShowCreateModal(false);
      setNewPlaylistName("");
      setNewPlaylistDesc("");
      const data = await liveSessionApiService.getStationPlaylists(selectedStation.id);
      setPlaylists(data);
    } catch {
      showError("Lỗi", "Không thể tạo playlist");
    }
  };

  const openEditPlaylistModal = () => {
    if (!selectedPlaylist) return;

    setEditPlaylistName(selectedPlaylist.playlistName ?? "");
    setEditIsAutoPlay(Boolean(selectedPlaylist.isAutoPlay));
    setEditIncludeInRequests(Boolean(selectedPlaylist.includeInRequests));
    setEditIncludeInOnDemand(Boolean(selectedPlaylist.includeInOnDemand));
    setEditIsEnabled(selectedPlaylist.isEnabled ?? true);
    setShowEditModal(true);
  };

  const handleUpdatePlaylist = async () => {
    if (!selectedPlaylist || !selectedStation || !editPlaylistName.trim()) {
      return;
    }

    try {
      await liveSessionApiService.updatePlaylist(selectedPlaylist.id, {
        playlistName: editPlaylistName.trim(),
        isAutoPlay: editIsAutoPlay,
        includeInRequests: editIncludeInRequests,
        includeInOnDemand: editIncludeInOnDemand,
        isEnabled: editIsEnabled,
      });

      const updatedPlaylists = await liveSessionApiService.getStationPlaylists(selectedStation.id);
      setPlaylists(updatedPlaylists);

      const updatedSelected = updatedPlaylists.find((pl) => pl.id === selectedPlaylist.id) ?? null;
      setSelectedPlaylist(updatedSelected);

      setShowEditModal(false);
      showSuccess("Cập nhật thành công", `Playlist "${editPlaylistName.trim()}" đã được cập nhật`);
    } catch {
      showError("Lỗi", "Không thể cập nhật playlist");
    }
  };

  const handleDeletePlaylist = async () => {
    if (!selectedPlaylist || !selectedStation) return;

    if (!window.confirm(`Bạn có chắc chắn muốn xoá playlist \"${selectedPlaylist.playlistName}\"?`)) {
      return;
    }

    try {
      await liveSessionApiService.deletePlaylist(selectedPlaylist.id);

      const updatedPlaylists = await liveSessionApiService.getStationPlaylists(selectedStation.id);
      setPlaylists(updatedPlaylists);
      setSelectedPlaylist(null);
      setTracks([]);

      showSuccess("Đã xoá", "Playlist đã được xoá thành công");
    } catch {
      showError("Lỗi", "Không thể xoá playlist");
    }
  };

  const handleOpenAddTracks = async () => {
    if (!selectedStation || !selectedPlaylist) return;
    try {
      const [stationMedia, allMedia] = await Promise.all([
        liveSessionApiService.getStationMusic(selectedStation.id),
        liveSessionApiService.getAllMusic(),
      ]);

      setStationMusic(stationMedia);
      setSystemMusic(allMedia.filter((m) => m.sourceType === "system"));
      setMusicTab("station");
      setSelectedSystemMediaIds([]);
      setShowAddTracksModal(true);
    } catch {
      showError("Lỗi", "Không thể tải danh sách nhạc");
    }
  };

  const handleAddTrack = async (musicId: string) => {
    if (!selectedPlaylist) return;
    try {
      await liveSessionApiService.addTracksToPlaylist(selectedPlaylist.id, [musicId]);
      showSuccess("Đã thêm", "Track đã được thêm vào playlist");
      const data = await liveSessionApiService.getPlaylistTracks(selectedPlaylist.id);
      setTracks(data);
    } catch {
      showError("Lỗi", "Không thể thêm track");
    }
  };

  const handleRemoveTrack = async (musicId: string) => {
    if (!selectedPlaylist) return;
    try {
      await liveSessionApiService.removeTracksFromPlaylist(selectedPlaylist.id, [musicId]);
      setTracks((prev) => prev.filter((t) => t.mediaFileId !== musicId));
      showSuccess("Đã xóa", "Track đã được xóa khỏi playlist");
    } catch {
      showError("Lỗi", "Không thể xóa track");
    }
  };

  const toggleSystemMediaSelection = (mediaId: string) => {
    setSelectedSystemMediaIds((prev) =>
      prev.includes(mediaId)
        ? prev.filter((id) => id !== mediaId)
        : [...prev, mediaId]
    );
  };

  const handleImportSystemMediaBatch = async () => {
    if (!selectedStation || selectedSystemMediaIds.length === 0) return;

    setMusicActionLoading(true);
    try {
      const result = await liveSessionApiService.importSystemMediaBatch(selectedStation.id, selectedSystemMediaIds);
      showSuccess(
        "Import thành công",
        `Imported ${result.importedCount}, skipped ${result.skippedCount}, failed ${result.failedCount}`
      );

      if (result.errors.length > 0) {
        showError("Một số bài import lỗi", result.errors[0]);
      }

      const stationMedia = await liveSessionApiService.getStationMusic(selectedStation.id);
      setStationMusic(stationMedia);
      setSelectedSystemMediaIds([]);
    } catch {
      showError("Lỗi", "Không thể import system media vào station");
    } finally {
      setMusicActionLoading(false);
    }
  };

  const handleAddSelectedSystemToPlaylist = async () => {
    if (!selectedPlaylist || !selectedStation || selectedSystemMediaIds.length === 0) return;

    const existingIds = new Set(tracks.map((t) => t.mediaFileId));
    const idsToAdd = selectedSystemMediaIds.filter((id) => !existingIds.has(id));

    if (idsToAdd.length === 0) {
      showError("Đã tồn tại", "Các bài đã được thêm vào playlist trước đó");
      return;
    }

    setMusicActionLoading(true);
    try {
      // Bước 1: Import system media lên AzuraCast trước
      const importResult = await liveSessionApiService.importSystemMediaBatch(
        selectedStation.id,
        idsToAdd
      );

      if (importResult.failedCount > 0) {
        showError(
          "Import lỗi",
          `${importResult.failedCount} bài không thể import lên AzuraCast. Kiểm tra file trên server.`
        );
        if (importResult.errors.length > 0) {
          console.warn("Import errors:", importResult.errors);
        }
      }

      if (importResult.importedCount > 0) {
        showSuccess(
          "Import thành công",
          `Đã import ${importResult.importedCount} bài lên AzuraCast`
        );
      }

      // Bước 2: Refresh station music để lấy media đã import hoặc đã map trước đó
      const refreshedStationMedia = await liveSessionApiService.getStationMusic(selectedStation.id);
      setStationMusic(refreshedStationMedia);

      // Bước 3: Chỉ add những bài thực sự đã có trong station media
      const stationMediaIds = new Set(refreshedStationMedia.map((item) => item.id));
      const readyToAddIds = idsToAdd.filter(
        (id) => stationMediaIds.has(id) && !existingIds.has(id)
      );

      if (readyToAddIds.length > 0) {
        await liveSessionApiService.addTracksToPlaylist(selectedPlaylist.id, readyToAddIds);
        showSuccess("Đã thêm", `Đã thêm ${readyToAddIds.length} bài vào playlist`);
      }

      const unresolvedCount = idsToAdd.length - readyToAddIds.length;
      if (unresolvedCount > 0) {
        showError(
          "Một số bài chưa sẵn sàng",
          `${unresolvedCount} bài chưa import được vào station nên chưa thêm playlist.`
        );
      }

      // Refresh playlist tracks
      const updatedTracks = await liveSessionApiService.getPlaylistTracks(selectedPlaylist.id);
      setTracks(updatedTracks);
      setSelectedSystemMediaIds([]);
    } catch (err: any) {
      console.error("Add system to playlist error:", err);
      showError(
        "Lỗi",
        err?.response?.data?.message || "Không thể thêm system media vào playlist"
      );
    } finally {
      setMusicActionLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="staff-loading">
        <RefreshCw size={24} className="staff-spin" />
        <p>Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="staff-dashboard">
      {/* Header */}
      <div className="staff-page-header">
        <div>
          <h1 className="staff-page-title" style={{
            background: 'linear-gradient(135deg, #1a9fd4 0%, #55c5f1 50%, #a0e4ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>Playlists</h1>
          <p className="staff-page-subtitle">Quản lý playlist cho từng station</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            className="staff-btn staff-btn--outline"
            onClick={handleSyncPlaylists}
            disabled={!selectedStation || syncing}
          >
            <ArrowDownToLine size={16} className={syncing ? "staff-spin" : ""} />
            {syncing ? "Syncing..." : "Sync Playlists"}
          </button>
          <button
            className="staff-btn staff-btn--primary"
            onClick={() => setShowCreateModal(true)}
            disabled={!selectedStation}
          >
            <Plus size={16} />
            Tạo Playlist
          </button>
        </div>
      </div>

      {/* Station selector */}
      <div className="pl-station-tabs">
        {stations.map((s) => (
          <button
            key={s.id}
            className={`pl-station-tab ${selectedStation?.id === s.id ? "active" : ""}`}
            onClick={() => handleSelectStation(s)}
          >
            {s.stationName}
          </button>
        ))}
      </div>

      {/* 2 Column: playlists list + playlist detail */}
      <div className="pl-layout">
        {/* Left: playlists */}
        <div className="pl-sidebar">
          <div className="pl-sidebar-header">
            <h3>Playlists ({playlists.length})</h3>
          </div>
          {playlists.length === 0 ? (
            <p className="staff-empty" style={{ padding: "20px 12px" }}>Chưa có playlist</p>
          ) : (
            <div className="pl-list">
              {playlists.map((pl) => (
                <button
                  key={pl.id}
                  className={`pl-item ${selectedPlaylist?.id === pl.id ? "active" : ""}`}
                  onClick={() => handleSelectPlaylist(pl)}
                >
                  <ListMusic size={16} />
                  <div className="pl-item-info">
                    <span className="pl-item-name">{pl.playlistName}</span>
                    <span className="pl-item-meta">
                      {pl.totalTracks} tracks · {formatDuration(pl.totalDuration)}
                    </span>
                  </div>
                  <ChevronRight size={14} className="pl-item-arrow" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: tracks */}
        <div className="pl-detail">
          {!selectedPlaylist ? (
            <div className="pl-detail-empty">
              <ListMusic size={40} style={{ color: "#c4b5fd" }} />
              <p>Chọn một playlist để xem chi tiết</p>
            </div>
          ) : (
            <>
              <div className="pl-detail-header">
                <div>
                  <h3>{selectedPlaylist.playlistName}</h3>
                  {selectedPlaylist.description && (
                    <p className="pl-detail-desc">{selectedPlaylist.description}</p>
                  )}
                </div>
                <div className="pl-detail-actions">
                  <button className="staff-btn staff-btn--outline" onClick={openEditPlaylistModal}>
                    <Pencil size={15} />
                    Sửa playlist
                  </button>
                  <button className="staff-btn staff-btn--outline" onClick={handleDeletePlaylist}>
                    <Trash2 size={15} />
                    Xoá playlist
                  </button>
                  <button className="staff-btn staff-btn--primary" onClick={handleOpenAddTracks}>
                    <Plus size={15} />
                    Thêm nhạc
                  </button>
                </div>
              </div>

              {loadingTracks ? (
                <div className="staff-loading" style={{ minHeight: 200 }}>
                  <RefreshCw size={20} className="staff-spin" />
                  <p>Đang tải tracks...</p>
                </div>
              ) : tracks.length === 0 ? (
                <p className="staff-empty">Playlist trống. Nhấn "Thêm nhạc" để bắt đầu.</p>
              ) : (
                <div className="pl-tracks">
                  {tracks.map((t, i) => (
                    <div className="pl-track-row" key={t.id}>
                      <span className="pl-track-num">{i + 1}</span>
                      <Music size={16} style={{ color: "#7C5CFC", flexShrink: 0 }} />
                      <div className="pl-track-info">
                        <span className="pl-track-title">{t.title}</span>
                        <span className="pl-track-artist">
                          {t.artist || "Unknown"} {t.album ? `· ${t.album}` : ""}
                        </span>
                      </div>
                      <span className="pl-track-dur">{formatDuration(t.durationSeconds)}</span>
                      <button
                        className="pl-track-remove"
                        onClick={() => handleRemoveTrack(t.mediaFileId)}
                        title="Xóa khỏi playlist"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="staff-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="staff-modal" onClick={(e) => e.stopPropagation()}>
            <div className="staff-modal-header">
              <h3>Tạo Playlist mới</h3>
              <button className="staff-modal-close" onClick={() => setShowCreateModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="staff-modal-body">
              <label className="staff-label">Tên playlist</label>
              <input
                className="staff-input"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="Nhập tên playlist..."
                autoFocus
              />
              <label className="staff-label" style={{ marginTop: 12 }}>Mô tả (tuỳ chọn)</label>
              <textarea
                className="staff-input staff-textarea"
                value={newPlaylistDesc}
                onChange={(e) => setNewPlaylistDesc(e.target.value)}
                placeholder="Mô tả ngắn..."
                rows={3}
              />
            </div>
            <div className="staff-modal-footer">
              <button className="staff-btn staff-btn--outline" onClick={() => setShowCreateModal(false)}>
                Huỷ
              </button>
              <button
                className="staff-btn staff-btn--primary"
                onClick={handleCreatePlaylist}
                disabled={!newPlaylistName.trim()}
              >
                Tạo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Playlist Modal */}
      {showEditModal && (
        <div className="staff-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="staff-modal" onClick={(e) => e.stopPropagation()}>
            <div className="staff-modal-header">
              <h3>Chỉnh sửa Playlist</h3>
              <button className="staff-modal-close" onClick={() => setShowEditModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="staff-modal-body">
              <label className="staff-label">Tên playlist</label>
              <input
                className="staff-input"
                value={editPlaylistName}
                onChange={(e) => setEditPlaylistName(e.target.value)}
                placeholder="Nhập tên playlist..."
                autoFocus
              />

              <div className="pl-edit-options">
                <label className="pl-edit-option">
                  <input
                    type="checkbox"
                    checked={editIsAutoPlay}
                    onChange={(e) => setEditIsAutoPlay(e.target.checked)}
                  />
                  <span>Tự động phát (AutoPlay)</span>
                </label>

                <label className="pl-edit-option">
                  <input
                    type="checkbox"
                    checked={editIncludeInRequests}
                    onChange={(e) => setEditIncludeInRequests(e.target.checked)}
                  />
                  <span>Cho phép request bài hát</span>
                </label>

                <label className="pl-edit-option">
                  <input
                    type="checkbox"
                    checked={editIncludeInOnDemand}
                    onChange={(e) => setEditIncludeInOnDemand(e.target.checked)}
                  />
                  <span>Hiển thị trong On-demand</span>
                </label>

                <label className="pl-edit-option">
                  <input
                    type="checkbox"
                    checked={editIsEnabled}
                    onChange={(e) => setEditIsEnabled(e.target.checked)}
                  />
                  <span>Kích hoạt playlist</span>
                </label>
              </div>
            </div>

            <div className="staff-modal-footer">
              <button className="staff-btn staff-btn--outline" onClick={() => setShowEditModal(false)}>
                Huỷ
              </button>
              <button
                className="staff-btn staff-btn--primary"
                onClick={handleUpdatePlaylist}
                disabled={!editPlaylistName.trim()}
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Tracks Modal */}
      {showAddTracksModal && (
        <div
          className="staff-modal-overlay"
          onClick={() => !musicActionLoading && setShowAddTracksModal(false)}
        >
          <div className="staff-modal staff-modal--wide" onClick={(e) => e.stopPropagation()}>
            <div className="staff-modal-header">
              <h3>Thêm nhạc vào "{selectedPlaylist?.playlistName}"</h3>
              <button
                className="staff-modal-close"
                onClick={() => setShowAddTracksModal(false)}
                disabled={musicActionLoading}
              >
                <X size={18} />
              </button>
            </div>
            <div className="pl-media-tabs">
              <button
                className={`pl-media-tab ${musicTab === "station" ? "active" : ""}`}
                onClick={() => setMusicTab("station")}
              >
                Station Media ({stationMusic.length})
              </button>
              <button
                className={`pl-media-tab ${musicTab === "system" ? "active" : ""}`}
                onClick={() => setMusicTab("system")}
              >
                System Media ({systemMusic.length})
              </button>
            </div>
            <div className="staff-modal-body" style={{ maxHeight: 400, overflowY: "auto" }}>
              {musicTab === "station" && stationMusic.length === 0 ? (
                <p className="staff-empty">Không có nhạc nào trong station. Hãy sync hoặc upload trước.</p>
              ) : null}

              {musicTab === "system" && systemMusic.length === 0 ? (
                <p className="staff-empty">Không có system media nào. Hãy upload media hệ thống trước.</p>
              ) : null}

              {musicTab === "station" ? (
                stationMusic.map((m) => {
                  const isAdded = tracks.some((t) => t.mediaFileId === m.id);
                  return (
                    <div className="pl-track-row" key={m.id}>
                      <Music size={16} style={{ color: "#7C5CFC", flexShrink: 0 }} />
                      <div className="pl-track-info">
                        <span className="pl-track-title">{m.title}</span>
                        <span className="pl-track-artist">{m.artist} {m.album ? `· ${m.album}` : ""}</span>
                      </div>
                      <span className="pl-track-dur">{formatDuration(m.duration)}</span>
                      <button
                        className={`staff-btn ${isAdded ? "staff-btn--outline" : "staff-btn--primary"}`}
                        style={{ padding: "5px 14px", fontSize: 12 }}
                        onClick={() => !isAdded && handleAddTrack(m.id)}
                        disabled={isAdded}
                      >
                        {isAdded ? "Đã thêm" : "Thêm"}
                      </button>
                    </div>
                  );
                })
              ) : (
                systemMusic.map((m) => {
                  const checked = selectedSystemMediaIds.includes(m.id);
                  const isAdded = tracks.some((t) => t.mediaFileId === m.id);

                  return (
                    <div className="pl-track-row" key={m.id}>
                      <input
                        type="checkbox"
                        className="pl-track-check"
                        checked={checked}
                        onChange={() => toggleSystemMediaSelection(m.id)}
                        disabled={isAdded}
                      />
                      <Music size={16} style={{ color: "#7C5CFC", flexShrink: 0 }} />
                      <div className="pl-track-info">
                        <span className="pl-track-title">{m.title}</span>
                        <span className="pl-track-artist">{m.artist} {m.album ? `· ${m.album}` : ""}</span>
                      </div>
                      <span className={`pl-source-badge ${isAdded ? "added" : "system"}`}>
                        {isAdded ? "Đã có" : "System"}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
            <div className="staff-modal-footer">
              {musicTab === "system" && (
                <>
                  <button
                    className="staff-btn staff-btn--outline"
                    onClick={handleImportSystemMediaBatch}
                    disabled={selectedSystemMediaIds.length === 0 || musicActionLoading}
                  >
                    {musicActionLoading ? "Đang xử lý..." : "Import vào Station"}
                  </button>
                  <button
                    className="staff-btn staff-btn--primary"
                    onClick={handleAddSelectedSystemToPlaylist}
                    disabled={selectedSystemMediaIds.length === 0 || musicActionLoading}
                  >
                    {musicActionLoading ? "Đang xử lý..." : "Add to Station Playlist"}
                  </button>
                </>
              )}
              <button
                className="staff-btn staff-btn--outline"
                onClick={() => setShowAddTracksModal(false)}
                disabled={musicActionLoading}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlaylistsScreen;
