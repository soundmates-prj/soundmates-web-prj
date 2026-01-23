import React, { useState } from "react";
import "./Register.css";
import logo from "../../assets/light_logo.png";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";

const Register: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="register-container">
      {/* LEFT */}
      <div className="register-left">
        <div className="brand">
          <img src={logo} alt="SoundMate" />
          <h1>SoundMate</h1>
          <p>Share feelings. Connect hearts.</p>
        </div>
      </div>

      {/* RIGHT */}
      <div className="register-right">
        <div className="register-box">
          <h2>Tạo tài khoản</h2>
          <p className="subtitle">Bắt đầu hành trình cùng SoundMate</p>

          {/* First & Last name */}
          <div className="name-row">
            <div className="input-wrapper">
              <User size={18} />
              <input type="text" placeholder="First name" />
            </div>

            <div className="input-wrapper">
              <User size={18} />
              <input type="text" placeholder="Last name" />
            </div>
          </div>

          {/* Username */}
          <div className="input-wrapper">
            <User size={18} />
            <input type="text" placeholder="Username" />
          </div>

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
              placeholder="Password"
            />
            <span
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </span>
          </div>

          <button className="btn-primary">Đăng ký</button>

          <p className="login">
            Đã có tài khoản? <span>Đăng nhập</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
