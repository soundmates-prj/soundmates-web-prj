import React from 'react';
import Icon from '../common/Icon';
import lighLogo from '../../assets/light_logo.png';
import appStoreImg from '../../assets/AppStore.png';
import chPlayImg from '../../assets/CHPlay.png';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="home-footer">
      <div className="footer-container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo">
              <img src={lighLogo} alt="SoundMates" />
              <div className="footer-logo-info">
                <h3 className="footer-logo-text">SoundMates</h3>
                <p className="footer-tagline">Đọc thú phát sóng mỗi ngày</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="footer-section-title">Về chúng tôi</h4>
            <ul className="footer-links">
              <li><a href="#">Trang chủ</a></li>
              <li><a href="#">Chính sách</a></li>
              <li><a href="#">Ứng dụng điện thoại</a></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-section-title">Liên hệ</h4>
            <ul className="footer-links">
              <li><a href="#">FAQ/ Hỗ trợ</a></li>
              <li><a href="#">Gửi thư podcast</a></li>
              <li><a href="#">Affiliates / Quảng cáo</a></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-section-title">Tất cả</h4>
            <ul className="footer-links">
              <li><a href="#">Diễn đàn</a></li>
              <li><a href="#">Playlist</a></li>
              <li><a href="#">Âm Nhạc</a></li>
            </ul>
          </div>

          <div className="footer-app-section">
            <div className="footer-social">
              <a href="#" className="footer-social-link">
                <Icon name="facebook" size={20} />
              </a>
              <a href="#" className="footer-social-link">
                <Icon name="instagram" size={20} />
              </a>
              <a href="#" className="footer-social-link">
                <Icon name="twitter" size={20} />
              </a>
            </div>
            <p className="footer-app-title">Tải ứng dụng SoundMates</p>
            <div className="footer-app-buttons">
              <a href="#" className="app-store-link">
                <img src={chPlayImg} alt="Get it on Google Play" />
              </a>
              <a href="#" className="app-store-link">
                <img src={appStoreImg} alt="Download on the App Store" />
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
