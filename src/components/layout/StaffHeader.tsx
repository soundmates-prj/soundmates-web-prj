import { Search, Bell, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./StaffHeader.css";

export default function StaffHeader() {
    const [userInfo, setUserInfo] = useState<any>(null);
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

    const currentDate = new Date().toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <header className="staff-header">
            <div className="staff-header-left">
                <div className="staff-header-date">
                    <Calendar size={18} />
                    <span>{currentDate}</span>
                </div>
            </div>

            <div className="staff-header-search">
                <Search size={18} />
                <input 
                    type="text" 
                    placeholder="Search sessions, requests, playlists..." 
                    className="staff-search-input"
                />
            </div>

            <div className="staff-header-actions">
                <button className="staff-header-btn">
                    <Bell size={20} />
                    <span className="staff-notification-badge">5</span>
                </button>

                <button 
                    className="staff-header-user"
                    onClick={() => navigate('/settings')}
                >
                    <div className="staff-user-avatar">
                        {userInfo?.firstName?.charAt(0) || userInfo?.username?.charAt(0) || 'S'}
                    </div>
                    <div className="staff-user-info">
                        <span className="staff-user-name">
                            {userInfo?.firstName && userInfo?.lastName 
                                ? `${userInfo.firstName} ${userInfo.lastName}` 
                                : userInfo?.username || 'Staff'}
                        </span>
                        <span className="staff-user-role">{userInfo?.roleName || 'Staff'}</span>
                    </div>
                </button>
            </div>
        </header>
    );
}
