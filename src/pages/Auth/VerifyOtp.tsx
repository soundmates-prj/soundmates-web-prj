import React, { useRef, useState } from "react";
import "./VerifyOtp.css";
import logo from "../../assets/light_logo.png";
import { Button } from "../../components/common";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../services/axios";
import { showToast } from "../../utils/toast";
import { ShieldCheck } from "lucide-react";

const VerifyOtp: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const handleChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      showToast.warning(
        "Thông báo", 
        "Vui lòng nhập đủ 6 số OTP"
      );
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/auth/verify-email", {
        email,
        otpCode: otp.join(""),
      });

      const { accessToken, refreshToken, user } = res.data.data;

      localStorage.setItem("accessToken", accessToken);

      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }

      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }

      showToast.success(
        "Xác thực thành công!",
        "Bạn đã xác thực tài khoản thành công!"
      );
      navigate("/", { replace: true });
    } catch (err: any) {
      showToast.error(
        "Xác thực thất bại", 
        err.response?.data?.message || "OTP không hợp lệ"
      );
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
        <p>Share feelings. Connect hearts.</p>
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
            <div className="otp-group">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputsRef.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(e.target.value, index)}
                />
              ))}
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
