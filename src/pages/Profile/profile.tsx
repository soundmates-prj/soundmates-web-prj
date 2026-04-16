import {
  Calendar1,
  SquarePen,
  Play,
  Heart,
  Music2,
  MoreHorizontal,
  ChartBar,
  AudioLines,
  Plus,
  Sparkles,
  Mic2,
  Bookmark,
  ListMusic,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/axios";
import { Avatar } from "../../components/common";
import "./profile.css";
import "./profile-dark.css";
import type { User } from "../../types/user";
import type { Post } from "../../types/post";
import CreatePostModal from "./modals/CreatePostModal";
import EditPostModal from "./modals/EditPostModal";
import favoriteService from "../../services/favoriteService";
import type { FavoriteItem } from "../../services/favoriteService";
import podcastService from "../../services/podcastService";
import type { PodcastItem } from "../../types/podcast";
import userPlaylistService from "../../services/userPlaylistService";
import type { UserPlaylist } from "../../services/userPlaylistService";
import BlogPostCard from "../../components/blog/BlogPostCard";
import ShareMusicModal from "../../components/blog/ShareMusicModal";
import UserPlaylistTab from "./UserPlaylistTab";

type Tab = "overview" | "songs" | "playlists" | "podcasts" | "community";

const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Tổng quan" },
  { key: "songs", label: "Bài hát" },
  { key: "playlists", label: "Playlist" },
  { key: "podcasts", label: "Podcast" },
  { key: "community", label: "Cộng đồng" },
];

