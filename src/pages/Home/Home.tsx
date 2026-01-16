import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Home as HomeIcon, Radio, Play, Mic, ChevronLeft, ChevronRight, User, LogOut, FileText, Folder, X, Heart, MessageCircle, Send, Sparkles, Crown, Music, Mail } from 'lucide-react';
import logo from '../../assets/light_logo.png';
import './Home.css';

type PlaylistItem = { id: number; title: string; count: string; mood: string; color: string };
type LiveSession = { id: number; title: string; host: string; listeners: number; isLive: boolean };
type PodcastLetter = { id: number; title: string; author: string; mood: string; reactions: number };

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [userPlaylistIndex, setUserPlaylistIndex] = useState(0);
  const [recommendedIndex, setRecommendedIndex] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // Check role and redirect if not MEMBER
    const role = localStorage.getItem('azuracast_user_role');
    const loggedIn = localStorage.getItem('azuracast_is_logged_in') === 'true';
    const name = localStorage.getItem('azuracast_user_name') || 'User';
    
    setIsLoggedIn(loggedIn);
    setUserName(name);
    
    if (loggedIn && role && role !== 'MEMBER') {
      // Redirect STAFF, HOST, ADMIN to dashboard
      if (role === 'STAFF' || role === 'HOST' || role === 'ADMIN') {
        navigate('/dashboard');
        return;
      }
    }

    // Check for login success flag
    const loginSuccess = localStorage.getItem('azuracast_login_success');
    if (loginSuccess === 'true') {
      setShowToast(true);
      localStorage.removeItem('azuracast_login_success');
      
      // Hide toast after 3 seconds
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setShowUserMenu(false);
    navigate('/login');
  };

  const userPlaylists: PlaylistItem[] = [
    { id: 1, title: 'Chill Vibes', count: '12 bài', mood: 'Thư giãn', color: '#B4A7D6' },
    { id: 2, title: 'Lo-fi Night', count: '18 bài', mood: 'Tĩnh lặng', color: '#A8D5BA' },
    { id: 3, title: 'Focus Beats', count: '9 bài', mood: 'Tập trung', color: '#FFD4A3' },
    { id: 4, title: 'Acoustic Mood', count: '14 bài', mood: 'Nhẹ nhàng', color: '#FFB6C1' },
  ];

  const recommendedPlaylists: PlaylistItem[] = [
    { id: 5, title: 'Healing Sounds', count: '20 bài', mood: 'Chữa lành', color: '#C5E1F5' },
    { id: 6, title: 'Morning Energy', count: '15 bài', mood: 'Năng lượng', color: '#FFE4B5' },
    { id: 7, title: 'Dreamy Synth', count: '11 bài', mood: 'Mơ mộng', color: '#E0BBE4' },
    { id: 8, title: 'Late Night', count: '17 bài', mood: 'Đêm khuya', color: '#B4D7ED' },
  ];

  const liveSessions: LiveSession[] = [
    { id: 1, title: 'Đêm nhạc chữa lành tâm hồn', host: 'DJ Mộng Mơ', listeners: 234, isLive: true },
  ];

  const podcastLetters: PodcastLetter[] = [
    { id: 1, title: 'Gửi người tôi chưa gặp', author: 'Người ẩn danh', mood: 'Trầm lắng', reactions: 89 },
    { id: 2, title: 'Những ngày không dám khóc', author: 'Tâm Tâm', mood: 'Buồn', reactions: 142 },
    { id: 3, title: 'Yêu thương bản thân', author: 'Linh', mood: 'Tích cực', reactions: 203 },
  ];

  const userPlaylistMax = useMemo(() => Math.max(0, userPlaylists.length - 1), [userPlaylists.length]);
  const recommendedMax = useMemo(() => Math.max(0, recommendedPlaylists.length - 1), [recommendedPlaylists.length]);

  const goUserPlaylist = (dir: number) => {
    setUserPlaylistIndex((prev) => {
      const next = prev + dir;
      if (next < 0) return userPlaylistMax;
      if (next > userPlaylistMax) return 0;
      return next;
    });
  };

  const goRecommended = (dir: number) => {
    setRecommendedIndex((prev) => {
      const next = prev + dir;
      if (next < 0) return recommendedMax;
      if (next > recommendedMax) return 0;
      return next;
    });
  };

  return (
    <div className="home-container">
      {showToast && (
        <div className="toast-notification">
          Đăng nhập thành công!
          <button 
            className="toast-close-btn" 
            onClick={() => setShowToast(false)}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
      )}
      <header className="home-topbar">
        <div className="topbar-left">
          <div className="app-logo">
            <img src={logo} alt="Soundmate" className="logo-img" />
            <span>SoundMates</span>
          </div>
          <div className="home-tab">
            <HomeIcon size={18} />
            <span>Trang Chủ</span>
          </div>
          <div className="home-tab">
            <Radio size={18} />
            <span>Phiên Trực Tiếp</span>
          </div>
        </div>
        <nav className="topbar-right" aria-label="Top actions">
          <button className="icon-btn" type="button" aria-label="Search">
            <Search size={18} />
          </button>
          <button className="icon-btn" type="button" aria-label="Notifications">
            <Bell size={18} />
          </button>
          {isLoggedIn ? (
            <div className="user-menu-wrapper">
              <button 
                className="user-avatar-btn" 
                type="button" 
                onClick={() => setShowUserMenu(!showUserMenu)}
                aria-label="User menu"
              >
                <User size={18} />
              </button>
              {showUserMenu && (
                <div className="user-dropdown">
                  <div className="user-dropdown-header">
                    <div className="user-avatar-circle">
                      <User size={20} />
                    </div>
                    <div className="user-info">
                      <div className="user-name">{userName}</div>
                    </div>
                  </div>
                  <div className="user-dropdown-divider" />
                  <button className="user-dropdown-item" onClick={() => navigate('/profile')}>
                    <FileText size={16} />
                    <span>Hồ sơ của tôi</span>
                  </button>
                  <button className="user-dropdown-item" onClick={() => navigate('/my-page')}>
                    <Folder size={16} />
                    <span>Trang của tôi</span>
                  </button>
                  <div className="user-dropdown-divider" />
                  <button className="user-dropdown-item logout" onClick={handleLogout}>
                    <LogOut size={16} />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="btn-login-nav" type="button" onClick={() => navigate('/login')}>
              Đăng Nhập Ngay!
            </button>
          )}
        </nav>
      </header>

      <main className="home-content">
        {/* Currently Live Sessions - MOVED TO TOP */}
        {liveSessions.length > 0 && (
          <section className="section-live">
            <div className="section-header">
              <h2 className="section-title">
                <span className="live-pulse" />
                Đang phát trực tiếp
              </h2>
            </div>
            <div className="live-grid">
              {liveSessions.map((session) => (
                <article key={session.id} className="live-session-card">
                  <div className="live-session-thumb">
                    <span className="live-badge">LIVE</span>
                    <div className="live-bg-gradient" />
                    <div className="live-hover-overlay">
                      <button className="live-join-overlay-btn">
                        <Play size={24} />
                        Join Live
                      </button>
                    </div>
                  </div>
                  <div className="live-session-info">
                    <h3>{session.title}</h3>
                    <div className="live-meta">
                      <span className="host-name">
                        <Mic size={14} />
                        {session.host}
                      </span>
                      <span className="listener-count">
                        <User size={14} />
                        {session.listeners} người
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* VIP Subscription Banner */}
        <section className="vip-banner">
          <div className="vip-gradient" />
          <div className="vip-content">
            <div className="vip-icon">
              <Crown size={32} />
            </div>
            <div className="vip-text">
              <h2>Nâng cấp trải nghiệm với Soundmate VIP</h2>
              <p>Không quảng cáo • Tải nhạc offline • Ưu tiên request nhạc</p>
            </div>
            <button className="vip-btn">
              Chỉ 99k/tháng
            </button>
          </div>
        </section>

        {/* Playlist của bạn - Carousel Style */}
        <section className="section-playlists">
          <div className="section-header">
            <h2 className="section-title">Playlist của bạn</h2>
            <div className="carousel-nav-btns">
              <button className="carousel-nav-btn" onClick={() => goUserPlaylist(-1)}>
                <ChevronLeft size={20} />
              </button>
              <button className="carousel-nav-btn" onClick={() => goUserPlaylist(1)}>
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          <div className="playlist-carousel">
            <div 
              className="playlist-carousel-track"
              style={{ transform: `translateX(-${userPlaylistIndex * 200}px)` }}
            >
              {userPlaylists.map((item) => (
                <article key={item.id} className="playlist-card-carousel">
                  <div className="playlist-thumb-carousel" style={{ background: `linear-gradient(135deg, ${item.color} 0%, ${item.color}99 100%)` }}>
                    <Music size={40} className="playlist-icon" />
                  </div>
                  <div className="playlist-info-carousel">
                    <h3>{item.title}</h3>
                    <p className="playlist-count">{item.count}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Playlist đề cử - Carousel Style */}
        <section className="section-playlists">
          <div className="section-header">
            <h2 className="section-title">Playlist đề cử</h2>
            <div className="carousel-nav-btns">
              <button className="carousel-nav-btn" onClick={() => goRecommended(-1)}>
                <ChevronLeft size={20} />
              </button>
              <button className="carousel-nav-btn" onClick={() => goRecommended(1)}>
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          <div className="playlist-carousel">
            <div 
              className="playlist-carousel-track"
              style={{ transform: `translateX(-${recommendedIndex * 200}px)` }}
            >
              {recommendedPlaylists.map((item) => (
                <article key={item.id} className="playlist-card-carousel">
                  <div className="playlist-thumb-carousel" style={{ background: `linear-gradient(135deg, ${item.color} 0%, ${item.color}99 100%)` }}>
                    <Music size={40} className="playlist-icon" />
                  </div>
                  <div className="playlist-info-carousel">
                    <h3>{item.title}</h3>
                    <p className="playlist-count">{item.count}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Podcast Letters */}
        <section className="section-letters">
          <div className="section-header">
            <h2 className="section-title">
              <Mail size={20} />
              Thư tâm tình
            </h2>
            <button className="see-all-btn">Xem tất cả</button>
          </div>
          <div className="letters-grid">
            {podcastLetters.map((letter) => (
              <article key={letter.id} className="letter-card">
                <div className="letter-header">
                  <span className="letter-mood">{letter.mood}</span>
                  <button className="letter-favorite">
                    <Heart size={18} />
                  </button>
                </div>
                <h3 className="letter-title">{letter.title}</h3>
                <p className="letter-author">Từ {letter.author}</p>
                <div className="letter-footer">
                  <span className="letter-reactions">
                    <Heart size={14} />
                    {letter.reactions}
                  </span>
                  <button className="letter-comment-btn">
                    <MessageCircle size={14} />
                    Phản hồi
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Healing Moment Section */}
        <section className="healing-section">
          <div className="healing-content">
            <Sparkles size={40} className="healing-icon" />
            <h2>Chia sẻ cảm xúc của bạn</h2>
            <p>Kết nối với mọi người qua âm nhạc và câu chuyện của bạn</p>
            <button className="share-feeling-btn">
              <Send size={18} />
              Viết thư tâm tình
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
