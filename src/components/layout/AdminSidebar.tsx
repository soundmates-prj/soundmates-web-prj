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
    ActivitySquare
} from 'lucide-react';
import logoLight from "../../assets/light_logo.png";
import logoDark from "../../assets/dark_logo.png";
import "./AdminSidebar.css";
import { showSuccess } from "../common/toastUtils";
import { useTheme } from "../../context/ThemeContext";

interface MenuItem {
    id: string;
    icon: React.ReactNode;
    label: string;
    path: string;
}

const sidebarMenuItems: MenuItem[] = [
    { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/admin/dashboard' },
    { id: 'users', icon: <Users size={20} />, label: 'Users', path: '/admin/users' },
    { id: 'music', icon: <Headphones size={20} />, label: 'Music Catalog', path: '/admin/music' },
    { id: 'stations', icon: <Music2 size={20} />, label: 'Stations', path: '/admin/stations' },
    { id: 'playlists', icon: <ListMusic size={20} />, label: 'Playlists', path: '/admin/playlists' },
    { id: 'sessions', icon: <Radio size={20} />, label: 'Live Sessions', path: '/admin/sessions' },
    { id: 'podcasts', icon: <Podcast size={20} />, label: 'Podcast', path: '/admin/podcasts' },
    { id: 'azuracast', icon: <ActivitySquare size={20} />, label: 'AzuraCast', path: '/admin/azuracast' },
    { id: 'analytics', icon: <BarChart3 size={20} />, label: 'Reports', path: '/admin/analytics' },
    { id: 'settings', icon: <Settings size={20} />, label: 'Settings', path: '/admin/settings' },
];

export default function AdminSidebar() {
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
        <aside className="admin-sidebar">
            <div className="admin-sidebar-logo" onClick={() => navigate('/admin/dashboard')}>
                <img src={theme === "dark" ? logoDark : logoLight} alt="SoundMates" />
                <span className="admin-logo-text">SoundMates</span>
            </div>

            <nav className="admin-sidebar-nav">
                {sidebarMenuItems.map((item) => (
                    <button
                        key={item.id}
                        className={`admin-nav-item ${isActive(item.path) ? "active" : ""}`}
                        onClick={() => navigate(item.path)}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>

            <button className="admin-logout-btn" onClick={handleLogout}>
                <LogOut size={20} />
                <span>Logout</span>
            </button>
        </aside>
    );
}