const formatDuration = (ms: number) => {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const formatDate = (d?: string | null) =>
  d
    ? new Date(d).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;

/* ──────────────────────────────────────────
   PROFILE
────────────────────────────────────────── */
export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [tab, setTab] = useState<Tab>("overview");
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showShareMusic, setShowShareMusic] = useState(false);
  const [editPost, setEditPost] = useState<Post | null>(null);
  const navigate = useNavigate();
  const [favTracks, setFavTracks] = useState<FavoriteItem[]>([]);
  const [savedPodcasts, setSavedPodcasts] = useState<PodcastItem[]>([]);
  const [userPlaylists, setUserPlaylists] = useState<UserPlaylist[]>([]);

  const loadFavorites = useCallback(async () => {
    try {
      const res = await favoriteService.getFavorites("track");
      if (res.success && res.data) {
        setFavTracks(res.data);
      }
    } catch (err) {
      console.error("Load favorites failed", err);
    }
  }, []);

  const loadSavedPodcasts = useCallback(async () => {
    try {
      const data = await podcastService.getSavedPodcasts();
      setSavedPodcasts(data);
    } catch (err) {
      console.error("Load saved podcasts failed", err);
    }
  }, []);

  const loadPlaylists = useCallback(async () => {
    try {
      const data = await userPlaylistService.getAll();
      setUserPlaylists(data);
    } catch (err) {
      console.error("Load playlists failed", err);
    }
  }, []);

  const handleUnsavePodcast = async (podcastId: string) => {
    setSavedPodcasts((prev) => prev.filter((p) => p.id !== podcastId));
    try {
      await podcastService.unsavePodcast(podcastId);
    } catch {
      loadSavedPodcasts();
    }
  };

  useEffect(() => {
    api
      .get("users/me/profile/full")
      .then((r) => setUser(r.data.data))
      .catch((e) => console.error("Load profile failed", e));

    api
      .get("me/posts")
      .then((r) => setPosts(r.data?.data?.items ?? []))
      .catch((e) => console.error("Load posts failed", e));

    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadFavorites();
    loadSavedPodcasts();
    loadPlaylists();
  }, [loadFavorites, loadSavedPodcasts, loadPlaylists]);

  if (!user) return <div className="pf-loading">Đang tải...</div>;

  const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  const dob = formatDate(user.dateOfBirth);
  const defaultCover =
    "https://images.unsplash.com/photo-1511376777868-611b54f68947?w=1200&q=80";
  const defaultAv =
    "https://i.pinimg.com/736x/3f/94/70/3f9470b34a8e3f526dbdb022f9f19cf7.jpg";

  const handlePostCreated = (post: Post) => {
    setPosts((prev) => [post, ...prev]);
  };

  const handlePostUpdated = (updated: Post) => {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  return (
    <div className="pf">
      {/* COVER */}
      <div className="pf-cover">
        <img src={user.backgroundImageUrl || defaultCover} alt="cover" />
      </div>

      {/* PROFILE BAR */}
      <div className="pf-bar">
        <div className="pf-bar-inner">
          {/* Avatar + info */}
          <div className="pf-left">
            <Avatar
              src={user.profileImageUrl || defaultAv}
              name={name}
              size="xl"
              className="pf-av"
            />
            <div className="pf-info">
              <div className="pf-name-row">
                <h1 className="pf-name">{name}</h1>
                <span className="pf-check">✔</span>
              </div>
              <p className="pf-bio">{user.bio || ""}</p>
              {dob && (
                <p className="pf-dob">
                  <Calendar1 size={13} />
                  {dob}
                </p>
              )}
            </div>
          </div>

          {/* Stats + edit */}
          <div className="pf-right">
            <Link to="/settings" className="pf-edit-btn">
              <SquarePen size={14} />
              Chỉnh sửa
            </Link>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="pf-tabs-row">
        <div className="pf-tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`pf-tab ${tab === t.key ? "active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div className="pf-content" key={tab}>
        {tab === "overview" && (
          <div className="pf-grid">
            {/* Left */}
            <div className="pf-col">
              {/* Top Tracks */}
              <div className="pf-card">
                <div className="pf-card-top">
                  <h3>Bài Hát Yêu Thích Nhất</h3>
                  <button className="pf-link">Xem tất cả</button>
                </div>
                {favTracks.length > 0 ? (
                  favTracks.slice(0, 5).map((t, idx) => (
                    <div key={t.id} className="track">
                      <span className="track-n">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <img
                        className="track-img"
                        src={
                          t.imgUrl ||
                          "https://i.scdn.co/image/ab67616d00004851b0cc2e9c4480df7de2c9f0b1"
                        }
                        alt={t.name}
                      />
                      <div className="track-info">
                        <p className="track-title">{t.name}</p>
                        <p className="track-artist">
                          {t.artistName}
                          {t.albumName ? ` · ${t.albumName}` : ""}
                        </p>
                      </div>
                      <span className="track-dur">
                        {t.durationMs ? formatDuration(t.durationMs) : "--:--"}
                      </span>
                      <span className="track-likes">
                        <Heart size={12} />
                      </span>
                      <button className="track-more">
                        <MoreHorizontal size={15} />
                      </button>
                    </div>
                  ))
                ) : (
                  <p
                    className="music-empty"
                    style={{
                      textAlign: "center",
                      padding: "16px 0",
                      color: "var(--neutral-400, #a3a3a3)",
                      fontSize: 13,
                    }}
                  >
                    Chưa có bài hát yêu thích nào
                  </p>
                )}
              </div>

              {/* Community Posts */}
              <div className="pf-card">
                <div className="pf-card-top">
                  <h3>
                    <ChartBar size={18} /> Cộng đồng
                  </h3>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="pf-create-post-btn"
                      onClick={() => setShowShareMusic(true)}
                    >
                      <Sparkles size={13} />
                      Share bài hát
                    </button>
                    <button
                      className="pf-create-post-btn"
                      onClick={() => setShowCreatePost(true)}
                    >
                      <Plus size={13} />
                      Tạo bài đăng
                    </button>
                  </div>
                </div>

                {/* Quick compose bar */}
                <div
                  className="pf-compose-bar"
                  onClick={() => setShowCreatePost(true)}
                >
                  <Avatar
                    src={user.profileImageUrl || defaultAv}
                    name={name}
                    size="sm"
                  />
                  <span className="pf-compose-placeholder">
                    Bạn đang nghĩ gì về âm nhạc hôm nay?
                  </span>
                  <div className="pf-compose-actions">
                    <span className="pf-compose-action-btn" title="Thêm ảnh">
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </span>
                    <span className="pf-compose-action-btn" title="Thêm audio">
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" y1="19" x2="12" y2="22" />
                      </svg>
                    </span>
                    <span className="pf-compose-action-btn" title="Tâm trạng">
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                        <line x1="9" y1="9" x2="9.01" y2="9" />
                        <line x1="15" y1="9" x2="15.01" y2="9" />
                      </svg>
                    </span>
                  </div>
                </div>

                {posts.length === 0 ? (
                  <p className="post-empty">Chưa có bài đăng nào.</p>
                ) : (
                  <div className="post-list">
                    {posts.map((post) => (
                      <BlogPostCard
                        key={post.id}
                        post={post}
                        user={user}
                        name={name}
                        defaultAv={defaultAv}
                        onEdit={setEditPost}
                        onDelete={handlePostDeleted}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right */}
            <div className="pf-col pf-col--sticky">
              <div className="pf-card">
                <div className="pf-card-top">
                  <h3>Podcast đã lưu</h3>
                  {savedPodcasts.length > 0 && (
                    <button
                      className="pf-link"
                      onClick={() => setTab("podcasts")}
                    >
                      Xem tất cả
                    </button>
                  )}
                </div>
                {savedPodcasts.length > 0 ? (
                  savedPodcasts.slice(0, 4).map((p) => (
                    <div
                      key={p.id}
                      className="pod"
                      onClick={() => navigate(`/podcast/${p.id}`)}
                      style={{ cursor: "pointer" }}
                    >
                      {p.banner ? (
                        <img className="pod-img" src={p.banner} alt={p.title} />
                      ) : (
                        <div className="pod-img pod-img--fallback">
                          <Mic2 size={16} />
                        </div>
                      )}
                      <div className="pod-info">
                        <p className="pod-title">{p.title}</p>
                        <p className="pod-ep">{p.author}</p>
                      </div>
                      <button
                        className="pod-play"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/podcast/${p.id}`);
                        }}
                      >
                        <Play size={12} fill="currentColor" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p
                    className="music-empty"
                    style={{
                      textAlign: "center",
                      padding: "16px 0",
                      color: "var(--neutral-400, #a3a3a3)",
                      fontSize: 13,
                    }}
                  >
                    Chưa lưu podcast nào
                  </p>
                )}
              </div>

              {/* Playlist của tôi */}
              <div className="pf-card">
                <div className="pf-card-top">
                  <h3>Playlist của tôi</h3>
                  {userPlaylists.length > 0 && (
                    <button
                      className="pf-link"
                      onClick={() => setTab("playlists")}
                    >
                      Xem tất cả
                    </button>
                  )}
                </div>
                {userPlaylists.length > 0 ? (
                  userPlaylists.slice(0, 4).map((pl) => (
                    <div key={pl.id} className="pod">
                      {pl.thumbnailUrl ? (
                        <img
                          className="pod-img"
                          src={pl.thumbnailUrl}
                          alt={pl.playlistName}
                        />
                      ) : (
                        <div className="pod-img pod-img--fallback">
                          <ListMusic size={16} />
                        </div>
                      )}
                      <div className="pod-info">
                        <p className="pod-title">{pl.playlistName}</p>
                        <p className="pod-ep">{pl.totalTracks ?? 0} bài hát</p>
                      </div>
                      <button
                        className="pod-play"
                        onClick={() => setTab("playlists")}
                      >
                        <Play size={12} fill="currentColor" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p
                    className="music-empty"
                    style={{
                      textAlign: "center",
                      padding: "16px 0",
                      color: "var(--neutral-400, #a3a3a3)",
                      fontSize: 13,
                    }}
                  >
                    Chưa có playlist nào
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Community tab — full view */}
        {tab === "community" && (
          <div className="pf-community-full">
            <div className="pf-community-header">
              <h2 className="pf-community-title">Bài đăng của tôi</h2>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="pf-create-post-btn"
                  onClick={() => setShowShareMusic(true)}
                >
                  <Sparkles size={14} />
                  Share bài hát
                </button>
                <button
                  className="pf-create-post-btn"
                  onClick={() => setShowCreatePost(true)}
                >
                  <Plus size={14} />
                  Tạo bài đăng
                </button>
              </div>
            </div>

            {/* Quick compose bar */}
            <div
              className="pf-compose-bar pf-compose-bar--full"
              onClick={() => setShowCreatePost(true)}
            >
              <Avatar
                src={user.profileImageUrl || defaultAv}
                name={name}
                size="sm"
              />
              <span className="pf-compose-placeholder">
                Bạn đang nghĩ gì về âm nhạc hôm nay?
              </span>
            </div>

            {posts.length === 0 ? (
              <div className="pf-empty">
                <Music2 size={28} />
                <p>Chưa có bài đăng nào</p>
                <button
                  className="pf-create-post-btn"
                  onClick={() => setShowCreatePost(true)}
                >
                  Tạo bài đăng đầu tiên
                </button>
              </div>
            ) : (
              <div className="post-list">
                {posts.map((post) => (
                  <BlogPostCard
                    key={post.id}
                    post={post}
                    user={user}
                    name={name}
                    defaultAv={defaultAv}
                    onEdit={setEditPost}
                    onDelete={handlePostDeleted}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "songs" && (
          <div className="pf-card">
            <div className="pf-card-top">
              <h3>
                <AudioLines size={18} /> Bài hát yêu thích
              </h3>
            </div>
            {favTracks.length > 0 ? (
              favTracks.map((t, idx) => (
                <div key={t.id} className="track">
                  <span className="track-n">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <img
                    className="track-img"
                    src={
                      t.imgUrl ||
                      "https://i.scdn.co/image/ab67616d00004851b0cc2e9c4480df7de2c9f0b1"
                    }
                    alt={t.name}
                  />
                  <div className="track-info">
                    <p className="track-title">{t.name}</p>
                    <p className="track-artist">
                      {t.artistName}
                      {t.albumName ? ` · ${t.albumName}` : ""}
                    </p>
                  </div>
                  <span className="track-dur">
                    {t.durationMs ? formatDuration(t.durationMs) : "--:--"}
                  </span>
                  <span className="track-likes">
                    <Heart size={12} />
                  </span>
                  <button className="track-more">
                    <MoreHorizontal size={15} />
                  </button>
                </div>
              ))
            ) : (
              <div className="pf-empty">
                <Music2 size={28} />
                <p>Chưa có bài hát yêu thích nào</p>
                <Link to="/settings" className="pf-link">
                  Thêm bài hát yêu thích
                </Link>
              </div>
            )}
          </div>
        )}

        {tab === "playlists" && <UserPlaylistTab />}

        {tab === "podcasts" && (
          <div className="pf-card">
            <div className="pf-card-top">
              <h3>
                <Mic2 size={18} /> Podcast đã lưu
              </h3>
              <span
                style={{ fontSize: 13, color: "var(--neutral-400, #a3a3a3)" }}
              >
                {savedPodcasts.length} podcast
              </span>
            </div>
            {savedPodcasts.length > 0 ? (
              <div className="pf-saved-podcasts-grid">
                {savedPodcasts.map((p) => (
                  <div
                    key={p.id}
                    className="pf-podcast-card"
                    onClick={() => navigate(`/podcast/${p.id}`)}
                  >
                    <div className="pf-podcast-card-banner">
                      {p.banner ? (
                        <img src={p.banner} alt={p.title} />
                      ) : (
                        <div className="pf-podcast-card-fallback">
                          <Mic2 size={28} />
                        </div>
                      )}
                      <div className="pf-podcast-card-overlay">
                        <button className="pf-podcast-card-play">
                          <Play size={16} fill="#fff" />
                        </button>
                      </div>
                    </div>
                    <div className="pf-podcast-card-body">
                      <h4 className="pf-podcast-card-title">{p.title}</h4>
                      <p className="pf-podcast-card-author">{p.author}</p>
                      {p.episodeCount != null && (
                        <p className="pf-podcast-card-eps">
                          {p.episodeCount} tập
                        </p>
                      )}
                    </div>
                    <button
                      className="pf-podcast-card-unsave"
                      title="Bỏ lưu"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnsavePodcast(p.id);
                      }}
                    >
                      <Bookmark size={14} fill="currentColor" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="pf-empty">
                <Mic2 size={28} />
                <p>Chưa lưu podcast nào</p>
                <Link to="/podcast" className="pf-link">
                  Khám phá podcast
                </Link>
              </div>
            )}
          </div>
        )}

        {tab !== "overview" &&
          tab !== "community" &&
          tab !== "songs" &&
          tab !== "playlists" &&
          tab !== "podcasts" && (
            <div className="pf-empty">
              <Music2 size={28} />
              <p>Chưa có nội dung nào</p>
            </div>
          )}
      </div>

      {/* CREATE POST MODAL */}
      <CreatePostModal
        open={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        user={user}
        name={name}
        defaultAv={defaultAv}
        onCreated={handlePostCreated}
      />

      <ShareMusicModal
        open={showShareMusic}
        onClose={() => setShowShareMusic(false)}
        onShared={handlePostCreated}
      />

      {/* EDIT POST MODAL */}
      <EditPostModal
        open={editPost !== null}
        post={editPost}
        onClose={() => setEditPost(null)}
        user={user}
        name={name}
        defaultAv={defaultAv}
        onUpdated={handlePostUpdated}
      />
    </div>
  );
}
