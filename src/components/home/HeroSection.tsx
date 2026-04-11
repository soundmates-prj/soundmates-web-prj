import { useRef, useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Icon from "../common/Icon";
import "./HeroSection.css";

/* ─── Metaball Canvas Background ─── */
interface Blob {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: [number, number, number];
}

function createBlobs(count: number, w: number, h: number): Blob[] {
  const colors: [number, number, number][] = [
    [0, 194, 255],   // cyan
    [85, 197, 241],   // primary
    [58, 168, 212],   // dark primary
    [0, 120, 255],    // deep blue
    [20, 80, 200],    // royal blue
    [100, 220, 255],  // light cyan
  ];
  return Array.from({ length: count }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 1.2,
    vy: (Math.random() - 0.5) * 1.2,
    r: 80 + Math.random() * 120,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));
}

/* ─── Bento Grid Block Data ─── */
const gridBlocks = [
  {
    id: 1,
    icon: 'M23 7l-7 5 7 5V7z M14 5H3a2 2 0 00-2 2v10a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2z',
    title: "Phòng Nghe",
    desc: "Tham gia phòng live cùng bạn bè",
    size: "span-2",
    path: "/live",
  },
  {
    id: 2,
    icon: 'M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3zM19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8',
    title: "Podcast",
    desc: "Thư podcast mỗi ngày",
    size: "",
    path: "/podcast",
  },
  {
    id: 3,
    icon: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z',
    title: "Diễn Đàn",
    desc: "Chia sẻ cảm xúc âm nhạc",
    size: "",
    path: "/forum",
  },
  {
    id: 4,
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    title: "Lịch Phát Sóng",
    desc: "Đặt lịch & nhận thông báo",
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

  /* ─── Canvas Animation ─── */
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const mx = mouseRef.current.x;
    const my = mouseRef.current.y;

    ctx.clearRect(0, 0, W, H);

    // Update blobs
    for (const b of blobsRef.current) {
      // Mouse attraction — subtle pull
      const dx = mx - b.x;
      const dy = my - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      b.vx += (dx / dist) * 0.15;
      b.vy += (dy / dist) * 0.15;

      // Damping
      b.vx *= 0.985;
      b.vy *= 0.985;

      b.x += b.vx;
      b.y += b.vy;

      // Bounce
      if (b.x < -b.r) b.x = W + b.r;
      if (b.x > W + b.r) b.x = -b.r;
      if (b.y < -b.r) b.y = H + b.r;
      if (b.y > H + b.r) b.y = -b.r;
    }

    // Draw blobs with radial gradients
    for (const b of blobsRef.current) {
      const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
      grad.addColorStop(0, `rgba(${b.color[0]},${b.color[1]},${b.color[2]},0.6)`);
      grad.addColorStop(0.5, `rgba(${b.color[0]},${b.color[1]},${b.color[2]},0.15)`);
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
      blobsRef.current = createBlobs(8, rect.width, rect.height);
    };

    resize();
    window.addEventListener("resize", resize);

    animIdRef.current = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animIdRef.current);
    };
  }, [animate]);

  /* ─── Mouse Tracking ─── */
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    mouseRef.current = { x, y };
    setMousePos({ x: (x / rect.width - 0.5) * 2, y: (y / rect.height - 0.5) * 2 });
  }, []);

  return (
    <section className="premium-hero" ref={heroRef} onMouseMove={handleMouseMove}>
      {/* Canvas background */}
      <canvas ref={canvasRef} className="hero-canvas" />
      <div className="hero-blur-overlay" />
      <div className="hero-noise-overlay" />

      {/* Main content */}
      <div className="hero-main-content">
        {/* Left — Headline */}
        <motion.div
          className="hero-headline"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <h1 className="hero-big-title">
            <span className="hero-glow-text">SoundMates</span>
          </h1>
          <p className="hero-tagline">Nền tảng âm nhạc thế hệ mới — nghe, kết nối, chia sẻ</p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Link to="/live" className="hero-btn">
              Khám phá ngay
              <Icon name="play" size={18} />
            </Link>
          </motion.div>
        </motion.div>

        {/* Right — Bento Grid */}
        <div className="hero-bento-grid">
          {gridBlocks.map((block, i) => (
            <motion.div
              key={block.id}
              className={`bento-block ${block.size}`}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.15 * i, duration: 0.5, type: "spring", stiffness: 120 }}
              style={{
                transform: `translate(${mousePos.x * (3 + i * 1.5)}px, ${mousePos.y * (3 + i * 1.5)}px)`,
              }}
            >
              <Link to={block.path} className="bento-block-inner">
                <div className="bento-icon-wrapper">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#55C5F1"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={block.icon} />
                  </svg>
                </div>
                <h3 className="bento-title">{block.title}</h3>
                <p className="bento-desc">{block.desc}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
