import React, { useState, useEffect } from "react";
import "./Login.css";
import logoLight from "../../assets/light_logo.png";
import logoDark from "../../assets/dark_logo.png";
import { Lock, Mail, Eye, EyeOff } from "lucide-react";
import { Button } from "../../components/common";
import api from "../../services/axios";
import { useNavigate } from "react-router-dom";
import { showError, showInfo, showSuccess } from "../../components/common/toastUtils";
import { GoogleLogin } from "@react-oauth/google";
import { useTheme } from "../../context/ThemeContext";

const Login: React.FC = () => {
  const { mode } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ emailOrUsername: false, password: false });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const getEmailForOtpFlow = (userData: any): string | null => {
    const emailFromResponse = userData?.email;
    if (emailFromResponse && EMAIL_REGEX.test(String(emailFromResponse))) {
      return String(emailFromResponse);
    }
    if (EMAIL_REGEX.test(emailOrUsername.trim())) {
      return emailOrUsername.trim();
    }
    return null;
  };

  const isUnverifiedFromLoginPayload = (userData: any): boolean => {
    if (!userData) return false;
    if (userData.isVerified === false) return true;
    if (userData.emailVerified === false) return true;
    if (userData.requiresOtp === true || userData.needVerifyOtp === true) return true;
    return false;
  };

  const isUnverifiedFromError = (error: any): boolean => {
    const status = error?.response?.status;
    const serverMsg = String(error?.response?.data?.message || "").toLowerCase();
    if (status !== 401 && status !== 403 && status !== 400) return false;
    return (
      serverMsg.includes("otp") ||
      serverMsg.includes("verify") ||
      serverMsg.includes("verified") ||
      serverMsg.includes("xác thực")
    );
  };

  const getLoginErrorMessage = (error: any): { title: string; description: string } => {
    const status = error?.response?.status;
    const serverMsg: string = error?.response?.data?.message || "";

    if (status === 403) {
      if (serverMsg.toLowerCase().includes("15 minutes") || serverMsg.toLowerCase().includes("locked due to too many")) {
        return {
          title: "Tài khoản bị khóa tạm thời",
          description: "Tài khoản của bạn đã bị khóa do đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút hoặc liên hệ hỗ trợ.",
        };
      }
      return {
        title: "Tài khoản bị khóa",
        description: "Tài khoản của bạn đã bị khóa hoặc vô hiệu hóa. Vui lòng liên hệ hỗ trợ.",
      };
    }

    if (status === 401 || status === 400) {
      return {
        title: "Sai thông tin đăng nhập",
        description: "Sai email/tên người dùng hoặc mật khẩu. Vui lòng thử lại.",
      };
    }

    if (!error?.response) {
      return {
        title: "Lỗi kết nối",
        description: "Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng và thử lại.",
      };
    }

    return {
      title: "Đăng nhập không thành công",
      description: serverMsg || "Có lỗi xảy ra. Vui lòng thử lại sau.",
    };
  };

  const handleLogin = async (e?: React.MouseEvent | React.FormEvent | React.KeyboardEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    if (loading) return;

    const errors = {
      emailOrUsername: !emailOrUsername.trim(),
      password: !password,
    };
    setFieldErrors(errors);

    if (errors.emailOrUsername || errors.password) {
      showError("Thiếu thông tin", "Vui lòng nhập Email/Tên người dùng và mật khẩu");
      return;
    }

    if (emailOrUsername.includes("@") && !EMAIL_REGEX.test(emailOrUsername.trim())) {
      setFieldErrors((prev) => ({ ...prev, emailOrUsername: true }));
      showError("Email không hợp lệ", "Vui lòng kiểm tra lại địa chỉ email");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/auth/login", {
        emailOrUsername: emailOrUsername.trim(),
        password,
        rememberMe,
      });

      const accessToken = res.data?.data?.accessToken;
      const userData = res.data?.data;

      if (isUnverifiedFromLoginPayload(userData)) {
        const verifyEmail = getEmailForOtpFlow(userData);
        if (!verifyEmail) {
          showError(
            "Tài khoản chưa xác thực",
            "Không tìm thấy email để xác thực OTP. Vui lòng đăng nhập bằng email.",
          );
          return;
        }

        showInfo("Tài khoản chưa xác thực", "Vui lòng xác thực OTP để tiếp tục đăng nhập");
        navigate("/verify-otp", {
          state: {
            email: verifyEmail,
            firstName: userData?.firstName,
            lastName: userData?.lastName,
            username: userData?.username,
          },
        });
        return;
      }

      if (!accessToken) {
        showError("Lỗi hệ thống", "Server không trả về token. Vui lòng thử lại.");
        return;
      }

      localStorage.setItem("accessToken", accessToken);
      if (userData) {
        localStorage.setItem("userInfo", JSON.stringify({
          id: userData.id,
          firstName: userData.firstName,
          lastName: userData.lastName,
          username: userData.username,
          email: userData.email,
          avatarUrl: userData.avatarUrl || null,
          roleName: userData.roleName,
        }));
      }
      window.dispatchEvent(new Event("authChange"));

      setFieldErrors({ emailOrUsername: false, password: false });
      showSuccess("Đăng nhập thành công!", "Chào mừng bạn quay trở lại SoundMates");

      const redirectUrl = userData?.redirectUrl;
      if (redirectUrl) {
        navigate(redirectUrl);
      } else {
        navigate("/");
      }
    } catch (error: any) {
      if (isUnverifiedFromError(error)) {
        const verifyEmail = getEmailForOtpFlow(error?.response?.data?.data);
        if (!verifyEmail) {
          showError(
            "Tài khoản chưa xác thực",
            "Vui lòng đăng nhập bằng email để tiếp tục xác thực OTP.",
          );
          return;
        }

        showInfo("Tài khoản chưa xác thực", "Vui lòng xác thực OTP để tiếp tục đăng nhập");
        navigate("/verify-otp", {
          state: {
            email: verifyEmail,
            firstName: error?.response?.data?.data?.firstName,
            lastName: error?.response?.data?.data?.lastName,
            username: error?.response?.data?.data?.username,
          },
        });
        return;
      }

      const { title, description } = getLoginErrorMessage(error);
      showError(title, description);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (!loading) {
        handleLogin(e);
      } else {
        e.preventDefault();
      }
    }
  };

  return (
    <div className="login-container">
      {/* LEFT */}
      <div className="login-left">
        <div className="brand">
          <img src={mode === "dark" ? logoDark : logoLight} alt="SoundMates" />
          <h1>SoundMates</h1>
          <p>Chia sẻ cảm xúc. Kết nối trái tim.</p>
        </div>
      </div>

      {/* RIGHT */}
      <div className="login-right">
        <div className="login-box">
          <h2>Đăng nhập</h2>
          <p className="subtitle">Chào mừng bạn quay trở lại !</p>

          <div className={`input-wrapper ${fieldErrors.emailOrUsername ? "input-error" : ""}`}>
            <Mail size={18} />
            <input
              type="text"
              placeholder="Tên người dùng hoặc Email"
              value={emailOrUsername}
              onChange={(e) => {
                setEmailOrUsername(e.target.value);
                if (fieldErrors.emailOrUsername)
                  setFieldErrors((p) => ({ ...p, emailOrUsername: false }));
              }}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div className={`input-wrapper ${fieldErrors.password ? "input-error" : ""}`}>
            <Lock size={18} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password)
                  setFieldErrors((p) => ({ ...p, password: false }));
              }}
              onKeyDown={handleKeyDown}
            />
            <span
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </span>
          </div>

          <div className="actions">
            <label className="remember-me">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Nhớ tài khoản</span>
            </label>
            <span className="forgot" onClick={() => navigate("/forget-password")}>Quên mật khẩu?</span>
          </div>

          <Button
            type="button"
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
                try {
                  const idToken = credentialResponse.credential;

                  if (!idToken) {
                    showError("Lỗi Google", "Không lấy được Google token");
                    return;
                  }

                  const res = await api.post("/auth/google-login", { idToken });

                  const accessToken = res.data?.data?.accessToken;

                  if (!accessToken) {
                    showError("Lỗi hệ thống", "Server không trả về token");
                    return;
                  }

                  localStorage.setItem("accessToken", accessToken);
                  const googleUserData = res.data?.data;
                  if (googleUserData) {
                    localStorage.setItem("userInfo", JSON.stringify({
                      id: googleUserData.id,
                      firstName: googleUserData.firstName,
                      lastName: googleUserData.lastName,
                      username: googleUserData.username,
                      email: googleUserData.email,
                      avatarUrl: googleUserData.avatarUrl || null,
                      roleName: googleUserData.roleName,
                    }));
                  }
                  window.dispatchEvent(new Event("authChange"));

                  showSuccess("Đăng nhập Google thành công!", "Chào mừng bạn quay trở lại SoundMates");

                  const redirectUrl = googleUserData?.redirectUrl;
                  if (redirectUrl) {
                    navigate(redirectUrl);
                  } else {
                    navigate("/");
                  }
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