import { useState, useEffect, useCallback, useRef } from "react";
import {
  ListMusic,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Loader2,
  Globe,
  Lock,
  Play,
  ArrowLeft,
  Music2,
  Search,
  CheckSquare,
  Square,
  Disc3,
  Volume2,
} from "lucide-react";
import userPlaylistService from "../../services/userPlaylistService";
import type {
  UserPlaylist,
  PlaylistTrack,
  MusicCatalogItem,
} from "../../services/userPlaylistService";
import { usePlayer } from "../../context/PlayerContext";
import ImageUploader from "./modals/ImageUploader";
import musicCatalogService from "../../services/musicCatalogService";
import api from "../../services/axios";
import "./UserPlaylistTab.css";

const fmtDur = (s?: number) => {
  if (!s) return "--:--";
  const m = Math.floor(s / 60),
    sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const getTrackMediaId = (track: PlaylistTrack): string =>
  String(track.mediaFileId ?? track.mediaId ?? "");

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

/* ── Resolve streaming URL from AzuraCast by media file ID ─────────── */
const resolveStreamUrl = async (
  mediaFileId: string,
  fallbackUrl?: string,
): Promise<string> => {
  // Nếu đã là full URL thì dùng luôn
  if (fallbackUrl?.startsWith("http")) return fallbackUrl;

  // UUID refers to internal media id: stream through backend endpoint.
  if (isUuid(mediaFileId)) {
    const API_URL =
      ((import.meta.env.VITE_API_URL as string | undefined) ?? window.location.origin).replace(
        /\/$/,
        "",
      );
    return `${API_URL}/api/v1/musiccatalog/${mediaFileId}/stream`;
  }

  try {
    // Chuyển string ID thành number cho AzuraCast
    const numericId = parseInt(mediaFileId, 10);
    if (!isNaN(numericId)) {
      const media = await musicCatalogService.getTrackById(numericId);
      // Ưu tiên full URL từ AzuraCast
      if (media.path && media.path.startsWith("http")) return media.path;
    }
  } catch (e) {
    console.warn("AzuraCast lookup failed, using API proxy:", e);
  }

  // Non-UUID IDs are typically AzuraCast unique_id; GUID stream endpoint won't match.
  return "";
};

const isApiMusicCatalogStream = (url: string) =>
  /\/api\/v1\/musiccatalog\/[^/]+\/stream$/i.test(url);

const fetchAuthenticatedStreamUrl = async (mediaFileId: string): Promise<string | null> => {
  try {
    const res = await api.get(`/musiccatalog/${mediaFileId}/stream`, {
      responseType: "blob",
    });
    const contentType = String(res.data?.type ?? "").toLowerCase();
    if (!contentType.startsWith("audio/") && !contentType.startsWith("video/")) {
      return null;
    }
    return URL.createObjectURL(res.data);
  } catch (error) {
    console.warn("Authenticated stream fetch failed", error);
    return null;
  }
};

const fetchAzuraBlobFromUniqueId = async (mediaFileId: string): Promise<string | null> => {
  try {
    const blob = await musicCatalogService.getTrackBlobByUniqueId(mediaFileId);
    if (!blob) return null;
    return URL.createObjectURL(blob);
  } catch (error) {
    console.warn("Azura unique-id blob fetch failed", error);
    return null;
  }
};

const buildPlaybackCandidates = (
  track: PlaylistTrack,
  catalogItem?: MusicCatalogItem,
  resolvedUrl?: string,
): string[] => {
  const candidates: string[] = [];
  const rawUrl = track.fileUrl || catalogItem?.fileUrl;

  if (rawUrl?.startsWith("http")) candidates.push(rawUrl);

  if (rawUrl && !rawUrl.startsWith("http")) {
    const ext = (track.fileType || "mp3").replace(/^\./, "");
    candidates.push(`${rawUrl}.${ext}`);

    const cloud = (track.artworkUrl || "").match(/res\.cloudinary\.com\/([^/]+)/i)?.[1];
    if (cloud) {
      candidates.push(`https://res.cloudinary.com/${cloud}/video/upload/${rawUrl}.${ext}`);
      candidates.push(`https://res.cloudinary.com/${cloud}/video/upload/${rawUrl}`);
      candidates.push(`https://res.cloudinary.com/${cloud}/raw/upload/${rawUrl}.${ext}`);
    }
  }

  if (resolvedUrl) candidates.push(resolvedUrl);

  return [...new Set(candidates.filter(Boolean))];
};

const tryPlayWithCandidates = (
  audio: HTMLAudioElement,
  candidates: string[],
): Promise<string> => {
  return new Promise((resolve, reject) => {
    let i = 0;

    const tryNext = () => {
      if (i >= candidates.length) {
        reject(new Error("Không tìm thấy nguồn audio hợp lệ"));
        return;
      }

      const src = candidates[i++];
      const onCanPlay = () => {
        cleanup();
        audio
          .play()
          .then(() => resolve(src))
          .catch(() => tryNext());
      };
      const onError = () => {
        cleanup();
        tryNext();
      };
      const cleanup = () => {
        audio.removeEventListener("canplay", onCanPlay);
        audio.removeEventListener("error", onError);
      };

      audio.addEventListener("canplay", onCanPlay, { once: true });
      audio.addEventListener("error", onError, { once: true });
      audio.src = src;
      audio.load();
    };

    tryNext();
  });
};
const fmtSize = (bytes?: number) => {
  if (!bytes) return "";
  return (bytes / 1024 / 1024).toFixed(1) + " MB";
};

interface FormState {
  playlistName: string;
  description: string;
  thumbnailUrl: string;
  visibility: number;
}
const INIT: FormState = {
  playlistName: "",
  description: "",
  thumbnailUrl: "",
  visibility: 0,
};

export default function UserPlaylistTab() {
  const [playlists, setPlaylists] = useState<UserPlaylist[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<UserPlaylist | null>(null);
  const [tracks, setTracks] = useState<PlaylistTrack[]>([]);
  const [tracksLoading, setTracksLoading] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [catalog, setCatalog] = useState<MusicCatalogItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<UserPlaylist | null>(null);
  const [form, setForm] = useState<FormState>(INIT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<UserPlaylist | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playingPlId, setPlayingPlId] = useState<string | null>(null); // which playlist is playing
  const blobUrlRef = useRef<string | null>(null);

  const { setTrack, setIsPlaying, audioRef, isPlaying } = usePlayer();

  const notifyError = (message: string, detail?: string) => {
    console.error(message, detail ?? "");
    window.alert(detail ? `${message}\n${detail}` : message);
  };

  /* ── Playback ──────────────────────────────────────────── */
  const playTrack = async (t: PlaylistTrack, list: PlaylistTrack[]) => {
    // Resolve URL first (may need AzuraCast lookup)
    const mediaId = getTrackMediaId(t);
    if (!mediaId) {
      notifyError("Không tìm thấy media ID", "Track không có mediaId/mediaFileId hợp lệ");
      return;
    }
    const catalogItem = catalog.find((c) => String(c.id) === mediaId);
    const rawUrl = t.fileUrl || catalogItem?.fileUrl;
    // Resolve streaming URL (AzuraCast lookup or API proxy)
    const fullUrl = await resolveStreamUrl(mediaId, rawUrl ?? undefined);

    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }

    let playbackUrl = fullUrl;
    if (isApiMusicCatalogStream(fullUrl)) {
      const blobUrl = await fetchAuthenticatedStreamUrl(mediaId);
      if (blobUrl) {
        playbackUrl = blobUrl;
        blobUrlRef.current = blobUrl;
      }
    }

    const azuraUniqueId =
      (rawUrl && !rawUrl.startsWith("http") ? rawUrl : "") ||
      (!isUuid(mediaId) ? mediaId : "");
    if (!playbackUrl && azuraUniqueId) {
      const azuraBlobUrl = await fetchAzuraBlobFromUniqueId(azuraUniqueId);
      if (azuraBlobUrl) {
        playbackUrl = azuraBlobUrl;
        blobUrlRef.current = azuraBlobUrl;
      }
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    const audio = new Audio();
    audioRef.current = audio;
    audio.volume = 0.8;
    const candidates = buildPlaybackCandidates(t, catalogItem, playbackUrl);

    if (candidates.length === 0) {
      notifyError("Không phát được bài hát", "Không tìm thấy nguồn audio khả dụng cho track này");
      return;
    }

    let playedSource = playbackUrl;
    try {
      playedSource = await tryPlayWithCandidates(audio, candidates);
      setIsPlaying(true);
    } catch (err: any) {
      console.error("Track play failed", err);
      notifyError("Không phát được bài hát", String(err?.message ?? err ?? "Unknown error"));
      return;
    }

    setTrack({
      title: t.title,
      artist: t.artist,
      album: t.album ?? undefined,
      artUrl: t.artworkUrl ?? "",
      duration: t.durationSeconds ?? 0,
      elapsed: 0,
      listenUrl: playedSource,
      lyrics: catalogItem?.lyrics ?? null,
    });

    setPlayingId(t.id);
    audio.addEventListener("ended", () => {
      const idx = list.findIndex((x) => x.id === t.id);
      if (idx < list.length - 1) {
        playTrack(list[idx + 1], list);
      } else {
        setIsPlaying(false);
        setPlayingId(null);
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current);
          blobUrlRef.current = null;
        }
      }
    });
  };

  /* ── Play entire playlist from card ──────────────────────── */
  const playPlaylist = async (pl: UserPlaylist) => {
    setPlayingPlId(pl.id);
    try {
      const shouldReload = selected?.id !== pl.id || tracks.length === 0;
      const currentTracks = shouldReload
        ? await userPlaylistService.getTracks(pl.id)
        : tracks;

      if (shouldReload) {
        setSelected(pl);
        setTracks(currentTracks);
      }

      if (currentTracks.length > 0) {
        await playTrack(currentTracks[0], currentTracks);
      } else {
        notifyError("Playlist trống", "Playlist chưa có bài hát nào");
      }
    } catch (e) {
      console.error("playPlaylist failed:", e);
      notifyError("Không phát được playlist");
    } finally {
      setPlayingPlId(null);
    }
  };

  const stopTrack = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setIsPlaying(false);
    setPlayingId(null);
  };

  /* ── Data fetching ─────────────────────────────────────── */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPlaylists(await userPlaylistService.getAll());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  const openDetail = async (pl: UserPlaylist) => {
    setSelected(pl);
    setTracksLoading(true);
    try {
      setTracks(await userPlaylistService.getTracks(pl.id));
    } catch (e) {
      console.error(e);
      setTracks([]);
    } finally {
      setTracksLoading(false);
    }
    // Preload catalog in background so playTrack can find fileUrl by mediaId
    if (catalog.length === 0) {
      try {
        setCatalog(await userPlaylistService.getMusicCatalog());
      } catch (e) {
        console.error("Catalog preload failed", e);
      }
    }
  };

  const openCatalog = async () => {
    setShowCatalog(true);
    setPicked(new Set());
    setCatalogSearch("");
    if (catalog.length === 0) {
      setCatalogLoading(true);
      try {
        setCatalog(await userPlaylistService.getMusicCatalog());
      } catch (e) {
        console.error(e);
      } finally {
        setCatalogLoading(false);
      }
    }
  };

  const togglePick = (id: string) =>
    setPicked((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });

  const handleAddTracks = async () => {
    if (!selected || picked.size === 0) return;
    setAdding(true);
    try {
      await userPlaylistService.addTracks(selected.id, [...picked]);
      const updated = await userPlaylistService.getTracks(selected.id);
      setTracks(updated);
      setPlaylists((prev) =>
        prev.map((p) =>
          p.id === selected.id ? { ...p, totalTracks: updated.length } : p,
        ),
      );
      setSelected((prev) =>
        prev ? { ...prev, totalTracks: updated.length } : prev,
      );
      setShowCatalog(false);
    } catch (e) {
      console.error(e);
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveTrack = async (t: PlaylistTrack) => {
    if (!selected) return;
    const mediaId = getTrackMediaId(t);
    if (!mediaId) {
      notifyError("Không xoá được bài", "Track không có mediaId/mediaFileId hợp lệ");
      return;
    }
    setRemovingId(t.id);
    try {
      await userPlaylistService.removeTrack(selected.id, mediaId);
      setTracks((prev) => prev.filter((x) => x.id !== t.id));
      setPlaylists((prev) =>
        prev.map((p) =>
          p.id === selected.id
            ? { ...p, totalTracks: (p.totalTracks ?? 1) - 1 }
            : p,
        ),
      );
      setSelected((prev) =>
        prev ? { ...prev, totalTracks: (prev.totalTracks ?? 1) - 1 } : prev,
      );
    } catch (e) {
      console.error(e);
    } finally {
      setRemovingId(null);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(INIT);
    setError("");
    setShowModal(true);
  };
  const openEdit = (pl: UserPlaylist, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(pl);
    setForm({
      playlistName: pl.playlistName,
      description: pl.description ?? "",
      thumbnailUrl: pl.thumbnailUrl ?? "",
      visibility: pl.visibility ?? 0,
    });
    setError("");
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
    setError("");
  };

  const handleSave = async () => {
    if (!form.playlistName.trim()) {
      setError("Vui lòng nhập tên playlist.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        playlistName: form.playlistName.trim(),
        description: form.description.trim(),
        thumbnailUrl: form.thumbnailUrl,
        visibility: form.visibility,
      };
      if (editing) {
        const u = await userPlaylistService.update(editing.id, payload);
        setPlaylists((p) => p.map((x) => (x.id === u.id ? u : x)));
        if (selected?.id === u.id) setSelected(u);
      } else {
        const c = await userPlaylistService.create({
          ...payload,
          isEnabled: true,
        });
        setPlaylists((p) => [c, ...p]);
      }
      closeModal();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Có lỗi xảy ra, thử lại nhé!");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await userPlaylistService.remove(deleteTarget.id);
      setPlaylists((p) => p.filter((x) => x.id !== deleteTarget.id));
      if (selected?.id === deleteTarget.id) setSelected(null);
      setDeleteTarget(null);
    } catch {
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const filteredCatalog = catalog.filter(
    (c) =>
      !catalogSearch ||
      c.title.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      c.artist.toLowerCase().includes(catalogSearch.toLowerCase()),
  );
  const addedIds = new Set(tracks.map((t) => getTrackMediaId(t)).filter(Boolean));

  /* ─────────────────────────── RENDER ─────────────────────────── */
  return (
    <div className="upl-wrap">
      {selected ? (
        <div className="upl-detail">
          {/* Back */}
          <div className="upl-detail-header">
            <button className="upl-back-btn" onClick={() => setSelected(null)}>
              <ArrowLeft size={16} /> Quay lại
            </button>
          </div>

          {/* Hero banner */}
          <div className="upl-detail-banner">
            {selected.thumbnailUrl && (
              <img
                className="upl-banner-bg"
                src={selected.thumbnailUrl}
                alt=""
                aria-hidden="true"
              />
            )}
            <div className="upl-banner-overlay" />
            <div className="upl-banner-content">
              <div className="upl-detail-thumb">
                {selected.thumbnailUrl ? (
                  <img
                    src={selected.thumbnailUrl}
                    alt={selected.playlistName}
                  />
                ) : (
                  <div className="upl-detail-thumb-ph">
                    <ListMusic size={44} />
                  </div>
                )}
              </div>
              <div className="upl-detail-meta">
                <p className="upl-banner-type">Playlist</p>
                <h2 className="upl-detail-name">{selected.playlistName}</h2>
                {selected.description && (
                  <p className="upl-detail-desc">{selected.description}</p>
                )}
                <p className="upl-detail-count">
                  {selected.totalTracks ?? 0} bài hát
                </p>
                <div className="upl-banner-actions">
                  <button
                    className="upl-banner-btn play-all"
                    onClick={() =>
                      tracks.length > 0 && playTrack(tracks[0], tracks)
                    }
                    disabled={tracks.length === 0}
                  >
                    <Play size={14} fill="white" /> Phát tất cả
                  </button>
                  <button
                    className="upl-banner-btn add-music"
                    onClick={openCatalog}
                  >
                    <Plus size={13} /> Thêm nhạc
                  </button>
                  <button
                    className="upl-banner-btn icon-only"
                    onClick={(e) => openEdit(selected, e)}
                    title="Chỉnh sửa"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    className="upl-banner-btn icon-only danger"
                    onClick={() => setDeleteTarget(selected)}
                    title="Xoá"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Track list */}
          <div className="upl-track-section-header">
            <h4 className="upl-track-section-title">Danh sách bài hát</h4>
          </div>

          {tracksLoading ? (
            <div className="upl-loading">
              <Loader2 size={22} className="upl-spin" />
              <span>Đang tải...</span>
            </div>
          ) : tracks.length === 0 ? (
            <div className="upl-track-empty">
              <Disc3 size={44} />
              <p>Playlist chưa có bài hát nào</p>
              <button className="upl-create-btn" onClick={openCatalog}>
                <Plus size={13} /> Thêm nhạc ngay
              </button>
            </div>
          ) : (
            <>
              <div className="upl-track-list">
                {tracks.map((t, idx) => {
                  const isNowPlaying = playingId === t.id && isPlaying;
                  return (
                    <div
                      key={t.id}
                      className={`upl-track-row${isNowPlaying ? " playing" : ""}`}
                      onDoubleClick={() => playTrack(t, tracks)}
                    >
                      <div
                        className="upl-track-num-wrap"
                        onClick={() =>
                          isNowPlaying ? stopTrack() : playTrack(t, tracks)
                        }
                      >
                        {isNowPlaying ? (
                          <Volume2 size={14} className="upl-playing-icon" />
                        ) : (
                          <span className="upl-track-num">
                            {String(idx + 1).padStart(2, "0")}
                          </span>
                        )}
                        <button className="upl-track-play-hover">
                          <Play size={12} fill="currentColor" />
                        </button>
                      </div>
                      <div className="upl-track-art">
                        {t.artworkUrl ? (
                          <img src={t.artworkUrl} alt={t.title} />
                        ) : (
                          <div className="upl-track-art-ph">
                            <Music2 size={14} />
                          </div>
                        )}
                      </div>
                      <div className="upl-track-info">
                        <p
                          className={`upl-track-title${isNowPlaying ? " now-playing" : ""}`}
                        >
                          {t.title}
                        </p>
                        <p className="upl-track-artist">
                          {t.artist}
                          {t.album ? ` · ${t.album}` : ""}
                        </p>
                      </div>
                      <span className="upl-track-dur">
                        {fmtDur(t.durationSeconds)}
                      </span>
                      <button
                        className="upl-track-del"
                        onClick={() => handleRemoveTrack(t)}
                        disabled={removingId === t.id}
                        title="Xoá khỏi playlist"
                      >
                        {removingId === t.id ? (
                          <Loader2 size={14} className="upl-spin" />
                        ) : (
                          <X size={14} />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="upl-header">
            <h3 className="upl-title">
              <ListMusic size={18} /> Playlist của tôi
            </h3>
            <button className="upl-create-btn" onClick={openCreate}>
              <Plus size={14} /> Tạo playlist
            </button>
          </div>

          {loading ? (
            <div className="upl-loading">
              <Loader2 size={24} className="upl-spin" />
              <span>Đang tải...</span>
            </div>
          ) : playlists.length === 0 ? (
            <div className="upl-empty">
              <div className="upl-empty-ico">
                <ListMusic size={44} />
              </div>
              <p>Chưa có playlist nào</p>
              <button className="upl-create-btn" onClick={openCreate}>
                <Plus size={13} /> Tạo playlist đầu tiên
              </button>
            </div>
          ) : (
            <div className="upl-grid">
              {playlists.map((pl) => (
                <div
                  key={pl.id}
                  className="upl-card"
                  onClick={() => openDetail(pl)}
                >
                  <div className="upl-cover">
                    {pl.thumbnailUrl ? (
                      <img src={pl.thumbnailUrl} alt={pl.playlistName} />
                    ) : (
                      <div className="upl-cover-ph">
                        <ListMusic size={36} />
                      </div>
                    )}
                    <div className="upl-cover-overlay">
                      <button
                        className="upl-play-btn"
                        onClick={async (e) => {
                          e.stopPropagation();
                          await playPlaylist(pl);
                        }}
                      >
                        <Play size={20} fill="white" />
                      </button>
                    </div>
                  </div>
                  <div className="upl-info">
                    <div className="upl-info-main">
                      <p className="upl-name">{pl.playlistName}</p>
                      <div className="upl-meta-row">
                        <span
                          className={`upl-vis ${pl.visibility === 0 ? "pub" : "prv"}`}
                        >
                          {pl.visibility === 0 ? (
                            <>
                              <Globe size={10} /> Công khai
                            </>
                          ) : (
                            <>
                              <Lock size={10} /> Riêng tư
                            </>
                          )}
                        </span>
                        {pl.totalTracks != null && (
                          <span className="upl-tracks">
                            {pl.totalTracks} bài
                          </span>
                        )}
                      </div>
                      {pl.description && (
                        <p className="upl-desc">{pl.description}</p>
                      )}
                    </div>
                    <div className="upl-btns">
                      <button
                        className="upl-icon-btn edit"
                        onClick={(e) => openEdit(pl, e)}
                        title="Chỉnh sửa"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className="upl-icon-btn del"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(pl);
                        }}
                        title="Xoá"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Catalog modal */}
      {showCatalog && (
        <div
          className="upl-overlay"
          onClick={() => !adding && setShowCatalog(false)}
        >
          <div
            className="upl-catalog-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="upl-modal-hd">
              <h3>Thêm nhạc vào playlist</h3>
              <button
                className="upl-close-btn"
                onClick={() => setShowCatalog(false)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="upl-catalog-search">
              <Search size={15} />
              <input
                placeholder="Tìm theo tên bài hoặc nghệ sĩ..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                autoFocus
              />
            </div>
            {picked.size > 0 && (
              <div className="upl-catalog-picked-bar">
                <CheckSquare size={14} /> Đã chọn {picked.size} bài
              </div>
            )}
            <div className="upl-catalog-list">
              {catalogLoading ? (
                <div className="upl-loading">
                  <Loader2 size={22} className="upl-spin" />
                  <span>Đang tải...</span>
                </div>
              ) : filteredCatalog.length === 0 ? (
                <div className="upl-track-empty">
                  <Music2 size={32} />
                  <p>Không tìm thấy bài hát</p>
                </div>
              ) : (
                filteredCatalog.map((c) => {
                  const already = addedIds.has(c.id);
                  const isChecked = picked.has(c.id);
                  return (
                    <div
                      key={c.id}
                      className={`upl-catalog-row${already ? " already" : ""}${isChecked ? " checked" : ""}`}
                      onClick={() => !already && togglePick(c.id)}
                    >
                      <div className="upl-catalog-check">
                        {already ? (
                          <CheckSquare size={16} className="already-icon" />
                        ) : isChecked ? (
                          <CheckSquare size={16} className="check-icon" />
                        ) : (
                          <Square size={16} />
                        )}
                      </div>
                      <div className="upl-track-art">
                        {c.artworkUrl ? (
                          <img src={c.artworkUrl} alt={c.title} />
                        ) : (
                          <div className="upl-track-art-ph">
                            <Music2 size={14} />
                          </div>
                        )}
                      </div>
                      <div className="upl-track-info">
                        <p className="upl-track-title">{c.title}</p>
                        <p className="upl-track-artist">
                          {c.artist}
                          {c.album ? ` · ${c.album}` : ""}
                        </p>
                      </div>
                      <div className="upl-catalog-right">
                        <span className="upl-track-dur">
                          {fmtDur(c.duration)}
                        </span>
                        {c.fileSize && (
                          <span className="upl-catalog-size">
                            {fmtSize(c.fileSize)}
                          </span>
                        )}
                        {already && (
                          <span className="upl-already-badge">Đã có</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="upl-modal-ft">
              <button
                className="upl-btn ghost"
                onClick={() => setShowCatalog(false)}
                disabled={adding}
              >
                Huỷ
              </button>
              <button
                className="upl-btn primary"
                onClick={handleAddTracks}
                disabled={adding || picked.size === 0}
              >
                {adding ? (
                  <>
                    <Loader2 size={13} className="upl-spin" /> Đang thêm...
                  </>
                ) : (
                  <>
                    <Plus size={13} /> Thêm{" "}
                    {picked.size > 0 ? `${picked.size} bài` : "nhạc"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit modal */}
      {showModal && (
        <div className="upl-overlay" onClick={closeModal}>
          <div className="upl-modal" onClick={(e) => e.stopPropagation()}>
            <div className="upl-modal-hd">
              <h3>{editing ? "Chỉnh sửa playlist" : "Tạo playlist mới"}</h3>
              <button className="upl-close-btn" onClick={closeModal}>
                <X size={16} />
              </button>
            </div>
            <div className="upl-modal-bd">
              <label className="upl-lbl">Ảnh bìa</label>
              <div className="upl-thumb-wrap">
                <ImageUploader
                  preview={form.thumbnailUrl || null}
                  onChange={(url) =>
                    setForm((f) => ({ ...f, thumbnailUrl: url ?? "" }))
                  }
                />
              </div>
              <label className="upl-lbl">
                Tên playlist <span className="upl-req">*</span>
              </label>
              <input
                className={`upl-inp${error && !form.playlistName.trim() ? " err" : ""}`}
                placeholder="Nhập tên playlist..."
                value={form.playlistName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, playlistName: e.target.value }))
                }
                maxLength={100}
                autoFocus
              />
              <label className="upl-lbl">Mô tả</label>
              <textarea
                className="upl-ta"
                placeholder="Mô tả ngắn (tuỳ chọn)..."
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={2}
                maxLength={300}
              />
              <div className="upl-vis-row">
                <div className="upl-vis-txt">
                  {form.visibility === 0 ? (
                    <>
                      <Globe size={15} />
                      <span>
                        <b>Công khai</b> — Mọi người có thể xem
                      </span>
                    </>
                  ) : (
                    <>
                      <Lock size={15} />
                      <span>
                        <b>Riêng tư</b> — Chỉ mình bạn thấy
                      </span>
                    </>
                  )}
                </div>
                <button
                  type="button"
                  className={`upl-tog${form.visibility === 0 ? " on" : ""}`}
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      visibility: f.visibility === 0 ? 1 : 0,
                    }))
                  }
                >
                  <span className="upl-tog-dot" />
                </button>
              </div>
              {error && <p className="upl-err-msg">{error}</p>}
            </div>
            <div className="upl-modal-ft">
              <button
                className="upl-btn ghost"
                onClick={closeModal}
                disabled={saving}
              >
                Huỷ
              </button>
              <button
                className="upl-btn primary"
                onClick={handleSave}
                disabled={saving || !form.playlistName.trim()}
              >
                {saving ? (
                  <>
                    <Loader2 size={13} className="upl-spin" /> Đang lưu...
                  </>
                ) : editing ? (
                  <>
                    <Check size={13} /> Lưu thay đổi
                  </>
                ) : (
                  <>
                    <Plus size={13} /> Tạo playlist
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div
          className="upl-overlay"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div className="upl-del-modal" onClick={(e) => e.stopPropagation()}>
            <div className="upl-del-ico">
              <Trash2 size={30} />
            </div>
            <h3>Xoá playlist?</h3>
            <p>
              Playlist <b>"{deleteTarget.playlistName}"</b> sẽ bị xoá vĩnh viễn.
            </p>
            <div className="upl-del-actions">
              <button
                className="upl-btn ghost"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Huỷ
              </button>
              <button
                className="upl-btn danger"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 size={13} className="upl-spin" /> Đang xoá...
                  </>
                ) : (
                  <>
                    <Trash2 size={13} /> Xoá
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
