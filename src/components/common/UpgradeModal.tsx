import React from "react";
import { useNavigate } from "react-router-dom";
import { Crown, Sparkles, X, XCircle } from "lucide-react";
import "./UpgradeModal.css";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  // What feature is blocked or needs an upgrade? (e.g. "Voice Clone", "Yêu cầu nhạc")
  featureName?: string;
  message?: string;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  featureName,
  message,
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="upgrade-modal-overlay">
      <div className="upgrade-modal-container">
        <button className="upgrade-modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="upgrade-modal-header">
          <div className="upgrade-modal-icon-wrapper">
            <Sparkles size={32} className="upgrade-modal-icon" />
          </div>
          <h2>Nâng cấp trải nghiệm!</h2>
          <p>
            {message ||
              `Tính năng ${
                featureName ? `"${featureName}"` : "này"
              } yêu cầu tài khoản có gói cước cao hơn. 
            Mở khóa giới hạn bằng cách nâng cấp Premium hoặc Elite.`}
          </p>
        </div>

        <div className="upgrade-modal-cards">
          {/* Elite Card */}
          <div className="upgrade-modal-card elite">
            <div className="upgrade-modal-card-header">
              <span className="upgrade-modal-card-badge elite-badge">ELITE</span>
              <h4>59,000đ<small>/tháng</small></h4>
            </div>
            <ul className="upgrade-modal-card-features">
              <li>• Yêu cầu nhạc 5 bài/ngày</li>
              <li>• Tham gia phòng Live</li>
              <li>• Chat và tương tác cơ bản</li>
            </ul>
          </div>

          {/* Premium Card */}
          <div className="upgrade-modal-card premium">
            <div className="upgrade-modal-tag">PHỔ BIẾN NHẤT</div>
            <div className="upgrade-modal-card-header">
              <span className="upgrade-modal-card-badge premium-badge">
                <Crown size={12} /> PREMIUM
              </span>
              <h4>159,000đ<small>/tháng</small></h4>
            </div>
            <ul className="upgrade-modal-card-features">
              <li>• Yêu cầu nhạc 15 bài/ngày</li>
              <li>• Tất cả tính năng Elite</li>
              <li>• Sử dụng AI Voice Clone</li>
            </ul>
          </div>
        </div>

        <div className="upgrade-modal-actions">
          <button
            className="upgrade-modal-btn cancel"
            onClick={onClose}
          >
            Để sau
          </button>
          <button
            className="upgrade-modal-btn upgrade"
            onClick={() => {
              onClose();
              navigate("/subscription");
            }}
          >
            Đến trang đăng ký
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;
