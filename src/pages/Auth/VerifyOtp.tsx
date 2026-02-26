import React, { useRef, useState } from "react";
import "./VerifyOtp.css";
import logo from "../../assets/light_logo.png";
import { Button } from "../../components/common";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../services/axios";
import { ShieldCheck } from "lucide-react";
import showToast from "../../utils/toast";

const VerifyOtp: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(value);
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      showToast.warning("Mã OTP không hợp lệ", "Vui lòng nhập đủ 6 số OTP");
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

      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }

      showToast.success("Xác thực thành công!", "Chào mừng bạn đến với SoundMates");
      navigate("/", { replace: true });
    } catch (err: any) {
      showToast.error("Xác thực thất bại", err.response?.data?.message || "Mã OTP không đúng hoặc đã hết hạn");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verify-container">
      {/* LEFT */}
      <div className="verify-left">
        <img src={logo} alt="SoundMates" />
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
            <strong style={{ color: "#5cc3f0" }}>{email}</strong>
          </p>

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
