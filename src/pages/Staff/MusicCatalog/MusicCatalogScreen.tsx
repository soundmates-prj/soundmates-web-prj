import React, { useState, useEffect } from "react";
import {
  Headphones, RefreshCw, Upload, ArrowDownToLine,
  Trash2, Plus, Check, X, FileMusic, Filter
} from "lucide-react";
import { liveSessionApiService } from "../../../services/liveSessionApiService";
import { musicCatalogService } from "../../../services/staffService";
import type { StationResult, MusicResult } from "../../../services/liveSessionApiService";
import { showError, showSuccess } from "../../../components/common/toastUtils";
import "./MusicCatalogScreen.css";

export function MusicCatalogScreen() {
  const [stations, setStations] = useState<StationResult[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<string>("");
  const [loadingStations, setLoadingStations] = useState(false);

  const [musicList, setMusicList] = useState<MusicResult[]>([]);
  const [loadingMusic, setLoadingMusic] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "station" | "system">("all");

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTarget, setUploadTarget] = useState<"station" | "system">("system");
  const [lyrics, setLyrics] = useState("");

  useEffect(() => {
    loadStations();
  }, []);

  useEffect(() => {
    if (selectedStationId) {
      loadMusic(selectedStationId);
    }
  }, [selectedStationId]);

  const loadStations = async () => {
    setLoadingStations(true);
    try {
      const res = await liveSessionApiService.getStations();
      setStations(res);
      if (res.length > 0 && !selectedStationId) {
        setSelectedStationId(res[0].id);
      }
    } catch (err) {
      showError("Lỗi", "Không thể tải danh sách station");
    } finally {
      setLoadingStations(false);
    }
  };

  const loadMusic = async (stationId: string) => {
    setLoadingMusic(true);
    try {
      const res = await liveSessionApiService.getStationMusic(stationId);
      setMusicList(res);
    } catch (err) {
      showError("Lỗi", "Không thể tải danh sách nhạc");
    } finally {
      setLoadingMusic(false);
    }
  };

  const handleSync = async () => {
    if (!selectedStationId) return;
    setSyncing(true);
    try {
      const res = await musicCatalogService.syncStationMusic(selectedStationId);
      showSuccess("Thành công", `Đã đồng bộ ${res.createdFiles} file mới, cập nhật ${res.updatedFiles} file.`);
      await loadMusic(selectedStationId);
    } catch (err) {
      showError("Lỗi", "Đồng bộ nhạc thất bại");
    } finally {
      setSyncing(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedStationId || !uploadFile) return;
    setUploading(true);
    try {
      const targetStationId = uploadTarget === "station" ? selectedStationId : undefined;
      await musicCatalogService.uploadMusic(targetStationId, uploadFile, { lyrics });
      showSuccess("Thành công", `Đã upload nhạc lên ${uploadTarget === "station" ? "Station" : "System Media"}`);
      setShowUploadModal(false);
      setUploadFile(null);
      setLyrics("");
      await loadMusic(selectedStationId);
    } catch (err) {
      showError("Lỗi", "Upload nhạc thất bại");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMusic = async (musicId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xoá bài hát này không? Hành động này không thể hoàn tác.")) {
      return;
    }

    try {
      await liveSessionApiService.deleteMusic(musicId);
      showSuccess("Thành công", "Đã xoá bài hát");
      // Tải lại danh sách nhạc sau khi xoá
      await loadMusic(selectedStationId);
    } catch (err) {
      showError("Lỗi", "Xoá bài hát thất bại");
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const filteredMusic = musicList.filter(m => {
    if (activeTab === "all") return true;
    return m.sourceType === activeTab;
  });

  return (
    <div className="staff-dashboard">
      <div className="staff-page-header">
        <div>
          <h1 className="staff-page-title">Kho Nhạc (Music Catalog)</h1>
          <p className="staff-page-subtitle">Quản lý và đồng bộ kho nhạc của các Station</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            className="staff-btn staff-btn--outline"
            onClick={handleSync}
            disabled={!selectedStationId || syncing}
          >
            <RefreshCw size={16} className={syncing ? "staff-spin" : ""} />
            {syncing ? "Đang đồng bộ..." : "Đồng bộ AzuraCast"}
          </button>
          <button
            className="staff-btn staff-btn--primary"
            onClick={() => setShowUploadModal(true)}
            disabled={!selectedStationId}
          >
            <Upload size={16} />
            Tải nhạc lên
          </button>
        </div>
      </div>

      <div className="mc-tabs">
        {stations.map(st => (
          <button
            key={st.id}
            className={`mc-tab ${selectedStationId === st.id ? "active" : ""}`}
            onClick={() => setSelectedStationId(st.id)}
          >
            {st.stationName}
          </button>
        ))}
      </div>

      <div className="mc-layout">
        <div className="mc-header">
          <div style={{ display: "flex", gap: 12 }}>
            <button
              className={`staff-btn ${activeTab === 'all' ? 'staff-btn--primary' : 'staff-btn--outline'}`}
              style={{ padding: "6px 12px", fontSize: 13 }}
              onClick={() => setActiveTab("all")}
            >
              Tất cả
            </button>
            <button
              className={`staff-btn ${activeTab === 'station' ? 'staff-btn--primary' : 'staff-btn--outline'}`}
              style={{ padding: "6px 12px", fontSize: 13 }}
              onClick={() => setActiveTab("station")}
            >
              Station Media
            </button>
            <button
              className={`staff-btn ${activeTab === 'system' ? 'staff-btn--primary' : 'staff-btn--outline'}`}
              style={{ padding: "6px 12px", fontSize: 13 }}
              onClick={() => setActiveTab("system")}
            >
              System Media
            </button>
          </div>
          <span style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}>
            Tổng số: {filteredMusic.length} bài
          </span>
        </div>

        {loadingMusic ? (
          <div className="staff-loading">
            <RefreshCw size={24} className="staff-spin" />
            <p>Đang tải danh sách nhạc...</p>
          </div>
        ) : filteredMusic.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", color: "#64748b" }}>
            <FileMusic size={48} style={{ margin: "0 auto 16px", opacity: 0.5 }} />
            <p>Chưa có bài nhạc nào. Hãy tải lên hoặc đồng bộ từ AzuraCast.</p>
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
                {filteredMusic.map(m => (
                  <tr key={m.id}>
                    <td>
                      <div className="mc-track-title">
                        <FileMusic size={16} color="#7C5CFC" />
                        {m.title}
                      </div>
                      <div className="mc-track-artist">{m.artist} {m.album ? `- ${m.album}` : ""}</div>
                    </td>
                    <td>
                      <span className={`mc-badge ${m.sourceType}`}>
                        {m.sourceType === "station" ? "Station" : "System"}
                      </span>
                    </td>
                    <td>{formatDuration(m.duration)}</td>
                    <td style={{ textTransform: "uppercase", fontSize: 12, fontWeight: 600, color: "#94a3b8" }}>
                      {m.fileType}
                    </td>
                    <td>{new Date(m.uploadedAt).toLocaleDateString("vi-VN")}</td>
                    <td>
                      <button
                        className="mc-btn-icon"
                        title="Xóa bài hát"
                        onClick={() => handleDeleteMusic(m.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showUploadModal && (
        <div className="staff-modal-overlay" onClick={() => !uploading && setShowUploadModal(false)}>
          <div className="staff-modal" onClick={e => e.stopPropagation()}>
            <div className="staff-modal-header">
              <h3>Tải nhạc lên hệ thống</h3>
              <button className="staff-modal-close" onClick={() => !uploading && setShowUploadModal(false)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                <X size={20} color="#64748b" />
              </button>
            </div>
            <div className="staff-modal-body">
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Lưu trữ vào:</label>
                <div style={{ display: "flex", gap: 16 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="uploadTarget"
                      value="system"
                      checked={uploadTarget === "system"}
                      onChange={() => setUploadTarget("system")}
                    />
                    System Media (SoundMates)
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="uploadTarget"
                      value="station"
                      checked={uploadTarget === "station"}
                      onChange={() => setUploadTarget("station")}
                    />
                    Station Media (AzuraCast)
                  </label>
                </div>
                <div style={{ marginTop: 8, fontSize: 13, color: "#64748b" }}>
                  {uploadTarget === "system"
                    ? "Nhạc sẽ được lưu trên Cloudinary và có thể import vào các station sau này."
                    : "Nhạc sẽ được tải trực tiếp lên AzuraCast station hiện tại."}
                </div>
              </div>

              <div
                className="file-drop-area"
                onClick={() => document.getElementById("file-upload")?.click()}
                style={{ marginBottom: 16 }}
              >
                <Upload size={32} color="#94a3b8" style={{ marginBottom: 12 }} />
                {uploadFile ? (
                  <p style={{ margin: 0, fontWeight: 600, color: "#1a9fd4" }}>{uploadFile.name}</p>
                ) : (
                  <p style={{ margin: 0, color: "#64748b" }}>Nhấn để chọn file nhạc (MP3, FLAC, WAV...)</p>
                )}
                <input
                  type="file"
                  id="file-upload"
                  style={{ display: "none" }}
                  accept="audio/*"
                  onChange={e => {
                    if (e.target.files && e.target.files.length > 0) {
                      setUploadFile(e.target.files[0]);
                    }
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>Lyrics (LRC Format)</label>
                <textarea
                  className="staff-input staff-textarea"
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  placeholder="[00:12.00] Line 1&#10;[00:15.30] Line 2..."
                  rows={4}
                  style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #cbd5e1" }}
                />
              </div>
            </div>
            <div className="staff-modal-footer">
              <button
                className="staff-btn staff-btn--outline"
                onClick={() => setShowUploadModal(false)}
                disabled={uploading}
              >
                Huỷ
              </button>
              <button
                className="staff-btn staff-btn--primary"
                onClick={handleUpload}
                disabled={!uploadFile || uploading}
              >
                {uploading ? "Đang tải lên..." : "Tải lên"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}