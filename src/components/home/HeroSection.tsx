import { useRef, useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Play, MessageSquare } from "lucide-react";
import heroBg from "../../assets/images/hero_music_bg.png";
import "./HeroSection.css";

/* ─── Metaball Canvas ─── */
interface Blob {
  x: number; y: number;
  vx: number; vy: number;
  r: number;
  color: [number, number, number];
}

function createBlobs(count: number, w: number, h: number): Blob[] {
  const colors: [number, number, number][] = [
    [0, 194, 255], [85, 197, 241], [58, 168, 212],
    [0, 120, 255], [20, 80, 200], [100, 220, 255],
  ];
  return Array.from({ length: count }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.7,
    vy: (Math.random() - 0.5) * 0.7,
    r: 100 + Math.random() * 150,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));
}

/* ─── Bento Grid data ─── */
const gridBlocks = [
  {
    id: 1,
    icon: 'M23 7l-7 5 7 5V7z M14 5H3a2 2 0 00-2 2v10a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2z',
    title: "Phòng Nghe Live",
    desc: "Tham gia phòng live cùng bạn bè ngay lúc này",
    size: "span-2",
    path: "/live",
  },
  {
    id: 2,
    icon: 'M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8',
    title: "Podcast",
    desc: "Thư viện podcast mỗi ngày",
    size: "",
    path: "/podcast",
  },
  {
    id: 3,
    icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    title: "Gửi Thư",
    desc: "Gửi yêu cầu podcast cho chương trình",
    size: "",
    path: "/gui-thu",
  },
  {
    id: 4,
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    title: "Lịch Phát Sóng",
    desc: "Xem các lịch phát sóng & nhận thông báo sớm nhất",
    size: "span-2",
    path: "/schedule-public",
  },
];

export default function HeroSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const blobsRef = useRef<Blob[]>([]);
  const animIdRef = useRef<number>(0);
  const heroRef = useRef<HTMLElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    for (const b of blobsRef.current) {
      const dx = mouseRef.current.x - b.x;
      const dy = mouseRef.current.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      b.vx += (dx / dist) * 0.1;
      b.vy += (dy / dist) * 0.1;
      b.vx *= 0.984;
      b.vy *= 0.984;
      b.x += b.vx;
      b.y += b.vy;
      if (b.x < -b.r) b.x = W + b.r;
      if (b.x > W + b.r) b.x = -b.r;
      if (b.y < -b.r) b.y = H + b.r;
      if (b.y > H + b.r) b.y = -b.r;
    }

    for (const b of blobsRef.current) {
      const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
      grad.addColorStop(0, `rgba(${b.color[0]},${b.color[1]},${b.color[2]},0.45)`);
      grad.addColorStop(0.45, `rgba(${b.color[0]},${b.color[1]},${b.color[2]},0.1)`);
      grad.addColorStop(1, `rgba(${b.color[0]},${b.color[1]},${b.color[2]},0)`);
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    animIdRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(dpr, dpr);
      blobsRef.current = createBlobs(9, rect.width, rect.height);
    };
    resize();
    window.addEventListener("resize", resize);
    animIdRef.current = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animIdRef.current);
    };
  }, [animate]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    mouseRef.current = { x, y };
    setMousePos({
      x: (x / rect.width - 0.5) * 2,
      y: (y / rect.height - 0.5) * 2,
    });
  }, []);

  return (
    <section className="premium-hero" ref={heroRef} onMouseMove={handleMouseMove}>
      {/* Layer 0 — background photo */}
      <div className="hero-bg-image">
        <img src={heroBg} alt="" aria-hidden="true" />
      </div>

      {/* Layer 1 — color overlay */}
      <div className="hero-color-overlay" />

      {/* Layer 2 — canvas blobs */}
      <canvas ref={canvasRef} className="hero-canvas" />

      {/* Layer 3 — noise */}
      <div className="hero-noise-overlay" />

      {/* Layer 4 — main content */}
      <div className="hero-main-content">

        {/* ── Left ── */}
        <motion.div
          className="hero-left"
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <h1 className="hero-big-title">
            <span className="hero-glow-text">SoundMates</span>
          </h1>

          <p className="hero-tagline">
            Nền tảng âm nhạc thế hệ mới —<br />
            nghe, kết nối và chia sẻ cùng cộng đồng.
          </p>

          <div className="hero-eq" aria-hidden="true">
            {Array.from({ length: 18 }).map((_, i) => (
              <span
                key={i}
                className="hero-eq-bar"
                style={{ animationDelay: `${i * 0.09}s` }}
              />
            ))}
          </div>

          <motion.div
            className="hero-ctas"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
          >
            <Link to="/live" className="hero-btn hero-btn--primary">
              <Play size={15} fill="currentColor" />
              Khám phá ngay
            </Link>
            <Link to="/forum" className="hero-btn hero-btn--ghost">
              <MessageSquare size={15} />
              Diễn đàn
            </Link>
          </motion.div>
        </motion.div>

        {/* ── Right — Bento Grid ──
            FIX: tách parallax wrapper (div) ra ngoài motion.div
            để tránh xung đột transform giữa Framer animate và inline style
        */}
        <div className="hero-bento-grid">
          {gridBlocks.map((block, i) => (
            /* Outer: motion.div chỉ chịu trách nhiệm entrance animation */
            <motion.div
              key={block.id}
              className={`bento-block ${block.size}`}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + 0.1 * i, duration: 0.5, type: "spring", stiffness: 110 }}
            >
              {/* Inner: div riêng chịu trách nhiệm parallax — không ảnh hưởng layout grid */}
              <div
                className="bento-parallax"
                style={{
                  transform: `translate(${mousePos.x * (1.5 + i * 0.8)}px, ${mousePos.y * (1.5 + i * 0.8)}px)`,
                  transition: "transform 0.12s linear",
                  height: "100%",
                }}
              >
                <Link to={block.path} className="bento-block-inner">
                  <div className="bento-icon-wrapper">
                    <svg
                      width="19" height="19" viewBox="0 0 24 24"
                      fill="none" stroke="#55C5F1"
                      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <path d={block.icon} />
                    </svg>
                  </div>
                  <h3 className="bento-title">{block.title}</h3>
                  <p className="bento-desc">{block.desc}</p>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="hero-scroll-hint"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <div className="hero-scroll-mouse">
          <div className="hero-scroll-wheel" />
        </div>
        <span>Cuộn xuống</span>
      </motion.div>
    </section>
  );
}
