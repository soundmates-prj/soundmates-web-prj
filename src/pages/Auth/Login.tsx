import React, { useState } from "react";
import "./Login.css";
import logo from "../../assets/light_logo.png";
import { Lock, Mail, Eye, EyeOff } from "lucide-react";
import { Button } from "../../components/common";
import api from "../../services/axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Vui lòng nhập email và mật khẩu");
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
        toast.error("Server không trả token");
        return;
      }

      localStorage.setItem("accessToken", accessToken);

      toast.success("Đăng nhập thành công");
      navigate("/");
    } catch (error: any) {
      toast.error(
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

          <button className="btn-google">
            <img
              src="https://www.citypng.com/public/uploads/preview/google-logo-icon-gsuite-hd-701751694791470gzbayltphh.png"
              alt="Google"
            />
            Đăng nhập với Google
          </button>

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
