import { useState, useEffect } from "react";
import { CreditCard, Package, Check, Crown, AlertCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/axios";
import { showSuccess, showError } from "../../../components/common/toastUtils";
import "./SubscriptionSettings.css";

interface Subscription {
  id: string;
  planId: string;
  planName: string;
  status: string;
  startDate: string;
  endDate: string;
  subscribeAt: string;
}

interface SubscriptionPlan {
  id: string;
  planName: string;
  price: number;
  durationDays: number;
  requestLimit: number;
  description: string;
  voiceModelLimit: number;
  ttsMinuteLimit: number;
  podcastRequestLimit: number;
}

export default function SubscriptionSettings() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const res = await api.get("/me/subscriptions");
        if (res.data.success && res.data.data) {
          const sub = res.data.data;
          setSubscription(sub);

          // Fetch plan details
          if (sub.planId) {
            const planRes = await api.get(`/subscription-plans/${sub.planId}`);
            if (planRes.data.success && planRes.data.data) {
              setPlan(planRes.data.data);
            }
          }
        }
      } catch (error: any) {
        // Handle 404 gracefully - API not implemented yet or user has no sub
        if (error?.response?.status === 404) {
          console.log("Subscription not found or API not implemented yet");
          setSubscription(null);
        } else {
          console.error("Failed to fetch subscription", error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === "active") {
      return (
        <span className="sub-badge active">
          <CheckCircle size={14} />
          Đang hoạt động
        </span>
      );
    }
    if (s === "expired") {
      return (
        <span className="sub-badge expired">
          <XCircle size={14} />
          Đã hết hạn
        </span>
      );
    }
    return (
      <span className="sub-badge cancelled">
        <XCircle size={14} />
        Đã hủy
      </span>
    );
  };

  const getPlanBadge = (planName: string) => {
    const name = planName?.toLowerCase() || "";
    if (name.includes("elite")) {
      return <span className="plan-badge elite">Elite</span>;
    }
    if (name.includes("premium")) {
      return <span className="plan-badge premium">Premium</span>;
    }
    return <span className="plan-badge free">Free</span>;
  };

  if (loading) {
    return (
      <div className="subscription-settings">
        <div className="settings-section-header">
          <h1>Gói dịch vụ</h1>
          <p>Quản lý gói dịch vụ của bạn</p>
        </div>
        <div className="sub-loading">
          <Loader2 size={32} className="sub-spinner" />
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="subscription-settings">
        <div className="settings-section-header">
          <h1>Gói dịch vụ</h1>
          <p>Quản lý gói dịch vụ của bạn</p>
        </div>
        <div className="sub-empty">
          <Crown size={48} />
          <h3>Chưa có gói dịch vụ</h3>
          <p>Nâng cấp lên Premium hoặc Elite để mở khóa tính năng độc quyền</p>
          <a href="/subscription" className="sub-upgrade-btn">
            Xem gói dịch vụ
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="subscription-settings">
      <div className="settings-section-header">
        <h1>Gói dịch vụ</h1>
        <p>Quản lý gói dịch vụ của bạn</p>
      </div>

      <div className="sub-card">
        <div className="sub-card-header">
          <div className="sub-card-icon">
            <Crown size={24} />
          </div>
          <div className="sub-card-title">
            <h3>{subscription.planName || plan?.planName || "Subscription"}</h3>
            {getPlanBadge(subscription.planName || plan?.planName || "")}
          </div>
          {getStatusBadge(subscription.status)}
        </div>

        <div className="sub-card-body">
          <div className="sub-info-row">
            <div className="sub-info-item">
              <Calendar size={18} />
              <div>
                <span className="sub-info-label">Ngày bắt đầu</span>
                <span className="sub-info-value">{formatDate(subscription.startDate)}</span>
              </div>
            </div>

            <div className="sub-info-item">
              <Calendar size={18} />
              <div>
                <span className="sub-info-label">Ngày kết thúc</span>
                <span className="sub-info-value">{formatDate(subscription.endDate)}</span>
              </div>
            </div>
          </div>

          {plan && plan.price > 0 && (
            <div className="sub-price">
              <span className="sub-price-label">Giá</span>
              <span className="sub-price-value">{plan.price.toLocaleString("vi-VN")} đ</span>
            </div>
          )}

          {plan?.description && (
            <div className="sub-description">
              <p>{plan.description}</p>
            </div>
          )}

          {plan && (
            <div className="sub-features-grid">
              <div className="sub-feature-item">
                <span className="sub-feature-label">Giọng nói AI</span>
                <span className="sub-feature-value">
                  {plan.voiceModelLimit > 0 ? `${plan.voiceModelLimit} giọng` : "Không có"}
                </span>
              </div>
              <div className="sub-feature-item">
                <span className="sub-feature-label">Thời gian TTS</span>
                <span className="sub-feature-value">
                  {plan.ttsMinuteLimit > 0 ? `${plan.ttsMinuteLimit} phút/tháng` : "Không có"}
                </span>
              </div>
              <div className="sub-feature-item">
                <span className="sub-feature-label">Request podcast</span>
                <span className="sub-feature-value">
                  {plan.podcastRequestLimit > 0 ? `${plan.podcastRequestLimit} request/ngày` : "Không có"}
                </span>
              </div>
              <div className="sub-feature-item">
                <span className="sub-feature-label">Request nhạc</span>
                <span className="sub-feature-value">
                  {plan.requestLimit > 0 ? `${plan.requestLimit} request/ngày` : "Không có"}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="sub-card-footer">
          <a href="/subscription" className="sub-manage-btn">
            Quản lý gói dịch vụ
          </a>
        </div>
      </div>
    </div>
  );
}
