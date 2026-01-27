import React, { useEffect, useState } from 'react';
import { Icon } from "../common";
import logoNoText from "../../assets/light_logo.png";
import "./Header.css";
import { useNavigate } from "react-router-dom";

const Header: React.FC = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const onScroll = () => setIsScrolled(window.scrollY > 10);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
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
                        <Icon name="search" size={20} color='#004395' />
                        <input placeholder="Podcast mới nhất..." />
                    </div>

                    <button className="icon-btn">
                        <Icon name="bell" size={20} color='#004395' />
                        <span className="dot" />
                    </button>

                    <div className="avatar">
                        <img onClick={() => navigate("/login")} src="https://i.pravatar.cc/100?img=5" />
                    </div>

                </div>

            </div>
        </header>
    );
};

export default Header;