import React, { useEffect, useRef, useState } from "react";
import { Icon, Button } from "../common";
import logoLight from "../../assets/light_logo.png";
import logoDark from "../../assets/dark_logo.png";
import { useTheme } from "../../context/ThemeContext";
import "./Header.css";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  UserCircle2,
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
import NotificationButton from "./NotificationButton";
import SearchBar from "./SearchBar";
import ThemeToggle from "./ThemeToggle";

interface UserInfo {
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  avatarUrl?: string | null;
}

const Header: React.FC = () => {
  const { theme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showLiveDropdown, setShowLiveDropdown] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<string>(location.pathname);
  const isLiveRoute =
    location.pathname === "/live" || location.pathname === "/livestream";
  const dropdownRef = useRef<HTMLDivElement>(null);
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
          api
            .get("/users/me/profile/full")
            .then((res) => {
              const profileData = res.data.data;
              setUserInfo({
                firstName: profileData.firstName,
                lastName: profileData.lastName,
                username: profileData.username,
                email: profileData.email,
                avatarUrl:
                  validateImageUrl(profileData.profileImageUrl) || null,
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
        liveDropdownRef.current &&
        !liveDropdownRef.current.contains(event.target as Node)
      ) {
        setShowLiveDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      showInfo("Nhạc đã dừng", "Chuyển sang trang cá nhân");
    }
    setShowDropdown(false);
    navigate("/profile");
  };

  return (
    <div className="header">
      <header className={`home-header ${isScrolled ? "scrolled" : ""}`}>
        <div className="header-container">
          <div className="header-left" onClick={() => navigate("/")}>
            <img
              src={theme === "dark" ? logoDark : logoLight}
              alt="SoundMates"
            />
            <span className="header-brand">SoundMates</span>
          </div>

          <nav className="header-center">
            <Link
              className={`nav-item${activeTab === "/" ? " active" : ""}`}
              to="/"
              onClick={() => setActiveTab("/")}
            >
              Trang Chủ
            </Link>

            <div className="nav-item-dropdown-wrap" ref={liveDropdownRef}>
              <button
                className={`nav-item nav-item-btn${isLiveRoute ? " active" : ""}`}
                onClick={() => setShowLiveDropdown((prev) => !prev)}
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
                    href="/live"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowLiveDropdown(false);
                      navigate("/live");
                    }}
                  >
                    <span className="nav-live-icon">
                      <Radio size={16} />
                    </span>
                    <div>
                      <p>Live Sessions</p>
                      <span>Xem tất cả phiên đang phát</span>
                    </div>
                  </a>
                  <a
                    className="nav-live-item"
                    href="/schedule-public"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowLiveDropdown(false);
                      navigate("/schedule-public");
                    }}
                  >
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

            <Link
              className={`nav-item${activeTab === "/podcast" ? " active" : ""}`}
              to="/podcast"
              onClick={() => setActiveTab("/podcast")}
            >
              Podcast
            </Link>
            <Link
              className={`nav-item${activeTab === "/forum" ? " active" : ""}`}
              to="/forum"
              onClick={() => setActiveTab("/forum")}
            >
              Diễn Đàn
            </Link>
            <Link
              className={`nav-item${activeTab === "/subscription" ? " active" : ""}`}
              to="/subscription"
              onClick={() => setActiveTab("/subscription")}
            >
              Gói Dịch Vụ
            </Link>
          </nav>

          <div className="header-right">
            <button className="icon-btn" onClick={() => setShowSearch(true)}>
              <Icon name="search" size={18} />
            </button>

            <ThemeToggle />

            {isLoggedIn ? (
              <>
                <NotificationButton />

                <div className="avatar-container" ref={dropdownRef}>
                  <div
                    className="avatar"
                    onClick={() => setShowDropdown((prev) => !prev)}
                  >
                    {validateImageUrl(userInfo?.avatarUrl) ? (
                      <img
                        src={validateImageUrl(userInfo?.avatarUrl)!}
                        alt="User avatar"
                      />
                    ) : (
                      <div className="avatar-default">
                        <UserCircle2
                          size={40}
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
                            <img
                              src={validateImageUrl(userInfo?.avatarUrl)!}
                              alt="avatar"
                            />
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
                          navigate("/profile/transactions");
                        }}
                      >
                        <Icon name="clock" size={18} />
                        <span>Lịch sử giao dịch</span>
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

      <SearchBar isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </div>
  );
};

export default Header;
