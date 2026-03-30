import { Search, Bell, Calendar, Shield, Mic2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./SharedLayout.css";

interface SharedHeaderProps {
    role: 'ADMIN' | 'STAFF' | 'HOST';
}

export default function SharedHeader({ role }: SharedHeaderProps) {
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

    const getRoleLabel = () => {
        switch (role) {
            case 'ADMIN':
                return 'Quản trị';
            case 'STAFF':
                return 'Nhân viên';
            case 'HOST':
                return 'MC';
            default:
                return role;
        }
    };

    const getRoleIcon = () => {
        switch (role) {
            case 'ADMIN':
                return <Shield size={12} />;
            case 'STAFF':
                return <Mic2 size={12} />;
            case 'HOST':
                return <Mic2 size={12} />;
            default:
                return null;
        }
    };

    return (
        <header className="shared-header">
            <div className="shared-header-left">
                <div className="shared-header-date">
                    <Calendar size={18} />
                    <span>{currentDate}</span>
                </div>
            </div>

            <div className="shared-header-search">
                <Search size={18} />
                <input
                    type="text"
                    placeholder={
                        role === 'ADMIN'
                            ? "Tìm kiếm người dùng, bài viết, phiên..."
                            : role === 'STAFF'
                                ? "Tìm kiếm phiên, yêu cầu, playlist..."
                                : "Tìm kiếm phiên, lịch trình, yêu cầu..."
                    }
                    className="shared-search-input"
                />
            </div>

            <div className="shared-header-actions">
                <button className="shared-header-btn">
                    <Bell size={20} />
                    <span className="shared-notification-badge">3</span>
                </button>

                <div className={`shared-role-badge ${role.toLowerCase()}`}>
                    {getRoleIcon()}
                    {getRoleLabel()}
                </div>

                <button
                    className="shared-header-user"
                    onClick={() => navigate('/settings')}
                >
                    <div className="shared-user-avatar">
                        {userInfo?.firstName?.charAt(0) || userInfo?.username?.charAt(0) || 'U'}
                    </div>
                    <div className="shared-user-info">
                        <span className="shared-user-name">
                            {userInfo?.firstName && userInfo?.lastName
                                ? `${userInfo.firstName} ${userInfo.lastName}`
                                : userInfo?.username || (role === 'ADMIN' ? 'Admin' : role === 'STAFF' ? 'Staff' : 'Host')}
                        </span>
                        <span className="shared-user-role">{getRoleLabel()}</span>
                    </div>
                </button>
            </div>
        </header>
    );
}
