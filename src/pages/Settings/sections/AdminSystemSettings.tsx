import { useState, useEffect, useCallback } from "react";
import {
  Bot,
  Radio,
  KeyRound,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Loader2,
  Settings2,
  AlertCircle,
  RefreshCw,
  BadgeCheck,
} from "lucide-react";
import {
  getGeminiConfig,
  upsertGeminiConfig,
  deleteGeminiConfig,
  type GeminiConfigResponse,
} from "../../../services/geminiConfigService";
import {
  getAzuraCastConfig,
  upsertAzuraCastConfig,
  deleteAzuraCastConfig,
  type AzuraCastConfigResponse,
} from "../../../services/azuracastConfigService";
import {
  liveSessionApiService,
  type AzuraCastHealthResult,
} from "../../../services/liveSessionApiService";
import { showError, showSuccess } from "../../../components/common/toastUtils";
import "./AdminSystemSettings.css";

type Tab = "ai" | "azuracast";

// ── AI Model Section ──────────────────────────────────────────────
function AIModelSection() {
  const [config, setConfig] = useState<GeminiConfigResponse | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [apiKeyError, setApiKeyError] = useState("");

  const loadConfig = useCallback(async () => {
    setLoadingConfig(true);
    try {
      const data = await getGeminiConfig();
      setConfig(data);
      if (data) setIsActive(data.isActive);
    } catch {
      setConfig(null);
    } finally {
      setLoadingConfig(false);
    }
  }, []);

  useEffect(() => { void loadConfig(); }, [loadConfig]);

  const handleSave = async () => {
    if (!apiKeyInput.trim()) {
      setApiKeyError("API Key là bắt buộc.");
      return;
    }
    setSaving(true);
    try {
      await upsertGeminiConfig({ provider: "gemini", apiKey: apiKeyInput.trim(), isActive });
      void loadConfig();
      setApiKeyInput("");
      showSuccess("Đã lưu cấu hình AI thành công!");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      showError("Lưu thất bại", e?.response?.data?.message || e?.message || "Không thể lưu cấu hình.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Bạn có chắc muốn xóa cấu hình AI? Các tính năng AI sẽ ngừng hoạt động.")) return;
    setDeleting(true);
    try {
      await deleteGeminiConfig();
      setConfig(null);
      setApiKeyInput("");
      setIsActive(true);
      showSuccess("Đã xóa cấu hình AI.");
    } catch (err: unknown) {
      const e = err as { message?: string };
      showError("Xóa thất bại", e?.message || "Không thể xóa cấu hình.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="admin-system-card">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <Bot size={20} style={{ color: "var(--text-muted)" }} />
        <div>
          <h3 className="admin-system-card-title" style={{ margin: 0 }}>Cấu hình AI Model</h3>
          <p style={{ color: "var(--text-muted)", fontSize: 12, margin: "2px 0 0" }}>
            Gemini API Key cho script generation, content moderation, AI podcast
          </p>
        </div>
      </div>

      {/* Status row */}
      <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {loadingConfig ? (
            <div className="ops-skeleton" style={{ width: 100, height: 14 }} />
          ) : (
            <span className={`ops-badge ${config?.isConfigured ? "ops-badge--good" : "ops-badge--warn"}`}>
              <Bot size={11} />
              {config?.provider ? config.provider.toUpperCase() : "Chưa cấu hình"}
            </span>
          )}
        </div>
        {config?.isConfigured && (
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Key: <code>{config.maskedApiKey}</code>
          </span>
        )}
        {config?.updatedAt && (
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Cập nhật: {new Date(config.updatedAt).toLocaleString("vi-VN")}
          </span>
        )}
      </div>

      {!config?.isConfigured && (
        <div className="ops-badge ops-badge--warn" style={{ marginBottom: 16, alignSelf: "flex-start" }}>
          <XCircle size={11} /> Chưa có cấu hình
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" }}>Gemini API Key</label>
          <div className="ops-inline-row">
            <input
              className="ops-input"
              style={{ flex: 1, minWidth: 0 }}
              type={showApiKey ? "text" : "password"}
              value={apiKeyInput}
              onChange={e => { setApiKeyInput(e.target.value); setApiKeyError(""); }}
              placeholder={config?.isConfigured ? "Nhập key mới để thay thế (để trống = giữ nguyên)" : "Nhập Gemini API Key (AIza...)"}
            />
            <button className="ops-btn ops-btn--ghost" onClick={() => setShowApiKey(v => !v)} type="button">
              {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {apiKeyError && <p style={{ color: "#ef4444", fontSize: 12, margin: "4px 0 0" }}>{apiKeyError}</p>}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} style={{ marginRight: 6 }} />
            Kích hoạt tính năng AI
          </label>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="ops-btn ops-btn--primary" onClick={() => void handleSave()} disabled={saving}>
            {saving ? <><Loader2 size={15} className="spin" /> Đang lưu...</> : <><CheckCircle2 size={15} /> Lưu cấu hình AI</>}
          </button>
          {config?.isConfigured && (
            <button className="ops-btn ops-btn--ghost" onClick={() => void handleDelete()} disabled={deleting} style={{ color: "#ef4444" }}>
              {deleting ? <><Loader2 size={15} className="spin" /> Đang xóa...</> : <><Trash2 size={15} /> Xóa cấu hình</>}
            </button>
          )}
        </div>

        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
          Lấy API Key từ{" "}
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary-color)" }}>
            Google AI Studio
          </a>
        </div>
      </div>
    </div>
  );
}

// ── AzuraCast Section ─────────────────────────────────────────────
function AzuraCastSection() {
  const [config, setConfig] = useState<AzuraCastConfigResponse | null>(null);
  const [health, setHealth] = useState<AzuraCastHealthResult | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [baseUrlError, setBaseUrlError] = useState("");
  const [apiKeyError, setApiKeyError] = useState("");

  const loadConfig = useCallback(async () => {
    setLoadingConfig(true);
    try {
      const data = await getAzuraCastConfig();
      setConfig(data);
      if (data.isConfigured) {
        setBaseUrl(data.baseUrl);
        setApiKeyInput("");
        setIsActive(data.isActive);
      }
    } catch {
      setConfig(null);
    } finally {
      setLoadingConfig(false);
    }
  }, []);

  useEffect(() => { void loadConfig(); }, [loadConfig]);

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

  const validate = (): boolean => {
    let valid = true;
    setBaseUrlError("");
    setApiKeyError("");

    if (!baseUrl.trim()) {
      setBaseUrlError("URL là bắt buộc.");
      valid = false;
    } else if (!baseUrl.trim().startsWith("http://") && !baseUrl.trim().startsWith("https://")) {
      setBaseUrlError("URL phải bắt đầu bằng http:// hoặc https://.");
      valid = false;
    }

    if (!apiKeyInput.trim()) {
      setApiKeyError("API Key là bắt buộc.");
      valid = false;
    }

    return valid;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const result = await upsertAzuraCastConfig({ baseUrl: baseUrl.trim(), apiKey: apiKeyInput.trim(), isActive });
      setConfig(result);
      setApiKeyInput("");
      showSuccess("Đã lưu cấu hình AzuraCast thành công!");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      showError("Lưu thất bại", e?.response?.data?.message || e?.message || "Không thể lưu cấu hình.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Bạn có chắc muốn xóa cấu hình? Hệ thống sẽ không thể kết nối streaming.")) return;
    setDeleting(true);
    try {
      await deleteAzuraCastConfig();
      setConfig(null);
      setBaseUrl("");
      setApiKeyInput("");
      setIsActive(true);
      showSuccess("Đã xóa cấu hình.");
    } catch (err: unknown) {
      const e = err as { message?: string };
      showError("Xóa thất bại", e?.message || "Không thể xóa cấu hình.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="admin-system-card">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <Radio size={20} style={{ color: "var(--text-muted)" }} />
        <div>
          <h3 className="admin-system-card-title" style={{ margin: 0 }}>Cấu hình AzuraCast</h3>
          <p style={{ color: "var(--text-muted)", fontSize: 12, margin: "2px 0 0" }}>
            Kết nối AzuraCast để đồng bộ đài phát và nội dung nhạc
          </p>
        </div>
      </div>

      {/* Status row */}
      <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {loadingConfig ? (
            <div className="ops-skeleton" style={{ width: 80, height: 14 }} />
          ) : (
            <span className={`ops-badge ${config?.isConfigured ? "ops-badge--good" : "ops-badge--warn"}`}>
              <BadgeCheck size={11} />
              {config?.isConfigured ? "Đã cấu hình" : "Chưa cấu hình"}
            </span>
          )}
        </div>

        <button className="ops-btn ops-btn--outline" onClick={() => void checkHealth()} disabled={loadingHealth}>
          <HeartPulse size={15} />
          {loadingHealth ? "Đang kiểm tra..." : "Check health"}
        </button>

        {health && (
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Stations: {health.stationCount} · {health.responseTimeMs}ms
          </span>
        )}
      </div>

      {!config?.isConfigured && (
        <div className="ops-badge ops-badge--warn" style={{ marginBottom: 16, alignSelf: "flex-start" }}>
          <XCircle size={11} /> Chưa có cấu hình — nhập thông tin bên dưới
        </div>
      )}

      {config?.isConfigured && (
        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
          <span className={`ops-badge ${config.isActive ? "ops-badge--good" : "ops-badge--warn"}`}>
            {config.isActive ? <><CheckCircle2 size={11} /> Đang bật</> : <><XCircle size={11} /> Đang tắt</>}
          </span>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
            URL: <strong>{config.baseUrl}</strong>
          </span>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
            Key: <code>{config.maskedApiKey}</code>
          </span>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" }}>Base URL</label>
          <input
            className="ops-input"
            style={{ width: "100%" }}
            value={baseUrl}
            onChange={e => { setBaseUrl(e.target.value); setBaseUrlError(""); }}
            placeholder="Ví dụ: https://radio.example.com"
          />
          {baseUrlError && <p style={{ color: "#ef4444", fontSize: 12, margin: "4px 0 0" }}>{baseUrlError}</p>}
        </div>

        <div>
          <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" }}>API Key</label>
          <div className="ops-inline-row">
            <input
              className="ops-input"
              style={{ flex: 1, minWidth: 0 }}
              type={showApiKey ? "text" : "password"}
              value={apiKeyInput}
              onChange={e => { setApiKeyInput(e.target.value); setApiKeyError(""); }}
              placeholder={config?.isConfigured ? "Nhập key mới để thay thế (để trống = giữ nguyên)" : "Nhập API Key của AzuraCast"}
            />
            <button className="ops-btn ops-btn--ghost" onClick={() => setShowApiKey(v => !v)} type="button">
              {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {apiKeyError && <p style={{ color: "#ef4444", fontSize: 12, margin: "4px 0 0" }}>{apiKeyError}</p>}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} style={{ marginRight: 6 }} />
            Kích hoạt kết nối
          </label>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="ops-btn ops-btn--primary" onClick={() => void handleSave()} disabled={saving}>
            {saving ? <><Loader2 size={15} className="spin" /> Đang lưu...</> : <><CheckCircle2 size={15} /> Lưu cấu hình</>}
          </button>
          {config?.isConfigured && (
            <button className="ops-btn ops-btn--ghost" onClick={() => void handleDelete()} disabled={deleting} style={{ color: "#ef4444" }}>
              {deleting ? <><Loader2 size={15} className="spin" /> Đang xóa...</> : <><Trash2 size={15} /> Xóa cấu hình</>}
            </button>
          )}
        </div>

        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
          API Key từ AzuraCast → Admin → API Keys
        </div>
      </div>
    </div>
  );
}

// ── HeartPulse icon inline to avoid extra import ──────────────────
function HeartPulse({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
      <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>
    </svg>
  );
}

// ── Main AdminSystemSettings Page ──────────────────────────────────
export default function AdminSystemSettings() {
  const [activeTab, setActiveTab] = useState<Tab>("ai");

  return (
    <div className="admin-system-settings">
      <div className="settings-section-header">
        <h1>Cài đặt</h1>
        <p>Quản lý cấu hình hệ thống</p>
      </div>

      {/* Tab nav */}
      <div className="sys-config-tabs">
        <button
          className={`sys-config-tab ${activeTab === "ai" ? "active" : ""}`}
          onClick={() => setActiveTab("ai")}
        >
          <Bot size={16} />
          AI Model
        </button>
        <button
          className={`sys-config-tab ${activeTab === "azuracast" ? "active" : ""}`}
          onClick={() => setActiveTab("azuracast")}
        >
          <Radio size={16} />
          AzuraCast
        </button>
      </div>

      {activeTab === "ai" && <AIModelSection />}
      {activeTab === "azuracast" && <AzuraCastSection />}

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
