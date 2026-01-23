import React from 'react';
import Icon from '../common/Icon';
import lighLogo from '../../assets/light_logo.png';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="home-footer">
      <div className="footer-container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo">
              <img src={lighLogo} alt="SoundMates" />
            </div>
            <p className="footer-description">
              Nền tảng chia sẻ âm nhạc và kết nối cộng đồng yêu nhạc hàng đầu Việt Nam
            </p>
            <div className="footer-social">
              <a href="#" className="footer-social-link">
                <Icon name="globe" size={18} />
              </a>
              <a href="#" className="footer-social-link">
                <Icon name="message" size={18} />
              </a>
              <a href="#" className="footer-social-link">
                <Icon name="mail" size={18} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="footer-section-title">Về chúng tôi</h4>
            <ul className="footer-links">
              <li><a href="#">Giới thiệu</a></li>
              <li><a href="#">Đội ngũ</a></li>
              <li><a href="#">Tuyển dụng</a></li>
              <li><a href="#">Liên hệ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-section-title">Liên hệ</h4>
            <ul className="footer-links">
              <li><a href="#">FAQ/Hỗ trợ</a></li>
              <li><a href="#">Đổi trả/Hoàn tiền</a></li>
              <li><a href="#">Hướng dẫn sử dụng</a></li>
              <li><a href="#">Affiliate / Quảng cáo</a></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-section-title">Tất cả</h4>
            <ul className="footer-links">
              <li><a href="#">Giới thiệu</a></li>
              <li><a href="#">Podcast</a></li>
              <li><a href="#">Playlist</a></li>
              <li><a href="#">Âm Nhạc</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copyright">
            © 2024 SoundMates. Bản quyền thuộc về SoundMates
          </p>
          <div className="footer-bottom-links">
            <a href="#">Điều khoản sử dụng</a>
            <a href="#">Chính sách bảo mật</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
