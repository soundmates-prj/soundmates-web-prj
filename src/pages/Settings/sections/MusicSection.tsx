import React, { useState } from "react";
import { Search } from "lucide-react";
import { showSuccess } from "../../../components/common/toastUtils";

import "./MusicSection.css";
import type { Song } from "../../../components/layout/SongRow";
import SongRow from "../../../components/layout/SongRow";

/* ── Mock data – replace with GET /api/music/catalog ── */
const INITIAL_SONGS: Song[] = [
  {
    id: 1,
    title: "Trời giấu trời mang đi",
    artist: "AMEE",
    cover: "https://i.pravatar.cc/40?img=1",
    added: true,
  },
  {
    id: 2,
    title: "Vẫn Sư Như Ý",
    artist: "Trúc Nhân",
    cover: "https://i.pravatar.cc/40?img=2",
    added: true,
  },
  {
    id: 3,
    title: "Ai Ngoài Anh",
    artist: "VSTRA",
    cover: "https://i.pravatar.cc/40?img=3",
    added: true,
  },
  {
    id: 4,
    title: "Cơn Mưa Ngang Qua",
    artist: "Sơn Tùng M-TP",
    cover: "https://i.pravatar.cc/40?img=4",
    added: false,
  },
  {
    id: 5,
    title: "Có Em (Feat. Low G)",
    artist: "Mashu",
    cover: "https://i.pravatar.cc/40?img=5",
    added: false,
  },
  {
    id: 6,
    title: "Waiting For You",
    artist: "MONO",
    cover: "https://i.pravatar.cc/40?img=6",
    added: false,
  },
];

const MusicSection: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>(INITIAL_SONGS);
  const [searchQuery, setSearch] = useState("");

  /* ── helpers ── */
  const toggleSong = (id: number) =>
    setSongs((prev) =>
      prev.map((s) => (s.id === id ? { ...s, added: !s.added } : s)),
    );

  const handleSave = () => {
    // TODO: PUT /api/members/me/favorite-songs  { songIds: songs.filter(s => s.added).map(s => s.id) }
    showSuccess("Đã lưu", "Danh sách âm nhạc yêu thích đã được cập nhật!");
  };

  const filteredSongs = songs.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.artist.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const favoriteSongs = songs.filter((s) => s.added);

  return (
    <div className="settings-card">
      <div className="settings-banner" style={{ minHeight: 72 }} />

      <div className="settings-form">
        <div className="music-panel">
          {/* ── Left: catalog search ── */}
          <div className="music-col">
            <div className="music-search-wrap">
              <Search size={15} className="music-search-icon" />
              <input
                className="music-search-input"
                placeholder="Tìm kiếm âm nhạc của bạn..."
                value={searchQuery}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="music-list">
              {filteredSongs.length > 0 ? (
                filteredSongs.map((song) => (
                  <SongRow
                    key={song.id}
                    song={song}
                    variant="left"
                    onToggle={toggleSong}
                  />
                ))
              ) : (
                <p className="music-empty">Không tìm thấy bài hát nào</p>
              )}
            </div>
          </div>

          {/* ── Right: favorites ── */}
          <div className="music-col">
            <p className="music-right-hint">
              Chọn từ danh sách bên trái để thêm vào âm nhạc yêu thích của bạn
            </p>

            <div className="music-list">
              {favoriteSongs.length > 0 ? (
                favoriteSongs.map((song) => (
                  <SongRow
                    key={song.id}
                    song={song}
                    variant="right"
                    onToggle={toggleSong}
                  />
                ))
              ) : (
                <p className="music-empty">Chưa có bài hát nào</p>
              )}
            </div>

            <div className="form-actions" style={{ marginTop: 16 }}>
              <button className="btn-primary" onClick={handleSave}>
                Lưu
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicSection;
