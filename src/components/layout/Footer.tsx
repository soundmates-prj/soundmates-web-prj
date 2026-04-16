import React from 'react';
import logoLight from '../../assets/light_logo.png';
import logoDark from '../../assets/dark_logo.png';
import { useTheme } from '../../context/ThemeContext';
import appStoreImg from '../../assets/AppStore.png';
import chPlayImg from '../../assets/CHPlay.png';
import { Facebook, Instagram, Twitter } from 'lucide-react';
import './Footer.css';

const Footer: React.FC = () => {
  const { mode } = useTheme();

  return (
    <footer className="home-footer">
      <div className="footer-container">
        <div className="footer-grid">

          {/* ── LEFT: Brand + Social ── */}
          <div className="footer-brand">
            <div className="footer-logo">
              <img
                src={mode === 'dark' ? logoDark : logoLight}
                alt="SoundMates"
                onError={(e) => {
                  e.currentTarget.src = logoLight;
                }}
              />
              <div className="footer-logo-info">
                <h3 className="footer-logo-text">SoundMates</h3>
                <p className="footer-tagline">Chia sẻ nhạc phát sóng mỗi ngày</p>
              </div>
            </div>

            <div className="footer-social">
              <a href="#" className="footer-social-link">
                <Facebook size={18} />
              </a>
              <a href="#" className="footer-social-link">
                <Instagram size={18} />
              </a>
              <a href="#" className="footer-social-link">
                <Twitter size={18} />
              </a>
            </div>
          </div>

          {/* ── CENTER: Link Groups ── */}
          <div className="footer-links-group">
            <div className="footer-links-col">
              <h4 className="footer-section-title">Về chúng tôi</h4>
              <ul className="footer-links">
                <li><a href="/">Trang chủ</a></li>
                <li><a href="#about-us">Giới thiệu</a></li>
                <li><a href="#">Chính sách</a></li>
              </ul>
            </div>

            <div className="footer-links-col">
              <h4 className="footer-section-title">Liên hệ</h4>
              <ul className="footer-links">
                <li><a href="#">FAQ</a></li>
                <li><a href="#">Gửi thư</a></li>
                <li><a href="#">Quảng cáo</a></li>
              </ul>
            </div>

            <div className="footer-links-col">
              <h4 className="footer-section-title">Khám phá</h4>
              <ul className="footer-links">
                <li><a href="/forum">Diễn đàn</a></li>
                <li><a href="/schedule-public">Lịch Phát Sóng</a></li>
                <li><a href="/podcast">Podcast</a></li>
              </ul>
            </div>
          </div>

          {/* ── RIGHT: App Download ── */}
          <div className="footer-app-section">
            <p className="footer-app-title">Tải ứng dụng SoundMates</p>
            <div className="apps">
              <a href="https://play.google.com/store/apps" target="_blank" rel="noopener noreferrer" className="app-store-link">
                <img src={chPlayImg} alt="Tải trên Google Play" />
              </a>
              <a href="https://www.apple.com/app-store/" target="_blank" rel="noopener noreferrer" className="app-store-link">
                <img src={appStoreImg} alt="Tải trên App Store" />
              </a>
            </div>
          </div>

        </div>

        <div className="footer-bottom">
          <p className="footer-copyright">
            All rights reserved@soundmates
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
