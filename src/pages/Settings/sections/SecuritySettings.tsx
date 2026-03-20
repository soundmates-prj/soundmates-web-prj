import { useState } from "react";
import { Eye, EyeOff, Lock, Check } from "lucide-react";
import api from "../../../services/axios";
import { showSuccess, showError } from "../../../components/common/toastUtils";
import "./SecuritySettings.css";

export default function SecuritySettings() {
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleShow = (field: "old" | "new" | "confirm") => {
    setShowPassword({ ...showPassword, [field]: !showPassword[field] });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.oldPassword || !form.newPassword || !form.confirmPassword) {
      showError("Thiếu thông tin", "Vui lòng điền đầy đủ các trường mật khẩu");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      showError("Mật khẩu không khớp", "Mật khẩu mới và xác nhận không giống nhau");
      return;
    }

    if (form.newPassword.length < 6) {
      showError("Mật khẩu yếu", "Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    try {
      setLoading(true);
      await api.post("/auth/change-password", {
        oldPassword: form.oldPassword,
        newPassword: form.newPassword,
      });
      showSuccess("Thành công", "Đổi mật khẩu thành công");
      setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      const msg = error.response?.data?.message || "Không thể đổi mật khẩu";
      showError("Lỗi", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="security-settings">
      <div className="settings-section-header">
        <h1>Bảo mật</h1>
        <p>Quản lý mật khẩu và bảo mật tài khoản</p>
      </div>

      <div className="security-card">
        <div className="security-card-header">
          <Lock size={20} />
          <div>
            <h3>Đổi mật khẩu</h3>
            <p>Cập nhật mật khẩu để bảo vệ tài khoản của bạn</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="security-form">
          <div className="security-field">
            <label>Mật khẩu hiện tại</label>
            <div className="security-input-wrap">
              <input
                type={showPassword.old ? "text" : "password"}
                name="oldPassword"
                value={form.oldPassword}
                onChange={handleChange}
                placeholder="Nhập mật khẩu hiện tại"
              />
              <button
                type="button"
                className="security-toggle-btn"
                onClick={() => toggleShow("old")}
              >
                {showPassword.old ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="security-field">
            <label>Mật khẩu mới</label>
            <div className="security-input-wrap">
              <input
                type={showPassword.new ? "text" : "password"}
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                placeholder="Nhập mật khẩu mới"
              />
              <button
                type="button"
                className="security-toggle-btn"
                onClick={() => toggleShow("new")}
              >
                {showPassword.new ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="security-field">
            <label>Xác nhận mật khẩu mới</label>
            <div className="security-input-wrap">
              <input
                type={showPassword.confirm ? "text" : "password"}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Xác nhận mật khẩu mới"
              />
              <button
                type="button"
                className="security-toggle-btn"
                onClick={() => toggleShow("confirm")}
              >
                {showPassword.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="security-submit-btn" disabled={loading}>
            <Check size={18} />
            {loading ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
          </button>
        </form>
      </div>
    </div>
  );
}
