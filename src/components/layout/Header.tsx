import React, { useEffect, useState } from 'react';
import { Icon, Button } from "../common";
import logoNoText from "../../assets/light_logo.png";
import "./Header.css";
import { useNavigate } from "react-router-dom";

const Header: React.FC = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const navigate = useNavigate();
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const notificationRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        // Kiểm tra xem user đã đăng nhập chưa (thông qua localStorage hoặc token)
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        setIsLoggedIn(!!token);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        setIsLoggedIn(false);
        setShowDropdown(false);
        navigate('/');
    };

    const handleProfile = () => {
        setShowDropdown(false);
        navigate('/profile');
    };

    return (
        <div className='header' >
            <header className={`home-header ${isScrolled ? "scrolled" : ""}`}>
                <div className="header-container">

                    {/* LEFT */}
                    <div className="header-left" onClick={() => navigate("/")}>
                        <img src={logoNoText} alt="SoundMates" />
                        <span className="header-brand">SoundMates</span>
                    </div>

                    {/* CENTER */}
                    <nav className="header-center">
                        <a className="nav-item active" href="#home">
                            <Icon name="home" size={18} />
                            Trang Chủ
                        </a>

                        <a className="nav-item" href="#">
                            <Icon name="radio" size={18} />
                            Phiên Live Trực Tiếp
                        </a>

                        <a className="nav-item" href="#">
                            <Icon name="calendar" size={18} />
                            Lịch Phát Sóng
                        </a>

                        <a className="nav-item" href="#">
                            <Icon name="music" size={18} />
                            Nhạc của tôi
                        </a>

                        <a className="nav-item" href="#">
                            <Icon name="message" size={18} />
                            Diễn đàn
                            <span className="nav-badge">12</span>
                        </a>
                    </nav>

                    {/* RIGHT */}
                    <div className="header-right">

                        <div className="header-search">
                            <input placeholder="Podcast mới nhất..." />
                        </div>

                        <button className="search-btn">
                            <Icon name="search" size={24} color='#004395' />
                        </button>

                        {isLoggedIn ? (
                            <>
                                <div className="notification-container" ref={notificationRef}>
                                    <Button className="icon-btn" onClick={() => setShowNotifications(!showNotifications)}>
                                        <Icon name="bell" size={24} color='#004395' />
                                        <span className="dot" />
                                    </Button>

                                    {showNotifications && (
                                        <div className="notification-dropdown">
                                            <div className="notification-header">
                                                <h3>Thông báo SoundMates</h3>
                                                <Icon name="bell" size={20} color='#55C5F1' />
                                            </div>
                                            <div className="notification-body">
                                                <p>Bạn đã đăng ký tài khoản thành công!</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="avatar-container" ref={dropdownRef}>
                                    <div className="avatar" onClick={() => setShowDropdown(!showDropdown)}>
                                        <img src="https://i.pravatar.cc/100?img=5" alt="User avatar" />
                                    </div>
                                    
                                    {showDropdown && (
                                        <div className="avatar-dropdown">
                                            <button className="dropdown-item" onClick={handleProfile}>
                                                <Icon name="user" size={18} />
                                                <span>Thông tin</span>
                                            </button>
                                            <button className="dropdown-item" onClick={handleLogout}>
                                                <Icon name="logout" size={18} />
                                                <span>Đăng xuất</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <Button className="login-btn"
                                onClick={() => navigate("/login")}>
                                Đăng nhập
                            </Button>
                        )}

                    </div>

                </div>
            </header>
        </div>
    );
};

export default Header;