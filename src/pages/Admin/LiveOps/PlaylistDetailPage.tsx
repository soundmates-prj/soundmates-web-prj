import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, GripVertical, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  liveSessionApiService,
  type MusicResult,
  type PlaylistMediaResult,
  type PlaylistResult,
} from "../../../services/liveSessionApiService";
import { showError, showSuccess } from "../../../components/common/toastUtils";
import "./LiveOps.css";

export default function PlaylistDetailPage() {
  const navigate = useNavigate();
  const { playlistId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const stationId = searchParams.get("stationId") || "";

  const [playlist, setPlaylist] = useState<PlaylistResult | null>(null);
  const [tracks, setTracks] = useState<PlaylistMediaResult[]>([]);
  const [stationMusic, setStationMusic] = useState<MusicResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const loadData = async () => {
    if (!playlistId) return;
    setLoading(true);
    try {
      const [trackList, stations] = await Promise.all([
        liveSessionApiService.getPlaylistTracks(playlistId),
        liveSessionApiService.getStations(),
      ]);

      setTracks(trackList);

      const stationTarget = stationId || stations[0]?.id;
      if (stationTarget) {
        const [musicList, playlists] = await Promise.all([
          liveSessionApiService.getStationMusic(stationTarget),
          liveSessionApiService.getStationPlaylists(stationTarget),
        ]);
        setStationMusic(musicList);
        setPlaylist(playlists.find((item) => item.id === playlistId) || null);
      }
    } catch {
      showError("Lỗi", "Không thể tải chi tiết playlist");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [playlistId]);

  const availableTracks = useMemo(() => {
    const added = new Set(tracks.map((item) => item.mediaFileId));
    return stationMusic.filter((item) => !added.has(item.id) && item.title.toLowerCase().includes(query.toLowerCase()));
  }, [stationMusic, tracks, query]);

  const addTrack = async (musicId: string) => {
    if (!playlistId) return;
    try {
      await liveSessionApiService.addTracksToPlaylist(playlistId, [musicId]);
      await loadData();
      showSuccess("Đã thêm track");
    } catch {
      showError("Không thể thêm track");
    }
  };

  const removeTrack = async (musicId: string) => {
    if (!playlistId) return;
    try {
      await liveSessionApiService.removeTracksFromPlaylist(playlistId, [musicId]);
      setTracks((prev) => prev.filter((item) => item.mediaFileId !== musicId));
      showSuccess("Đã xóa track khỏi playlist");
    } catch {
      showError("Không thể xóa track");
    }
  };

  const syncPlaylist = async () => {
    if (!stationId) {
      showError("Thiếu stationId", "Không thể sync playlist nếu không có stationId trên URL");
      return;
    }

    try {
      await liveSessionApiService.syncStationPlaylists(stationId);
      showSuccess("Đã sync playlist theo station");
      await loadData();
    } catch {
      showError("Sync playlist thất bại");
    }
  };

  const restartStation = async () => {
    if (!stationId) return;
    try {
      await liveSessionApiService.restartStation(stationId);
      showSuccess("Đã yêu cầu Restart Broadcasting");
    } catch {
      showError("Restart thất bại");
    }
  };

  const reloadStation = async () => {
    if (!stationId) return;
    try {
      await liveSessionApiService.reloadStation(stationId);
      showSuccess("Đã yêu cầu Reload Config");
    } catch {
      showError("Reload thất bại");
    }
  };

  const handleDrop = (targetId: string) => {
    if (!draggingId || draggingId === targetId) return;

    const next = [...tracks];
    const srcIndex = next.findIndex((item) => item.id === draggingId);
    const targetIndex = next.findIndex((item) => item.id === targetId);
    if (srcIndex < 0 || targetIndex < 0) return;

    const [dragged] = next.splice(srcIndex, 1);
    next.splice(targetIndex, 0, dragged);
    setTracks(next);
    setDraggingId(null);
  };

  return (
    <div className="ops-page">
      <div className="ops-header">
        <div>
          <button className="ops-link-btn" onClick={() => navigate("/admin/playlists")}>
            <ArrowLeft size={13} /> Quay lại Playlist Page
          </button>
          <h1 className="ops-title">PlaylistDetail Page</h1>
          <p className="ops-subtitle">{playlist?.playlistName || "Chi tiết playlist"}</p>
        </div>
        <div className="ops-actions">
          <button className="ops-btn ops-btn--ghost" onClick={() => void loadData()}>
            <RefreshCw size={15} />
            Làm mới
          </button>
          <button className="ops-btn ops-btn--outline" onClick={reloadStation} title="Reload AzuraCast mà không rớt kết nối">
            Reload Config
          </button>
          <button className="ops-btn ops-btn--primary" onClick={restartStation} title="Khởi động lại toàn bộ trạm phát sóng">
            Restart Broadcast
          </button>
        </div>
      </div>

      <div className="ops-grid" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
        <div className="ops-card">
          <h3 className="ops-card-title">Tracks (drag reorder)</h3>
          {loading ? (
            <div className="ops-stack">
              <div className="ops-skeleton" />
              <div className="ops-skeleton" />
            </div>
          ) : tracks.length === 0 ? (
            <div className="ops-empty">Playlist chưa có track</div>
          ) : (
            <div className="ops-stack">
              {tracks.map((track, index) => (
                <div
                  key={track.id}
                  className={`ops-track-item ${draggingId === track.id ? "dragging" : ""}`}
                  draggable
                  onDragStart={() => setDraggingId(track.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(track.id)}
                >
                  <div className="ops-inline-row">
                    <GripVertical size={14} />
                    <strong>{index + 1}. {track.title}</strong>
                    <span style={{ color: "var(--text-muted)" }}>{track.artist || "Unknown"}</span>
                  </div>
                  <button className="ops-btn ops-btn--ghost" onClick={() => void removeTrack(track.mediaFileId)}>
                    <Trash2 size={14} />
                    Xóa
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="ops-card">
          <h3 className="ops-card-title">Add track</h3>
          <input
            className="ops-input"
            placeholder="Tìm bài hát..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: "100%", marginBottom: 10 }}
          />
          <div className="ops-stack" style={{ maxHeight: 520, overflowY: "auto" }}>
            {availableTracks.slice(0, 40).map((item) => (
              <div className="ops-track-item" key={item.id}>
                <div>
                  <strong>{item.title}</strong>
                  <div style={{ color: "var(--text-muted)", fontSize: 12 }}>{item.artist}</div>
                </div>
                <button className="ops-btn ops-btn--primary" onClick={() => void addTrack(item.id)}>
                  <Plus size={14} />
                  Thêm
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
