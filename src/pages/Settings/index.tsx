import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  User,
  Settings2,
  Music,
  Mic2,
  FileText,
  Crown,
  LogOut,
} from "lucide-react";
import "./Settings.css";

import SystemSection from "./sections/SystemSection";
import MusicSection from "./sections/MusicSection";
import ProfileSection from "./sections/ProfileSection";

/* ─────────────────────────────────────────────
   Types & constants
───────────────────────────────────────────── */
export type SidebarSection =
  | "profile"
  | "system"
  | "music"
  | "voice"
  | "posts"
  | "premium";

export const SECTION_META: Record<
  SidebarSection,
  { title: string; sub: string }
> = {
  profile: {
    title: "Hồ sơ của bạn",
    sub: "Quản lý hồ sơ & cài đặt cá nhân của bạn",
  },
  system: { title: "Cài đặt hệ thống", sub: "Quản lý hệ thống của bạn" },
  music: {
    title: "Âm nhạc yêu thích",
    sub: "Thể hiện âm nhạc yêu thích của bạn",
  },
  voice: { title: "Quản lý giọng nói", sub: "Cấu hình giọng đọc AI của bạn" },
  posts: {
    title: "Quản lý bài viết",
    sub: "Xem và quản lý các bài đăng của bạn",
  },
  premium: {
    title: "Quản lý gói Premium",
    sub: "Nâng cấp và quản lý gói dịch vụ",
  },
};

const SIDEBAR_ITEMS: {
  key: SidebarSection;
  icon: React.ReactNode;
  label: string;
}[] = [
  { key: "profile", icon: <User size={17} />, label: "Hồ sơ người dùng" },
  { key: "system", icon: <Settings2 size={17} />, label: "Cài đặt hệ thống" },
  { key: "music", icon: <Music size={17} />, label: "Âm nhạc yêu thích" },
  { key: "voice", icon: <Mic2 size={17} />, label: "Quản lý giọng nói" },
  { key: "posts", icon: <FileText size={17} />, label: "Quản lý bài viết" },
  { key: "premium", icon: <Crown size={17} />, label: "Quản lý gói Premium" },
];

/* ─────────────────────────────────────────────
   Placeholder for unbuilt sections
───────────────────────────────────────────── */
const PlaceholderSection: React.FC<{ section: SidebarSection }> = ({
  section,
}) => {
  const item = SIDEBAR_ITEMS.find((i) => i.key === section);
  return (
    <div className="settings-card">
      <div className="settings-placeholder">
        <div className="placeholder-icon">{item?.icon}</div>
        <p>{SECTION_META[section].title}</p>
        <span>Tính năng đang được phát triển</span>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Settings shell
───────────────────────────────────────────── */
const Settings: React.FC = () => {
  const [active, setActive] = useState<SidebarSection>("profile");

  const renderSection = () => {
    switch (active) {
      case "profile":
        return <ProfileSection />;
      case "system":
        return <SystemSection />;
      case "music":
        return <MusicSection />;
      default:
        return <PlaceholderSection section={active} />;
    }
  };

  return (
    <div className="settings-page">
      {/* Breadcrumb */}
      <div className="settings-breadcrumb">
        <Link to="/">Trang chủ</Link>
        <span className="bc-sep">›</span>
        <span>Cài đặt hệ thống</span>
      </div>

      <div className="settings-layout">
        {/* ── Sidebar ── */}
        <aside className="settings-sidebar">
          <p className="sidebar-menu-label">Mục lục</p>

          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.key}
              className={`sidebar-item ${active === item.key ? "active" : ""}`}
              onClick={() => setActive(item.key)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}

          <button
            className="sidebar-logout"
            onClick={() => {
              localStorage.clear();
              window.location.href = "/login";
            }}
          >
            <LogOut size={16} />
            Đăng xuất tài khoản
          </button>
        </aside>

        {/* ── Main content ── */}
        <main className="settings-main">
          <div className="settings-main-header">
            <h1>{SECTION_META[active].title}</h1>
            <p>{SECTION_META[active].sub}</p>
          </div>
          {renderSection()}
        </main>
      </div>
    </div>
  );
};

export default Settings;
