import React, { useEffect, useRef, useState } from 'react';
import { Icon, Avatar, Badge } from '../common';
import logoText from '../../assets/logo_text.png';
import logoNoText from '../../assets/logo_notext.png';
import './Header.css';
import { useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header className={`home-header ${isScrolled ? 'scrolled' : ''}`}>
            <div className="header-container">
                <div className="header-logo" onClick={() => navigate('/')}>
                    <img src={logoNoText} alt="SoundMates" />
                    <img src={logoText} alt="SoundMates" className='logo-text'/>
                </div>

                <nav className="header-nav">
                    <a href="#" className="nav-item active">
                        <Icon name="home" size={18} />
                        Trang Chủ
                    </a>
                    <a href="#" className="nav-item">
                        <Icon name="radio" size={18} />
                        Phòng Trực Tiếp
                    </a>
                    <a href="#" className="nav-item">
                        <Icon name="calendar" size={18} />
                        Lịch Phát Sóng
                    </a>
                    <a href="#" className="nav-item">
                        <Icon name="music" size={18} />
                        Nhạc của bạn
                    </a>
                    <a href="#" className="nav-item">
                        <Icon name="message" size={18} />
                        Diễn đàn
                        <span className="nav-item-badge">12</span>
                    </a>
                </nav>

                <div className="header-actions">
                    <div className="header-search">
                        <Icon name="search" size={18} color="#94a3b8" />
                        <input type="text" placeholder="Tìm kiếm..." />
                    </div>
                    <button className="header-icon-btn">
                        <Icon name="bell" size={20} />
                        <span className="notification-dot"></span>
                    </button>
                    <div className="header-avatar">
                        <img src="https://i.pravatar.cc/100?img=5" alt="Avatar" />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
