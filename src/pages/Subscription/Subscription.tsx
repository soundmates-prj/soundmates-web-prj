import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/axios";
import { showToast } from "../../utils/toast";
import "./Subscription.css";
import { motion } from "framer-motion";

interface Plan {
  id?: string;
  planName: string;
  price: number;
  durationDays: number;
  requestLimit: number;
  isActive?: boolean;
  description: string;
}

export default function Subscription() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleSubscribe = async (plan: Plan) => {
    // Nếu là gói free, redirect về trang đăng ký
    if (plan.price === 0) {
      navigate("/register");
      return;
    }

    const toastId = showToast.loading("Đang xử lý thanh toán...");
    try {
      const response = await api.post("/payments", {
        targetType: "Subscription",
        targetId: plan.id ?? plan.planName,
        method: "VNPay",
        totalAmount: plan.price,
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
    }
  };

  const getFeatures = (plan: Plan) => {
    const tierName = plan.planName.toLowerCase();
    const features = [
      "Nghe podcast/music không giới hạn",
      "Tham gia phiên live trực tuyến",
      `Gửi request phát nhạc <strong>${plan.requestLimit} request/ngày</strong>`,
    ];
    if (tierName.includes("free") || plan.price === 0) {
      features.push("Chất lượng âm thanh tiêu chuẩn");
    } else if (tierName.includes("premium")) {
      features.push("Tạo giọng đọc AI dựa trên giọng thật của bạn <strong>(Giới hạn)</strong>");
      features.push("Áp dụng các <strong>Theme</strong> cơ bản");
    } else {
      features.push("Tạo giọng đọc AI dựa trên giọng thật của bạn <strong>(Không giới hạn)</strong>");
      features.push("Ưu tiên request khi tham gia phòng live");
      features.push("Áp dụng các <strong>Theme</strong> mới nhất của nền tảng");
      features.push("Gửi thư podcast trực tuyến trong livestream");
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
        <p className="subscription-subtitle">Nâng tầm trải nghiệm âm nhạc của bạn cùng SoundMates</p>
      </motion.div>

      {/* Subscription Plans */}
      <div className="subscription-plans">
        {plans
          .sort((a, b) => {
            // Sort: Free (0), Elite (2), Premium (1)
            const getOrder = (plan: Plan) => {
              const name = plan.planName.toLowerCase();
              if (name.includes("free") || plan.price === 0) return 0;
              if (name.includes("elite")) return 1;
              if (name.includes("premium")) return 2;
              return 3;
            };
            return getOrder(a) - getOrder(b);
          })
          .map((plan, index) => {
          const tierName = plan.planName.toLowerCase();
          const isElite = tierName.includes("elite");
          const isPremium = tierName.includes("premium");
          const isCurrentPlan = false; // TODO: Fetch current user plan
          
          let cardClass = "free";
          if (isElite) cardClass = "elite";
          else if (isPremium) cardClass = "premium";

          return (
            <motion.div
              key={plan.id ?? `${plan.planName}-${index}`}
              className={`subscription-card ${cardClass} ${
                isCurrentPlan ? "current" : ""
              }`}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              whileHover={{ y: -10, transition: { duration: 0.2 } }}
            >
              {/* Most Popular Badge for Premium */}
              {isElite && (
                <div className="popular-badge">Elite</div>
              )}

              {/* Plan Header */}
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
                <p className="plan-description">{plan.description}</p>
              </div>

              {/* Subscribe Button */}
              <motion.button 
                className="plan-button" 
                onClick={() => handleSubscribe(plan)}
                disabled={isCurrentPlan}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isCurrentPlan ? "Đang sử dụng" : plan.price === 0 ? "Đăng ký" : "Mua Ngay"}
              </motion.button>

              {/* Features List */}
              <div className="plan-features">
                <h3 className="features-title">Đặc quyền:</h3>
                <ul className="features-list">
                  {getFeatures(plan).map((feature, idx) => (
                    <li
                      key={idx}
                      dangerouslySetInnerHTML={{ __html: feature }}
                    />
                  ))}
                </ul>
              </div>

              {/* Included Features Note */}
              {plan.price > 0 && (
                <p className="included-features">Đã bao gồm tất cả các tính năng miễn phí</p>
              )}

              {/* Current Plan Badge */}
              {isCurrentPlan && (
                <div className="current-plan-badge">Gói hiện tại của bạn</div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
