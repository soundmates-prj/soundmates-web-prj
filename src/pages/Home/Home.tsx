import { useState } from "react";
import { Link } from "react-router-dom";
import "./Home.css";
import Icon from "../../components/common/Icon";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import HeroSection from "../../components/home/HeroSection";
import useDragScroll from "../../hooks/useDragScroll";

import playlistCover1 from "../../assets/images/playlist_cover_1.png";
import playlistCover2 from "../../assets/images/playlist_cover_2.png";
import playlistCover3 from "../../assets/images/playlist_cover_3.png";
import playlistCover4 from "../../assets/images/playlist_cover_4.png";
import playlistCover5 from "../../assets/images/playlist_cover_5.png";

const playlists = [
  { id: 1, title: "Aethereal Flow", subtitle: "Celestial Waves", image: playlistCover1 },
  { id: 2, title: "Skyward Serenade", subtitle: "Celeste", image: playlistCover2 },
  { id: 3, title: "Purr-fect Beats", subtitle: "Luna Paws", image: playlistCover3 },
  { id: 4, title: "Radio Waves", subtitle: "The Vintage Sound", image: playlistCover4 },
  { id: 5, title: "Rainy Day Coffee", subtitle: "Warmth & Wood", image: playlistCover5 },
  { id: 6, title: "Lofi Chill", subtitle: "Relaxing Vibes", image: playlistCover2 },
  { id: 7, title: "Jazz Night", subtitle: "Smooth Sessions", image: playlistCover1 },
];

const scheduleItems = [
  { id: 1, time: "23:00", period: "Đang phát", title: "Đêm nhạc bolero học", host: "❤ Emily_vui", isLive: true },
  { id: 2, time: "23:00", period: "Sắp tới", title: "KPOP Party Mix", host: "🎧 Minh", isLive: false },
  { id: 3, time: "00:00", period: "Sắp tới", title: "Bùa biêng và em hát", host: "🎵 Luna_DJ", isLive: false },
  { id: 4, time: "3:00", period: "Sắp tới", title: "Dawn Coffee", host: "☕ Lan_vy_ơi", isLive: false },
  { id: 5, time: "21:00", period: "Sắp tới", title: "Late night Afternoon", host: "💫 Jacky_oi", isLive: false },
];

const forumPosts = [
  { id: 1, author: "Phan Minh", badge: "Premium", avatar: "https://i.pravatar.cc/100?img=1", title: "Playlist tổng hợp các bài nhạc chill cùng team music", likes: 32, comments: 24, time: "10 phút" },
  { id: 2, author: "Anh Tuấn Music", badge: "Artist", avatar: "https://i.pravatar.cc/100?img=2", title: "Các anh chị ơi mình cần chọn loại Tai nghe gì?", likes: 56, comments: 200, time: "24 giờ" },
  { id: 3, author: "Nhạc Việt DJ", badge: "VIP", avatar: "https://i.pravatar.cc/100?img=3", title: "lài số lùi của bản bọ không hiện lên loai ho, mọi người...", likes: 128, comments: 89, time: "2 ngày" },
];

const podcasts = [
  { id: 1, title: "Podcast 1", subtitle: "mật thư", image: playlistCover1 },
  { id: 2, title: "Podcast 2", subtitle: "câu chuyện chúng ta", image: playlistCover2 },
  { id: 3, title: "Podcast 3", subtitle: "tâm trạng", image: playlistCover3 },
  { id: 4, title: "Podcast 4", subtitle: "tự sự", image: playlistCover4 },
  { id: 5, title: "Podcast 5", subtitle: "yêu lành", image: playlistCover5 },
  { id: 6, title: "Podcast 6", subtitle: "kể chuyện", image: playlistCover1 },
];

const playlistTabs = ["Mới", "Thịnh Hành", "EDM", "Acoustic", "Nhạc", "Bolê", "Phim"];

/* ─── Framer Motion Variants ─── */
const sectionReveal: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const cardReveal: Variants = {
  hidden: { y: 24, opacity: 0, scale: 0.97 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 140, damping: 22 },
  },
};

