import React from 'react';
import { ShieldCheck, Lock, Eye, FileText, Database, UserCheck } from 'lucide-react';
import './InfoPages.css';

const PrivacyPage: React.FC = () => {
  return (
    <div className="info-page privacy-page">
      <div className="info-hero">
        <div className="hero-content">
          <ShieldCheck className="hero-icon animated-pulse" />
          <h1>Chính sách bảo mật</h1>
          <p className="hero-subtitle">
            Quyền riêng tư của bạn là ưu tiên hàng đầu của chúng tôi.
          </p>
        </div>
      </div>

      <div className="info-container">
        <div className="glass-card">
          <section className="privacy-section">
            <div className="privacy-header">
              <Database className="privacy-icon" />
              <h2>1. Thu thập thông tin</h2>
            </div>
            <p>
              Chúng tôi thu thập các thông tin cần thiết để cung cấp dịch vụ tốt nhất cho bạn, bao gồm:
            </p>
            <ul>
              <li><strong>Thông tin tài khoản:</strong> Tên, email, ảnh đại diện khi bạn đăng ký qua hệ thống hoặc mạng xã hội.</li>
              <li><strong>Thông tin sử dụng:</strong> Lịch sử nghe nhạc, danh sách yêu thích, các podcast bạn đã tạo và tương tác trên diễn đàn.</li>
              <li><strong>Dữ liệu giọng nói:</strong> Chỉ được thu thập khi bạn sử dụng tính năng Voice Clone. Dữ liệu này được mã hóa và bảo mật tuyệt đối.</li>
            </ul>
          </section>

          <section className="privacy-section">
            <div className="privacy-header">
              <Eye className="privacy-icon" />
              <h2>2. Sử dụng thông tin</h2>
            </div>
            <p>Thông tin của bạn được sử dụng một cách minh bạch nhằm:</p>
            <ul>
              <li>Cá nhân hóa trải nghiệm âm nhạc và gợi ý nội dung dựa trên sở thích cá nhân.</li>
              <li>Xử lý và quản lý các giao dịch đăng ký gói Premium một cách an toàn.</li>
              <li>Cải thiện chất lượng thuật toán AI và phát triển các tính năng mới theo nhu cầu người dùng.</li>
              <li>Hỗ trợ khách hàng và giải quyết các vấn đề kỹ thuật phát sinh.</li>
            </ul>
          </section>

          <section className="privacy-section">
            <div className="privacy-header">
              <Lock className="privacy-icon" />
              <h2>3. Bảo mật dữ liệu</h2>
            </div>
            <p>
              SoundMates cam kết bảo vệ dữ liệu của bạn bằng các tiêu chuẩn bảo mật cao nhất:
            </p>
            <ul>
              <li>Sử dụng giao thức mã hóa SSL/TLS cho mọi truyền tải dữ liệu.</li>
              <li>Lưu trữ dữ liệu nhạy cảm trong môi trường máy chủ bảo mật, có phân quyền truy cập nghiêm ngặt.</li>
              <li>Thường xuyên kiểm tra và cập nhật các biện pháp phòng chống tấn công mạng.</li>
            </ul>
          </section>

          <section className="privacy-section">
            <div className="privacy-header">
              <UserCheck className="privacy-icon" />
              <h2>4. Quyền của bạn</h2>
            </div>
            <p>
              Bạn luôn có toàn quyền kiểm soát dữ liệu cá nhân của mình:
            </p>
            <ul>
              <li>Quyền truy cập và cập nhật thông tin cá nhân bất kỳ lúc nào.</li>
              <li>Quyền yêu cầu xóa bỏ tài khoản và toàn bộ dữ liệu liên quan.</li>
              <li>Quyền từ chối nhận các thông báo quảng cáo không thiết yếu.</li>
            </ul>
          </section>

          <div className="privacy-footer">
            <p><strong>Cập nhật lần cuối:</strong> Ngày 05 tháng 05 năm 2026</p>
            <p>Mọi thắc mắc về quyền riêng tư, vui lòng liên hệ: <a href="mailto:soundmates.company@gmail.com">soundmates.company@gmail.com</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
