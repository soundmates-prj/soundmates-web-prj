import { useState, useEffect, useRef } from "react";
import { Search, X, Loader2, Music, User, Disc, Users, Album, Radio, FileText, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/axios";
import "./SearchBar.css";

// ── Types ─────────────────────────────────────────────────────────

type SearchTab = "track" | "artist" | "album" | "playlist" | "user" | "blog" | "schedule";

interface SpotifyTrack { id: string; name: string; artists: { name: string }[]; album: { name: string; images: { url: string }[]; external_urls?: { spotify?: string } }; external_urls?: { spotify?: string } }
interface SpotifyArtist { id: string; name: string; images: { url: string }[]; followers?: { total: number }; genres?: string[]; external_urls?: { spotify?: string } }
interface SpotifyAlbum { id: string; name: string; artists: { name: string }[]; images: { url: string }[]; release_date?: string; total_tracks?: number; external_urls?: { spotify?: string } }
interface SearchUser { id: string; username: string; email: string; firstName?: string; lastName?: string; roleName?: string; profileImageUrl?: string; }
interface SearchBlog { id: string; title: string; contentText?: string; authorName?: string; thumbnailUrl?: string; createdAt?: string; status?: string; }
interface SearchSchedule { id: string; title?: string; status?: string; startDate?: string; liveSession?: { sessionName?: string; thumbnailUrl?: string; }; }

// ── SearchTabButton ─────────────────────────────────────────────

function TabPill({
  tab, activeTab, label, Icon, count, onClick
}: {
  tab: SearchTab; activeTab: SearchTab; label: string;
  Icon: React.ElementType; count: number; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`sb-tab ${activeTab === tab ? "active" : ""}`}
    >
      <Icon size={13} />
      <span>{label}</span>
      {count > 0 && <span className="sb-tab-badge">{count > 99 ? "99+" : count}</span>}
    </button>
  );
}

// ── Image helpers ────────────────────────────────────────────────

function ResultThumb({
  src, alt, fallback: FallbackIcon, rounded
}: {
  src?: string; alt: string; fallback: React.ElementType; rounded?: boolean;
}) {
  return (
    <div className={`sb-thumb ${rounded ? "rounded" : ""}`}>
      {src ? (
        <img src={src} alt={alt} />
      ) : (
        <FallbackIcon size={18} />
      )}
    </div>
  );
}

// ── Spotify Track row ─────────────────────────────────────────────

function TrackRow({ t }: { t: SpotifyTrack }) {
  const img = t.album.images[0]?.url;
  return (
    <div
      className="sb-row sb-spotify-row"
      onClick={() => window.open(t.external_urls?.spotify || t.album.external_urls?.spotify, "_blank")}
    >
      <ResultThumb src={img} alt={t.name} fallback={Music} />
      <div className="sb-row-info">
        <span className="sb-row-title">{t.name}</span>
        <span className="sb-row-sub">{t.artists.map(a => a.name).join(", ")}</span>
        {t.album?.name && <span className="sb-row-sub"><Disc size={10} /> {t.album.name}</span>}
      </div>
      <span className="sb-open-icon">↗</span>
    </div>
  );
}

// ── Spotify Artist row ─────────────────────────────────────────────

function ArtistRow({ a }: { a: SpotifyArtist }) {
  const img = a.images[0]?.url;
  return (
    <div
      className="sb-row sb-spotify-row"
      onClick={() => window.open(a.external_urls?.spotify, "_blank")}
    >
      <ResultThumb src={img} alt={a.name} fallback={Users} rounded />
      <div className="sb-row-info">
        <span className="sb-row-title">{a.name}</span>
        <span className="sb-row-sub">
          Nghệ sĩ {a.followers ? `• ${(a.followers.total / 1000).toFixed(0)}K người theo dõi` : ""}
        </span>
        {a.genres?.length ? <span className="sb-row-sub">{a.genres.slice(0, 2).join(", ")}</span> : null}
      </div>
      <span className="sb-open-icon">↗</span>
    </div>
  );
}

// ── Spotify Album row ─────────────────────────────────────────────

function AlbumRow({ a }: { a: SpotifyAlbum }) {
  const img = a.images[0]?.url;
  return (
    <div
      className="sb-row sb-spotify-row"
      onClick={() => window.open(a.external_urls?.spotify, "_blank")}
    >
      <ResultThumb src={img} alt={a.name} fallback={Album} />
      <div className="sb-row-info">
        <span className="sb-row-title">{a.name}</span>
        <span className="sb-row-sub">{a.artists.map(x => x.name).join(", ")}</span>
        <span className="sb-row-sub">
          Album{a.total_tracks ? ` • ${a.total_tracks} bài` : ""}
          {a.release_date ? ` • ${a.release_date.split("-")[0]}` : ""}
        </span>
      </div>
      <span className="sb-open-icon">↗</span>
    </div>
  );
}

