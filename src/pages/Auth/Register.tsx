import React, { useState } from "react";
import "./Register.css";
import logo from "../../assets/light_logo.png";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "../../components/common";
import { useNavigate } from "react-router-dom";
import api from "../../services/axios";
import { showToast } from "../../utils/toast";

const Register: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const PASSWORD_REGEX =
    /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setForm({ ...form, [name]: value });

    // Validate password realtime
    if (name === "password") {
      if (!value) {
        setPasswordError("");
      } else if (!PASSWORD_REGEX.test(value)) {
        setPasswordError(
          "Mật khẩu phải có ít nhất 8 ký tự, 1 chữ in hoa, 1 số và 1 ký tự đặc biệt",
        );
      } else {
        setPasswordError("");
      }
    }
  };

  const handleRegister = async () => {
    const { firstName, lastName, username, email, password } = form;

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !username.trim() ||
      !email.trim() ||
      !password.trim()
    ) {
      showToast.warning("Thông báo", "Vui lòng nhập đầy đủ thông tin");
      return;
    }
    if (passwordError) {
      showToast.warning("Thông báo", "Mật khẩu chưa đúng định dạng");
      return;
    }

    try {
      setLoading(true);

      await api.post("/auth/register", {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim(),
        email: email.trim(),
        password: password,
      });

      showToast.success(
        "Đăng ký thành công!",
        "Vui lòng kiểm tra email để lấy mã OTP"
      );

      navigate("/verify-otp", { state: { email } });
    } catch (error: any) {
      showToast.error(
        "Đăng ký thất bại", 
        error.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-left">
        <div className="brand">
          <img src={logo} alt="SoundMate" />
          <h1>SoundMate</h1>
          <p>Share feelings. Connect hearts.</p>
        </div>
      </div>

      <div className="register-right">
        <div className="register-box">
          <h2>Tạo tài khoản</h2>
          <p className="subtitle">Bắt đầu hành trình cùng SoundMate</p>

          <div className="name-row">
            <div className="input-wrapper">
              <User size={18} />
              <input
                type="text"
                name="firstName"
                placeholder="Họ"
                value={form.firstName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-wrapper">
              <User size={18} />
              <input
                type="text"
                name="lastName"
                placeholder="Tên"
                value={form.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="input-wrapper">
            <User size={18} />
            <input
              type="text"
              name="username"
              placeholder="Tên người dùng"
              value={form.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-wrapper">
            <Mail size={18} />
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-wrapper">
            <Lock size={18} />
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Mật khẩu"
              value={form.password}
              onChange={handleChange}
            />
            <span
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </span>
          </div>

          {passwordError && <p className="error-text">{passwordError}</p>}

          <Button
            className="btn-primary"
            isLoading={loading}
            onClick={handleRegister}
          >
            Đăng ký
          </Button>

          <p className="login">
            Đã có tài khoản?{" "}
            <span onClick={() => navigate("/login")}>Đăng nhập</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
