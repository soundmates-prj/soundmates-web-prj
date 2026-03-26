import { useState, useEffect, useCallback } from "react";
import {
  BadgeCheck,
  HeartPulse,
  KeyRound,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Loader2,
  Radio,
} from "lucide-react";
import {
  liveSessionApiService,
  type ApiKeyTestResult,
  type AzuraCastHealthResult,
} from "../../../services/liveSessionApiService";
import {
  getAzuraCastConfig,
  upsertAzuraCastConfig,
  deleteAzuraCastConfig,
  type AzuraCastConfigResponse,
} from "../../../services/azuracastConfigService";
import { showError, showSuccess } from "../../../components/common/toastUtils";
import "./LiveOps.css";

export default function StreamingServicePage() {
  // ── State ─────────────────────────────────────────────────────
  const [config, setConfig] = useState<AzuraCastConfigResponse | null>(null);
  const [health, setHealth] = useState<AzuraCastHealthResult | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Validation errors
  const [baseUrlError, setBaseUrlError] = useState("");
  const [apiKeyError, setApiKeyError] = useState("");

  // ── Load config on mount ───────────────────────────────────────
  const loadConfig = useCallback(async () => {
    setLoadingConfig(true);
    try {
      const data = await getAzuraCastConfig();
      setConfig(data);
      if (data.isConfigured) {
        setBaseUrl(data.baseUrl);
        setApiKeyInput(""); // Don't prefill — it's masked from backend
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

  // ── Health check ───────────────────────────────────────────────
  const checkHealth = async () => {
    setLoadingHealth(true);
    try {
      const data = await liveSessionApiService.getAzuraHealth();
      setHealth(data);
      showSuccess("Đã kiểm tra kết nối thành công");
    } catch {
      showError("Health check thất bại", "Không thể kết nối đến streaming service.");
    } finally {
      setLoadingHealth(false);
    }
  };

  // ── Validation ────────────────────────────────────────────────
  const validate = (): boolean => {
    let valid = true;
    setBaseUrlError("");
    setApiKeyError("");

    if (!baseUrl.trim()) {
      setBaseUrlError("URL là bắt buộc.");
      valid = false;
    } else if (
      !baseUrl.trim().startsWith("http://") &&
      !baseUrl.trim().startsWith("https://")
    ) {
      setBaseUrlError("URL phải bắt đầu bằng http:// hoặc https://.");
      valid = false;
    }

    if (!apiKeyInput.trim()) {
      setApiKeyError("API Key là bắt buộc.");
      valid = false;
    }

    return valid;
  };

  // ── Save ───────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const result = await upsertAzuraCastConfig({
        baseUrl: baseUrl.trim(),
        apiKey: apiKeyInput.trim(),
        isActive,
      });
      setConfig(result);
      setApiKeyInput(""); // Clear plain-text key from memory
      showSuccess("Đã lưu cấu hình thành công!");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể lưu cấu hình. Vui lòng kiểm tra URL và API Key.";
      showError("Lưu thất bại", msg);
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────
  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Bạn có chắc muốn xóa cấu hình? Hệ thống sẽ không thể kết nối streaming cho đến khi cấu hình lại."
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      await deleteAzuraCastConfig();
      setConfig(null);
      setBaseUrl("");
      setApiKeyInput("");
      setIsActive(true);
      showSuccess("Đã xóa cấu hình.");
    } catch (err: any) {
      showError("Xóa thất bại", err?.message || "Không thể xóa cấu hình.");
    } finally {
      setDeleting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="ops-page">
      <div className="ops-header">
        <div>
          <h1 className="ops-title">Streaming Service</h1>
          <p className="ops-subtitle">
            Quản lý kết nối dịch vụ streaming cho hệ thống live session
          </p>
        </div>
      </div>

      {/* ── Status cards ── */}
      <div className="ops-grid" style={{ marginBottom: 14 }}>
        <div className="ops-card">
          <h3 className="ops-card-title">Trạng thái kết nối</h3>
          <span
            className={`ops-badge ${
              health?.isHealthy ? "ops-badge--good" : "ops-badge--danger"
            }`}
          >
            <BadgeCheck size={12} />
            {health?.isHealthy ? "Đã kết nối" : "Chưa kết nối"}
          </span>
        </div>

        <div className="ops-card">
          <h3 className="ops-card-title">Cấu hình</h3>
          {loadingConfig ? (
            <div className="ops-skeleton" style={{ width: "60%", height: 16 }} />
          ) : (
            <span
              className={`ops-badge ${
                config?.isConfigured ? "ops-badge--good" : "ops-badge--warn"
              }`}
            >
              {config?.isConfigured ? (
                <>
                  <CheckCircle2 size={11} /> Đã cấu hình
                </>
              ) : (
                <>
                  <XCircle size={11} /> Chưa cấu hình
                </>
              )}
            </span>
          )}
        </div>

        <div className="ops-card">
          <h3 className="ops-card-title">Kiểm tra kết nối</h3>
          <button
            className="ops-btn ops-btn--primary"
            onClick={() => void checkHealth()}
            disabled={loadingHealth}
          >
            <HeartPulse size={15} />
            {loadingHealth ? "Đang kiểm tra..." : "Check health"}
          </button>
          {health && (
            <div className="ops-stack" style={{ marginTop: 10, fontSize: 13 }}>
              <div>Stations: {health.stationCount}</div>
              <div>Response: {health.responseTimeMs} ms</div>
              <div>{health.message}</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Config form ── */}
      <div className="ops-card">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <Radio size={20} style={{ color: "var(--text-muted)" }} />
          <div>
            <h3 className="ops-card-title" style={{ margin: 0 }}>
              Cấu hình Streaming Service
            </h3>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: 12,
                margin: "2px 0 0",
              }}
            >
              Nhập URL và API Key để kết nối dịch vụ streaming. API Key được mã hóa trước khi lưu.
            </p>
          </div>
        </div>

        {/* Current config summary */}
        {config?.isConfigured && (
          <div className="ops-stack" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <span
                className={`ops-badge ${config.isActive ? "ops-badge--good" : "ops-badge--warn"}`}
              >
                {config.isActive ? (
                  <CheckCircle2 size={11} /> <span>Đang bật</span>
                ) : (
                  <XCircle size={11} /> <span>Đang tắt</span>
                )}
              </span>
              <span style={{ color: "var(--text-muted)" }}>
                URL: <strong>{config.baseUrl}</strong>
              </span>
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Key hiện tại: <code>{config.maskedApiKey}</code>
            </div>
            {config.updatedAt && (
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Cập nhật lần cuối:{" "}
                {new Date(config.updatedAt).toLocaleString("vi-VN")}
              </div>
            )}
          </div>
        )}

        {/* Not configured yet */}
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
        <div className="ops-stack" style={{ gap: 12 }}>
          {/* Base URL */}
          <div>
            <label
              style={{
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 6,
                display: "block",
              }}
            >
              Base URL
            </label>
            <input
              className="ops-input"
              style={{ width: "100%", minWidth: 0 }}
              value={baseUrl}
              onChange={(e) => {
                setBaseUrl(e.target.value);
                setBaseUrlError("");
              }}
              placeholder="Ví dụ: http://streaming.local:5000"
            />
            {baseUrlError && (
              <p style={{ color: "#ef4444", fontSize: 12, margin: "4px 0 0" }}>
                {baseUrlError}
              </p>
            )}
          </div>

          {/* API Key */}
          <div>
            <label
              style={{
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 6,
                display: "block",
              }}
            >
              API Key
            </label>
            <div className="ops-inline-row">
              <input
                className="ops-input"
                style={{ width: "100%", minWidth: 0, flex: 1 }}
                type={showApiKey ? "text" : "password"}
                value={apiKeyInput}
                onChange={(e) => {
                  setApiKeyInput(e.target.value);
                  setApiKeyError("");
                }}
                placeholder={
                  config?.isConfigured
                    ? "Nhập key mới để thay thế (để trống = giữ nguyên)"
                    : "Nhập API Key của dịch vụ streaming"
                }
              />
              <button
                className="ops-btn ops-btn--ghost"
                onClick={() => setShowApiKey((v) => !v)}
                type="button"
                title={showApiKey ? "Ẩn" : "Hiện"}
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
            <label
              style={{ fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                style={{ marginRight: 6 }}
              />
              Kích hoạt kết nối
            </label>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
            <button
              className="ops-btn ops-btn--primary"
              onClick={() => void handleSave()}
              disabled={saving}
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
                className="ops-btn ops-btn--ghost"
                onClick={() => void handleDelete()}
                disabled={deleting}
                style={{ color: "#ef4444" }}
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
