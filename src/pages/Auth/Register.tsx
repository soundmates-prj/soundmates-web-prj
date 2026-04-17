import React, { useState, useEffect } from "react";
import "./Register.css";
import logoLight from "../../assets/light_logo.png";
import logoDark from "../../assets/dark_logo.png";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "../../components/common";
import { useNavigate } from "react-router-dom";
import api from "../../services/axios";
import { showError, showSuccess } from "../../components/common/toastUtils";
import { useTheme } from "../../context/ThemeContext";

const Register: React.FC = () => {
  const { mode } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);

  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  // ── Constants (BR-02, BR-03) ──
  const MAX_NAME_LENGTH = 20;
  const MIN_NAME_LENGTH = 1;
  const MAX_USERNAME_LEN = 30;
  const MIN_USERNAME_LEN = 3;
  const PASSWORD_REGEX =
    /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    // ── Họ (lastName): required, 1–20 chars ──
    if (name === "lastName") {
      if (!value.trim()) setLastNameError("Họ không được để trống!");
      else if (value.trim().length > MAX_NAME_LENGTH)
        setLastNameError(`Họ không được quá ${MAX_NAME_LENGTH} ký tự!`);
      else setLastNameError("");
    }

    // ── Tên (firstName): required, 1–20 chars ──
    if (name === "firstName") {
      if (!value.trim()) setFirstNameError("Tên không được để trống!");
      else if (value.trim().length > MAX_NAME_LENGTH)
        setFirstNameError(`Tên không được quá ${MAX_NAME_LENGTH} ký tự!`);
      else setFirstNameError("");
    }

    // ── Username: 3–30 chars ──
    if (name === "username") {
      if (!value.trim())
        setUsernameError("Tên người dùng không được để trống!");
      else if (value.trim().length < MIN_USERNAME_LEN)
        setUsernameError(
          `Tên người dùng phải có ít nhất ${MIN_USERNAME_LEN} ký tự!`,
        );
      else if (value.trim().length > MAX_USERNAME_LEN)
        setUsernameError(
          `Tên người dùng không được quá ${MAX_USERNAME_LEN} ký tự!`,
        );
      else setUsernameError("");
    }

    if (name === "email") {
      if (!value.trim()) setEmailError("Email không được để trống!");
      else if (!EMAIL_REGEX.test(value.trim()))
        setEmailError("Email không đúng định dạng!");
      else setEmailError("");
    }

    if (name === "password") {
      if (!value) setPasswordError("");
      else if (!PASSWORD_REGEX.test(value))
        setPasswordError(
          "Mật khẩu phải có ít nhất 8 ký tự, 1 chữ in hoa, 1 số và 1 ký tự đặc biệt!",
        );
      else setPasswordError("");
    }

    if (name === "confirmPassword") {
      if (!value) setConfirmPasswordError("");
      else if (value !== form.password)
        setConfirmPasswordError("Mật khẩu xác nhận không khớp!");
      else setConfirmPasswordError("");
    }
  };

  const validateAll = (): boolean => {
    let valid = true;

    if (!form.firstName?.trim()) {
      setFirstNameError("Tên không được để trống!");
      valid = false;
    } else if (form.firstName.trim().length > MAX_NAME_LENGTH) {
      setFirstNameError(`Tên không được quá ${MAX_NAME_LENGTH} ký tự!`);
      valid = false;
    }

    if (!form.lastName?.trim()) {
      setLastNameError("Họ không được để trống!");
      valid = false;
    } else if (form.lastName.trim().length > MAX_NAME_LENGTH) {
      setLastNameError(`Họ không được quá ${MAX_NAME_LENGTH} ký tự!`);
      valid = false;
    }

    if (!form.username?.trim()) {
      setUsernameError("Tên người dùng không được để trống!");
      valid = false;
    } else if (form.username.trim().length < MIN_USERNAME_LEN) {
      setUsernameError(
        `Tên người dùng phải có ít nhất ${MIN_USERNAME_LEN} ký tự!`,
      );
      valid = false;
    } else if (form.username.trim().length > MAX_USERNAME_LEN) {
      setUsernameError(
        `Tên người dùng không được quá ${MAX_USERNAME_LEN} ký tự!`,
      );
      valid = false;
    }

    if (!form.email?.trim()) {
      setEmailError("Email không được để trống!");
      valid = false;
    } else if (!EMAIL_REGEX.test(form.email.trim())) {
      setEmailError("Email không đúng định dạng!");
      valid = false;
    }

    if (!form.password) {
      setPasswordError("Mật khẩu không được để trống!");
      valid = false;
    } else if (!PASSWORD_REGEX.test(form.password)) {
      setPasswordError(
        "Mật khẩu phải có ít nhất 8 ký tự, 1 chữ in hoa, 1 số và 1 ký tự đặc biệt!",
      );
      valid = false;
    }

    if (!form.confirmPassword) {
      setConfirmPasswordError("Vui lòng xác nhận mật khẩu!");
      valid = false;
    } else if (form.confirmPassword !== form.password) {
      setConfirmPasswordError("Mật khẩu xác nhận không khớp!");
      valid = false;
    }

    return valid;
  };

  const handleRegister = async () => {
    if (!validateAll()) return;

    const { firstName, lastName, username, email, password } = form;

    try {
      setLoading(true);

      await api.post("/auth/register", {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim(),
        email: email.trim(),
        password: password,
      });

      showSuccess(
        "Đăng ký thành công!",
        "Vui lòng kiểm tra email để lấy mã OTP",
      );

      navigate("/verify-otp", {
        state: {
          email,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          username: username.trim(),
        },
      });
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        "Địa chỉ email hoặc tên người dùng đã tồn tại";
      showError("Đăng ký thất bại", message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading) {
      handleRegister();
    }
  };

  return (
    <div className="register-container">
      <div className="register-left">
        <div className="brand">
          <img src={mode === "dark" ? logoDark : logoLight} alt="SoundMates" />
          <h1>SoundMates</h1>
          <p>Chia sẻ cảm xúc. Kết nối trái tim.</p>
        </div>
      </div>

      <div className="register-right">
        <div className="register-box">
          <h2>Tạo tài khoản</h2>
          <p className="subtitle">Bắt đầu hành trình cùng SoundMate</p>

          <div className="name-row">
            {/* EF-01 + BR-01: Họ (lastName) — required, 1–20 chars */}
            <div
              className={`input-wrapper${lastNameError ? " input-error" : ""}`}
            >
              <User size={18} />
              <input
                type="text"
                name="lastName"
                placeholder="Họ"
                value={form.lastName}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                maxLength={MAX_NAME_LENGTH}
              />
            </div>

            {/* EF-01 + BR-01: Tên (firstName) — required, 1–20 chars */}
            <div
              className={`input-wrapper${firstNameError ? " input-error" : ""}`}
            >
              <User size={18} />
              <input
                type="text"
                name="firstName"
                placeholder="Tên"
                value={form.firstName}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                maxLength={MAX_NAME_LENGTH}
              />
            </div>
          </div>
          {lastNameError && <p className="error-text">{lastNameError}</p>}
          {firstNameError && <p className="error-text">{firstNameError}</p>}

          <div
            className={`input-wrapper${usernameError ? " input-error" : ""}`}
          >
            <User size={18} />
            <input
              type="text"
              name="username"
              placeholder="Tên người dùng"
              value={form.username}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
              maxLength={MAX_USERNAME_LEN}
            />
          </div>
          {usernameError && <p className="error-text">{usernameError}</p>}

          <div className={`input-wrapper${emailError ? " input-error" : ""}`}>
            <Mail size={18} />
            <input
              name="email"
              type="text"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
            />
          </div>
          {emailError && <p className="error-text">{emailError}</p>}

          <div
            className={`input-wrapper${passwordError ? " input-error" : ""}`}
          >
            <Lock size={18} />
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Mật khẩu"
              value={form.password}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
            />
            <span
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </span>
          </div>
          {passwordError && <p className="error-text">{passwordError}</p>}

          <div
            className={`input-wrapper${confirmPasswordError ? " input-error" : ""}`}
          >
            <Lock size={18} />
            <input
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Xác nhận mật khẩu"
              value={form.confirmPassword}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
            />
            <span
              className="toggle-password"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </span>
          </div>
          {confirmPasswordError && (
            <p className="error-text">{confirmPasswordError}</p>
          )}

          <Button
            className="btn-primary"
            isLoading={loading}
            onClick={handleRegister}
            disabled={
              !!firstNameError ||
              !!lastNameError ||
              !!usernameError ||
              !!emailError ||
              !!passwordError ||
              !!confirmPasswordError
            }
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