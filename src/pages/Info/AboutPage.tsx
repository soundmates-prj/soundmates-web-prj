import React from 'react';
import { Sparkles, Music, Mic2, Users, Heart, Globe } from 'lucide-react';
import './InfoPages.css';

// Import Avatars
import avatar1 from '../../assets/avatars/anh1.jpg';
import avatar2 from '../../assets/avatars/anh2.jpg';
import avatar3 from '../../assets/avatars/anh3.jpg';
import avatar4 from '../../assets/avatars/anh4.jpg';
import avatar5 from '../../assets/avatars/anh5.jpg';

const AboutPage: React.FC = () => {
  return (
    <div className="info-page about-page">
      <div className="info-hero">
        <div className="hero-content">
          <Sparkles className="hero-icon animated-pulse" />
          <h1>Về SoundMates</h1>
          <p className="hero-subtitle">
            Kết nối tâm hồn qua từng giai điệu và câu chuyện podcast.
          </p>
        </div>
        <div className="hero-bg-glow"></div>
      </div>

      <div className="info-container">
        <section className="info-section">
          <div className="section-grid">
            <div className="section-text">
              <h2>Sứ mệnh của chúng tôi</h2>
              <p>
                SoundMates ra đời với mục tiêu mang lại trải nghiệm âm nhạc và podcast cá nhân hóa tuyệt vời nhất.
                Chúng tôi tin rằng âm nhạc không chỉ là những nốt nhạc, mà là ngôn ngữ của cảm xúc,
                là nhịp cầu kết nối những tâm hồn đồng điệu.
              </p>
              <p>
                Với công nghệ AI tiên tiến, SoundMates cho phép bạn không chỉ nghe nhạc mà còn có thể
                tạo ra những nội dung podcast độc nhất vô nhị từ chính giọng nói của bạn hoặc những giọng đọc truyền cảm nhất.
              </p>
            </div>
            <div className="section-visual">
              <div className="glass-card visual-card">
                <Music className="visual-icon" />
                <span>1M+ Bài hát</span>
              </div>
              <div className="glass-card visual-card">
                <Mic2 className="visual-icon" />
                <span>AI Voice Clone</span>
              </div>
            </div>
          </div>
        </section>

        <section className="info-section alternate">
          <h2>Giá trị cốt lõi</h2>
          <div className="values-grid">
            <div className="value-item">
              <div className="value-icon-wrap"><Heart /></div>
              <h3>Sáng tạo</h3>
              <p>Luôn đổi mới để mang lại những tính năng độc đáo và thú vị nhất cho người dùng.</p>
            </div>
            <div className="value-item">
              <div className="value-icon-wrap"><Users /></div>
              <h3>Cộng đồng</h3>
              <p>Xây dựng không gian chia sẻ, nơi mọi người có thể tìm thấy người bạn tâm giao qua âm nhạc.</p>
            </div>
            <div className="value-item">
              <div className="value-icon-wrap"><Globe /></div>
              <h3>Kết nối</h3>
              <p>Phá vỡ rào cản ngôn ngữ và khoảng cách, mang âm nhạc đến mọi góc nhỏ trên thế giới.</p>
            </div>
          </div>
        </section>

        <section className="info-section team-section">
          <h2>Đội ngũ phát triển</h2>
          <p className="section-intro">
            Chúng tôi là những người trẻ đam mê âm nhạc và công nghệ, luôn nỗ lực hết mình
            để xây dựng một nền tảng SoundMates ngày càng hoàn thiện.
          </p>

          <div className="team-container">
            {/* Top row: 2 members */}
            <div className="team-row top-row">
              {[
                { name: "Trần Hồ Quốc Anh", role: "Leader & Developer", avatar: avatar1 },
                { name: "Nguyễn Đức Anh Minh", role: "Developer", avatar: avatar2 },
              ].map((member, idx) => (
                <div key={idx} className="team-member-card">
                  <div className="member-avatar-placeholder">
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.name} />
                    ) : (
                      <Users size={48} />
                    )}
                  </div>
                  <h3>{member.name}</h3>
                  <p>{member.role}</p>
                </div>
              ))}
            </div>

            {/* Bottom row: 3 members */}
            <div className="team-row bottom-row">
              {[
                { name: "Đoàn Công Thành", role: "Developer", avatar: avatar3 },
                { name: "Trần Hoàng Nam", role: "Developer", avatar: avatar4 },
                { name: "Phan Minh Đức", role: "Developer", avatar: avatar5 },
              ].map((member, idx) => (
                <div key={idx} className="team-member-card">
                  <div className="member-avatar-placeholder">
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.name} />
                    ) : (
                      <Users size={48} />
                    )}
                  </div>
                  <h3>{member.name}</h3>
                  <p>{member.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="info-section special-thanks">
          <div className="glass-card thanks-card">
            <Heart className="thanks-icon animated-pulse" />
            <h2>Special Thanks</h2>
            <p className="thanks-text">
              Chúng tôi xin gửi lời cảm ơn chân thành và sâu sắc nhất đến
            </p>
            <h3 className="thanks-name">Mr. Nguyễn Ngọc Lâm</h3>
            <p className="thanks-subtext">
              Vì sự hỗ trợ, hướng dẫn và đồng hành quý báu trong suốt quá trình thực hiện dự án SoundMates.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;
