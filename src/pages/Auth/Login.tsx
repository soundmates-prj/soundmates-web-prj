import React, { useState } from "react";
import "./Login.css";
import logo from "../../assets/light_logo.png";
import { Lock, Mail, Eye, EyeOff } from "lucide-react";
import { Button } from "../../components/common";
import api from "../../services/axios";
import { useNavigate } from "react-router-dom";
import { showToast } from "../../utils/toast";
import { GoogleLogin } from "@react-oauth/google";

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      showToast.warning(
        "Thông báo",
        "Vui lòng nhập email và mật khẩu"
      );
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/auth/login", {
        emailOrUsername: email,
        password,
      });

      console.log("LOGIN RESPONSE:", res.data);

      const accessToken = res.data?.data?.accessToken;

      if (!accessToken) {
        showToast.error(
          "Server không trả token",
          "Vui lòng thử lại sau"
        );
        return;
      }

      localStorage.setItem("accessToken", accessToken);

      showToast.success(
        "Đăng nhập thành công",
        "Chào mừng bạn đã quay trở lại SoundMate!"
      );
      navigate("/");
    } catch (error: any) {
      showToast.error(
        "Đăng nhập thất bại",
        error.response?.data?.message || "Email hoặc mật khẩu không đúng",
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
          <img src={logo} alt="SoundMate" />
          <h1>SoundMate</h1>
          <p>Share feelings. Connect hearts.</p>
        </div>
      </div>

      {/* RIGHT */}
      <div className="login-right">
        <div className="login-box">
          <h2>Đăng nhập</h2>
          <p className="subtitle">Chào mừng bạn quay trở lại !</p>

          {/* Email */}
          <div className="input-wrapper">
            <Mail size={18} />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            <span className="forgot">Quên mật khẩu?</span>
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
                    showToast.error("Không lấy được Google token");
                    return;
                  }

                  const res = await api.post("/auth/google-login", {
                    idToken,
                  });

                  console.log("GOOGLE LOGIN RESPONSE:", res.data);

                  const accessToken = res.data?.data?.accessToken;

                  if (!accessToken) {
                    showToast.error("Server không trả token");
                    return;
                  }

                  localStorage.setItem("accessToken", accessToken);

                  showToast.success("Đăng nhập Google thành công");
                  navigate("/");
                } catch (err: any) {
                  showToast.error(
                    err.response?.data?.message || "Đăng nhập Google thất bại",
                  );
                }
              }}
              onError={() => {
                showToast.error("Google Login thất bại");
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
