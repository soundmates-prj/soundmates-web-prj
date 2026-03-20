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
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/axios";
import { Avatar } from "../../components/common";
import "./profile.css";
import type { User } from "../../types/user";
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

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    api
      .get("/users/me/profile/full")
      .then((r) => setUser(r.data.data))
      .catch((e) => console.error("Load profile failed", e));
  }, []);

  if (!user) return <div className="pf-loading">Đang tải...</div>;

  const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  const dob = formatDate(user.dateOfBirth);
  const defaultCover =
    "https://images.unsplash.com/photo-1511376777868-611b54f68947?w=1200&q=80";
  const defaultAv =
    "https://i.pinimg.com/736x/3f/94/70/3f9470b34a8e3f526dbdb022f9f19cf7.jpg";
  
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

              {/* Post */}
              <div className="pf-card">
                <div className="pf-card-top">
                  <h3>
                    <ChartBar size={18} /> Cộng đồng
                  </h3>
                </div>
                <div className="post">
                  <div className="post-top">
                    <Avatar
                      src={validProfileImage}
                      name={name}
                      size="sm"
                    />
                    <div>
                      <p className="post-name">{name}</p>
                      <p className="post-time">2 giờ trước</p>
                    </div>
                  </div>
                  <p className="post-body">
                    Vừa tìm ra nghệ sĩ lofi mới! "Late Night Melodies" nghe cực
                    chill 🎵
                  </p>
                  <div className="post-actions">
                    <button className="post-btn">
                      <Heart size={13} />
                      324
                    </button>
                    <button className="post-btn">
                      <MessageCircle size={13} />
                      18
                    </button>
                    <button className="post-btn">
                      <Share2 size={13} />
                      Chia sẻ
                    </button>
                  </div>
                </div>
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

        {tab !== "overview" && (
          <div className="pf-empty">
            <Music2 size={28} />
            <p>Chưa có nội dung nào</p>
          </div>
        )}
      </div>
    </div>
  );
}