// ── User row ─────────────────────────────────────────────────────

function UserRow({ u, onNavigate }: { u: SearchUser; onNavigate: (path: string) => void }) {
  const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || u.email;
  return (
    <div className="sb-row" onClick={() => { onNavigate(`/profile/${u.id}`); onCloseRef.current?.(); }}>
      <ResultThumb src={u.profileImageUrl} alt={name} fallback={Users} rounded />
      <div className="sb-row-info">
        <span className="sb-row-title">{name}</span>
        <span className="sb-row-sub">@{u.username}</span>
        {u.roleName && <span className="sb-role-chip">{u.roleName}</span>}
      </div>
      <ChevronRight size={14} className="sb-chevron" />
    </div>
  );
}

// ── Blog row ─────────────────────────────────────────────────────

function BlogRow({ b, onNavigate }: { b: SearchBlog; onNavigate: (path: string) => void }) {
  return (
    <div className="sb-row" onClick={() => { onNavigate(`/blog/${b.id}`); onCloseRef.current?.(); }}>
      <ResultThumb src={b.thumbnailUrl} alt={b.title} fallback={FileText} />
      <div className="sb-row-info">
        <span className="sb-row-title">{b.title}</span>
        {b.authorName && <span className="sb-row-sub"><User size={10} /> {b.authorName}</span>}
        {b.createdAt && <span className="sb-row-sub">{new Date(b.createdAt).toLocaleDateString("vi-VN")}</span>}
      </div>
      <ChevronRight size={14} className="sb-chevron" />
    </div>
  );
}

// ── Schedule row ──────────────────────────────────────────────────

function ScheduleRow({ s, onNavigate }: { s: SearchSchedule; onNavigate: (path: string) => void }) {
  const thumb = s.liveSession?.thumbnailUrl;
  return (
    <div className="sb-row" onClick={() => { onNavigate(`/schedule/${s.id}`); onCloseRef.current?.(); }}>
      <ResultThumb src={thumb} alt={s.title || s.liveSession?.sessionName || ""} fallback={Radio} />
      <div className="sb-row-info">
        <span className="sb-row-title">{s.title || s.liveSession?.sessionName || "Lịch phát sóng"}</span>
        {s.liveSession?.sessionName && <span className="sb-row-sub"><Radio size={10} /> {s.liveSession.sessionName}</span>}
        {s.status && <span className={`sb-status-chip sb-status-${s.status.toLowerCase()}`}>{s.status}</span>}
      </div>
      <ChevronRight size={14} className="sb-chevron" />
    </div>
  );
}

// ── Main SearchBar ────────────────────────────────────────────────

// Shared ref accessor so row click handlers can close the search
const onCloseRef = { current: (() => {}) as () => void };

