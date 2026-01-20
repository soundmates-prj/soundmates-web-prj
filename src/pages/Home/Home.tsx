import { useState, useRef, useEffect } from 'react';
import './Home.css';
import Icon from '../../components/common/Icon';

// Import images
import heroIllustration from '../../assets/images/hero_illustration.png';
import playlistCover1 from '../../assets/images/playlist_cover_1.png';
import playlistCover2 from '../../assets/images/playlist_cover_2.png';
import playlistCover3 from '../../assets/images/playlist_cover_3.png';
import playlistCover4 from '../../assets/images/playlist_cover_4.png';
import playlistCover5 from '../../assets/images/playlist_cover_5.png';

// Mock data
const playlists = [
  { id: 1, title: 'Aethereal Flow', subtitle: 'Celestial Waves', image: playlistCover1 },
  { id: 2, title: 'Skyward Serenade', subtitle: 'Celeste', image: playlistCover2 },
  { id: 3, title: 'Purr-fect Beats', subtitle: 'Luna Paws', image: playlistCover3 },
  { id: 4, title: 'Radio Waves', subtitle: 'The Vintage Sound', image: playlistCover4 },
  { id: 5, title: 'Rainy Day Coffee', subtitle: 'Warmth & Wood', image: playlistCover5 },
  { id: 6, title: 'Lofi Chill', subtitle: 'Relaxing Vibes', image: playlistCover2 },
  { id: 7, title: 'Jazz Night', subtitle: 'Smooth Sessions', image: playlistCover1 },
];

const scheduleItems = [
  { id: 1, time: '23:00', period: 'Đang phát', title: 'Đêm nhạc bolero học', host: '❤ Emily_vui', isLive: true },
  { id: 2, time: '23:00', period: 'Sắp tới', title: 'KPOP Party Mix', host: '🎧 Minh', isLive: false },
  { id: 3, time: '00:00', period: 'Sắp tới', title: 'Bùa biêng và em hát', host: '🎵 Luna_DJ', isLive: false },
  { id: 4, time: '3:00', period: 'Sắp tới', title: 'Dawn Coffee', host: '☕ Lan_vy_ơi', isLive: false },
  { id: 5, time: '21:00', period: 'Sắp tới', title: 'Late night Afterunon', host: '💫 Jacky_oi', isLive: false },
];

const forumPosts = [
  {
    id: 1,
    author: 'Phan Minh',
    badge: 'Premium',
    avatar: 'https://i.pravatar.cc/100?img=1',
    title: 'Playlist tổng hợp các bài nhạc chill cùng team music',
    likes: 32,
    comments: 24,
    time: '10 phút'
  },
  {
    id: 2,
    author: 'Anh Tuấn Music',
    badge: 'Artist',
    avatar: 'https://i.pravatar.cc/100?img=2',
    title: 'Các anh chị ơi mình cần chọn loại Tai nghe gì?',
    likes: 56,
    comments: 200,
    time: '24 giờ'
  },
  {
    id: 3,
    author: 'Nhạc Việt DJ',
    badge: 'VIP',
    avatar: 'https://i.pravatar.cc/100?img=3',
    title: 'lài số lùi của bản bọ không hiện lên loai ho, mọi người...',
    likes: 128,
    comments: 89,
    time: '2 ngày'
  },
];

const playlistTabs = ['Mới', 'Thịnh Hành', 'EDM', 'Acoustic', 'Nhạc', 'Bolê', 'Phim'];