export default function Home() {
  const [activeTab, setActiveTab] = useState("Mới");
  
  const { containerRef: playlistRef, handlers: playlistHandlers } = useDragScroll();
  const { containerRef: podcastRef, handlers: podcastHandlers } = useDragScroll();

  const scrollSection = (ref: React.RefObject<HTMLDivElement | null>, direction: "prev" | "next") => {
    if (ref.current) {
      const scrollAmount = 400;
      ref.current.scrollBy({
        left: direction === "next" ? scrollAmount : -scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="home-page">
      {/* ═══ Hero Section ═══ */}
      <HeroSection />

      {/* ═══ Playlist Section ═══ */}
      <motion.section
        className="sm-section"
        variants={sectionReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
      >
        <div className="sm-container">
          <div className="section-header">
            <h2 className="section-title">Playlist đề cử</h2>
            <div className="section-tabs">
              {playlistTabs.map((tab) => (
                <button
                  key={tab}
                  className={`section-tab ${activeTab === tab ? "active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="playlist-carousel">
            <button className="carousel-nav prev" onClick={() => scrollSection(playlistRef, "prev")}>
              <Icon name="chevron-left" size={24} />
            </button>

            <motion.div
              className="playlist-carousel-inner"
              ref={playlistRef}
              {...playlistHandlers}
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              {playlists.map((playlist) => (
                <motion.div
                  key={playlist.id}
                  className="playlist-card"
                  variants={cardReveal}
                  whileHover={{ y: -8, transition: { duration: 0.25 } }}
                  onClickCapture={playlistHandlers.onClickCapture}
                >
                  <img src={playlist.image} alt={playlist.title} className="playlist-card-image" draggable={false} />
                  <div className="playlist-card-content">
                    <h4 className="playlist-card-title">{playlist.title}</h4>
                    <p className="playlist-card-subtitle">{playlist.subtitle}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <button className="carousel-nav next" onClick={() => scrollSection(playlistRef, "next")}>
              <Icon name="chevron-right" size={24} />
            </button>
          </div>
        </div>
      </motion.section>

      {/* ═══ Live Room Section ═══ */}
      <motion.section
        className="sm-section"
        variants={sectionReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
      >
        <div className="sm-container">
          <div className="section-header">
            <h2 className="section-title">Phòng Đang Phát</h2>
            <a href="#" className="section-link">
              Xem thêm <Icon name="chevron-right" size={16} />
            </a>
          </div>

          <div className="live-room-card">
            <div className="live-room-badge">LIVE</div>
            <div className="live-room-content">
              <div className="live-room-info">
                <h3 className="live-room-title">Đêm nhạc cổ điển êm dịu</h3>
                <div className="live-room-meta">
                  <span><Icon name="users" size={16} /> 33 Kết nối</span>
                  <span><Icon name="heart" size={16} /> 156 lượt thích</span>
                </div>
                <a href="#" className="live-room-link">
                  Xem danh sách phát <Icon name="chevron-right" size={14} />
                </a>
              </div>
              <button className="live-room-cta">Tham Gia</button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ═══ Schedule Section ═══ */}
      <motion.section
        className="sm-section"
        variants={sectionReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
      >
        <div className="sm-container">
          <div className="section-header">
            <h2 className="section-title">Lịch phát sóng</h2>
            <a href="#" className="section-link">
              Xem tất cả <Icon name="chevron-right" size={16} />
            </a>
          </div>

          <motion.div
            className="schedule-list"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {scheduleItems.map((item) => (
              <motion.div
                key={item.id}
                className="schedule-item"
                variants={cardReveal}
                whileHover={{ x: 6, transition: { duration: 0.2 } }}
              >
                <div className="schedule-item-time">
                  <span className="schedule-item-time-value">{item.time}</span>
                  <span className="schedule-item-time-period">{item.period}</span>
                </div>
                <div className="music-wave">
                  <span></span><span></span><span></span><span></span><span></span>
                </div>
                <div className="schedule-item-content">
                  <h4 className="schedule-item-title">{item.title}</h4>
                  <p className="schedule-item-subtitle">{item.host}</p>
                </div>
                <button className={`schedule-item-action ${item.isLive ? "live" : "upcoming"}`}>
                  {item.isLive ? "Đang Phát" : "Thông báo"}
                </button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ═══ Forum Section ═══ */}
      <motion.section
        className="sm-section"
        variants={sectionReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
      >
        <div className="sm-container">
          <div className="section-header">
            <h2 className="section-title">Diễn đàn SoundMates</h2>
            <a href="#" className="section-link">
              Xem tất cả <Icon name="chevron-right" size={16} />
            </a>
          </div>

          <motion.div
            className="forum-list"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {forumPosts.map((post) => (
              <motion.div
                key={post.id}
                className="forum-item"
                variants={cardReveal}
                whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
              >
                <img src={post.avatar} alt={post.author} className="forum-item-avatar" />
                <div className="forum-item-content">
                  <div className="forum-item-header">
                    <span className="forum-item-author">{post.author}</span>
                    <span className="forum-item-badge">{post.badge}</span>
                  </div>
                  <p className="forum-item-title">{post.title}</p>
                  <div className="forum-item-meta">
                    <span><Icon name="heart" size={14} /> {post.likes} Lượt thích</span>
                    <span><Icon name="message" size={14} /> {post.comments} Bình luận</span>
                    <span><Icon name="clock" size={14} /> {post.time}</span>
                  </div>
                </div>
                <button className="forum-item-action">Xem Ngay</button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ═══ Podcast Section ═══ */}
      <motion.section
        className="sm-section"
        variants={sectionReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
      >
        <div className="sm-container">
          <div className="section-header">
            <h2 className="section-title">Các thư Podcast yêu thích</h2>
            <a href="#" className="section-link">
              Xem tất cả <Icon name="chevron-right" size={16} />
            </a>
          </div>

          <div className="playlist-carousel">
            <button className="carousel-nav prev" onClick={() => scrollSection(podcastRef, "prev")}>
              <Icon name="chevron-left" size={24} />
            </button>

            <motion.div
              className="playlist-carousel-inner"
              ref={podcastRef}
              {...podcastHandlers}
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              {podcasts.map((podcast) => (
                <motion.div
                  key={podcast.id}
                  className="podcast-card"
                  variants={cardReveal}
                  whileHover={{ y: -8, transition: { duration: 0.25 } }}
                  onClickCapture={podcastHandlers.onClickCapture}
                >
                  <div className="podcast-card-image-wrapper">
                    <img src={podcast.image} alt={podcast.title} className="podcast-card-image" draggable={false} />
                    <div className="podcast-card-overlay">
                      <button className="podcast-play-btn">
                        <Icon name="play" size={20} />
                      </button>
                    </div>
                  </div>
                  <div className="podcast-card-content">
                    <h4 className="podcast-card-title">{podcast.title}</h4>
                    <p className="podcast-card-subtitle">{podcast.subtitle}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <button className="carousel-nav next" onClick={() => scrollSection(podcastRef, "next")}>
              <Icon name="chevron-right" size={24} />
            </button>
          </div>
        </div>
      </motion.section>

      {/* ═══ Subscription Section ═══ */}
      <motion.section
        className="sm-section subscription-section"
        variants={sectionReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <div className="sm-container">
          <motion.div
            className="subscription-container"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.7 }}
          >
            <div className="subscription-content">
              <span className="subscription-tag">Premium</span>
              <h2 className="subscription-title">Trở thành Hội Viên SoundMates</h2>
              <p className="subscription-description">
                Chỉ với <span className="price">159.000đ / tháng</span>, bạn mở khóa toàn bộ đặc quyền
                dành riêng cho những người yêu âm nhạc và muốn trải nghiệm trọn vẹn nhất.
              </p>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ display: "inline-block" }}>
                <Link to="/subscription" className="subscription-cta">
                  Khám Phá Các Gói <Icon name="arrow-right" size={18} />
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* ═══ About SoundMates Section ═══ */}
      <motion.section
        id="about-us"
        className="sm-section about-section"
        variants={sectionReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <div className="sm-container">
          <div className="about-container">
            <div className="about-content">
              <h2 className="about-title">
                Giới thiệu về <span className="gradient-text">SoundMates</span>
              </h2>
              <p className="about-description">
                SoundMates là nơi những tâm hồn yêu nhạc hội tụ. Chúng tôi mang đến trải nghiệm nghe nhạc
                không chỉ giới hạn ở âm thanh, mà còn là sự kết nối, sẻ chia cảm xúc qua từng podcast và
                playlist. Hãy để SoundMates đồng hành cùng bạn lan tỏa yêu thương mỗi ngày!
              </p>
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
