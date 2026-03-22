import { useLocation, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    Radio,
    Calendar,
    Music,
    Mic,
    ListMusic,
    Antenna,
    Settings,
    LogOut,
    Podcast
} from 'lucide-react';
import logoLight from "../../assets/light_logo.png";
import logoDark from "../../assets/dark_logo.png";
import "./StaffSidebar.css";
import { showSuccess } from "../common/toastUtils";
import { useTheme } from "../../context/ThemeContext";

interface MenuItem {
    id: string;
    icon: React.ReactNode;
    label: string;
    path: string;
}

const sidebarMenuItems: MenuItem[] = [
    { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/staff/dashboard' },
    { id: 'sessions', icon: <Radio size={20} />, label: 'Live Sessions', path: '/staff/sessions' },
    { id: 'schedule', icon: <Calendar size={20} />, label: 'Schedule', path: '/staff/schedule' },
    { id: 'stations', icon: <Antenna size={20} />, label: 'Stations', path: '/staff/stations' },
    { id: 'playlists', icon: <ListMusic size={20} />, label: 'Playlists', path: '/staff/playlists' },
    { id: 'music-requests', icon: <Music size={20} />, label: 'Music Requests', path: '/staff/music-requests' },
    { id: 'podcast-requests', icon: <Mic size={20} />, label: 'Podcast Requests', path: '/staff/podcast-requests' },
    { id: 'podcast-creator', icon: <Podcast size={20} />, label: 'Podcast Creator', path: '/staff/podcast-creator' },
    { id: 'settings', icon: <Settings size={20} />, label: 'Settings', path: '/staff/settings' },
];

export default function StaffSidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { theme } = useTheme();

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
        <aside className="staff-sidebar">
            <div className="staff-sidebar-logo" onClick={() => navigate('/staff/dashboard')}>
                <img src={theme === "dark" ? logoDark : logoLight} alt="SoundMates" />
                <span className="staff-logo-text">SoundMates</span>
            </div>

            <nav className="staff-sidebar-nav">
                {sidebarMenuItems.map((item) => (
                    <button
                        key={item.id}
                        className={`staff-nav-item ${isActive(item.path) ? "active" : ""}`}
                        onClick={() => navigate(item.path)}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>

            <button className="staff-logout-btn" onClick={handleLogout}>
                <LogOut size={20} />
                <span>Logout</span>
            </button>
        </aside>
    );
}
