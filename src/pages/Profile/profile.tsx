import {
  Calendar1,
  SquarePen,
  Play,
  Heart,
  MessageCircle,
  Share2,
  Music2,
  MoreHorizontal,
  ChartBar,
  AudioLines,
  Plus,
} from "lucide-react";

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/axios";
import { Avatar } from "../../components/common";
import "./profile.css";
import "./profile-dark.css";
import type { User } from "../../types/user";
import type { Post } from "../../types/post";
import CreatePostModal from "./modals/CreatePostModal";
import { validateImageUrl } from "../../utils/stringUtils";

type Tab = "overview" | "songs" | "playlists" | "podcasts" | "community";

const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Tổng quan" },
  { key: "songs", label: "Bài hát" },
  { key: "playlists", label: "Playlist" },
  { key: "podcasts", label: "Podcast" },
  { key: "community", label: "Cộng đồng" },
];

const TRACKS = [
  {
    id: 1,
    n: "01",
    title: "Late Night Melodies",
    artist: "Lofi Vibes · Midnight Sessions",
    dur: "3:42",
    likes: "12.4k",
    cover:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=48&h=48&fit=crop",
  },
  {
    id: 2,
    n: "02",
    title: "Ocean Waves",
    artist: "Chill Beats · Summer Haze",
    dur: "4:15",
    likes: "8.9k",
    cover:
      "https://images.unsplash.com/photo-1501612780327-45045538702b?w=48&h=48&fit=crop",
  },
  {
    id: 3,
    n: "03",
    title: "Skyward Dreams",
    artist: "Ambient Collection · Vol.2",
    dur: "5:01",
    likes: "6.1k",
    cover:
      "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=48&h=48&fit=crop",
  },
];