export default function Home() {
  const [activeTab, setActiveTab] = useState('Mới');
  const [isScrolled, setIsScrolled] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollCarousel = (direction: 'prev' | 'next') => {
    if (carouselRef.current) {
      const scrollAmount = 400;
      carouselRef.current.scrollBy({
        left: direction === 'next' ? scrollAmount : -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Listen <span>Together.</span>
            </h1>
            <p className="hero-subtitle">Chia sẻ âm nhạc của bạn</p>
            <a href="#" className="hero-cta">
              <Icon name="play" size={20} />
              Bắt Đầu
            </a>
          </div>
          <div className="hero-illustration">
            <img src={heroIllustration} alt="Listen Together" />
          </div>
        </div>
      </section>

      {/* Playlist Section */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Playlist đề cử</h2>
          <div className="section-tabs">
            {playlistTabs.map(tab => (
              <button
                key={tab}
                className={`section-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="playlist-carousel">
          <button className="carousel-nav prev" onClick={() => scrollCarousel('prev')}>
            <Icon name="chevron-left" size={24} />
          </button>

          <div className="playlist-carousel-inner" ref={carouselRef}>
            {playlists.map(playlist => (
              <div key={playlist.id} className="playlist-card hover-lift">
                <img src={playlist.image} alt={playlist.title} className="playlist-card-image" />
                <div className="playlist-card-content">
                  <h4 className="playlist-card-title">{playlist.title}</h4>
                  <p className="playlist-card-subtitle">{playlist.subtitle}</p>
                </div>
              </div>
            ))}
          </div>

          <button className="carousel-nav next" onClick={() => scrollCarousel('next')}>
            <Icon name="chevron-right" size={24} />
          </button>
        </div>
      </section>

      {/* Live Room Section */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Phòng Đang Phát</h2>
          <a href="#" className="section-link">
            Xem thêm
            <Icon name="chevron-right" size={16} />
          </a>
        </div>

        <div className="live-room-card">
          <div className="live-room-badge">LIVE</div>
          <div className="live-room-content">
            <div className="live-room-info">
              <h3 className="live-room-title">Đêm nhạc cổ điển êm dịu</h3>
              <div className="live-room-meta">
                <span>
                  <Icon name="users" size={16} />
                  33 Kết nối
                </span>
                <span>
                  <Icon name="heart" size={16} />
                  156 lượt thích
                </span>
              </div>
              <a href="#" className="live-room-link">
                Xem danh sách phát
                <Icon name="chevron-right" size={14} />
              </a>
            </div>
            <button className="live-room-cta">
              <Icon name="headphones" size={18} />
              Tham Gia
            </button>
          </div>
        </div>
      </section>

      {/* Schedule Section */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Lịch phát sóng</h2>
          <a href="#" className="section-link">
            Xem tất cả
            <Icon name="chevron-right" size={16} />
          </a>
        </div>

        <div className="schedule-list">
          {scheduleItems.map(item => (
            <div key={item.id} className="schedule-item hover-lift">
              <div className="schedule-item-time">
                <span className="schedule-item-time-value">{item.time}</span>
                <span className="schedule-item-time-period">{item.period}</span>
              </div>
              <div className="music-wave">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div className="schedule-item-content">
                <h4 className="schedule-item-title">{item.title}</h4>
                <p className="schedule-item-subtitle">{item.host}</p>
              </div>
              <button className={`schedule-item-action ${item.isLive ? 'live' : 'upcoming'}`}>
                {item.isLive ? 'Đang Phát' : 'Thông báo'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Forum Section */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Diễn đàn SoundMates</h2>
          <a href="#" className="section-link">
            Xem tất cả
            <Icon name="chevron-right" size={16} />
          </a>
        </div>

        <div className="forum-list">
          {forumPosts.map(post => (
            <div key={post.id} className="forum-item hover-lift">
              <img src={post.avatar} alt={post.author} className="forum-item-avatar" />
              <div className="forum-item-content">
                <div className="forum-item-header">
                  <span className="forum-item-author">{post.author}</span>
                  <span className="forum-item-badge">{post.badge}</span>
                </div>
                <p className="forum-item-title">{post.title}</p>
                <div className="forum-item-meta">
                  <span>
                    <Icon name="heart" size={14} />
                    {post.likes} Lượt thích
                  </span>
                  <span>
                    <Icon name="message" size={14} />
                    {post.comments} Bình luận
                  </span>
                  <span>
                    <Icon name="clock" size={14} />
                    {post.time}
                  </span>
                </div>
              </div>
              <button className="forum-item-action">Xem Ngay</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
