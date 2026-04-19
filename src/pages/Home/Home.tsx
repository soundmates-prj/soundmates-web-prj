import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Home.css";
import Icon from "../../components/common/Icon";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import HeroSection from "../../components/home/HeroSection";
import useDragScroll from "../../hooks/useDragScroll";
import api from "../../services/axios";
import liveSessionApiService from "../../services/liveSessionApiService";
import type { SessionScheduleResult } from "../../services/liveSessionApiService";
import userPlaylistService, { type UserPlaylist } from "../../services/userPlaylistService";
import podcastService from "../../services/podcastService";
import type { PodcastItem } from "../../types/podcast";
import type {
  PublishedPostsResponse,
  PublishedPost,
  TrendingPostsResponse,
  TrendingPost,
} from "../../types/forum";
import { resolveUserDisplayNames } from "../../utils/userProfileNameResolver";

import playlistCover1 from "../../assets/images/playlist_cover_1.png";
import playlistCover2 from "../../assets/images/playlist_cover_2.png";
import playlistCover3 from "../../assets/images/playlist_cover_3.png";
import playlistCover4 from "../../assets/images/playlist_cover_4.png";
import playlistCover5 from "../../assets/images/playlist_cover_5.png";

const PLAYLISTS = [
  { id: 1, title: "Aethereal Flow", subtitle: "Celestial Waves", image: playlistCover1 },
  { id: 2, title: "Skyward Serenade", subtitle: "Celeste", image: playlistCover2 },
  { id: 3, title: "Purr-fect Beats", subtitle: "Luna Paws", image: playlistCover3 },
  { id: 4, title: "Radio Waves", subtitle: "The Vintage Sound", image: playlistCover4 },
  { id: 5, title: "Rainy Day Coffee", subtitle: "Warmth & Wood", image: playlistCover5 },
  { id: 6, title: "Lofi Chill", subtitle: "Relaxing Vibes", image: playlistCover2 },
  { id: 7, title: "Jazz Night", subtitle: "Smooth Sessions", image: playlistCover1 },
];

const PODCASTS = [
  { id: 1, title: "Podcast 1", subtitle: "mật thư", image: playlistCover1 },
  { id: 2, title: "Podcast 2", subtitle: "câu chuyện chúng ta", image: playlistCover2 },
  { id: 3, title: "Podcast 3", subtitle: "tâm trạng", image: playlistCover3 },
  { id: 4, title: "Podcast 4", subtitle: "tự sự", image: playlistCover4 },
  { id: 5, title: "Podcast 5", subtitle: "yêu lành", image: playlistCover5 },
  { id: 6, title: "Podcast 6", subtitle: "kể chuyện", image: playlistCover1 },
];

const PLAYLIST_TABS = ["Mới", "Thịnh Hành", "EDM", "Acoustic", "Nhạc", "Bolê", "Phim"];

// ── Types ──────────────────────────────────────────────────────────────────

type HomeScheduleItem = {
  id: number | string;
  time: string;
  period: string;
  title: string;
  host: string;
  isLive: boolean;
};

type HomeForumItem = {
  id: number | string;
  author: string;
  badge: string;
  avatar: string;
  title: string;
  likes: number;
  comments: number;
  time: string;
};

// ── Helpers ─────────────────────────────────────────────────────────────────

