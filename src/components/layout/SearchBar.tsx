import { useState, useEffect, useRef } from "react";
import { Search, X, Loader2, Music, User, Disc, Users, Album } from "lucide-react";
import api from "../../services/axios";
import "./SearchBar.css";

type SearchType = "track" | "artist" | "album" | "playlist";

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string; height?: number }[];
  };
  duration_ms: number;
}

interface SpotifyArtist {
  id: string;
  name: string;
  images: { url: string; height?: number }[];
  followers?: { total: number };
  genres?: string[];
}

interface SpotifyAlbum {
  id: string;
  name: string;
  artists: { name: string }[];
  images: { url: string; height?: number }[];
  release_date?: string;
  total_tracks?: number;
}

interface SearchBarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchBar({ isOpen, onClose }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SearchType>("track");
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [artists, setArtists] = useState<SpotifyArtist[]>([]);
  const [albums, setAlbums] = useState<SpotifyAlbum[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    } else {
      setQuery("");
      setTracks([]);
      setArtists([]);
      setAlbums([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setTracks([]);
      setArtists([]);
      setAlbums([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await api.get("/spotify/search", {
          params: { q: query, type: "track,artist,album", limit: 8, offset: 0 },
        });
        if (res.data.success && res.data.data) {
          setTracks(res.data.data.tracks?.items || []);
          setArtists(res.data.data.artists?.items || []);
          setAlbums(res.data.data.albums?.items || []);
        }
      } catch (error) {
        console.error("Search failed", error);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  const handleClear = () => {
    setQuery("");
    setTracks([]);
    setArtists([]);
    setAlbums([]);
    inputRef.current?.focus();
  };

  const getActiveResults = () => {
    switch (activeTab) {
      case "track":
        return tracks;
      case "artist":
        return artists;
      case "album":
        return albums;
      default:
        return [];
    }
  };

  const renderResults = () => {
    const results = getActiveResults();
    
    if (loading) {
      return (
        <div className="search-bar-loading">
          <Loader2 size={24} className="search-bar-spinner" />
          <span>Đang tìm kiếm...</span>
        </div>
      );
    }

    if (!query.trim()) {
      return (
        <div className="search-bar-empty">
          <Search size={32} />
          <span>Nhập từ khóa để tìm kiếm</span>
        </div>
      );
    }

    if (results.length === 0) {
      return (
        <div className="search-bar-empty">
          <Music size={32} />
          <span>Không tìm thấy kết quả</span>
        </div>
      );
    }

    if (activeTab === "track") {
      return (
        <div className="search-bar-results">
          {(results as SpotifyTrack[]).map((track) => {
            const img = track.album.images[0]?.url;
            return (
              <div key={track.id} className="search-result-item">
                <div className="search-result-img">
                  {img ? <img src={img} alt={track.name} /> : <Music size={20} />}
                </div>
                <div className="search-result-info">
                  <div className="search-result-title">{track.name}</div>
                  <div className="search-result-subtitle">
                    <User size={12} />
                    {track.artists.map((a) => a.name).join(", ")}
                  </div>
                  <div className="search-result-album">
                    <Disc size={12} />
                    {track.album.name}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    if (activeTab === "artist") {
      return (
        <div className="search-bar-results">
          {(results as SpotifyArtist[]).map((artist) => {
            const img = artist.images[0]?.url;
            return (
              <div key={artist.id} className="search-result-item">
                <div className="search-result-img artist-img">
                  {img ? <img src={img} alt={artist.name} /> : <Users size={20} />}
                </div>
                <div className="search-result-info">
                  <div className="search-result-title">{artist.name}</div>
                  <div className="search-result-subtitle">
                    <Users size={12} />
                    Nghệ sĩ
                    {artist.followers && ` • ${(artist.followers.total / 1000).toFixed(0)}K người theo dõi`}
                  </div>
                  {artist.genres && artist.genres.length > 0 && (
                    <div className="search-result-album">
                      <Music size={12} />
                      {artist.genres.slice(0, 2).join(", ")}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    if (activeTab === "album") {
      return (
        <div className="search-bar-results">
          {(results as SpotifyAlbum[]).map((album) => {
            const img = album.images[0]?.url;
            return (
              <div key={album.id} className="search-result-item">
                <div className="search-result-img">
                  {img ? <img src={img} alt={album.name} /> : <Album size={20} />}
                </div>
                <div className="search-result-info">
                  <div className="search-result-title">{album.name}</div>
                  <div className="search-result-subtitle">
                    <User size={12} />
                    {album.artists.map((a) => a.name).join(", ")}
                  </div>
                  <div className="search-result-album">
                    <Disc size={12} />
                    Album • {album.total_tracks || 0} bài
                    {album.release_date && ` • ${album.release_date.split("-")[0]}`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    return null;
  };

  const tabs = [
    { key: "track" as const, label: "Bài hát", icon: Music, count: tracks.length },
    { key: "artist" as const, label: "Nghệ sĩ", icon: Users, count: artists.length },
    { key: "album" as const, label: "Album", icon: Album, count: albums.length },
  ];

  if (!isOpen) return null;

  return (
    <div className="search-bar-overlay">
      <div className="search-bar-container" ref={containerRef}>
        <div className="search-bar-header">
          <div className="search-bar-input-wrap">
            <Search size={20} className="search-bar-icon" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Tìm bài hát, nghệ sĩ, album..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="search-bar-input"
            />
            {loading && <Loader2 size={18} className="search-bar-spinner" />}
            {query && !loading && (
              <button onClick={handleClear} className="search-bar-clear">
                <X size={18} />
              </button>
            )}
          </div>
          <button onClick={onClose} className="search-bar-close">
            <X size={20} />
          </button>
        </div>

        <div className="search-bar-tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`search-tab ${activeTab === tab.key ? "active" : ""}`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                {tab.count > 0 && <span className="search-tab-count">{tab.count}</span>}
              </button>
            );
          })}
        </div>

        <div className="search-bar-content">
          {renderResults()}
        </div>
      </div>
    </div>
  );
}
