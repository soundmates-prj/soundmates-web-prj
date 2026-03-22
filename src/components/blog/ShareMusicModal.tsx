import { useEffect, useMemo, useState } from "react";
import { Music2, Search, X } from "lucide-react";
import favoriteService, { type FavoriteItem } from "../../services/favoriteService";
import shareMusicService from "../../services/shareMusicService";
import type { Post } from "../../types/post";
import ShareCard, { type ShareCardData, type ShareCardTemplate } from "./ShareCard";
import "./ShareMusicModal.css";

interface ShareMusicModalProps {
  open: boolean;
  onClose: () => void;
  onShared: (post: Post) => void;
}

const templates: ShareCardTemplate[] = ["dark", "light", "gradient", "minimal"];

export default function ShareMusicModal({ open, onClose, onShared }: ShareMusicModalProps) {
  const [tracks, setTracks] = useState<FavoriteItem[]>([]);
  const [selected, setSelected] = useState<FavoriteItem | null>(null);
  const [template, setTemplate] = useState<ShareCardTemplate>("gradient");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializedForOpen, setInitializedForOpen] = useState(false);
  const [sharing, setSharing] = useState(false);

  const visibleTracks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tracks;
    return tracks.filter((t) =>
      `${t.name} ${t.artistName} ${t.albumName}`.toLowerCase().includes(q),
    );
  }, [tracks, query]);

  const previewData: ShareCardData | null = selected
    ? {
        trackId: selected.itemId || selected.id,
        title: selected.name,
        artist: selected.artistName || "Unknown Artist",
        albumImage: selected.imgUrl,
        previewUrl: selected.previewUrl,
        template,
      }
    : null;

  const loadTracks = async () => {
    setLoading(true);
    try {
      const res = await favoriteService.getFavorites("track");
      const items = res?.data ?? [];
      setTracks(items);
      if (items.length > 0 && !selected) {
        setSelected(items[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open || initializedForOpen || loading) {
      return;
    }

    setInitializedForOpen(true);
    void loadTracks();
  }, [open, initializedForOpen, loading]);

  useEffect(() => {
    if (open) {
      return;
    }

    setInitializedForOpen(false);
  }, [open]);

  if (!open) return null;

  const handleShare = async () => {
    if (!selected) return;
    setSharing(true);
    try {
      const post = await shareMusicService.share({
        trackId: selected.itemId || selected.id,
        title: selected.name,
        artist: selected.artistName || "Unknown Artist",
        albumImage: selected.imgUrl,
        previewUrl: selected.previewUrl,
        template,
      });
      onShared(post);
      onClose();
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="sm-modal-overlay" onClick={onClose}>
      <div className="sm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sm-modal__header">
          <h3>Share Music</h3>
          <button className="sm-icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="sm-modal__body">
          <div className="sm-panel sm-panel--list">
            <div className="sm-search">
              <Search size={14} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm theo tên bài hát hoặc nghệ sĩ"
              />
            </div>

            <div className="sm-track-list">
              {loading ? (
                <>
                  <div className="sm-track-skeleton" />
                  <div className="sm-track-skeleton" />
                  <div className="sm-track-skeleton" />
                  <div className="sm-track-skeleton" />
                </>
              ) : null}
              {!loading && visibleTracks.length === 0 ? (
                <p className="sm-hint">Chưa có bài hát yêu thích để chia sẻ.</p>
              ) : null}
              {visibleTracks.map((track) => (
                <button
                  key={track.id}
                  className={`sm-track-item ${selected?.id === track.id ? "active" : ""}`}
                  onClick={() => setSelected(track)}
                >
                  <img src={track.imgUrl} alt={track.name} />
                  <div className="sm-track-item__meta">
                    <strong>{track.name}</strong>
                    <span>{track.artistName}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="sm-panel sm-panel--preview">
            <div className="sm-template-picker">
              {templates.map((t) => (
                <button
                  key={t}
                  className={`sm-template-chip ${template === t ? "active" : ""}`}
                  onClick={() => setTemplate(t)}
                >
                  {t}
                </button>
              ))}
            </div>

            {previewData ? (
              <ShareCard data={previewData} />
            ) : (
              <div className="sm-hint sm-hint--center">
                <Music2 size={18} />
                Chọn bài hát để preview card
              </div>
            )}
          </div>
        </div>

        <div className="sm-modal__footer">
          <button className="sm-btn sm-btn--ghost" onClick={onClose} disabled={sharing}>
            Hủy
          </button>
          <button className="sm-btn sm-btn--primary" onClick={handleShare} disabled={!selected || sharing}>
            {sharing ? "Đang đăng..." : "Đăng lên tường"}
          </button>
        </div>
      </div>
    </div>
  );
}
