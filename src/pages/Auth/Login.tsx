import React, { useState } from "react";
import "./Login.css";
import logoLight from "../../assets/light_logo.png";
import logoDark from "../../assets/dark_logo.png";
import { Lock, Mail, Eye, EyeOff } from "lucide-react";
import { Button } from "../../components/common";
import api from "../../services/axios";
import { useNavigate } from "react-router-dom";
import { showError, showSuccess } from "../../components/common/toastUtils";
import { GoogleLogin } from "@react-oauth/google";
import { useTheme } from "../../context/ThemeContext";

const Login: React.FC = () => {
  const { theme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleLogin = async () => {
    if (!emailOrUsername.trim() || !password) {
      showError("Thiếu thông tin", "Vui lòng nhập Email/Tên người dùng và mật khẩu");
      return;
    }
    // Nếu người dùng nhập có dấu @ thì kiểm tra định dạng email
    if (emailOrUsername.includes("@") && !EMAIL_REGEX.test(emailOrUsername.trim())) {
      showError("Email không hợp lệ", "Vui lòng kiểm tra lại địa chỉ email");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/auth/login", {
        emailOrUsername: emailOrUsername.trim(),
        password,
      });

      console.log("LOGIN RESPONSE:", res.data);

      const accessToken = res.data?.data?.accessToken;

      if (!accessToken) {
        showError("Lỗi hệ thống", "Server không trả về token");
        return;
      }

      localStorage.setItem("accessToken", accessToken);
      const userData = res.data?.data;
      if (userData) {
        localStorage.setItem("userInfo", JSON.stringify({
          firstName: userData.firstName,
          lastName: userData.lastName,
          username: userData.username,
          email: userData.email,
          avatarUrl: userData.avatarUrl || null,
        }));
      }
      window.dispatchEvent(new Event("authChange"));

      showSuccess("Đăng nhập thành công!", "Chào mừng bạn quay trở lại SoundMates");
      navigate("/");
    } catch (error: any) {
      showError(
        "Đăng nhập không thành công!",
        error.response?.data?.message || "Mật khẩu hoặc Email/Username không khớp.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* LEFT */}
      <div className="login-left">
        <div className="brand">
          <img src={theme === "dark" ? logoDark : logoLight} alt="SoundMates" />
          <h1>SoundMates</h1>
          <p>Chia sẻ cảm xúc. Kết nối trái tim.</p>
        </div>
      </div>

      {/* RIGHT */}
      <div className="login-right">
        <div className="login-box">
          <h2>Đăng nhập</h2>
          <p className="subtitle">Chào mừng bạn quay trở lại !</p>

          {/* Email hoặc Tên người dùng */}
          <div className="input-wrapper">
            <Mail size={18} />
            <input
              type="text"
              placeholder="Tên người dùng hoặc Email"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
            />
          </div>

          {/* Password */}
          <div className="input-wrapper">
            <Lock size={18} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </span>
          </div>

          <div className="actions">
            <span className="forgot" onClick={() => navigate("/forget-password")}>Quên mật khẩu?</span>
          </div>

          <Button
            className="btn-primary"
            isLoading={loading}
            onClick={handleLogin}
          >
            Đăng nhập
          </Button>

          <div className="divider">
            <span></span>
            <p>hoặc</p>
            <span></span>
          </div>

          <div className="btn-google-wrapper">
            <GoogleLogin
              theme="outline"
              size="large"
              width="100%"
              text="signin_with"
              onSuccess={async (credentialResponse) => {
                console.log("Google credentialResponse:", credentialResponse);
                console.log("Google ID Token:", credentialResponse.credential);
                try {
                  const idToken = credentialResponse.credential;

                  if (!idToken) {
                    showError("Lỗi Google", "Không lấy được Google token");
                    return;
                  }

                  const res = await api.post("/auth/google-login", {
                    idToken,
                  });

                  console.log("GOOGLE LOGIN RESPONSE:", res.data);

                  const accessToken = res.data?.data?.accessToken;

                  if (!accessToken) {
                    showError("Lỗi hệ thống", "Server không trả về token");
                    return;
                  }

                  localStorage.setItem("accessToken", accessToken);
                  const googleUserData = res.data?.data;
                  if (googleUserData) {
                    localStorage.setItem("userInfo", JSON.stringify({
                      firstName: googleUserData.firstName,
                      lastName: googleUserData.lastName,
                      username: googleUserData.username,
                      email: googleUserData.email,
                      avatarUrl: googleUserData.avatarUrl || null,
                    }));
                  }
                  window.dispatchEvent(new Event("authChange"));

                  showSuccess("Đăng nhập Google thành công!", "Chào mừng bạn quay trở lại SoundMates");
                  navigate("/");
                } catch (err: any) {
                  showError(
                    "Đăng nhập Google thất bại",
                    err.response?.data?.message || "Vui lòng thử lại sau",
                  );
                }
              }}
              onError={() => {
                showError("Đăng nhập Google thất bại", "Vui lòng thử lại sau");
              }}
            />
          </div>

          <p className="register">
            Bạn chưa có tài khoản?{" "}
            <span
              onClick={() => navigate("/register")}
              style={{ cursor: "pointer" }}
            >
              Tạo tài khoản
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
