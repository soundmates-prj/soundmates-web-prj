import { useNavigate } from "react-router-dom";
import "./AuthPromptModal.css";

interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}

export default function AuthPromptModal({
  isOpen,
  onClose,
  title = "Yêu cầu đăng nhập",
  message = "Vui lòng đăng nhập hoặc đăng ký để tiếp tục sử dụng tính năng này nhé!",
}: AuthPromptModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="ap-modal-overlay" onClick={onClose}>
      <div
        className="ap-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="ap-modal-title">{title}</h3>
        <p className="ap-modal-message">{message}</p>
        <div className="ap-modal-actions">
          <button
            className="ap-btn-primary"
            onClick={() => navigate("/login")}
          >
            Đăng nhập
          </button>
          <button
            className="ap-btn-secondary"
            onClick={() => navigate("/register")}
          >
            Đăng ký
          </button>
          <button className="ap-btn-outline" onClick={() => navigate("/")}>
            Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}
