import React, { useRef, useState } from "react";
import "./VerifyOtp.css";
import logoLight from "../../assets/light_logo.png";
import logoDark from "../../assets/dark_logo.png";
import { Button } from "../../components/common";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../services/axios";
import { showError, showSuccess, showInfo } from "../../components/common/toastUtils";
import { ShieldCheck } from "lucide-react";
import { maskEmail } from "../../utils/stringUtils";
import { useTheme } from "../../context/ThemeContext";

const VerifyOtp: React.FC = () => {
  const { mode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const stateFirstName = location.state?.firstName;
  const stateLastName = location.state?.lastName;
  const stateUsername = location.state?.username;

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const startCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      setResendLoading(true);
      await api.post("/auth/resend-otp", { email });
      showInfo("Đã gửi lại OTP", "Kiểm tra email của bạn");
      startCooldown();
    } catch (err: any) {
      if (err.response?.status === 429) {
        showInfo("Vui lòng chờ", "Bạn cần đợi ít nhất 1 phút trước khi gửi lại mã");
        startCooldown();
      } else {
        showError("Gửi thất bại", err.response?.data?.message || "Vui lòng thử lại sau");
      }
    } finally {
      setResendLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(value);
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      showError("Mã OTP không hợp lệ", "Vui lòng nhập đủ 6 số OTP");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/auth/verify-email", {
        email,
        otpCode: otp,
      });

      const { accessToken, refreshToken, user } = res.data.data;

      localStorage.setItem("accessToken", accessToken);

      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }

      const userInfo = {
        firstName: user?.firstName || stateFirstName || "",
        lastName: user?.lastName || stateLastName || "",
        username: user?.username || stateUsername || "",
        email: user?.email || email || "",
        avatarUrl: user?.avatarUrl || null,
      };
      localStorage.setItem("userInfo", JSON.stringify(userInfo));

      window.dispatchEvent(new Event("authChange"));

      showSuccess("Xác thực thành công!", "Chào mừng bạn đến với SoundMates");
      navigate("/", { replace: true });
    } catch (err: any) {
      showError("Xác thực thất bại", err.response?.data?.message || "Mã OTP không đúng hoặc đã hết hạn");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verify-container">
      {/* LEFT */}
      <div className="verify-left">
        <img src={theme === "dark" ? logoDark : logoLight} alt="SoundMates" />
        <h1>SoundMates</h1>
        <p>Chia sẻ cảm xúc. Kết nối trái tim.</p>
      </div>

      {/* RIGHT */}
      <div className="verify-right">
        <div className="verify-card">
          <div className="icon">
            <ShieldCheck size={32} />
          </div>

          <h2>Xác thực mã OTP</h2>
          <p className="email">
            Mã OTP đã gửi về{" "}
            <strong style={{ color: "#5cc3f0" }}>{maskEmail(email ?? "")}</strong>
          </p>

          <div className="otp-resend-row">
            <button
              className="otp-resend-btn"
              onClick={handleResend}
              disabled={resendCooldown > 0 || resendLoading}
            >
              {resendCooldown > 0
                ? `Gửi lại sau ${resendCooldown}s`
                : resendLoading
                  ? "Đang gửi..."
                  : "Gửi lại"}
            </button>
          </div>

          <div className="otp-wrapper">
            {/* Visual 6 boxes */}
            <div className="otp-group" onClick={() => inputRef.current?.focus()}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={`otp-box${otp.length === i ? " otp-box-active" : ""
                    }${otp[i] ? " otp-box-filled" : ""}`}
                >
                  {otp[i] || ""}
                </div>
              ))}
              {/* Hidden input */}
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={handleChange}
                className="otp-hidden-input"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleVerifyOtp();
                }}
              />
            </div>
            <Button
              className="btn-primary"
              isLoading={loading}
              onClick={handleVerifyOtp}
            >
              Xác thực
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;