const PODCASTS = [
  {
    id: 1,
    title: "Tech Talk Daily",
    ep: "Ep.245: AI Revolution",
    cover:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=48&h=48&fit=crop",
  },
  {
    id: 2,
    title: "Startup Stories",
    ep: "Building a Unicorn",
    cover:
      "https://images.unsplash.com/photo-1492724441997-5dc865305da7?w=48&h=48&fit=crop",
  },
];

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

  useEffect(() => {
    api
      .get("/users/me/profile/full")
      .then((r) => setUser(r.data.data))
      .catch((e) => console.error("Load profile failed", e));

    api
      .get("me/posts")
      .then((r) => setPosts(r.data?.data?.items ?? []))
      .catch((e) => console.error("Load posts failed", e));
  }, []);

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
  
  // Validate profile image URL
  const validProfileImage = validateImageUrl(user.profileImageUrl) || defaultAv;
  const validBackgroundImage = validateImageUrl(user.backgroundImageUrl) || defaultCover;

  return (
    <div className="pf">
      {/* COVER */}
      <div className="pf-cover">
        <img src={validBackgroundImage} alt="cover" />
      </div>

      {/* PROFILE BAR */}
      <div className="pf-bar">
        <div className="pf-bar-inner">
          {/* Avatar + info */}
          <div className="pf-left">
            <Avatar
              src={validProfileImage}
              name={name}
              size="xl"
              className="pf-av"
            />
            <div className="pf-info">
              <div className="pf-name-row">
                <h1 className="pf-name">{name}</h1>
                <span className="pf-check">✔</span>
              </div>
              <p className="pf-bio">{user.bio || "Music Enthusiast"}</p>
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
                  <h3>
                    <AudioLines size={18} /> Top Tracks
                  </h3>
                  <button className="pf-link">Xem tất cả</button>
                </div>
                {TRACKS.map((t) => (
                  <div key={t.id} className="track">
                    <span className="track-n">{t.n}</span>
                    <img className="track-img" src={t.cover} alt={t.title} />
                    <div className="track-info">
                      <p className="track-title">{t.title}</p>
                      <p className="track-artist">{t.artist}</p>
                    </div>
                    <span className="track-dur">{t.dur}</span>
                    <span className="track-likes">
                      <Heart size={12} />
                      {t.likes}
                    </span>
                    <button className="track-more">
                      <MoreHorizontal size={15} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Community Posts */}
              <div className="pf-card">
                <div className="pf-card-top">
                  <h3>
                    <ChartBar size={18} /> Cộng đồng
                  </h3>
                  {/* ── CREATE POST BUTTON ── */}
                  <button
                    className="pf-create-post-btn"
                    onClick={() => setShowCreatePost(true)}
                  >
                    <Plus size={13} />
                    Tạo bài đăng
                  </button>
                </div>

                {/* Quick compose bar */}
                <div
                  className="pf-compose-bar"
                  onClick={() => setShowCreatePost(true)}
                >
                  <Avatar
                    src={validProfileImage}
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
                      <div key={post.id} className="post-card">
                        {/* Header */}
                        <div className="post-header">
                          <Avatar
                            src={validProfileImage}
                            name={name}
                            size="sm"
                          />
                          <div className="post-meta">
                            <p className="post-name">{name}</p>
                            <p className="post-time">
                              {new Date(
                                post.publishedAt ?? post.createdAt,
                              ).toLocaleDateString("vi-VN", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                          {post.moodTag && (
                            <span className="post-mood">{post.moodTag}</span>
                          )}
                        </div>

                        {/* Body */}
                        <div className="post-body-wrap">
                          {post.title && (
                            <p className="post-title">{post.title}</p>
                          )}
                          <p className="post-body">{post.contentText}</p>
                        </div>

                        {/* Media */}
                        {post.imageUrl?.startsWith("http") && (
                          <div className="post-img-wrap">
                            <img src={post.imageUrl} alt="post" />
                          </div>
                        )}
                        {post.audioUrl?.startsWith("http") && (
                          <div className="post-audio-wrap">
                            <audio controls src={post.audioUrl} />
                          </div>
                        )}

                        {/* Actions */}
                        <div className="post-actions">
                          <button className="post-btn">
                            <Heart size={14} />
                            Thích
                          </button>
                          <button className="post-btn">
                            <MessageCircle size={14} />
                            Bình luận
                          </button>
                          <button className="post-btn">
                            <Share2 size={14} />
                            Chia sẻ
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right */}
            <div className="pf-col">
              <div className="pf-card">
                <div className="pf-card-top">
                  <h3>Podcast đã lưu</h3>
                </div>
                {PODCASTS.map((p) => (
                  <div key={p.id} className="pod">
                    <img className="pod-img" src={p.cover} alt={p.title} />
                    <div className="pod-info">
                      <p className="pod-title">{p.title}</p>
                      <p className="pod-ep">{p.ep}</p>
                    </div>
                    <button className="pod-play">
                      <Play size={12} fill="currentColor" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Community tab — full view */}
        {tab === "community" && (
          <div className="pf-community-full">
            <div className="pf-community-header">
              <h2 className="pf-community-title">Bài đăng của tôi</h2>
              <button
                className="pf-create-post-btn"
                onClick={() => setShowCreatePost(true)}
              >
                <Plus size={14} />
                Tạo bài đăng
              </button>
            </div>

            {/* Quick compose bar */}
            <div
              className="pf-compose-bar pf-compose-bar--full"
              onClick={() => setShowCreatePost(true)}
            >
              <Avatar
                src={validProfileImage}
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
                  <Plus size={14} /> Tạo bài đăng đầu tiên
                </button>
              </div>
            ) : (
              <div className="post-list">
                {posts.map((post) => (
                  <div key={post.id} className="post-card">
                    <div className="post-header">
                      <Avatar
                        src={validProfileImage}
                        name={name}
                        size="sm"
                      />
                      <div className="post-meta">
                        <p className="post-name">{name}</p>
                        <p className="post-time">
                          {new Date(
                            post.publishedAt ?? post.createdAt,
                          ).toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      {post.moodTag && (
                        <span className="post-mood">{post.moodTag}</span>
                      )}
                    </div>
                    <div className="post-body-wrap">
                      {post.title && <p className="post-title">{post.title}</p>}
                      <p className="post-body">{post.contentText}</p>
                    </div>
                    {post.imageUrl?.startsWith("http") && (
                      <div className="post-img-wrap">
                        <img src={post.imageUrl} alt="post" />
                      </div>
                    )}
                    {post.audioUrl?.startsWith("http") && (
                      <div className="post-audio-wrap">
                        <audio controls src={post.audioUrl} />
                      </div>
                    )}
                    <div className="post-actions">
                      <button className="post-btn">
                        <Heart size={14} /> Thích
                      </button>
                      <button className="post-btn">
                        <MessageCircle size={14} /> Bình luận
                      </button>
                      <button className="post-btn">
                        <Share2 size={14} /> Chia sẻ
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab !== "overview" && tab !== "community" && (
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
    </div>
  );
}