const formatRelativeTime = (iso?: string | null): string => {
  if (!iso) return "vừa xong";
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "vừa xong";
  if (min < 60) return `${min} phút`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours} giờ`;
  return `${Math.floor(hours / 24)} ngày`;
};

const isScheduleLiveNow = (s: SessionScheduleResult): boolean => {
  if (s.liveSession?.status === "Live") return true;
  if (s.liveSession?.status !== "Scheduled") return false;
  const start = new Date(`${s.startDate}T${s.startTime}`);
  const end = new Date(`${s.startDate}T${s.endTime}`);
  const now = new Date();
  return start <= now && now <= end;
};

const mapScheduleToHomeItem = (s: SessionScheduleResult): HomeScheduleItem => {
  const start = new Date(`${s.startDate}T${s.startTime}`);
  const end = new Date(`${s.startDate}T${s.endTime}`);
  const now = new Date();
  const isLive = isScheduleLiveNow(s);
  const isUpcoming = start > now;
  const ended = end < now;

  let period: string;
  if (isLive) period = "Đang phát";
  else if (isUpcoming) period = "Sắp tới";
  else if (ended) period = "Đã phát";
  else period = "Đang phát";

  return {
    id: s.id,
    time: s.startTime.slice(0, 5),
    period,
    title: s.title || s.liveSession?.sessionName || "Phiên phát sóng",
    host: s.liveSession?.station?.stationName
      ? `🎧 ${s.liveSession.station.stationName}`
      : "🎵 SoundMates",
    isLive,
  };
};

const pickTopScheduleItems = (items: SessionScheduleResult[]): HomeScheduleItem[] => {
  const sorted = [...items].sort((a, b) => {
    const aKey = `${a.startDate}${a.startTime}`;
    const bKey = `${b.startDate}${b.startTime}`;
    return aKey.localeCompare(bKey);
  });

  const liveItems = sorted.filter((s) => mapScheduleToHomeItem(s).isLive);
  const upcomingItems = sorted.filter((s) => {
    const start = new Date(`${s.startDate}T${s.startTime}`);
    return start > new Date();
  });

  const seen = new Set<string | number>();
  const merged: SessionScheduleResult[] = [];
  for (const s of [...liveItems, ...upcomingItems]) {
    if (seen.has(s.id)) continue;
    seen.add(s.id);
    merged.push(s);
    if (merged.length >= 5) break;
  }

  if (merged.length === 0 && sorted.length > 0) {
    const nowMs = Date.now();
    const byNearest = [...sorted].sort((a, b) => {
      const ta = new Date(`${a.startDate}${a.startTime}`).getTime();
      const tb = new Date(`${b.startDate}${b.startTime}`).getTime();
      return Math.abs(ta - nowMs) - Math.abs(tb - nowMs);
    });
    return byNearest.slice(0, 5).map(mapScheduleToHomeItem);
  }

  return merged.map(mapScheduleToHomeItem);
};

const mapPostToHomeItem = (
  p: PublishedPost,
  index: number,
  authorNamesByUserId: Record<string, string>,
): HomeForumItem => ({
  id: p.id,
  author: authorNamesByUserId[p.userId] || p.userFullName || "Thành viên SoundMates",
  badge: p.moodTag ? p.moodTag : p.isGenerated ? "AI" : "Community",
  avatar: p.userAvatarUrl || `https://i.pravatar.cc/100?img=${(index % 10) + 1}`,
  title: p.title || p.contentText || "Bài viết mới từ cộng đồng",
  likes: p.reactionCount ?? 0,
  comments: 0,
  time: formatRelativeTime(p.publishedAt || p.createdAt),
});

const mapTrendingToHomeItem = (
  p: TrendingPost,
  index: number,
  authorNamesByUserId: Record<string, string>,
): HomeForumItem => ({
  id: p.id,
  author:
    authorNamesByUserId[p.userId] ||
    p.userFullName?.trim() ||
    "Thành viên SoundMates",
  badge: p.moodTag ? p.moodTag : p.isGenerated ? "AI" : "Community",
  avatar: p.userAvatarUrl || `https://i.pravatar.cc/100?img=${(index % 10) + 1}`,
  title: p.title || p.contentText || "Bài viết từ cộng đồng",
  likes: p.reactionCount ?? 0,
  comments: p.commentCount ?? 0,
  time: formatRelativeTime(p.publishedAt || p.createdAt),
});

const pickTopForumItems = (
  items: PublishedPost[],
  authorNamesByUserId: Record<string, string>,
): HomeForumItem[] =>
  [...items]
    .sort((a, b) => {
      const tb = new Date(b.publishedAt ?? b.createdAt).getTime();
      const ta = new Date(a.publishedAt ?? a.createdAt).getTime();
      return tb - ta;
    })
    .slice(0, 3)
    .map((p, i) => mapPostToHomeItem(p, i, authorNamesByUserId));

