import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/axios";
import { showToast } from "../../utils/toast";
import vnpayLogo from "../../assets/vnpay_logo.png";
import payosLogo from "../../assets/payos_logo.png";
import "./Subscription.css";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Plan {
  id?: string;
  planName: string;
  price: number;
  durationDays: number;
  requestLimit: number;
  voiceModelLimit: number;
  ttsMinuteLimit: number;
  podcastRequestLimit: number;
  isActive?: boolean;
  description: string;
}

interface CurrentSubscription {
  id: string;
  planId: string;
  planName: string;
  status: string;
  startDate: string;
  endDate: string;
  subscribeAt: string;
}

interface SubscriptionHistoryItem {
  id: string;
  planId: string;
  planName: string;
  status: string;
  startDate: string;
  endDate: string;
  subscribeAt: string;
}

interface TransactionItem {
  id: string;
  paymentId: string;
  paymentProvider: string;
  paymentMethod: string;
  amount: number;
  paymentAt: string;
  transactionStatus: string;
  createdAt: string;
}

type PaymentMethod = "VNPay" | "PayOS";
type HistoryTab = "current" | "history";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const normalizeText = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

const detectPlanTier = (plan: Plan): "free" | "premium" | "elite" | "other" => {
  if (plan.price === 0) return "free";
  const name = normalizeText(plan.planName);
  if (name.includes("elite") || name.includes("hoi vien")) return "elite";
  if (name.includes("premium")) return "premium";
  return "other";
};

const getTierOrder = (tier: ReturnType<typeof detectPlanTier>) => {
  switch (tier) {
    case "free": return 0;
    case "elite": return 1;
    case "premium": return 2;
    default: return 3;
  }
};

const formatDate = (value?: string) => {
  if (!value) return "N/A";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleDateString("vi-VN");
};

const formatCurrency = (value?: number) => {
  if (typeof value !== "number" || Number.isNaN(value)) return "N/A";
  return value.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
};

const formatStatusLabel = (value?: string) => {
  const n = (value || "").trim().toLowerCase();
  if (!n) return "N/A";
  if (n === "active") return "Đang hoạt động";
  if (n === "expired") return "Đã hết hạn";
  if (n === "cancelled" || n === "canceled") return "Đã hủy";
  if (n === "success") return "Thành công";
  if (n === "pending") return "Đang xử lý";
  if (n === "failed") return "Thất bại";
  return value || "N/A";
};

const getStatusColor = (value?: string) => {
  const n = (value || "").trim().toLowerCase();
  if (n === "active" || n === "success") return "#10B981";
  if (n === "pending") return "#F59E0B";
  if (["cancelled", "canceled", "failed", "expired"].includes(n)) return "#EF4444";
  return "#6B7280";
};

