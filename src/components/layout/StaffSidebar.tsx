import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
    LayoutDashboard,
    Radio,
    ListMusic,
    Podcast,
    Headphones,
    ChevronRight,
    LogOut,
    Disc3,
} from "lucide-react";
import "./StaffSidebar.css";
import { showSuccess } from "../../components/common/toastUtils";

interface MenuItem {
    id: string;
    icon: React.ReactNode;
    label: string;
    path: string;
}

const sidebarMenuItems: MenuItem[] = [
    { id: "dashboard", icon: <LayoutDashboard size={20} />, label: "Tổng Quan", path: "/staff/dashboard" },
    { id: "stations", icon: <Radio size={20} />, label: "Stations", path: "/staff/stations" },
    { id: "playlists", icon: <ListMusic size={20} />, label: "Playlists", path: "/staff/playlists" },
    { id: "sessions", icon: <Disc3 size={20} />, label: "Live Sessions", path: "/staff/sessions" },
    { id: "podcasts", icon: <Podcast size={20} />, label: "Podcasts", path: "/staff/podcasts" },
];

export default function StaffSidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const [userInfo, setUserInfo] = useState<any>(null);

    useEffect(() => {
        const storedUserInfo = localStorage.getItem("userInfo");
        if (storedUserInfo) {
            try {
                setUserInfo(JSON.parse(storedUserInfo));
            } catch (error) {
                console.error("Failed to parse user info:", error);
            }
        }
    }, []);

    const isActive = (path: string) => location.pathname.startsWith(path);

    const handleNavigation = (path: string) => navigate(path);

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userInfo");
        window.dispatchEvent(new Event("authChange"));
        showSuccess("Đăng xuất thành công", "Hẹn gặp lại bạn!");
        navigate("/login");
    };

    return (
        <aside className="staff-sidebar">
            {/* Logo */}
            <div className="staff-sidebar-logo">
                <div className="staff-logo-icon">
                    <Headphones size={24} color="#fff" />
                </div>
                <div className="staff-logo-text">
                    <h1 className="staff-logo-title">
                        <span className="staff-logo-listen">Sound</span>
                        <span className="staff-logo-mates">Mates</span>
                    </h1>
                    <span className="staff-logo-subtitle">Staff Panel</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="staff-sidebar-nav">
                <span className="staff-nav-section-label">Quản lý</span>
                {sidebarMenuItems.map((item) => (
                    <button
                        key={item.id}
                        className={`staff-nav-item ${isActive(item.path) ? "active" : ""}`}
                        onClick={() => handleNavigation(item.path)}
                    >
                        <span className="staff-nav-icon">{item.icon}</span>
                        <span className="staff-nav-label">{item.label}</span>
                        {isActive(item.path) && (
                            <ChevronRight size={16} className="staff-nav-arrow" />
                        )}
                    </button>
                ))}
            </nav>

            {/* User */}
            <div className="staff-sidebar-user">
                <div className="staff-user-avatar">
                    <span>
                        {userInfo?.firstName?.charAt(0) ||
                            userInfo?.username?.charAt(0) ||
                            "S"}
                    </span>
                </div>
                <div className="staff-user-info">
                    <span className="staff-user-name">
                        {userInfo?.firstName && userInfo?.lastName
                            ? `${userInfo.firstName} ${userInfo.lastName}`
                            : userInfo?.username || "Staff User"}
                    </span>
                    <span className="staff-user-role">
                        {userInfo?.roleName || "Staff"}
                    </span>
                </div>
                <button
                    className="staff-logout-btn"
                    onClick={handleLogout}
                    title="Đăng xuất"
                >
                    <LogOut size={18} />
                </button>
            </div>
        </aside>
    );
}
