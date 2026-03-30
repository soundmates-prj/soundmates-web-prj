import { useLocation, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    Headphones,
    Radio,
    BarChart3,
    Settings,
    LogOut,
    Music2,
    ListMusic,
    Podcast,
    Receipt,
    Calendar,
    Music,
    Mic,
    Antenna,
    MessageSquare,
    ShieldCheck,
    Flag,
    FileText as FileTextIcon,
    Settings2,
    Play,
} from 'lucide-react';
import logoLight from "../../assets/light_logo.png";
import logoDark from "../../assets/dark_logo.png";
import "./SharedLayout.css";
import { showSuccess } from "../common/toastUtils";
import { useTheme } from "../../context/ThemeContext";

interface MenuItem {
    id: string;
    icon: React.ReactNode;
    label: string;
    path: string;
}

interface SharedSidebarProps {
    role: 'ADMIN' | 'STAFF' | 'HOST';
}

const adminMenuItems: MenuItem[] = [
    { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Bảng điều khiển', path: '/admin/dashboard' },
    { id: 'users', icon: <Users size={20} />, label: 'Người dùng', path: '/admin/users' },
    { id: 'roles', icon: <ShieldCheck size={20} />, label: 'Vai trò & Quyền', path: '/admin/roles' },
    { id: 'moderation', icon: <Flag size={20} />, label: 'Kiểm duyệt hệ thống', path: '/admin/moderation' },
    { id: 'music', icon: <Headphones size={20} />, label: 'Kho nhạc', path: '/admin/music' },
    { id: 'stations', icon: <Music2 size={20} />, label: 'Đài phát', path: '/admin/stations' },
    { id: 'playlists', icon: <ListMusic size={20} />, label: 'Playlist', path: '/admin/playlists' },
    { id: 'sessions', icon: <Radio size={20} />, label: 'Phiên phát sóng', path: '/admin/sessions' },
    { id: 'podcasts', icon: <Podcast size={20} />, label: 'Podcast', path: '/admin/podcasts' },
    { id: 'posts', icon: <FileTextIcon size={20} />, label: 'Bài viết người dùng', path: '/admin/posts' },
    { id: 'transactions', icon: <Receipt size={20} />, label: 'Giao dịch', path: '/admin/transactions' },
    { id: 'analytics', icon: <BarChart3 size={20} />, label: 'Báo cáo', path: '/admin/analytics' },
    { id: 'system-config', icon: <Settings2 size={20} />, label: 'Cấu hình hệ thống', path: '/admin/system-config' },
    { id: 'settings', icon: <Settings size={20} />, label: 'Cài đặt', path: '/admin/settings' },
];

const staffMenuItems: MenuItem[] = [
    { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Bảng điều khiển', path: '/staff/dashboard' },
    { id: 'sessions', icon: <Radio size={20} />, label: 'Phiên phát sóng', path: '/staff/sessions' },
    { id: 'schedule', icon: <Calendar size={20} />, label: 'Lịch trình', path: '/staff/schedule' },
    { id: 'stations', icon: <Antenna size={20} />, label: 'Đài phát', path: '/staff/stations' },
    { id: 'playlists', icon: <ListMusic size={20} />, label: 'Playlist', path: '/staff/playlists' },
    { id: 'music-requests', icon: <Music size={20} />, label: 'Yêu cầu nhạc', path: '/staff/music-requests' },
    { id: 'podcast-requests', icon: <Mic size={20} />, label: 'Yêu cầu podcast', path: '/staff/podcast-requests' },
    { id: 'chat-moderation', icon: <MessageSquare size={20} />, label: 'Kiểm duyệt chat', path: '/staff/chat-moderation' },
    { id: 'analytics', icon: <BarChart3 size={20} />, label: 'Phân tích', path: '/staff/analytics' },
    { id: 'podcast-creator', icon: <Podcast size={20} />, label: 'Tạo AI Podcast', path: '/staff/podcast-creator' },
    { id: 'settings', icon: <Settings size={20} />, label: 'Cài đặt', path: '/staff/settings' },
];

const hostMenuItems: MenuItem[] = [
    { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Bảng điều khiển', path: '/host/dashboard' },
    { id: 'sessions', icon: <Radio size={20} />, label: 'Phiên phát sóng', path: '/host/sessions' },
    { id: 'live-control', icon: <Play size={20} />, label: 'Điều khiển Live', path: '/host/live' },
    { id: 'schedule', icon: <Calendar size={20} />, label: 'Lịch trình', path: '/host/schedule' },
    { id: 'admin-sessions', icon: <Radio size={20} />, label: 'Quản lý Phiên PS', path: '/host/admin-sessions' },
    { id: 'music-requests', icon: <Music size={20} />, label: 'Yêu cầu nhạc', path: '/host/music-requests' },
    { id: 'podcast-requests', icon: <Mic size={20} />, label: 'Yêu cầu podcast', path: '/host/podcast-requests' },
    { id: 'analytics', icon: <BarChart3 size={20} />, label: 'Phân tích', path: '/host/analytics' },
    { id: 'settings', icon: <Settings size={20} />, label: 'Cài đặt', path: '/host/settings' },
];

export default function SharedSidebar({ role }: SharedSidebarProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const { theme } = useTheme();

    const menuItems =
        role === 'ADMIN'
            ? adminMenuItems
            : role === 'STAFF'
                ? staffMenuItems
                : hostMenuItems;
    const dashboardPath =
        role === 'ADMIN'
            ? '/admin/dashboard'
            : role === 'STAFF'
                ? '/staff/dashboard'
                : '/host/dashboard';

    const isActive = (path: string) => {
        return location.pathname === path;
    };

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userInfo');
        window.dispatchEvent(new Event('authChange'));
        showSuccess('Đăng xuất thành công', 'Hẹn gặp lại bạn!');
        navigate('/login');
    };

    return (
        <aside className="shared-sidebar">
            <div className="shared-sidebar-logo" onClick={() => navigate(dashboardPath)}>
                <img src={theme === "dark" ? logoDark : logoLight} alt="SoundMates" />
                <span className="shared-logo-text">SoundMates</span>
            </div>

            <nav className="shared-sidebar-nav">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        className={`shared-nav-item ${isActive(item.path) ? "active" : ""}`}
                        onClick={() => navigate(item.path)}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>

            <button className="shared-logout-btn" onClick={handleLogout}>
                <LogOut size={20} />
                <span>Đăng xuất</span>
            </button>
        </aside>
    );
}