// ─── FAQ Item ────────────────────────────────────────────────────────────────

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="faq-item">
      <button className="faq-question" onClick={() => setOpen((p) => !p)}>
        <span>{question}</span>
        <span className={`faq-chevron${open ? " faq-chevron--open" : ""}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="faq-answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <p>{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── History Modal ──────────────────────────────────────────────────────────

function HistoryModal({
  current,
  history,
  transactions,
  onClose,
}: {
  current: CurrentSubscription | null;
  history: SubscriptionHistoryItem[];
  transactions: TransactionItem[];
  onClose: () => void;
}) {
  const [tab, setTab] = useState<HistoryTab>("current");
  const latestTx = transactions[0] || null;

  const meta = (label: string, value: string, color?: string) => (
    <div className="history-meta-row">
      <span className="history-meta-label">{label}</span>
      <span className="history-meta-value" style={color ? { color } : undefined}>{value}</span>
    </div>
  );

  const subCard = (s: CurrentSubscription | SubscriptionHistoryItem, header = false) => (
    <div className="history-card">
      {header && <h4 className="history-card-title">Thông tin gói</h4>}
      {meta("Tên gói", s.planName || "N/A")}
      {meta("Trạng thái", formatStatusLabel(s.status), getStatusColor(s.status))}
      {meta("Ngày bắt đầu", formatDate(s.startDate))}
      {meta("Ngày hết hạn", formatDate(s.endDate))}
      {meta("Ngày đăng ký", formatDate(s.subscribeAt))}
    </div>
  );

  const txCard = (t: TransactionItem, header = false) => (
    <div className="history-card">
      {header && <h4 className="history-card-title">Thông tin giao dịch</h4>}
      {meta("Mã giao dịch", t.id || "N/A")}
      {meta("Mã payment", t.paymentId || "N/A")}
      {meta("Nhà cung cấp", t.paymentProvider || "N/A")}
      {meta("Phương thức", t.paymentMethod || "N/A")}
      {meta("Số tiền", formatCurrency(t.amount))}
      {meta("Trạng thái", formatStatusLabel(t.transactionStatus), getStatusColor(t.transactionStatus))}
      {meta("Ngày thanh toán", formatDate(t.paymentAt))}
    </div>
  );

  const empty = (msg: string) => (
    <div className="history-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="2" />
      </svg>
      <p>{msg}</p>
    </div>
  );

  return (
    <>
      <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        className="history-modal"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        <div className="modal-header">
          <h3>Chi tiết đăng ký &amp; Lịch sử</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="history-tabs">
          <button className={`history-tab${tab === "current" ? " history-tab--active" : ""}`} onClick={() => setTab("current")}>Gói hiện tại</button>
          <button className={`history-tab${tab === "history" ? " history-tab--active" : ""}`} onClick={() => setTab("history")}>Lịch sử</button>
        </div>

        <div className="history-body">
          {tab === "current" ? (
            <div className="history-tab-content">
              {current ? (
                <>
                  {subCard(current, true)}
                  {latestTx ? txCard(latestTx, true) : empty("Không có giao dịch cho gói hiện tại.")}
                </>
              ) : empty("Bạn chưa có gói đăng ký nào đang hoạt động.")}
            </div>
          ) : (
            <div className="history-tab-content">
              {history.length > 0 && (
                <div className="history-section">
                  <h4 className="history-section-title">Lịch sử gói đăng ký</h4>
                  {history.map((item) => subCard(item))}
                </div>
              )}
              {transactions.length > 0 && (
                <div className="history-section">
                  <h4 className="history-section-title">Lịch sử giao dịch</h4>
                  {transactions.map((t) => txCard(t))}
                </div>
              )}
              {history.length === 0 && transactions.length === 0 && empty("Chưa có lịch sử gói đăng ký hoặc giao dịch.")}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}

// ─── Feature List ────────────────────────────────────────────────────────────

interface FeatureDef { text: string; bold?: string }

function getFeatures(plan: Plan, tier: ReturnType<typeof detectPlanTier>): FeatureDef[] {
  const base: FeatureDef[] = [
    { text: "Thưởng thức âm nhạc & podcast không giới hạn" },
    { text: "Giao lưu vui vẻ cùng cộng đồng trong phòng Live" },
  ];

  if (tier === "free") {
    return [
      ...base,
      { text: "Chưa hỗ trợ Podcast & AI Clone" },
    ];
  }
  if (tier === "elite") {
    return [
      ...base,
      { text: `${plan.requestLimit} lượt yêu cầu nhạc`, bold: 'mỗi ngày' },
      { text: "Đăng bán tối đa", bold: "2 Podcast" },
      { text: "Theme giao diện cơ bản" },
    ];
  }
  // premium
  return [
    ...base,
    { text: "Mọi đặc quyền từ gói Miễn Phí" },
    { text: `${plan.requestLimit} lượt yêu cầu nhạc`, bold: " mỗi ngày" },
    { text: "Tạo tối đa", bold: "5 Podcast mỗi ngày" },
    { text: "Mở khóa tính năng", bold: "đăng bán Podcast" },
    { text: "Tự tạo giọng nói AI", bold: `${plan.voiceModelLimit} giọng` },
    { text: "AI đọc văn bản", bold: `${plan.ttsMinuteLimit} phút/tháng` },
    { text: "Cập nhật mọi Theme mới nhất & 'đặc biệt' nhất" },
  ];
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function Subscription() {
  const navigate = useNavigate();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSub, setCurrentSub] = useState<CurrentSubscription | null>(null);
  const [subHistory, setSubHistory] = useState<SubscriptionHistoryItem[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Payment modal
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [processingMethod, setProcessingMethod] = useState<PaymentMethod | null>(null);

  // ── Fetch all data ───────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    const [plansR, subR, histR, txR] = await Promise.allSettled([
      api.get("/subscription-plans"),
      api.get("/me/subscriptions"),
      api.get("/me/subscriptions/history?page=1&pageSize=20"),
      api.get("/me/transaction/history?page=1&pageSize=50"),
    ]);

    // Plans
    if (plansR.status === "fulfilled" && plansR.value.data?.success) {
      const fetched = plansR.value.data.data as Plan[];
      setPlans(
        fetched
          .filter((p) => p.isActive !== false)
          .sort((a, b) => {
            // Sort: free=1, premium=2, elite=3 → renders as [Free, Premium, Elite]
            // Then CSS order:-1 on Elite moves it to visual column 1 (center on 3-col grid)
            const orderA = getTierOrder(detectPlanTier(a));
            const orderB = getTierOrder(detectPlanTier(b));
            return orderA - orderB;
          })
      );
    } else {
      const msg = plansR.status === "fulfilled" ? plansR.value.data?.message : (plansR as PromiseRejectedResult).reason?.message;
      showToast.error(msg || "Không thể tải danh sách gói đăng ký.");
    }

    // Current sub
    if (subR.status === "fulfilled" && subR.value.data?.success) {
      setCurrentSub(subR.value.data.data);
    }

    // History
    if (histR.status === "fulfilled" && histR.value.data?.success) {
      setSubHistory(histR.value.data.data?.items || []);
    }

    // Transactions
    if (txR.status === "fulfilled" && txR.value.data?.success) {
      const items = txR.value.data.data?.items || [];
      setTransactions([...items].sort((a, b) => {
        const ta = new Date(a.paymentAt || a.createdAt).getTime();
        const tb = new Date(b.paymentAt || b.createdAt).getTime();
        return tb - ta;
      }));
    }

    setLoading(false);
  }, []);

  // ── Scroll to top on mount / route change ───────────────────────────────
  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo(0, 0);

    // Also reset any parent scroll containers
    let el = document.documentElement;
    while (el) {
      el.scrollTop = 0;
      el = el.parentElement as HTMLElement;
    }
  }, []);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  // ── Payment ──────────────────────────────────────────────────────────────

  const openModal = (plan: Plan) => {
    if (plan.price === 0) { navigate("/register"); return; }
    setSelectedPlan(plan);
    setShowMethodModal(true);
  };

  const handlePay = async (plan: Plan, method: PaymentMethod) => {
    setProcessingMethod(method);
    setShowMethodModal(false);
    const toastId = showToast.loading("Đang xử lý thanh toán...");
    try {
      const returnUrl = `${window.location.origin}/payment/result`;
      const res = await api.post("/payments", {
        targetType: "Subscription",
        targetId: plan.id ?? plan.planName,
        method,
        totalAmount: plan.price,
        returnUrl,
      });
      showToast.dismiss(toastId);
      if (res.data?.paymentUrl) {
        showToast.success("Đang chuyển hướng đến cổng thanh toán...");
        window.location.href = res.data.paymentUrl;
      } else {
        showToast.success("Đăng ký thành công!");
        void fetchAll();
      }
    } catch (err: any) {
      showToast.dismiss(toastId);

      // Guest chưa đăng nhập → redirect sang /login
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate("/login", { replace: true });
        return;
      }

      showToast.error(err.response?.data?.message || "Có lỗi xảy ra khi tạo thanh toán.");
    } finally {
      setProcessingMethod(null);
      setSelectedPlan(null);
    }
  };

  // ── Render states ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="subscription-page">
        <div className="subscription-header">
          <h1 className="subscription-title">Chọn Gói Dịch Vụ</h1>
          <p className="subscription-subtitle">Đang Tải Bảng Giá...</p>
        </div>
        <div className="subscription-loading">
          <div className="subscription-spinner" />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="subscription-page">
        <div className="subscription-header">
          <h1 className="subscription-title">Gói Đăng Ký</h1>
          <p className="subscription-subtitle">{loadError}</p>
        </div>
        <div className="subscription-error-actions">
          <motion.button className="retry-button" onClick={() => void fetchAll()} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            Thử lại
          </motion.button>
        </div>
      </div>
    );
  }

  if (!plans.length) {
    return (
      <div className="subscription-page">
        <div className="subscription-header">
          <h1 className="subscription-title">Gói Đăng Ký</h1>
          <p className="subscription-subtitle">Hiện chưa có gói đăng ký khả dụng. Vui lòng quay lại sau.</p>
        </div>
      </div>
    );
  }

  // ── JSX ────────────────────────────────────────────────────────────────

  const currentPlanId = currentSub?.planId ?? null;
  const daysLeft = currentSub?.endDate
    ? Math.ceil((new Date(currentSub.endDate).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div className="subscription-page">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <motion.div className="subscription-header"
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <h1 className="subscription-title">Chọn gói dịch vụ</h1>
        <p className="subscription-subtitle">Nâng cao trải nghiệm âm nhạc và sáng tạo nội dung với các gói dịch vụ linh hoạt, phù hợp với mọi nhu cầu.</p>
      </motion.div>

      {/* ── Current Plan Banner ──────────────────────────────────────── */}
      {/* {currentSub && (
        <motion.div
          className="current-plan-banner"
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
          onClick={() => setShowHistory(true)} role="button" tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setShowHistory(true)}
        >
          <div className="current-plan-banner-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
              <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
            </svg>
          </div>
          <div className="current-plan-banner-text">
            <span className="current-plan-banner-caption">Gói hiện tại của bạn</span>
            <span className="current-plan-banner-name">
              {currentSub.planName}
              <span className="current-plan-banner-status" style={{ color: getStatusColor(currentSub.status) }}>
                {formatStatusLabel(currentSub.status)}
              </span>
            </span>
          </div>
          {daysLeft !== null && daysLeft > 0 && (
            <div className="current-plan-banner-tag">{daysLeft} ngày</div>
          )}
          <button className="current-plan-history-btn" onClick={(e) => { e.stopPropagation(); setShowHistory(true); }} aria-label="Xem lịch sử">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          </button>
        </motion.div>
      )} */}

      {/* ── Plan Cards ───────────────────────────────────────────────── */}
      <div className="subscription-plans">
        {plans.map((plan, index) => {
          const tier = detectPlanTier(plan);
          const cardClass = tier === "premium" ? "elite" : tier === "elite" ? "premium" : "free";
          const isCurrent = plan.id === currentPlanId;
          const isProcessing = processingMethod !== null && selectedPlan?.id === plan.id;

          return (
            <motion.div
              key={plan.id ?? `${plan.planName}-${index}`}
              className={`subscription-card ${cardClass}${isCurrent ? " current" : ""}${tier === "premium" ? " order-elite" : ""}`}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
            >
              {/* Badges */}
              {tier === "premium" && (
                <div className="popular-badge">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="#ffffff" stroke="none">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  Yêu thích nhất
                </div>
              )}


              {/* Header */}
              <div className="plan-header">
                <h2 className="plan-name">{plan.planName}</h2>
                <div className="plan-pricing">
                  {plan.price > 0 && <span className="currency">đ</span>}
                  <span className="price">{plan.price === 0 ? "Miễn Phí" : plan.price.toLocaleString("vi-VN")}</span>
                  {plan.price > 0 && plan.durationDays > 0 && <span className="period">/{plan.durationDays} Ngày</span>}
                </div>
                <p className="plan-description">
                  {plan.planName.toLowerCase().includes("free") || plan.price === 0
                    ? "Khởi đầu hoàn hảo. Trải nghiệm âm nhạc cơ bản miễn phí."
                    : plan.planName.toLowerCase().includes("premium")
                      ? "Đẳng cấp thượng lưu. Tự do sáng tạo với toàn bộ tính năng cao cấp nhất."
                      : plan.planName.toLowerCase().includes("elite")
                        ? "Nâng tầm trải nghiệm. Mở khóa tính năng đăng bán Podcast."
                        : plan.description}
                </p>
              </div>

              {/* Button */}
              {(!isCurrent ? plan.price > (plans.find(p => p.id === currentPlanId)?.price || 0) : true) && plan.price > 0 && (
                <motion.button
                  className="plan-button"
                  onClick={() => isCurrent ? undefined : openModal(plan)}
                  disabled={isCurrent || isProcessing}
                  style={isCurrent ? { opacity: 0.7, cursor: "not-allowed", background: "#10b981", color: "#fff", border: "none" } : {}}
                  whileHover={!isCurrent && !isProcessing ? { scale: 1.05 } : {}}
                  whileTap={!isCurrent && !isProcessing ? { scale: 0.95 } : {}}
                >
                  {isCurrent
                    ? "Đang sở hữu"
                    : isProcessing
                      ? "Đang xử lý..."
                      : ((plans.find(p => p.id === currentPlanId)?.price || 0) > 0 ? "Nâng cấp" : "Chọn Gói Này")}
                </motion.button>
              )}

              {/* Features */}
              <div className="plan-features">
                <h3 className="features-title">Ưu đãi dành cho bạn:</h3>
                <ul className="features-list">
                  {getFeatures(plan, tier).map((f, i) => (
                    <li key={i}>
                      <span>{f.text} {f.bold && <strong>{f.bold}</strong>}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {plan.price > 0 && (
                <p className="included-features">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                  </svg>
                  Bao gồm tất cả tính năng từ gói Miễn Phí
                </p>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* ── FAQ Section ──────────────────────────────────────────────── */}
      <motion.div className="faq-section" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
        <div className="faq-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
            <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <h3 className="faq-title">Câu hỏi thường gặp</h3>
        </div>
        <div className="faq-list">
          <FaqItem question="Tôi có thể hủy gói bất kỳ lúc nào không?" answer="Có, bạn có thể hủy gói đăng ký bất kỳ lúc nào. Gói sẽ vẫn hoạt động đến hết kỳ thanh toán hiện tại." />
          <FaqItem question="Thanh toán có an toàn không?" answer="Hoàn toàn an toàn. Chúng tôi sử dụng các cổng thanh toán uy tín (VNPay, PayOS) và mã hóa SSL 256-bit." />
          <FaqItem question="Tôi có thể đổi gói không?" answer="Có, bạn có thể nâng cấp hoặc hạ cấp gói bất kỳ lúc nào. Phần chênh lệch sẽ được tính theo ngày sử dụng còn lại." />
          <FaqItem question="Gói Miễn Phí có giới hạn không?" answer="Gói Miễn Phí cho phép bạn sử dụng các tính năng cơ bản với giới hạn request nhạc mỗi ngày. Các tính năng nâng cao như Podcast AI hay Voice Clone chỉ có ở gói trả phí." />
        </div>
      </motion.div>

      {/* ── Payment Modal ────────────────────────────────────────────── */}
      <AnimatePresence>
        {showMethodModal && selectedPlan && (
          <>
            <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setShowMethodModal(false); setSelectedPlan(null); }} />
            <motion.div className="payment-method-modal"
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }} transition={{ type: "spring", damping: 25, stiffness: 300 }}>
              <div className="modal-header">
                <h3>Chọn phương thức thanh toán</h3>
                <button className="modal-close" onClick={() => { setShowMethodModal(false); setSelectedPlan(null); }}>&times;</button>
              </div>
              <div className="modal-body">
                <div className="modal-plan-info">
                  <span className="modal-plan-name">{selectedPlan.planName}</span>
                  <span className="modal-plan-price">{selectedPlan.price.toLocaleString("vi-VN")} đ</span>
                </div>
                <div className="payment-methods">
                  <motion.button className="payment-method-btn" onClick={() => handlePay(selectedPlan, "VNPay")} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <img src={vnpayLogo} alt="VNPay" className="payment-method-logo vnpay" />
                    <div className="payment-method-info">
                      <span className="payment-method-name">VNPay</span>
                      <span className="payment-method-desc">Thanh toán qua VNPay QR</span>
                    </div>
                    <span className="payment-method-arrow">›</span>
                  </motion.button>
                  <motion.button className="payment-method-btn" onClick={() => handlePay(selectedPlan, "PayOS")} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <img src={payosLogo} alt="PayOS" className="payment-method-logo payos" />
                    <div className="payment-method-info">
                      <span className="payment-method-name">PayOS</span>
                      <span className="payment-method-desc">Thanh toán qua PayOS — Ví điện tử</span>
                    </div>
                    <span className="payment-method-arrow">›</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── History Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showHistory && (
          <HistoryModal
            current={currentSub}
            history={subHistory}
            transactions={transactions}
            onClose={() => setShowHistory(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
