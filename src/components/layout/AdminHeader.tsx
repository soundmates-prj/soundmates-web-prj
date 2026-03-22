import { Search, Bell } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminHeader.css";

export default function AdminHeader() {
    const [userInfo, setUserInfo] = useState<any>(null);
    const [showNotifications, setShowNotifications] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const storedUserInfo = localStorage.getItem('userInfo');
        if (storedUserInfo) {
            try {
                setUserInfo(JSON.parse(storedUserInfo));
            } catch (error) {
                console.error('Failed to parse user info:', error);
            }
        }
    }, []);

    return (
        <header className="admin-header">
            <div className="admin-header-search">
                <Search size={18} />
                <input 
                    type="text" 
                    placeholder="Search users, posts, sessions..." 
                    className="admin-search-input"
                />
            </div>

            <div className="admin-header-actions">
                <button 
                    className="admin-header-btn"
                    onClick={() => setShowNotifications(!showNotifications)}
                >
                    <Bell size={20} />
                    <span className="admin-notification-badge">3</span>
                </button>

                <button 
                    className="admin-header-user"
                    onClick={() => navigate('/settings')}
                >
                    <div className="admin-user-avatar">
                        {userInfo?.firstName?.charAt(0) || userInfo?.username?.charAt(0) || 'A'}
                    </div>
                    <div className="admin-user-info">
                        <span className="admin-user-name">
                            {userInfo?.firstName && userInfo?.lastName 
                                ? `${userInfo.firstName} ${userInfo.lastName}` 
                                : userInfo?.username || 'Admin'}
                        </span>
                        <span className="admin-user-role">{userInfo?.roleName || 'Admin'}</span>
                    </div>
                </button>
            </div>
        </header>
    );
}