export default function SearchBar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SearchTab>("track");
  const [loading, setLoading] = useState(false);

  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [artists, setArtists] = useState<SpotifyArtist[]>([]);
  const [albums, setAlbums] = useState<SpotifyAlbum[]>([]);
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [blogs, setBlogs] = useState<SearchBlog[]>([]);
  const [schedules, setSchedules] = useState<SearchSchedule[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Wire close callback into shared ref
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  // Open: focus input. Close: reset all.
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setTracks([]); setArtists([]); setAlbums([]);
      setUsers([]); setBlogs([]); setSchedules([]);
      setActiveTab("track");
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setTracks([]); setArtists([]); setAlbums([]);
      setUsers([]); setBlogs([]); setSchedules([]);
      setLoading(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      await Promise.allSettled([fetchSpotify(), fetchUsers(), fetchBlogs(), fetchSchedules()]);
      setLoading(false);
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  // ── Fetch helpers ──────────────────────────────────────────────

  const fetchSpotify = async () => {
    try {
      const res = await api.get("/spotify/search", {
        params: { q: query, type: "track,artist,album", limit: 8 },
      });
      if (res.data?.data) {
        setTracks(res.data.data.tracks?.items || []);
        setArtists(res.data.data.artists?.items || []);
        setAlbums(res.data.data.albums?.items || []);
      }
    } catch { /* silent */ }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get("/users", { params: { q: query, page: 1, pageSize: 6 } });
      if (res.data?.data?.items) setUsers(res.data.data.items);
    } catch { /* silent */ }
  };

  const fetchBlogs = async () => {
    try {
      const res = await api.get("/posts/published", { params: { search: query, page: 1, pageSize: 6 } });
      if (res.data?.data?.items) setBlogs(res.data.data.items);
    } catch { /* silent */ }
  };

  const fetchSchedules = async () => {
    try {
      const res = await api.get("/schedule/search", { params: { q: query, page: 1, pageSize: 6 } });
      if (res.data?.data?.content) setSchedules(res.data.data.content);
    } catch { /* silent */ }
  };

  // ── Active results ────────────────────────────────────────────

  const getActiveItems = (): unknown[] => {
    switch (activeTab) {
      case "track": return tracks;
      case "artist": return artists;
      case "album": return albums;
      case "user": return users;
      case "blog": return blogs;
      case "schedule": return schedules;
      default: return [];
    }
  };

  const activeItems = getActiveItems();
  const hasQuery = query.trim().length > 0;
  const hasResults = activeItems.length > 0;

  // ── Render results ─────────────────────────────────────────────

  const renderContent = () => {
    if (loading) return (
      <div className="sb-state"><Loader2 size={22} className="sb-spin" /><span>Đang tìm kiếm...</span></div>
    );
    if (!hasQuery) return (
      <div className="sb-state">
        <Search size={28} />
        <span>Nhập từ khóa để tìm kiếm người dùng, blog, lịch phát...</span>
      </div>
    );
    if (!hasResults) return (
      <div className="sb-state">
        <Search size={28} />
        <span>Không tìm thấy kết quả nào</span>
      </div>
    );
    return (
      <div className="sb-results-list">
        {activeTab === "track" && (tracks as SpotifyTrack[]).map(t => <TrackRow key={t.id} t={t} />)}
        {activeTab === "artist" && (artists as SpotifyArtist[]).map(a => <ArtistRow key={a.id} a={a} />)}
        {activeTab === "album" && (albums as SpotifyAlbum[]).map(a => <AlbumRow key={a.id} a={a} />)}
        {activeTab === "user" && (users as SearchUser[]).map(u => <UserRow key={u.id} u={u} onNavigate={navigate} />)}
        {activeTab === "blog" && (blogs as SearchBlog[]).map(b => <BlogRow key={b.id} b={b} onNavigate={navigate} />)}
        {activeTab === "schedule" && (schedules as SearchSchedule[]).map(s => <ScheduleRow key={s.id} s={s} onNavigate={navigate} />)}
      </div>
    );
  };

  // ── Tabs ─────────────────────────────────────────────────────

  const tabs: { key: SearchTab; label: string; icon: React.ElementType }[] = [
    { key: "track", label: "Bài hát", icon: Music },
    { key: "artist", label: "Nghệ sĩ", icon: Users },
    { key: "album", label: "Album", icon: Album },
    { key: "user", label: "Người dùng", icon: User },
    { key: "blog", label: "Blog", icon: FileText },
    { key: "schedule", label: "Lịch phát", icon: Radio },
  ];

  const getCount = (key: SearchTab) => {
    switch (key) { case "track": return tracks.length; case "artist": return artists.length; case "album": return albums.length; case "user": return users.length; case "blog": return blogs.length; case "schedule": return schedules.length; default: return 0; }
  };

  if (!isOpen) return null;

  return (
    <div className="sb-overlay" onClick={onClose}>
      {/* Panel — stop propagation so click inside doesn't close */}
      <div className="sb-panel" ref={panelRef} onClick={e => e.stopPropagation()}>
        {/* ── Input ── */}
        <div className="sb-input-row">
          <Search size={16} className="sb-input-icon" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Tìm kiếm bài hát, nghệ sĩ, album, người dùng, blog, lịch phát..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="sb-input"
          />
          {loading && <Loader2 size={15} className="sb-spin" />}
          {query && !loading && (
            <button className="sb-clear-btn" onClick={() => setQuery("")}><X size={14} /></button>
          )}
          <button className="sb-close-btn" onClick={onClose}><X size={16} /></button>
        </div>

        {/* ── Tabs ── */}
        <div className="sb-tabs">
          {tabs.map(t => (
            <TabPill
              key={t.key}
              tab={t.key}
              activeTab={activeTab}
              label={t.label}
              Icon={t.icon}
              count={getCount(t.key)}
              onClick={() => setActiveTab(t.key)}
            />
          ))}
        </div>

        {/* ── Results ── */}
        <div className="sb-results">{renderContent()}</div>
      </div>
    </div>
  );
}
