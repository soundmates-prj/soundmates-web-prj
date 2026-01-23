import React, { useState } from "react";
import "./Login.css";
import logo from "../../assets/light_logo.png";
import { Lock, Mail, Eye, EyeOff } from "lucide-react";

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
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
            <input type="email" placeholder="Email" />
          </div>

          {/* Password */}
          <div className="input-wrapper">
            <Lock size={18} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Mật khẩu"
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

          <button className="btn-primary">Đăng nhập</button>

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
            Bạn chưa có tài khoản? <span>Tạo tài khoản</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
