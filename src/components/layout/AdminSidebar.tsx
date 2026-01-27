import { useLocation, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    Sparkles,
    Users,
    Radio,
    FileText,
    Music,
    Star,
    BarChart3,
    Bell,
    Settings,
    ChevronRight,
    Headphones
} from 'lucide-react';
import "./AdminSidebar.css";

interface MenuItem {
    id: string;
    icon: React.ReactNode;
    label: string;
    path: string;
}

const sidebarMenuItems: MenuItem[] = [
    { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/admin/dashboard' },
    { id: 'analytics', icon: <BarChart3 size={20} />, label: 'Analytics', path: '/admin/analytics' },
    { id: 'ai-content', icon: <Sparkles size={20} />, label: 'AI Content', path: '/admin/ai-content' },
    { id: 'users', icon: <Users size={20} />, label: 'Quản Lý Users', path: '/admin/users' },
    { id: 'broadcasts', icon: <Radio size={20} />, label: 'Live Broadcasts', path: '/admin/broadcasts' },
    { id: 'content', icon: <FileText size={20} />, label: 'Posts & Podcasts', path: '/admin/posts' },
    { id: 'music', icon: <Music size={20} />, label: 'Music Catalog', path: '/admin/music' },
    { id: 'mentors', icon: <Star size={20} />, label: 'Đánh Giá Mentors', path: '/admin/mentors' },
    { id: 'settings', icon: <Settings size={20} />, label: 'Cài Đặt Hệ Thống', path: '/admin/settings' },
];

interface AdminSidebarProps {
    collapsed?: boolean;
    onToggle?: () => void;
}

export default function AdminSidebar({ collapsed = false }: AdminSidebarProps) {
    const location = useLocation();
    const navigate = useNavigate();

    const isActive = (path: string) => {
        return location.pathname === path;
    };

    const handleNavigation = (path: string) => {
        navigate(path);
    };

    return (
        <aside className={`admin-sidebar ${collapsed ? "collapsed" : ""}`}>
            {/* Logo Section */}
            <div className="sidebar-logo">
                {!collapsed ? (
                    <div className="logo-text">
                        <h1 className="logo-title">
                            <span className="logo-listen">Listen </span>
                            <span className="logo-together">Together.</span>
                        </h1>
                        <span className="logo-subtitle">Admin Dashboard</span>
                    </div>
                ) : (
                    <div className="logo-icon">
                        <Headphones size={28} color="#fff" />
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                {sidebarMenuItems.map((item) => (
                    <button
                        key={item.id}
                        className={`sidebar-nav-item ${isActive(item.path) ? "active" : ""}`}
                        onClick={() => handleNavigation(item.path)}
                        title={collapsed ? item.label : undefined}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        {!collapsed && (
                            <>
                                <span className="nav-label">{item.label}</span>
                                {isActive(item.path) && (
                                    <ChevronRight size={16} className="nav-arrow" />
                                )}
                            </>
                        )}
                    </button>
                ))}
            </nav>

            {/* User Profile Section */}
            <div className="sidebar-user">
                <div className="user-avatar">
                    <span>A</span>
                </div>
                {!collapsed && (
                    <div className="user-info">
                        <span className="user-name">Admin User</span>
                        <span className="user-role">Super Admin</span>
                    </div>
                )}
            </div>
        </aside>
    );
}
