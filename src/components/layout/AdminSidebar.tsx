import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
    LayoutDashboard,
    Sparkles,
    Users,
    Radio,
    FileText,
    Music,
    Star,
    BarChart3,
    Settings,
    ChevronRight,
    Headphones,
    LogOut
} from 'lucide-react';
import "./AdminSidebar.css";
import { showSuccess } from "../../components/common/toastUtils";

interface MenuItem {
    id: string;
    icon: React.ReactNode;
    label: string;
    path: string;
}

const sidebarMenuItems: MenuItem[] = [
    { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Tổng Quan', path: '/admin/dashboard' },
    { id: 'analytics', icon: <BarChart3 size={20} />, label: 'Thống Kê', path: '/admin/analytics' },
    { id: 'ai-content', icon: <Sparkles size={20} />, label: 'Nội Dung AI', path: '/admin/ai-content' },
    { id: 'users', icon: <Users size={20} />, label: 'Quản Lý Users', path: '/admin/users' },
    { id: 'broadcasts', icon: <Radio size={20} />, label: 'Phát Sóng Live', path: '/admin/broadcasts' },
    { id: 'content', icon: <FileText size={20} />, label: 'Bài Viết & Podcast', path: '/admin/posts' },
    { id: 'music', icon: <Music size={20} />, label: 'Kho Nhạc', path: '/admin/music' },
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
    const [userInfo, setUserInfo] = useState<any>(null);

    useEffect(() => {
        // Load user info from localStorage
        const storedUserInfo = localStorage.getItem('userInfo');
        if (storedUserInfo) {
            try {
                setUserInfo(JSON.parse(storedUserInfo));
            } catch (error) {
                console.error('Failed to parse user info:', error);
            }
        }
    }, []);

    const isActive = (path: string) => {
        return location.pathname === path;
    };

    const handleNavigation = (path: string) => {
        navigate(path);
    };

    const handleLogout = () => {
        // Clear localStorage
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userInfo');
        
        // Dispatch auth change event
        window.dispatchEvent(new Event('authChange'));
        
        // Show success message
        showSuccess('Đăng xuất thành công', 'Hẹn gặp lại bạn!');
        
        // Redirect to login
        navigate('/login');
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
                    <span>{userInfo?.firstName?.charAt(0) || userInfo?.username?.charAt(0) || 'A'}</span>
                </div>
                {!collapsed && (
                    <div className="user-info">
                        <span className="user-name">
                            {userInfo?.firstName && userInfo?.lastName 
                                ? `${userInfo.firstName} ${userInfo.lastName}` 
                                : userInfo?.username || 'Admin User'}
                        </span>
                        <span className="user-role">{userInfo?.roleName || 'Admin'}</span>
                    </div>
                )}
                <button 
                    className="logout-btn" 
                    onClick={handleLogout}
                    title="Đăng xuất"
                >
                    <LogOut size={18} />
                </button>
            </div>
        </aside>
    );
}
