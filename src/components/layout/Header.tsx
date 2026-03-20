import React, { useEffect, useRef, useState } from "react";
import { Icon, Button } from "../common";
import logoLight from "../../assets/light_logo.png";
import logoDark from "../../assets/dark_logo.png";
import { useTheme } from "../../context/ThemeContext";
import "./Header.css";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  UserCircle2,
  Bell,
  Search,
  X,
  Clock,
  TrendingUp,
  ChevronDown,
  Radio,
  Mic2,
  Calendar,
  Zap,
} from "lucide-react";
import { usePlayer } from "../../context/PlayerContext";
import { showInfo } from "../common/toastUtils";
import { validateImageUrl } from "../../utils/stringUtils";
import api from "../../services/axios";

interface UserInfo {
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  avatarUrl?: string | null;
}

const SEARCH_CATEGORIES = [
  { key: "all", label: "Tất cả" },
  { key: "podcast", label: "Podcast" },
  { key: "music", label: "Nhạc" },
  { key: "artist", label: "Nghệ sĩ" },
  { key: "playlist", label: "Playlist" },
  { key: "live", label: "Live Stream" },
  { key: "forum", label: "Diễn đàn" },
];

const TRENDING_TOPICS = [
  "Sơn Tùng M-TP",
  "SpaceSpeakers",
  "Podcast Tâm Lý",
  "Rhymastic Live",
  "Hoàng Thùy Linh",
];

