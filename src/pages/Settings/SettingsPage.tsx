import { useState } from "react";
import { User, Palette, Shield, Crown, FileText, Music, LogOut } from "lucide-react";
import ProfileSettings from "./sections/ProfileSettings";
import AppearanceSettings from "./sections/AppearanceSettings";
import SecuritySettings from "./sections/SecuritySettings";
import SubscriptionSettings from "./sections/SubscriptionSettings";
import MyPostsSettings from "./sections/MyPostsSettings";
import MusicSection from "./sections/MusicSection";
import "./SettingsPage.css";

type SettingsTab = "profile" | "appearance" | "security" | "subscription" | "posts" | "music";

const TABS = [
  { key: "profile" as const, label: "Hồ sơ", icon: User },
  { key: "appearance" as const, label: "Giao diện", icon: Palette },
  { key: "security" as const, label: "Bảo mật", icon: Shield },
  { key: "subscription" as const, label: "Gói dịch vụ", icon: Crown },
  { key: "posts" as const, label: "Bài viết", icon: FileText },
  { key: "music" as const, label: "Nhạc yêu thích", icon: Music },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return <ProfileSettings />;
      case "appearance":
        return <AppearanceSettings />;
      case "security":
        return <SecuritySettings />;
      case "subscription":
        return <SubscriptionSettings />;
      case "posts":
        return <MyPostsSettings />;
      case "music":
        return <MusicSection />;
      default:
        return null;
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-wrapper">
        {/* Sidebar */}
        <aside className="settings-nav">
          <div className="settings-nav-header">
            <h2>Cài đặt</h2>
          </div>

          <nav className="settings-nav-list">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`settings-nav-item ${activeTab === tab.key ? "active" : ""}`}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="settings-nav-footer">
            <button className="settings-logout-btn" onClick={handleLogout}>
              <LogOut size={18} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </aside>

        {/* Content */}
        <main className="settings-content">{renderContent()}</main>
      </div>
    </div>
  );
}
