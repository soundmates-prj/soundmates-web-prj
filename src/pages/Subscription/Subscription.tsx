import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/axios";
import { showToast } from "../../utils/toast";
import "./Subscription.css";
import { motion, AnimatePresence } from "framer-motion";

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

type PaymentMethod = "VNPay" | "PayOS";

export default function Subscription() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Payment method selector state
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [processingMethod, setProcessingMethod] = useState<PaymentMethod | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await api.get("/subscription-plans");
        if (response.data.success) {
          const fetchedPlans = response.data.data as Plan[];
          const sortedPlans = fetchedPlans.sort((a: Plan, b: Plan) => a.price - b.price);
          setPlans(sortedPlans);
        } else {
          setError(response.data.message || "Failed to load plans");
          showToast.error(response.data.message || "Không thể tải danh sách gói đăng ký");
        }
      } catch (err: any) {
        console.error("Error fetching plans:", err);
        setError("Có lỗi xảy ra khi tải gói đăng ký.");
        showToast.error("Có lỗi xảy ra khi tải gói đăng ký.");
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const openPaymentMethodModal = (plan: Plan) => {
    if (plan.price === 0) {
      navigate("/register");
      return;
    }
    setSelectedPlan(plan);
    setShowMethodModal(true);
  };

  const handleSubscribe = async (plan: Plan, method: PaymentMethod) => {
    setProcessingMethod(method);
    setShowMethodModal(false);

    const toastId = showToast.loading("Đang xử lý thanh toán...");
    try {
      // Luôn gửi returnUrl để backend redirect đúng về frontend
      const frontendUrl = window.location.origin;
      const returnUrl = `${frontendUrl}/payment/result`;

      const response = await api.post("/payments", {
        targetType: "Subscription",
        targetId: plan.id ?? plan.planName,
        method: method,
        totalAmount: plan.price,
        returnUrl,
      });

      showToast.dismiss(toastId);

      if (response.data && response.data.paymentUrl) {
        showToast.success("Đang chuyển hướng đến cổng thanh toán...");
        window.location.href = response.data.paymentUrl;
      } else {
        showToast.success("Đăng ký thành công!");
      }
    } catch (err: any) {
      showToast.dismiss(toastId);
      console.error("Payment error:", err);
      showToast.error(err.response?.data?.message || "Có lỗi xảy ra khi tạo thanh toán.");
    } finally {
      setProcessingMethod(null);
      setSelectedPlan(null);
    }
  };

  const getFeatures = (plan: Plan) => {
    const tierName = plan.planName.toLowerCase();
    const isFree = tierName.includes("free") || plan.price === 0;
    const isPremium = tierName.includes("premium");

    const features = [
      "Thưởng thức âm nhạc & podcast không giới hạn",
      "Giao lưu vui vẻ cùng cộng đồng trong phòng Live",
    ];

    if (isFree) {
      features.push(`<strong>${plan.requestLimit} lượt yêu cầu bài hát</strong> mỗi ngày (Đủ cho một buổi sáng chill đúng không nè?)`);
      features.push("Chưa hỗ trợ Podcast & AI Clone (Gói nâng cấp đang chờ bạn khám phá đó!)");
    } else if (isPremium) {
      features.push("Mọi đặc quyền từ gói Miễn Phí");
      features.push(`<strong>${plan.requestLimit} lượt yêu cầu bài hát</strong> mỗi ngày (Thoải mái quẩy cả ngày luôn nhé!)`);
      features.push(`<strong>${plan.podcastRequestLimit} lượt tạo Podcast</strong> mỗi ngày`);
      features.push(`Tự tạo <strong>${plan.voiceModelLimit} giọng nói AI</strong> của riêng bạn`);
      features.push(`<strong>${plan.ttsMinuteLimit} phút</strong> AI đọc văn bản (Tổng thời lượng mỗi tháng)`);
      features.push("Theme giao diện cơ bản (Nhìn là mê, xài là phê)");
    } else {
      features.push("Đẳng cấp tối thượng - dành riêng cho hệ 'VIP'");
      features.push(`<strong>${plan.requestLimit} lượt yêu cầu nhạc + Ưu tiên hàng đợi</strong> (Chốt đơn là phát ngay!)`);
      features.push(`<strong>${plan.podcastRequestLimit} lượt tạo Podcast</strong> mỗi ngày`);
      features.push(`Tự do sáng tạo tới <strong>${plan.voiceModelLimit} giọng AI</strong> từ bất kỳ nguồn nào`);
      features.push(`<strong>${plan.ttsMinuteLimit} phút</strong> AI đọc văn bản (Tổng thời lượng mỗi tháng)`);
      features.push("Cập nhật mọi Theme mới nhất & 'chanh sả' nhất");
    }

    return features;
  };

  if (loading) {
    return <div className="subscription-page"><div className="subscription-header"><h1 className="subscription-title">Đang tải...</h1></div></div>;
  }

  if (error) {
    return <div className="subscription-page"><div className="subscription-header"><h1 className="subscription-title">{error}</h1></div></div>;
  }

  return (
    <div className="subscription-page">
      {/* Page Title */}
      <motion.div
        className="subscription-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="subscription-title">Gói đăng ký</h1>
        <p className="subscription-subtitle">Chào mừng bạn! Hãy chọn một gói dịch vụ để bắt đầu hành trình âm nhạc tuyệt vời nhé.</p>
      </motion.div>

      {/* Subscription Plans */}
      <div className="subscription-plans">
        {plans
          .sort((a, b) => {
            const getOrder = (plan: Plan) => {
              const name = plan.planName.toLowerCase();
              if (name.includes("free") || plan.price === 0) return 0;
              if (name.includes("elite")) return 1; // Elite in the center
              if (name.includes("premium")) return 2;
              return 3;
            };
            return getOrder(a) - getOrder(b);
          })
          .map((plan, index) => {
            const tierName = plan.planName.toLowerCase();
            const isElite = tierName.includes("elite");
            const isPremium = tierName.includes("premium");
            const isCurrentPlan = false;

            let cardClass = "free";
            if (isElite) cardClass = "elite";
            else if (isPremium) cardClass = "premium";

            const getPlanDescription = (plan: Plan) => {
              const name = plan.planName.toLowerCase();
              if (name.includes("free") || plan.price === 0) return "Trải nghiệm cơ bản, không cần thanh toán.";
              if (name.includes("premium")) return "Nâng cấp giới hạn và mở khóa AI giọng đọc.";
              if (name.includes("elite")) return "Toàn quyền truy cập, ưu tiên cao nhất.";
              return plan.description;
            };

            return (
              <motion.div
                key={plan.id ?? `${plan.planName}-${index}`}
                className={`subscription-card ${cardClass} ${isCurrentPlan ? "current" : ""
                  }`}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                whileHover={{ y: -10, transition: { duration: 0.2 } }}
              >
                {isElite && (
                  <div className="popular-badge">Elite</div>
                )}

                <div className="plan-header">
                  <h2 className="plan-name">{plan.planName}</h2>
                  <div className="plan-pricing">
                    {plan.price > 0 && <span className="currency">đ</span>}
                    <span className="price">
                      {plan.price === 0 ? "Miễn Phí" : plan.price.toLocaleString("vi-VN")}
                    </span>
                    {plan.price > 0 && plan.durationDays > 0 && (
                      <span className="period">/{plan.durationDays} Ngày</span>
                    )}
                  </div>
                  <p className="plan-description">{getPlanDescription(plan)}</p>
                </div>

                <motion.button
                  className="plan-button"
                  onClick={() => openPaymentMethodModal(plan)}
                  disabled={isCurrentPlan || processingMethod !== null}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isCurrentPlan
                    ? "Đang sử dụng"
                    : plan.price === 0
                      ? "Đăng ký"
                      : processingMethod !== null && selectedPlan?.id === plan.id
                        ? "Đang xử lý..."
                        : "Chọn Gói Này"}
                </motion.button>

                <div className="plan-features">
                  <h3 className="features-title">Ưu đãi dành cho bạn:</h3>
                  <ul className="features-list">
                    {getFeatures(plan).map((feature, idx) => (
                      <li
                        key={idx}
                        dangerouslySetInnerHTML={{ __html: feature }}
                      />
                    ))}
                  </ul>
                </div>

                {plan.price > 0 && (
                  <p className="included-features">Bao gồm tất cả các tính năng từ gói Miễn Phí</p>
                )}

                {isCurrentPlan && (
                  <div className="current-plan-badge">Gói bạn đang đồng hành cùng chúng mình</div>
                )}
              </motion.div>
            );
          })}
      </div>

      {/* Payment Method Modal */}
      <AnimatePresence>
        {showMethodModal && selectedPlan && (
          <>
            {/* Backdrop */}
            <motion.div
              className="modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowMethodModal(false);
                setSelectedPlan(null);
              }}
            />

            {/* Modal */}
            <motion.div
              className="payment-method-modal"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="modal-header">
                <h3>Chọn phương thức thanh toán</h3>
                <button
                  className="modal-close"
                  onClick={() => {
                    setShowMethodModal(false);
                    setSelectedPlan(null);
                  }}
                >
                  &times;
                </button>
              </div>

              <div className="modal-body">
                <div className="modal-plan-info">
                  <span className="modal-plan-name">{selectedPlan.planName}</span>
                  <span className="modal-plan-price">
                    {selectedPlan.price.toLocaleString("vi-VN")} đ
                  </span>
                </div>

                <div className="payment-methods">
                  {/* VNPay */}
                  <motion.button
                    className="payment-method-btn"
                    onClick={() => handleSubscribe(selectedPlan, "VNPay")}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="payment-method-icon vnpay">
                      <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
                      </svg>
                    </div>
                    <div className="payment-method-info">
                      <span className="payment-method-name">VNPay</span>
                      <span className="payment-method-desc">Thanh toán qua VNPay QR</span>
                    </div>
                    <div className="payment-method-arrow">›</div>
                  </motion.button>

                  {/* PayOS */}
                  <motion.button
                    className="payment-method-btn"
                    onClick={() => handleSubscribe(selectedPlan, "PayOS")}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="payment-method-icon payos">
                      <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                        <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12z" />
                        <path d="M7 10h2v4H7zm4-1h2v5h-2zm4 3h2v2h-2z" />
                      </svg>
                    </div>
                    <div className="payment-method-info">
                      <span className="payment-method-name">PayOS</span>
                      <span className="payment-method-desc">Thanh toán qua PayOS - Ví điện tử</span>
                    </div>
                    <div className="payment-method-arrow">›</div>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