const Header: React.FC = () => {
  const { theme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState("all");
  const [showLiveDropdown, setShowLiveDropdown] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<string>(location.pathname);
  const isLiveRoute = location.pathname === "/livestream";
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const searchPanelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const liveDropdownRef = useRef<HTMLDivElement>(null);
  const player = usePlayer();

  const syncAuthState = () => {
    const token = localStorage.getItem("accessToken");
    setIsLoggedIn(!!token);
    if (token) {
      try {
        const stored = localStorage.getItem("userInfo");
        if (stored) {
          const parsedUserInfo = JSON.parse(stored);
          // Fetch fresh profile data to get profileImageUrl
          api.get("/users/me/profile/full")
            .then((res) => {
              const profileData = res.data.data;
              setUserInfo({
                ...parsedUserInfo,
                avatarUrl: validateImageUrl(profileData.profileImageUrl) || null
              });
            })
            .catch(() => {
              setUserInfo(parsedUserInfo);
            });
        } else {
          setUserInfo(null);
        }
      } catch {
        setUserInfo(null);
      }
    } else {
      setUserInfo(null);
    }
  };

  // Sync active tab with browser navigation
  useEffect(() => {
    setActiveTab(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    syncAuthState();
    window.addEventListener("authChange", syncAuthState);
    window.addEventListener("storage", syncAuthState);
    return () => {
      window.removeEventListener("authChange", syncAuthState);
      window.removeEventListener("storage", syncAuthState);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        searchPanelRef.current &&
        !searchPanelRef.current.contains(event.target as Node)
      ) {
        setShowSearch(false);
      }
      if (
        liveDropdownRef.current &&
        !liveDropdownRef.current.contains(event.target as Node)
      ) {
        setShowLiveDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-focus search input when panel opens
  useEffect(() => {
    if (showSearch) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [showSearch]);

  const handleLogout = () => {
    if (player.isPlaying) {
      player.toggle();
      showInfo("Nhạc đã dừng", "Bạn đã đăng xuất khỏi SoundMates");
    }
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userInfo");
    setIsLoggedIn(false);
    setUserInfo(null);
    setShowDropdown(false);
    window.dispatchEvent(new Event("authChange"));
    navigate("/");
  };

  const handleProfile = () => {
    if (player.isPlaying) {
      player.toggle();
      showInfo(
        "Nhạc đã dừng",
        "Chuyển sang trang cá nhân — bạn có thể phát lại bất cứ lúc nào",
      );
    }
    setShowDropdown(false);
    navigate("/profile");
  };

  return (
    <div className="header">
      <header className={`home-header ${isScrolled ? "scrolled" : ""}`}>
        <div className="header-container">
          {/* LEFT */}
          <div className="header-left" onClick={() => navigate("/")}>
            <img src={theme === 'dark' ? logoDark : logoLight} alt="SoundMates" />
            <span className="header-brand">SoundMates</span>
          </div>

          {/* CENTER */}
          <nav className="header-center">
            <Link
              className={`nav-item${activeTab === "/" ? " active" : ""}`}
              to="/"
              onClick={() => setActiveTab("/")}
            >
              Trang Chủ
            </Link>

            {/* Phiên Trực Tiếp — with dropdown */}
            <div className="nav-item-dropdown-wrap" ref={liveDropdownRef}>
              <button
                className={`nav-item nav-item-btn${isLiveRoute ? " active" : ""}`}
                onClick={() => {
                  setShowLiveDropdown((prev) => !prev);
                }}
              >
                Phiên Trực Tiếp
                <ChevronDown
                  size={14}
                  className={`nav-chevron ${showLiveDropdown ? "open" : ""}`}
                />
              </button>

              {showLiveDropdown && (
                <div className="nav-live-dropdown">
                  <div className="nav-live-dropdown-header">Khám phá Live</div>
                  <a
                    className="nav-live-item"
                    href="/livestream"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowLiveDropdown(false);
                      navigate("/livestream");
                    }}
                  >
                    <span className="nav-live-icon">
                      <Radio size={16} />
                    </span>
                    <div>
                      <p>Live Stream âm nhạc</p>
                      <span>Nghe nhạc trực tiếp từ nghệ sĩ</span>
                    </div>
                  </a>
                  <a className="nav-live-item" href="#">
                    <span className="nav-live-icon">
                      <Mic2 size={16} />
                    </span>
                    <div>
                      <p>Podcast Live</p>
                      <span>Chương trình phát thanh trực tiếp</span>
                    </div>
                  </a>
                  <a className="nav-live-item" href="#">
                    <span className="nav-live-icon">
                      <Zap size={16} />
                    </span>
                    <div>
                      <p>Sự kiện nổi bật</p>
                      <span>Concert, showcase đang diễn ra</span>
                    </div>
                  </a>
                  <a className="nav-live-item" href="#">
                    <span className="nav-live-icon">
                      <Calendar size={16} />
                    </span>
                    <div>
                      <p>Lịch phát sóng</p>
                      <span>Xem lịch live sắp tới</span>
                    </div>
                  </a>
                </div>
              )}
            </div>

            <a
              className={`nav-item${activeTab === "podcast" ? " active" : ""}`}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab("podcast");
              }}
            >
              Podcast
            </a>
            <a
              className={`nav-item${activeTab === "forum" ? " active" : ""}`}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab("forum");
              }}
            >
              Diễn Đàn
            </a>
            <Link
              className={`nav-item${activeTab === "/subscription" ? " active" : ""}`}
              to="/subscription"
              onClick={() => setActiveTab("/subscription")}
            >
              Gói Dịch Vụ
            </Link>
          </nav>

          {/* RIGHT */}
          <div className="header-right">
            {/* Search trigger */}
            <div className="search-trigger" ref={searchPanelRef}>
              <div
                className={`header-search ${showSearch ? "active" : ""}`}
                onClick={() => {
                  setShowSearch(true);
                  setShowNotifications(false);
                  setShowDropdown(false);
                  setShowLiveDropdown(false);
                }}
              >
                <Search size={16} color="#9CA3AF" />
                <input
                  ref={searchInputRef}
                  placeholder="Tìm kiếm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSearch(true)}
                />
                {searchQuery && (
                  <button
                    className="search-clear"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchQuery("");
                    }}
                  >
                    <X size={14} color="#9CA3AF" />
                  </button>
                )}
              </div>

              {showSearch && (
                <div className="search-panel">
                  {/* Category chips */}
                  <div className="search-categories">
                    {SEARCH_CATEGORIES.map((cat) => (
                      <button
                        key={cat.key}
                        className={`search-cat-chip ${searchCategory === cat.key ? "active" : ""}`}
                        onClick={() => setSearchCategory(cat.key)}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  <div className="search-divider" />

                  {/* Trending */}
                  <div className="search-section">
                    <div className="search-section-title">
                      <TrendingUp size={14} />
                      <span>Xu hướng</span>
                    </div>
                    <div className="search-suggestions">
                      {TRENDING_TOPICS.map((topic) => (
                        <button key={topic} className="search-suggestion-item">
                          <Search size={13} color="#9CA3AF" />
                          <span>{topic}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="search-divider" />

                  {/* Recent searches */}
                  <div className="search-section">
                    <div className="search-section-title">
                      <Clock size={14} />
                      <span>Gần đây</span>
                    </div>
                    <p className="search-empty">Chưa có lịch sử tìm kiếm</p>
                  </div>
                </div>
              )}
            </div>

            {isLoggedIn ? (
              <>
                {/* Notification */}
                <div className="notification-container" ref={notificationRef}>
                  <button
                    className="icon-btn notif-btn"
                    onClick={() => {
                      setShowNotifications((prev) => !prev);
                      setShowSearch(false);
                      setShowDropdown(false);
                      setShowLiveDropdown(false);
                    }}
                  >
                    <Bell size={20} color="#55C5F1" strokeWidth={1.8} />
                    <span className="notif-badge">3</span>
                  </button>

                  {showNotifications && (
                    <div className="notification-dropdown">
                      <div className="notification-header">
                        <h3>Thông báo</h3>
                        <button className="notif-mark-read">
                          Đánh dấu đã đọc
                        </button>
                      </div>
                      <div className="notification-list">
                        <div className="notif-item unread">
                          <div className="notif-dot" />
                          <div className="notif-content">
                            <p className="notif-text">
                              Bạn đã đăng ký tài khoản thành công!
                            </p>
                            <span className="notif-time">Vừa xong</span>
                          </div>
                        </div>
                        <div className="notif-item unread">
                          <div className="notif-dot" />
                          <div className="notif-content">
                            <p className="notif-text">
                              Có phiên Live mới từ{" "}
                              <strong>SpaceSpeakers</strong>
                            </p>
                            <span className="notif-time">5 phút trước</span>
                          </div>
                        </div>
                        <div className="notif-item unread">
                          <div className="notif-dot" />
                          <div className="notif-content">
                            <p className="notif-text">
                              Podcast mới:{" "}
                              <strong>"Tâm lý học ứng dụng"</strong> đã phát
                              hành
                            </p>
                            <span className="notif-time">1 giờ trước</span>
                          </div>
                        </div>
                      </div>
                      <div className="notification-footer">
                        <button>Xem tất cả thông báo</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Avatar */}
                <div className="avatar-container" ref={dropdownRef}>
                  <div
                    className="avatar"
                    onClick={() => {
                      setShowDropdown((prev) => !prev);
                      setShowNotifications(false);
                      setShowSearch(false);
                      setShowLiveDropdown(false);
                    }}
                  >
                    {validateImageUrl(userInfo?.avatarUrl) ? (
                      <img src={validateImageUrl(userInfo?.avatarUrl)!} alt="User avatar" />
                    ) : (
                      <div className="avatar-default">
                        <UserCircle2
                          size={44}
                          color="#55C5F1"
                          strokeWidth={1.5}
                        />
                      </div>
                    )}
                  </div>

                  {showDropdown && (
                    <div className="avatar-dropdown">
                      <div className="avatar-dropdown-user">
                        <div className="avatar-dropdown-avatar">
                          {validateImageUrl(userInfo?.avatarUrl) ? (
                            <img src={validateImageUrl(userInfo?.avatarUrl)!} alt="avatar" />
                          ) : (
                            <UserCircle2
                              size={32}
                              color="#55C5F1"
                              strokeWidth={1.5}
                            />
                          )}
                        </div>
                        <div>
                          <p className="avatar-dropdown-name">
                            {userInfo?.firstName && userInfo?.lastName
                              ? `${userInfo.firstName} ${userInfo.lastName}`
                              : userInfo?.username || "Người dùng"}
                          </p>
                          <p className="avatar-dropdown-email">
                            {userInfo?.email || ""}
                          </p>
                        </div>
                      </div>

                      <div className="avatar-dropdown-divider" />

                      <button className="dropdown-item" onClick={handleProfile}>
                        <Icon name="user" size={18} />
                        <span>Trang cá nhân</span>
                      </button>
                      <button
                        className="dropdown-item"
                        onClick={() => {
                          setShowDropdown(false);
                          navigate("/settings");
                        }}
                      >
                        <Icon name="settings" size={18} />
                        <span>Cài đặt</span>
                      </button>

                      <div className="avatar-dropdown-divider" />

                      <button
                        className="dropdown-item logout"
                        onClick={handleLogout}
                      >
                        <Icon name="logout" size={18} />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Button className="login-btn" onClick={() => navigate("/login")}>
                Đăng nhập
              </Button>
            )}
          </div>
        </div>
      </header>
    </div>
  );
};

export default Header;