const pickTopForumFromTrending = (
  items: TrendingPost[],
  authorNamesByUserId: Record<string, string>,
): HomeForumItem[] =>
  [...items]
    .sort((a, b) => {
      const scoreB = (b.reactionCount ?? 0) + (b.commentCount ?? 0);
      const scoreA = (a.reactionCount ?? 0) + (a.commentCount ?? 0);
      return scoreB - scoreA;
    })
    .slice(0, 3)
    .map((p, i) => mapTrendingToHomeItem(p, i, authorNamesByUserId));

// ── Framer Motion Variants ─────────────────────────────────────────────────

const sectionReveal: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const cardReveal: Variants = {
  hidden: { y: 24, opacity: 0, scale: 0.97 },
  visible: { y: 0, opacity: 1, scale: 1, transition: { type: "spring", stiffness: 140, damping: 22 } },
};

// ── Component ──────────────────────────────────────────────────────────────

export default function Home() {
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("Mới");
  const [scheduleItems, setScheduleItems] = useState<HomeScheduleItem[]>([]);
  const [forumPosts, setForumPosts] = useState<HomeForumItem[]>([]);
  const [userPlaylists, setUserPlaylists] = useState<UserPlaylist[]>([]);
  const [podcasts, setPodcasts] = useState<PodcastItem[]>([]);
  const [isScheduleLoading, setIsScheduleLoading] = useState(true);
  const [isForumLoading, setIsForumLoading] = useState(true);
  const [isPlaylistLoading, setIsPlaylistLoading] = useState(true);
  const [isPodcastLoading, setIsPodcastLoading] = useState(true);

  // Track previous path để detect khi nào quay về Home
  const prevPathRef = useRef<string>("/");

  const { containerRef: playlistRef, handlers: playlistHandlers } = useDragScroll();
  const { containerRef: podcastRef, handlers: podcastHandlers } = useDragScroll();

  const liveSession = scheduleItems.find((item) => item.isLive);

  // ── Fetch Functions ──────────────────────────────────────────────────────

  const fetchUserPlaylists = useCallback(async () => {
    setIsPlaylistLoading(true);
    try {
      const playlists = await userPlaylistService.getPublic();
      setUserPlaylists(playlists);
    } catch {
      setUserPlaylists([]);
    } finally {
      setIsPlaylistLoading(false);
    }
  }, []);

  const fetchSchedule = useCallback(async () => {
    setIsScheduleLoading(true);
    try {
      const schedules = await liveSessionApiService.getSchedules();
      setScheduleItems(pickTopScheduleItems(schedules));
    } catch {
      setScheduleItems([]);
    } finally {
      setIsScheduleLoading(false);
    }
  }, []);

  const fetchPodcasts = useCallback(async () => {
    setIsPodcastLoading(true);
    try {
      const items = await podcastService.getPublishedPodcasts();
      setPodcasts(items);
    } catch {
      setPodcasts([]);
    } finally {
      setIsPodcastLoading(false);
    }
  }, []);

  const fetchForum = useCallback(async () => {
    setIsForumLoading(true);
    try {
      // Try trending first - backend trả về { success, data: { items } }
      const trendRes = await api.get<TrendingPostsResponse>("/posts/trending", {
        params: { page: 1, pageSize: 12 },
      });

      const trendItems = (trendRes.data as any)?.data?.items ?? [];
      if (trendItems.length > 0) {
        const typedTrendItems = trendItems as TrendingPost[];
        const fallbackByUserId = typedTrendItems.reduce<Record<string, string>>(
          (acc, item) => {
            acc[item.userId] = item.userFullName ?? "Thành viên SoundMates";
            return acc;
          },
          {},
        );

        const resolvedAuthorNames = await resolveUserDisplayNames(
          typedTrendItems.map((item) => item.userId),
          fallbackByUserId,
        );

        setForumPosts(
          pickTopForumFromTrending(typedTrendItems, resolvedAuthorNames),
        );
        setIsForumLoading(false);
        return;
      }
    } catch {
      // ignore
    }

    // Fallback to published
    try {
      const pubRes = await api.get<PublishedPostsResponse>("/posts/published", {
        params: { page: 1, pageSize: 12 },
      });

      const pubItems = (pubRes.data as any)?.data?.items ?? [];
      const typedPubItems = pubItems as PublishedPost[];
      const fallbackByUserId = typedPubItems.reduce<Record<string, string>>(
        (acc, item) => {
          acc[item.userId] = item.userFullName ?? "Thành viên SoundMates";
          return acc;
        },
        {},
      );

      const resolvedAuthorNames = await resolveUserDisplayNames(
        typedPubItems.map((item) => item.userId),
        fallbackByUserId,
      );

      setForumPosts(pickTopForumItems(typedPubItems, resolvedAuthorNames));
    } catch {
      setForumPosts([]);
    } finally {
      setIsForumLoading(false);
    }
  }, []);

  // ── Fetch on mount ───────────────────────────────────────────────────────

  useEffect(() => {
    fetchSchedule();
    fetchForum();
    fetchUserPlaylists();
    fetchPodcasts();
  }, [fetchSchedule, fetchForum, fetchUserPlaylists, fetchPodcasts]);

  // ── Re-fetch khi quay về Home từ trang khác ────────────────────────────
  // Dùng useRef track prevPath để detect navigation
  useEffect(() => {
    const prev = prevPathRef.current;
    const current = location.pathname;

    // Nếu đang ở Home và trước đó đang ở trang khác → re-fetch
    if (current === "/" && prev !== "/") {
      fetchSchedule();
      fetchForum();
      fetchUserPlaylists();
      fetchPodcasts();
    }

    prevPathRef.current = current;
  }, [location.pathname, fetchSchedule, fetchForum, fetchUserPlaylists, fetchPodcasts]);

  const scrollSection = (ref: React.RefObject<HTMLDivElement | null>, direction: "prev" | "next") => {
    if (ref.current) {
      ref.current.scrollBy({ left: direction === "next" ? 400 : -400, behavior: "smooth" });
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="home-page">
      <HeroSection />

      {/* ── Playlist ── */}
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
              {PLAYLIST_TABS.map((tab) => (
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
              {isPlaylistLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="playlist-card skeleton" />
                ))
              ) : userPlaylists.length > 0 ? (
                userPlaylists.slice(0, 6).map((playlist) => (
                  <motion.div
                    key={playlist.id}
                    className="playlist-card"
                    variants={cardReveal}
                    whileHover={{ y: -8, transition: { duration: 0.25 } }}
                    onClickCapture={playlistHandlers.onClickCapture}
                    style={{ cursor: 'default' }}
                  >
                    <img
                      src={playlist.thumbnailUrl || playlistCover1}
                      alt={playlist.playlistName}
                      className="playlist-card-image"
                      draggable={false}
                    />
                    <div className="playlist-card-content">
                      <h4 className="playlist-card-title">{playlist.playlistName}</h4>
                      <p className="playlist-card-subtitle">
                        {playlist.description || `${playlist.totalTracks || 0} tracks`}
                      </p>
                    </div>
                  </motion.div>
                ))
              ) : (
                PLAYLISTS.map((playlist) => (
                  <motion.div
                    key={playlist.id}
                    className="playlist-card"
                    variants={cardReveal}
                    whileHover={{ y: -8, transition: { duration: 0.25 } }}
                    onClickCapture={playlistHandlers.onClickCapture}
                    style={{ cursor: 'default' }}
                  >
                    <img src={playlist.image} alt={playlist.title} className="playlist-card-image" draggable={false} />
                    <div className="playlist-card-content">
                      <h4 className="playlist-card-title">{playlist.title}</h4>
                      <p className="playlist-card-subtitle">{playlist.subtitle}</p>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>

            <button className="carousel-nav next" onClick={() => scrollSection(playlistRef, "next")}>
              <Icon name="chevron-right" size={24} />
            </button>
          </div>
        </div>
      </motion.section>

      {/* ── Live Room ── */}
      {(isScheduleLoading || liveSession) && (
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
              <Link to="/live" className="section-link">
                Xem thêm <Icon name="chevron-right" size={16} />
              </Link>
            </div>

            {isScheduleLoading ? (
              <div className="live-room-card skeleton" style={{ height: 160 }} />
            ) : liveSession ? (
              <div className="live-room-card">
                <div className="live-room-badge">LIVE</div>
                <div className="live-room-content">
                  <div className="live-room-info">
                    <h3 className="live-room-title">{liveSession.title}</h3>
                    <div className="live-room-meta">
                      <span><Icon name="users" size={16} /> {/* Mock số lượng hoặc từ API nếu có */} Người nghe ẩn danh</span>
                      <span><Icon name="user" size={16} /> {liveSession.host}</span>
                    </div>
                    <Link to={`/live/${liveSession.id}`} className="live-room-link">
                      Xem danh sách phát <Icon name="chevron-right" size={14} />
                    </Link>
                  </div>
                  <Link to={`/live/${liveSession.id}`} className="live-room-cta">Tham Gia</Link>
                </div>
              </div>
            ) : null}
          </div>
        </motion.section>
      )}

      {/* ── Schedule ── */}
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
            <Link to="/schedule-public" className="section-link">
              Xem tất cả <Icon name="chevron-right" size={16} />
            </Link>
          </div>

          <motion.div
            className="schedule-list"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {isScheduleLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="schedule-item skeleton" />
              ))
            ) : scheduleItems.length === 0 ? (
              <div className="section-empty">
                <Icon name="calendar" size={32} />
                <p>Chưa có lịch phát sóng nào</p>
              </div>
            ) : (
              scheduleItems.map((item) => (
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
              ))
            )}
          </motion.div>
        </div>
      </motion.section>

      {/* ── Forum ── */}
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
            <Link to="/forum" className="section-link">
              Xem tất cả <Icon name="chevron-right" size={16} />
            </Link>
          </div>

          <motion.div
            className="forum-list"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          >
            {isForumLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="forum-item skeleton" />
              ))
            ) : forumPosts.length === 0 ? (
              <div className="section-empty">
                <Icon name="file-text" size={32} />
                <p>Chưa có bài viết nào</p>
              </div>
            ) : (
              forumPosts.map((post) => (
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
                  <Link to="/forum" className="forum-item-action">
                    Xem Ngay
                  </Link>
                </motion.div>
              ))
            )}
          </motion.div>
        </div>
      </motion.section>

      {/* ── Podcast ── */}
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
            <Link to="/podcast" className="section-link">
              Xem tất cả <Icon name="chevron-right" size={16} />
            </Link>
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
              {isPodcastLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="podcast-card skeleton" />
                ))
              ) : podcasts.length > 0 ? (
                podcasts.slice(0, 8).map((podcast) => (
                  <motion.div
                    key={podcast.id}
                    className="podcast-card"
                    variants={cardReveal}
                    whileHover={{ y: -8, transition: { duration: 0.25 } }}
                    onClickCapture={podcastHandlers.onClickCapture}
                    onClick={() => navigate(`/podcast/${podcast.id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="podcast-card-image-wrapper">
                      <img
                        src={podcast.banner || playlistCover1}
                        alt={podcast.title}
                        className="podcast-card-image"
                        draggable={false}
                      />
                      <div className="podcast-card-overlay">
                        <button className="podcast-play-btn">
                          <Icon name="play" size={20} />
                        </button>
                      </div>
                    </div>
                    <div className="podcast-card-content">
                      <h4 className="podcast-card-title">{podcast.title}</h4>
                      <p className="podcast-card-subtitle">{podcast.author || "SoundMates"}</p>
                    </div>
                  </motion.div>
                ))
              ) : (
                PODCASTS.map((podcast) => (
                  <motion.div
                    key={podcast.id}
                    className="podcast-card"
                    variants={cardReveal}
                    whileHover={{ y: -8, transition: { duration: 0.25 } }}
                    onClickCapture={podcastHandlers.onClickCapture}
                    onClick={() => navigate("/podcast")}
                    style={{ cursor: "pointer" }}
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
                ))
              )}
            </motion.div>

            <button className="carousel-nav next" onClick={() => scrollSection(podcastRef, "next")}>
              <Icon name="chevron-right" size={24} />
            </button>
          </div>
        </div>
      </motion.section>

      {/* ── Subscription ── */}
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

      {/* ── About ── */}
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
