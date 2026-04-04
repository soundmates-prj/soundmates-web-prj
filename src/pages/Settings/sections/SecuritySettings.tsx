import { useState } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  Check,
  Trash2,
  AlertTriangle,
  X,
  Info,
  Loader2,
} from "lucide-react";
import userService from "../../../services/userService";
import { showSuccess, showError } from "../../../components/common/toastUtils";
import "./SecuritySettings.css";

const CONFIRM_DELETE_TEXT = "XÓA TÀI KHOẢN";

export default function SecuritySettings() {
  // ── Password change form ─────────────────────────────────────────
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

  // ── Delete account form ──────────────────────────────────────────
  const [showDeleteForm, setShowDeleteForm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeletePw, setShowDeletePw] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Password handlers ────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleShow = (field: "old" | "new" | "confirm") => {
    setShowPassword({ ...showPassword, [field]: !showPassword[field] });
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
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
      const res = await userService.updatePassword({
        oldPassword: form.oldPassword,
        newPassword: form.newPassword,
      });

      if (res.success) {
        showSuccess("Thành công", "Đổi mật khẩu thành công. Bạn sẽ được đăng xuất...");
        setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
        setTimeout(() => {
          localStorage.clear();
          window.dispatchEvent(new Event("authChange"));
          window.location.href = "/login";
        }, 1500);
      } else {
        showError("Lỗi", res.message || "Không thể đổi mật khẩu");
      }
    } catch {
      showError("Lỗi", "Không thể đổi mật khẩu");
    } finally {
      setLoading(false);
    }
  };

  // ── Delete account handlers ──────────────────────────────────────
  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (deleteConfirmText.trim() !== CONFIRM_DELETE_TEXT) {
      showError("Xác nhận không hợp lệ", `Vui lòng nhập chính xác "${CONFIRM_DELETE_TEXT}" để xác nhận`);
      return;
    }
    if (!deletePassword) {
      showError("Thiếu thông tin", "Vui lòng nhập mật khẩu để xác nhận");
      return;
    }

    try {
      setDeleteLoading(true);
      const res = await userService.requestAccountDeletion({
        password: deletePassword,
        confirmationText: deleteConfirmText,
      });

      if (res.success) {
        showSuccess("Đã gửi yêu cầu", res.message || "Yêu cầu xóa tài khoản đã được ghi nhận.");
        setTimeout(() => {
          localStorage.clear();
          window.dispatchEvent(new Event("authChange"));
          window.location.href = "/login";
        }, 2000);
      } else {
        showError("Lỗi", res.message || "Không thể xóa tài khoản");
      }
    } catch {
      showError("Lỗi", "Không thể xóa tài khoản");
    } finally {
      setDeleteLoading(false);
    }
  };

  const resetDeleteForm = () => {
    setDeleteConfirmText("");
    setDeletePassword("");
    setShowDeleteForm(false);
  };

  return (
    <div className="security-settings">
      <div className="settings-section-header">
        <h1>Bảo mật</h1>
        <p>Quản lý mật khẩu và bảo mật tài khoản của bạn</p>
      </div>

      {/* ── Change Password Card ───────────────────────────────── */}
      <div className="security-card">
        <div className="security-card-header">
          <div className="security-card-icon">
            <Lock size={20} />
          </div>
          <div>
            <h3>Đổi mật khẩu</h3>
            <p>Cập nhật mật khẩu để bảo vệ tài khoản của bạn</p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="security-form">
          <div className="security-field">
            <label>Mật khẩu hiện tại</label>
            <div className="security-input-wrap">
              <input
                type={showPassword.old ? "text" : "password"}
                name="oldPassword"
                value={form.oldPassword}
                onChange={handleChange}
                placeholder="Nhập mật khẩu hiện tại"
                autoComplete="current-password"
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
                autoComplete="new-password"
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
                autoComplete="new-password"
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
            {loading ? (
              <>
                <Loader2 size={18} className="spin" />
                Đang cập nhật...
              </>
            ) : (
              <>
                <Check size={18} />
                Cập nhật mật khẩu
              </>
            )}
          </button>
        </form>
      </div>

      {/* ── Delete Account Card ────────────────────────────────── */}
      <div className="security-card security-card--danger">
        <div className="security-card-header">
          <div className="security-card-icon security-card-icon--danger">
            <Trash2 size={20} />
          </div>
          <div>
            <h3>Xóa tài khoản vĩnh viễn</h3>
            <p>Xóa vĩnh viễn tài khoản và toàn bộ dữ liệu cá nhân</p>
          </div>
        </div>

        <div className="security-card-body">
          {/* Warning banner */}
          <div className="security-danger-alert">
            <AlertTriangle size={16} />
            <div>
              <strong>Hành động này không thể hoàn tác!</strong>
              <ul>
                <li>
                  Tất cả dữ liệu sẽ bị xóa vĩnh viễn sau 30 ngày
                </li>
                <li>
                  Bài viết, bình luận, danh sách phát, tin nhắn sẽ bị xóa
                  hoàn toàn.
                </li>
                <li>
                  Bạn có thể hủy yêu cầu trong vòng 30 ngày bằng cách đăng
                  nhập.
                </li>
              </ul>
            </div>
          </div>

          {!showDeleteForm ? (
            <button
              className="security-danger-btn"
              onClick={() => setShowDeleteForm(true)}
            >
              <Trash2 size={16} />
              Xóa tài khoản vĩnh viễn
            </button>
          ) : (
            <form onSubmit={handleDeleteAccount} className="security-delete-form">
              <button
                type="button"
                className="security-form-close"
                onClick={resetDeleteForm}
              >
                <X size={16} />
              </button>

              {/* Confirmation text input */}
              <div className="security-field">
                <label>
                  Nhập <strong className="text-danger">"{CONFIRM_DELETE_TEXT}"</strong> để xác nhận *
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={CONFIRM_DELETE_TEXT}
                  className={
                    deleteConfirmText &&
                      deleteConfirmText.trim() !== CONFIRM_DELETE_TEXT
                      ? "input-error"
                      : ""
                  }
                  autoComplete="off"
                />
                {deleteConfirmText &&
                  deleteConfirmText.trim() !== CONFIRM_DELETE_TEXT && (
                    <span className="security-field-error">
                      Vui lòng nhập chính xác "{CONFIRM_DELETE_TEXT}"
                    </span>
                  )}
              </div>

              {/* Password input */}
              <div className="security-field">
                <label>Nhập mật khẩu để xác nhận *</label>
                <div className="security-input-wrap">
                  <input
                    type={showDeletePw ? "text" : "password"}
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Nhập mật khẩu hiện tại"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="security-toggle-btn"
                    onClick={() => setShowDeletePw(!showDeletePw)}
                  >
                    {showDeletePw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Note */}
              <div className="security-info-note">
                <Info size={14} />
                <span>
                  Sau khi xác nhận, bạn sẽ được đăng xuất ngay lập tức. Tài
                  khoản sẽ bị xóa vĩnh viễn sau 30 ngày nếu bạn không đăng nhập
                  để hủy yêu cầu.
                </span>
              </div>

              <button
                type="submit"
                className="security-danger-btn security-danger-btn--confirm"
                disabled={
                  deleteLoading ||
                  deleteConfirmText.trim() !== CONFIRM_DELETE_TEXT
                }
              >
                {deleteLoading ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Xóa tài khoản vĩnh viễn
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
