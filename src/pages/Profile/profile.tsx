import { SquarePen } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../../services/axios";
import "./profile.css";
import type { User } from "../../types/user";

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/users/me/profile/full");
        setUser(res.data.data);
      } catch (error) {
        console.error("Load profile failed", error);
      }
    };

    fetchProfile();
  }, []);

  if (!user) {
    return <div className="profile-container">Loading profile...</div>;
  }

  const defaultAvatar =
    "https://i.pinimg.com/736x/3f/94/70/3f9470b34a8e3f526dbdb022f9f19cf7.jpg";

  const defaultCover =
    "https://images.unsplash.com/photo-1511376777868-611b54f68947";

  return (
    <div className="profile-container">
      {/* COVER */}
      <div className="cover">
        <div className="cover-inner">
          <img src={user.backgroundImageUrl || defaultCover} alt="cover" />
        </div>

        {/* avatar */}
        <div className="avatar-wrapper">
          <img
            className="profile-avatar"
            src={user.profileImageUrl || defaultAvatar}
            alt="avatar"
          />
        </div>
      </div>

      {/* HEADER */}
      <div className="profile-header">
        <div className="profile-info">
          <div className="profile-name">
            <h1>
              {user.firstName} {user.lastName}
            </h1>
            <span className="verified">✔</span>
          </div>

          <p className="profile-bio">{user.bio || "Music Enthusiast"}</p>
        </div>

        <button className="btn-edit">
          <SquarePen size={16} />
          Edit Profile
        </button>
      </div>

      {/* TABS */}
      <div className="profile-tabs">
        <button className="active">Overview</button>
        <button>Songs</button>
        <button>Playlists</button>
        <button>Podcasts</button>
        <button>Community</button>
      </div>

      {/* GRID */}
      <div className="profile-grid">
        {/* LEFT */}
        <div className="left-column">
          <div className="card">
            <div className="card-header">
              <h3>Top Tracks</h3>
              <span className="view-all">View All</span>
            </div>

            <div className="track-row">
              <span className="track-index">01</span>

              <img
                className="track-cover"
                src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f"
              />

              <div className="track-info">
                <p className="track-title">Late Night Melodies</p>
                <span className="track-sub">
                  Lofi Vibes • Midnight Sessions
                </span>
              </div>

              <div className="track-actions">
                <span>❤ 12.4k</span>
              </div>
            </div>
          </div>

          {/* COMMUNITY */}
          <div className="card">
            <h3>Community Posts</h3>

            <div className="post">
              <div className="post-header">
                <img
                  src={user.profileImageUrl || defaultAvatar}
                  className="post-avatar"
                />

                <div>
                  <strong>
                    {user.firstName} {user.lastName}
                  </strong>
                  <span className="post-time">• 2 hours ago</span>
                </div>
              </div>

              <p className="post-text">
                Just discovered this new lofi artist! Perfect music for
                studying.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="right-column">
          <div className="card">
            <h3>Saved Podcasts</h3>

            <div className="podcast">
              <img src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4" />

              <div>
                <p className="podcast-title">Tech Talk Daily</p>
                <span className="podcast-ep">Ep.245: AI Revolution</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
