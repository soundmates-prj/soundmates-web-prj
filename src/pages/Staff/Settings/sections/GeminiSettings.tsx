import { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Brain,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react";
import {
  getGeminiConfig,
  upsertGeminiConfig,
  deleteGeminiConfig,
  type GeminiConfigResponse,
} from "../../../../services/geminiConfigService";
import { showError, showSuccess } from "../../../../components/common/toastUtils";
import "../../../Settings/sections/AdminSystemSettings.css";

export default function GeminiSettings() {
  // ── State ─────────────────────────────────────────────────────
  const [config, setConfig] = useState<GeminiConfigResponse | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Validation errors
  const [apiKeyError, setApiKeyError] = useState("");

  // ── Load config on mount ───────────────────────────────────────
  const loadConfig = useCallback(async () => {
    setLoadingConfig(true);
    try {
      const data = await getGeminiConfig();
      setConfig(data);
      if (data) {
        setIsActive(data.isActive);
      }
    } catch {
      setConfig(null);
    } finally {
      setLoadingConfig(false);
    }
  }, []);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  // ── Validation ────────────────────────────────────────────────
  const validate = (): boolean => {
    setApiKeyError("");

    if (!apiKeyInput.trim()) {
      setApiKeyError("API Key là bắt buộc.");
      return false;
    }

    return true;
  };

  // ── Save ───────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      await upsertGeminiConfig({
        provider: "Gemini",
        apiKey: apiKeyInput.trim(),
        isActive,
      });
      setApiKeyInput("");
      await loadConfig();
      showSuccess("Đã lưu cấu hình Gemini thành công!");
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { message?: string } }; message?: string };
      const msg =
        errObj?.response?.data?.message ||
        errObj?.message ||
        "Không thể lưu cấu hình. Vui lòng kiểm tra API Key.";
      showError("Lưu thất bại", msg);
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────
  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Bạn có chắc muốn xóa cấu hình Gemini? AI features sẽ không hoạt động cho đến khi cấu hình lại."
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      await deleteGeminiConfig();
      setConfig(null);
      setApiKeyInput("");
      setIsActive(true);
      showSuccess("Đã xóa cấu hình Gemini.");
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      showError("Xóa thất bại", errObj?.message || "Không thể xóa cấu hình.");
    } finally {
      setDeleting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="admin-system-settings">
      <div className="settings-section-header">
        <h1 style={{
          background: 'linear-gradient(135deg, #1a9fd4 0%, #55c5f1 50%, #a0e4ff 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>Cấu hình Gemini AI</h1>
        <p>Quản lý API Key cho dịch vụ Gemini AI sử dụng trong podcast creation</p>
      </div>

      {/* ── Status cards ── */}
      <div className="admin-system-grid">
        <div className="admin-system-card">
          <div className="admin-system-card-title">Trạng thái</div>
          {loadingConfig ? (
            <div className="ops-skeleton" style={{ width: "60%", height: 16 }} />
          ) : (
            <span
              className={`ops-badge ${
                config?.isConfigured ? "ops-badge--good" : "ops-badge--warn"
              }`}
            >
              {config?.isConfigured ? (
                <><CheckCircle2 size={11} /> Đã cấu hình</>
              ) : (
                <><XCircle size={11} /> Chưa cấu hình</>
              )}
            </span>
          )}
        </div>

        <div className="admin-system-card">
          <div className="admin-system-card-title">Trạng thái kích hoạt</div>
          {loadingConfig ? (
            <div className="ops-skeleton" style={{ width: "60%", height: 16 }} />
          ) : (
            <span
              className={`ops-badge ${
                config?.isActive ? "ops-badge--good" : "ops-badge--warn"
              }`}
            >
              {config?.isActive ? (
                <><CheckCircle2 size={11} /> Đang bật</>
              ) : (
                <><XCircle size={11} /> Đang tắt</>
              )}
            </span>
          )}
        </div>
      </div>

      {/* ── Config form ── */}
      <div className="admin-system-card" style={{ marginTop: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <Brain size={20} style={{ color: "var(--text-muted)" }} />
          <div>
            <h3 className="admin-system-card-title" style={{ margin: 0 }}>
              Cấu hình Gemini API Key
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: 12, margin: "2px 0 0" }}>
              Nhập API Key từ Google AI Studio. Key được mã hóa trước khi lưu.
            </p>
          </div>
        </div>

        {/* Current config summary */}
        {config?.isConfigured && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 4 }}>
              Key hiện tại: <code>{config.maskedApiKey}</code>
            </div>
            {config.updatedAt && (
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Cập nhật lần cuối: {new Date(config.updatedAt).toLocaleString("vi-VN")}
              </div>
            )}
          </div>
        )}

        {!config?.isConfigured && (
          <div
            className="ops-badge ops-badge--warn"
            style={{ marginBottom: 16, alignSelf: "flex-start" }}
          >
            <XCircle size={11} />
            Chưa có cấu hình — nhập thông tin bên dưới
          </div>
        )}

        {/* Form fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* API Key */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" }}>
              Gemini API Key
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                style={{
                  width: "100%",
                  minWidth: 0,
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid rgba(148, 163, 184, 0.24)",
                  background: "var(--bg-secondary)",
                  color: "var(--text-color)",
                  fontSize: 14,
                }}
                type={showApiKey ? "text" : "password"}
                value={apiKeyInput}
                onChange={(e) => {
                  setApiKeyInput(e.target.value);
                  setApiKeyError("");
                }}
                placeholder={
                  config?.isConfigured
                    ? "Nhập key mới để thay thế (để trống = giữ nguyên)"
                    : "Nhập Gemini API Key của bạn"
                }
              />
              <button
                onClick={() => setShowApiKey((v) => !v)}
                type="button"
                title={showApiKey ? "Ẩn" : "Hiện"}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid rgba(148, 163, 184, 0.24)",
                  background: "var(--bg-secondary)",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                }}
              >
                {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {apiKeyError && (
              <p style={{ color: "#ef4444", fontSize: 12, margin: "4px 0 0" }}>
                {apiKeyError}
              </p>
            )}
          </div>

          {/* IsActive toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                style={{ marginRight: 6 }}
              />
              Kích hoạt Gemini AI
            </label>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
            <button
              onClick={() => void handleSave()}
              disabled={saving}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                background: "#3b82f6",
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? (
                <>
                  <Loader2 size={15} className="spin" /> Đang lưu...
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} /> Lưu cấu hình
                </>
              )}
            </button>

            {config?.isConfigured && (
              <button
                onClick={() => void handleDelete()}
                disabled={deleting}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "1px solid rgba(148, 163, 184, 0.24)",
                  background: "transparent",
                  color: "#ef4444",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: deleting ? "not-allowed" : "pointer",
                  opacity: deleting ? 0.6 : 1,
                }}
              >
                {deleting ? (
                  <>
                    <Loader2 size={15} className="spin" /> Đang xóa...
                  </>
                ) : (
                  <>
                    <Trash2 size={15} /> Xóa cấu hình
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <style>{`
          .spin {
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}
