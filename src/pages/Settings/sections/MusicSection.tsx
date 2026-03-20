import React, { useState, useEffect, useCallback, useRef } from "react";
import { Search, Loader2 } from "lucide-react";
import {
  showSuccess,
  showError,
} from "../../../components/common/toastUtils";

import "./MusicSection.css";
import type { Song } from "../../../components/layout/SongRow";
import SongRow from "../../../components/layout/SongRow";
import favoriteService from "../../../services/favoriteService";
import type {
  SpotifyTrack,
  FavoriteItem,
} from "../../../services/favoriteService";

/* ── Helpers ── */
const DEFAULT_COVER =
  "https://i.scdn.co/image/ab67616d00004851b0cc2e9c4480df7de2c9f0b1";

function spotifyTrackToSong(
  track: SpotifyTrack,
  favoriteItemIds: Set<string>,
): Song {
  const img =
    track.album.images.find((i) => i.height === 64)?.url ??
    track.album.images[track.album.images.length - 1]?.url ??
    DEFAULT_COVER;
  return {
    id: track.id,
    title: track.name,
    artist: track.artists.map((a) => a.name).join(", "),
    cover: img,
    added: favoriteItemIds.has(track.id),
    albumName: track.album.name,
    itemId: track.id,
    source: "Spotify",
    durationMs: track.duration_ms,
    externalUrl: track.external_urls.spotify,
  };
}

function favoriteToSong(fav: FavoriteItem): Song {
  return {
    id: fav.itemId,
    title: fav.name,
    artist: fav.artistName,
    cover: fav.imgUrl || DEFAULT_COVER,
    added: true,
    albumName: fav.albumName,
    itemId: fav.itemId,
    source: fav.source,
    durationMs: fav.durationMs,
    externalUrl: fav.externalUrl,
  };
}

const MusicSection: React.FC = () => {
  const [searchQuery, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [favorites, setFavorites] = useState<Song[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Load favorites on mount ── */
  const loadFavorites = useCallback(async () => {
    try {
      const res = await favoriteService.getFavorites("track");
      if (res.success && res.data) {
        setFavorites(res.data.map(favoriteToSong));
      }
    } catch (err) {
      console.error("Load favorites failed", err);
    } finally {
      setLoadingFavorites(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  /* ── Debounced Spotify search ── */
  const doSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setSearchResults([]);
        return;
      }
      setLoadingSearch(true);
      try {
        const res = await favoriteService.searchSpotify(q, "track", 10, 0);
        const favIds = new Set(favorites.map((f) => f.itemId ?? f.id));
        if (res.success && res.data.tracks) {
          setSearchResults(
            res.data.tracks.items.map((t) => spotifyTrackToSong(t, favIds)),
          );
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error("Spotify search failed", err);
        showError("Lỗi", "Không thể tìm kiếm nhạc từ Spotify");
      } finally {
        setLoadingSearch(false);
      }
    },
    [favorites],
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(searchQuery), 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, doSearch]);

  /* ── Sync "added" flag on search results when favorites change ── */
  useEffect(() => {
    const favIds = new Set(favorites.map((f) => f.itemId ?? f.id));
    setSearchResults((prev) =>
      prev.map((s) => ({ ...s, added: favIds.has(s.itemId ?? s.id) })),
    );
  }, [favorites]);

  /* ── Add to favorites ── */
  const handleAdd = async (song: Song) => {
    const itemId = song.itemId ?? song.id;
    setBusyIds((prev) => new Set(prev).add(itemId));
    try {
      await favoriteService.addFavorite({
        itemType: "Track",
        itemId,
        source: "Spotify",
        name: song.title,
        artistName: song.artist,
        albumName: song.albumName ?? "",
        imgUrl: song.cover,
        previewUrl: "",
      });
      showSuccess("Đã thêm", `${song.title} đã được thêm vào yêu thích`);
      await loadFavorites();
    } catch (err) {
      console.error("Add favorite failed", err);
      showError("Lỗi", "Không thể thêm bài hát vào yêu thích");
    } finally {
      setBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  /* ── Remove from favorites ── */
  const handleRemove = async (song: Song) => {
    const itemId = song.itemId ?? song.id;
    setBusyIds((prev) => new Set(prev).add(itemId));
    try {
      await favoriteService.removeFavorite({
        itemType: "track",
        itemId,
        source: "spotify",
      });
      showSuccess("Đã xoá", `${song.title} đã được xoá khỏi yêu thích`);
      await loadFavorites();
    } catch (err) {
      console.error("Remove favorite failed", err);
      showError("Lỗi", "Không thể xoá bài hát khỏi yêu thích");
    } finally {
      setBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  /* ── Toggle handler for left panel ── */
  const toggleSearchSong = (id: string) => {
    const song = searchResults.find((s) => s.id === id);
    if (!song || busyIds.has(song.itemId ?? song.id)) return;
    if (song.added) {
      handleRemove(song);
    } else {
      handleAdd(song);
    }
  };

  /* ── Remove handler for right panel ── */
  const removeFavoriteSong = (id: string) => {
    const song = favorites.find((s) => s.id === id);
    if (!song || busyIds.has(song.itemId ?? song.id)) return;
    handleRemove(song);
  };

  return (
    <div className="settings-card">
      <div className="settings-banner" style={{ minHeight: 72 }} />

      <div className="settings-form">
        <div className="music-panel">
          {/* ── Left: Spotify search ── */}
          <div className="music-col">
            <div className="music-search-wrap">
              <Search size={15} className="music-search-icon" />
              <input
                className="music-search-input"
                placeholder="Tìm kiếm bài hát trên Spotify..."
                value={searchQuery}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="music-list">
              {loadingSearch ? (
                <div className="music-loading">
                  <Loader2 size={20} className="music-spinner" />
                  <span>Đang tìm kiếm...</span>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((song) => (
                  <SongRow
                    key={song.id}
                    song={song}
                    variant="left"
                    onToggle={toggleSearchSong}
                  />
                ))
              ) : searchQuery.trim() ? (
                <p className="music-empty">Không tìm thấy bài hát nào</p>
              ) : (
                <p className="music-empty">
                  Nhập tên bài hát để tìm kiếm trên Spotify
                </p>
              )}
            </div>
          </div>

          {/* ── Right: favorites ── */}
          <div className="music-col">
            <p className="music-right-hint">
              Chọn từ danh sách bên trái để thêm vào âm nhạc yêu thích của bạn
            </p>

            <div className="music-list">
              {loadingFavorites ? (
                <div className="music-loading">
                  <Loader2 size={20} className="music-spinner" />
                  <span>Đang tải...</span>
                </div>
              ) : favorites.length > 0 ? (
                favorites.map((song) => (
                  <SongRow
                    key={song.id}
                    song={song}
                    variant="right"
                    onToggle={removeFavoriteSong}
                  />
                ))
              ) : (
                <p className="music-empty">Chưa có bài hát nào</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicSection;
