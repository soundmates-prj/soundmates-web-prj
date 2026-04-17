import { useState, useEffect } from "react";
import {
  Shield,
  AlertTriangle,
  Trash2,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  X,
  RefreshCw,
  Info,
  Loader2,
} from "lucide-react";
import userService from "../../../services/userService";
import { showSuccess, showError } from "../../../components/common/toastUtils";
import "./AccountSettings.css";

const DEACTIVATION_REASONS = [
  { value: "Tạm nghỉ", label: "Tạm nghỉ sử dụng" },
  { value: "Quá nhiều thông báo", label: "Quá nhiều thông báo" },
  { value: "Lý do cá nhân", label: "Lý do cá nhân" },
  { value: "Khác", label: "Khác" },
];

const CONFIRM_DELETE_TEXT = "XÓA TÀI KHOẢN";

type AccountStatus = "active" | "deactivated" | "pending_deletion";

interface AccountState {
  status: AccountStatus;
  deletionDeadline?: string | null;
}

export default function AccountSettings() {
  const [accountState, setAccountState] = useState<AccountState>({
    status: "active",
  });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [activeSection, setActiveSection] = useState<
    "none" | "deactivate" | "delete"
  >("none");

  // ── Deactivate form ──────────────────────────────────────────────
  const [deactivateReason, setDeactivateReason] = useState("");
  const [deactivateNote, setDeactivateNote] = useState("");
  const [deactivatePassword, setDeactivatePassword] = useState("");
  const [showDeactivatePw, setShowDeactivatePw] = useState(false);
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  // ── Delete form ─────────────────────────────────────────────────
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeletePw, setShowDeletePw] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Cancel deletion ──────────────────────────────────────────────
  const [cancelLoading, setCancelLoading] = useState(false);

  // ── Fetch account status on mount ───────────────────────────────
  useEffect(() => {
    const fetchAccountStatus = async () => {
      try {
        setLoadingProfile(true);
        const storedUser = localStorage.getItem("userInfo");
        const userId = storedUser ? JSON.parse(storedUser).id : "";

        if (!userId) {
          setLoadingProfile(false);
          return;
        }

        const res = await userService.getUserById(userId);

        if (res.success && res.data) {
          if (res.data.deletionScheduledAt) {
            setAccountState({
              status: "pending_deletion",
              deletionDeadline: new Date(
                res.data.deletionScheduledAt,
              ).toLocaleDateString("vi-VN"),
            });
          } else if (!res.data.isActive) {
            setAccountState({ status: "deactivated" });
          } else {
            setAccountState({ status: "active" });
          }
        }
      } catch {
        // On error, default to active — don't block the UI
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchAccountStatus();
  }, []);

  const handleDeactivate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!deactivatePassword) {
      showError("Thiếu thông tin", "Vui lòng nhập mật khẩu để xác nhận");
      return;
    }
    if (!deactivateReason) {
      showError("Thiếu thông tin", "Vui lòng chọn lý do vô hiệu hóa");
      return;
    }

    try {
      setDeactivateLoading(true);
      const res = await userService.deactivateAccount({
        password: deactivatePassword,
        reason: deactivateReason,
        additionalNote: deactivateNote || undefined,
      });

      if (res.success) {
        showSuccess(
          "Đã vô hiệu hóa",
          res.message ||
          "Tài khoản đã được vô hiệu hóa. Bạn có thể đăng nhập lại trong vòng 90 ngày.",
        );
        setTimeout(() => {
          localStorage.clear();
          window.dispatchEvent(new Event("authChange"));
          window.location.href = "/login";
        }, 2000);
      } else {
        showError("Lỗi", res.message || "Không thể vô hiệu hóa tài khoản");
      }
    } catch {
      showError("Lỗi", "Không thể vô hiệu hóa tài khoản");
    } finally {
      setDeactivateLoading(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (deleteConfirmText.trim() !== CONFIRM_DELETE_TEXT) {
      showError(
        "Xác nhận không hợp lệ",
        `Vui lòng nhập chính xác "${CONFIRM_DELETE_TEXT}" để xác nhận`,
      );
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
        showSuccess(
          "Đã gửi yêu cầu",
          res.message || "Yêu cầu xóa tài khoản đã được ghi nhận.",
        );
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

  const handleCancelDeletion = async () => {
    try {
      setCancelLoading(true);
      const res = await userService.cancelAccountDeletion();
      if (res.success) {
        showSuccess(
          "Đã hủy yêu cầu",
          res.message ||
          "Yêu cầu xóa tài khoản đã được hủy. Tài khoản đã được kích hoạt lại.",
        );
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        showError(
          "Lỗi",
          res.message || "Không thể hủy yêu cầu xóa tài khoản",
        );
      }
    } catch {
      showError("Lỗi", "Không thể hủy yêu cầu xóa tài khoản");
    } finally {
      setCancelLoading(false);
    }
  };

  const resetDeactivateForm = () => {
    setDeactivateReason("");
    setDeactivateNote("");
    setDeactivatePassword("");
    setActiveSection("none");
  };

  const resetDeleteForm = () => {
    setDeleteConfirmText("");
    setDeletePassword("");
    setActiveSection("none");
  };

  // ── Loading state ───────────────────────────────────────────────
  if (loadingProfile) {
    return (
      <div className="account-settings">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "300px",
            gap: "12px",
            color: "var(--text-secondary)",
          }}
        >
          <Loader2 size={20} className="spin" />
          <span>Đang tải...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="account-settings">
      <div className="settings-section-header">
        <h1>Quản lý tài khoản</h1>
        <p>Vô hiệu hóa hoặc xóa tài khoản của bạn</p>
      </div>

      {/* ── Status Banner ─────────────────────────────────────── */}
      {accountState.status === "active" && (
        <div className="account-status-banner account-status-banner--active">
          <CheckCircle size={20} />
          <div>
            <strong>Tài khoản đang hoạt động</strong>
            <p>Tài khoản của bạn đang hoạt động bình thường.</p>
          </div>
        </div>
      )}

      {accountState.status === "deactivated" && (
        <div className="account-status-banner account-status-banner--deactivated">
          <Clock size={20} />
          <div>
            <strong>Tài khoản đã bị vô hiệu hóa</strong>
            <p>
              Bạn có thể đăng nhập lại trong vòng 90 ngày để kích hoạt lại
              tài khoản.
            </p>
          </div>
        </div>
      )}

      {accountState.status === "pending_deletion" && (
        <div className="account-status-banner account-status-banner--danger">
          <AlertTriangle size={20} />
          <div>
            <strong>Tài khoản đang chờ xóa</strong>
            <p>
              Tài khoản sẽ bị xóa vĩnh viễn vào{" "}
              <strong>{accountState.deletionDeadline}</strong>.
              Hãy đăng nhập để hủy yêu cầu.
            </p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          DEACTIVATE ACCOUNT CARD
      ══════════════════════════════════════════════════════════ */}
      {accountState.status === "active" && (
        <div className="account-card">
          <div className="account-card-header">
            <div className="account-card-icon account-card-icon--warning">
              <Shield size={20} />
            </div>
            <div>
              <h3>Vô hiệu hóa tài khoản</h3>
              <p>Tạm thời khóa tài khoản và ẩn nội dung khỏi mọi người</p>
            </div>
          </div>

          <div className="account-card-body">
            <div className="account-info-grid">
              <div className="account-info-item">
                <CheckCircle size={14} className="account-info-icon" />
                <span>Hồ sơ và nội dung bị ẩn khỏi công chúng</span>
              </div>
              <div className="account-info-item">
                <CheckCircle size={14} className="account-info-icon" />
                <span>Có thể đăng nhập lại trong 90 ngày để kích hoạt</span>
              </div>
              <div className="account-info-item">
                <CheckCircle size={14} className="account-info-icon" />
                <span>Tất cả dữ liệu được bảo toàn</span>
              </div>
              <div className="account-info-item">
                <CheckCircle size={14} className="account-info-icon" />
                <span>Tài khoản Premium sẽ bị tạm ngưng</span>
              </div>
            </div>

            {activeSection !== "deactivate" ? (
              <button
                className="account-btn account-btn--warning"
                onClick={() => setActiveSection("deactivate")}
              >
                <Shield size={16} />
                Vô hiệu hóa tài khoản
              </button>
            ) : (
              <form onSubmit={handleDeactivate} className="account-form">
                <button
                  type="button"
                  className="account-form-close"
                  onClick={resetDeactivateForm}
                >
                  <X size={16} />
                </button>

                <div className="account-field">
                  <label>Lý do vô hiệu hóa *</label>
                  <select
                    value={deactivateReason}
                    onChange={(e) => setDeactivateReason(e.target.value)}
                    required
                  >
                    <option value="">-- Chọn lý do --</option>
                    {DEACTIVATION_REASONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="account-field">
                  <label>Phản hồi thêm (tùy chọn)</label>
                  <textarea
                    value={deactivateNote}
                    onChange={(e) => setDeactivateNote(e.target.value)}
                    placeholder="Chia sẻ thêm để chúng tôi cải thiện..."
                    rows={3}
                  />
                </div>

                <div className="account-field">
                  <label>Nhập mật khẩu để xác nhận *</label>
                  <div className="account-input-wrap">
                    <input
                      type={showDeactivatePw ? "text" : "password"}
                      value={deactivatePassword}
                      onChange={(e) =>
                        setDeactivatePassword(e.target.value)
                      }
                      placeholder="Nhập mật khẩu hiện tại"
                      required
                    />
                    <button
                      type="button"
                      className="account-toggle-btn"
                      onClick={() => setShowDeactivatePw(!showDeactivatePw)}
                    >
                      {showDeactivatePw ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="account-form-note">
                  <Info size={14} />
                  <span>
                    Sau khi vô hiệu hóa, bạn sẽ được đăng xuất ngay lập
                    tức. Bạn có thể đăng nhập lại trong vòng 90 ngày để
                    kích hoạt lại tài khoản.
                  </span>
                </div>

                <button
                  type="submit"
                  className="account-btn account-btn--warning"
                  disabled={deactivateLoading}
                >
                  {deactivateLoading ? (
                    <>
                      <Loader2 size={16} className="spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    "Xác nhận vô hiệu hóa"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          DELETE ACCOUNT CARD
      ══════════════════════════════════════════════════════════ */}
      {accountState.status === "active" && (
        <div className="account-card account-card--danger">
          <div className="account-card-header">
            <div className="account-card-icon account-card-icon--danger">
              <Trash2 size={20} />
            </div>
            <div>
              <h3>Xóa tài khoản vĩnh viễn</h3>
              <p>Xóa vĩnh viễn tài khoản và toàn bộ dữ liệu</p>
            </div>
          </div>

          <div className="account-card-body">
            <div className="account-warning-box">
              <AlertTriangle size={16} className="account-warning-icon" />
              <div>
                <strong>Hành động này không thể hoàn tác!</strong>
                <ul>
                  <li>
                    Tất cả dữ liệu sẽ bị xóa vĩnh viễn sau{" "}
                    <strong>30 ngày</strong>.
                  </li>
                  <li>
                    Bài viết, bình luận, danh sách phát sẽ bị xóa.
                  </li>
                  <li>
                    Bạn có thể hủy yêu cầu trong vòng 30 ngày bằng cách đăng
                    nhập.
                  </li>
                </ul>
              </div>
            </div>

            {activeSection !== "delete" ? (
              <button
                className="account-btn account-btn--danger-outline"
                onClick={() => setActiveSection("delete")}
              >
                <Trash2 size={16} />
                Xóa tài khoản vĩnh viễn
              </button>
            ) : (
              <form onSubmit={handleDeleteAccount} className="account-form">
                <button
                  type="button"
                  className="account-form-close"
                  onClick={resetDeleteForm}
                >
                  <X size={16} />
                </button>

                <div className="account-field">
                  <label>
                    Nhập{" "}
                    <strong style={{ color: "#dc2626" }}>
                      {CONFIRM_DELETE_TEXT}
                    </strong>{" "}
                    để xác nhận *
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder={CONFIRM_DELETE_TEXT}
                    required
                    className={
                      deleteConfirmText &&
                        deleteConfirmText.trim() !== CONFIRM_DELETE_TEXT
                        ? "input-error"
                        : ""
                    }
                  />
                </div>

                <div className="account-field">
                  <label>Nhập mật khẩu để xác nhận *</label>
                  <div className="account-input-wrap">
                    <input
                      type={showDeletePw ? "text" : "password"}
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="Nhập mật khẩu hiện tại"
                      required
                    />
                    <button
                      type="button"
                      className="account-toggle-btn"
                      onClick={() => setShowDeletePw(!showDeletePw)}
                    >
                      {showDeletePw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="account-form-note account-form-note--danger">
                  <AlertTriangle size={14} />
                  <span>
                    Sau khi xác nhận, bạn sẽ được đăng xuất. Tài khoản sẽ bị
                    xóa vĩnh viễn sau 30 ngày nếu bạn không đăng nhập để hủy.
                  </span>
                </div>

                <button
                  type="submit"
                  className="account-btn account-btn--danger"
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
                    "Xóa tài khoản vĩnh viễn"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          CANCEL DELETION CARD (when pending)
      ══════════════════════════════════════════════════════════ */}
      {accountState.status === "pending_deletion" && (
        <div className="account-card account-card--cancel">
          <div className="account-card-header">
            <div className="account-card-icon account-card-icon--success">
              <RefreshCw size={20} />
            </div>
            <div>
              <h3>Hủy yêu cầu xóa tài khoản</h3>
              <p>Tài khoản của bạn sẽ được khôi phục ngay lập tức</p>
            </div>
          </div>

          <div className="account-card-body">
            <div className="account-success-info">
              <CheckCircle size={16} />
              <span>
                Nếu bạn đổi ý, hãy nhấn nút bên dưới để hủy yêu cầu xóa và
                khôi phục tài khoản ngay lập tức.
              </span>
            </div>

            <button
              className="account-btn account-btn--success"
              onClick={handleCancelDeletion}
              disabled={cancelLoading}
            >
              {cancelLoading ? (
                <>
                  <Loader2 size={16} className="spin" />
                  Đang hủy...
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  Hủy yêu cầu xóa
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
