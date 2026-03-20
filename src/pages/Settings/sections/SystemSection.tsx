import React, { useState } from "react";
import { ChevronDown, Eye, EyeOff } from "lucide-react";
import { showSuccess, showError } from "../../../components/common/toastUtils";
import { useTheme } from "../../../context/ThemeContext";
import "./SystemSection.css";
import "./ProfileSection.css"; /* reuse .form-group, .input-prefix, .select-wrap */

interface SystemForm {
  theme: string;
  language: string;
}

interface PwForm {
  current: string;
  next: string;
  confirm: string;
}

const SystemSection: React.FC = () => {
  const { theme, setTheme } = useTheme();
  
  const [systemForm, setSystemForm] = useState<SystemForm>({
    theme: theme === 'dark' ? "Tối" : "Sáng",
    language: "Tiếng Việt",
  });

  const [showPwSection, setShowPwSection] = useState(false);
  const [pwForm, setPwForm] = useState<PwForm>({
    current: "",
    next: "",
    confirm: "",
  });
  const [showPw, setShowPw] = useState({
    current: false,
    next: false,
    confirm: false,
  });

  /* ── handlers ── */
  const toggleShowPw = (field: keyof typeof showPw) =>
    setShowPw((prev) => ({ ...prev, [field]: !prev[field] }));

  const handleChangePassword = async () => {
    if (!pwForm.current || !pwForm.next || !pwForm.confirm) {
      showError("Thiếu thông tin", "Vui lòng điền đầy đủ các trường mật khẩu");
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      showError("Không khớp", "Mật khẩu mới và xác nhận không khớp");
      return;
    }
    // TODO: PUT /api/auth/change-password  { currentPassword, newPassword }
    showSuccess("Thành công", "Mật khẩu đã được thay đổi!");
    setPwForm({ current: "", next: "", confirm: "" });
    setShowPwSection(false);
  };

  const PW_FIELDS: { field: keyof PwForm; label: string }[] = [
    { field: "current", label: "Mật khẩu hiện tại" },
    { field: "next", label: "Mật khẩu mới" },
    { field: "confirm", label: "Xác nhận mật khẩu mới" },
  ];

  return (
    <div className="settings-card">
      <div className="settings-banner" style={{ minHeight: 72 }} />

      <div className="settings-form">
        {/* Theme */}
        <div className="form-group">
          <label>Themes</label>
          <div className="select-wrap">
            <span className="select-prefix-icon">{theme === 'dark' ? '🌙' : '☀️'}</span>
            <select
              value={systemForm.theme}
              onChange={(e) => {
                const newThemeStr = e.target.value;
                setSystemForm({ ...systemForm, theme: newThemeStr });
                setTheme(newThemeStr === 'Tối' ? 'dark' : 'light');
              }}
            >
              <option>Sáng</option>
              <option>Tối</option>
            </select>
            <ChevronDown size={15} className="select-chevron" />
          </div>
        </div>

        {/* Language */}
        <div className="form-group">
          <label>Ngôn ngữ</label>
          <div className="select-wrap">
            <span className="select-prefix-icon">🌐</span>
            <select
              value={systemForm.language}
              onChange={(e) =>
                setSystemForm({ ...systemForm, language: e.target.value })
              }
            >
              <option>Tiếng Việt</option>
              <option>English</option>
            </select>
            <ChevronDown size={15} className="select-chevron" />
          </div>
        </div>

        {/* Email – readonly */}
        <div className="form-group">
          <label>Email</label>
          <div className="input-prefix">
            <span className="input-prefix-icon">✉️</span>
            <input
              value="user***04@gmail.com"
              readOnly
              className="input-readonly"
            />
          </div>
        </div>

        {/* Username – readonly */}
        <div className="form-group">
          <label>Username</label>
          <div className="input-prefix">
            <span className="input-prefix-icon">👤</span>
            <input value="user****12" readOnly className="input-readonly" />
          </div>
        </div>

        {/* Change password toggle */}
        <div className="form-group">
          <label>Cài đặt tài khoản</label>
          <button
            className="btn-change-pw"
            onClick={() => setShowPwSection((v) => !v)}
          >
            🔒 Đổi mật khẩu mới
          </button>
        </div>

        {/* Password fields – collapsible */}
        {showPwSection && (
          <div className="pw-section">
            {PW_FIELDS.map(({ field, label }) => (
              <div className="form-group" key={field}>
                <label>{label}</label>
                <div className="input-suffix">
                  <input
                    type={showPw[field] ? "text" : "password"}
                    value={pwForm[field]}
                    placeholder="••••••••"
                    onChange={(e) =>
                      setPwForm({ ...pwForm, [field]: e.target.value })
                    }
                  />
                  <button
                    className="pw-toggle"
                    onClick={() => toggleShowPw(field)}
                    type="button"
                  >
                    {showPw[field] ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            ))}

            <div className="form-actions">
              <button
                className="btn-ghost"
                onClick={() => setShowPwSection(false)}
              >
                Huỷ
              </button>
              <button className="btn-primary" onClick={handleChangePassword}>
                Lưu mật khẩu
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemSection;
