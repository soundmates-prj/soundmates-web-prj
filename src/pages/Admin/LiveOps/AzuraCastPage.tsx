import { useState } from "react";
import { BadgeCheck, HeartPulse, KeyRound } from "lucide-react";
import {
  liveSessionApiService,
  type ApiKeyTestResult,
  type AzuraCastHealthResult,
} from "../../../services/liveSessionApiService";
import { showError, showSuccess } from "../../../components/common/toastUtils";
import "./LiveOps.css";

export default function AzuraCastPage() {
  const [health, setHealth] = useState<AzuraCastHealthResult | null>(null);
  const [testResult, setTestResult] = useState<ApiKeyTestResult | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [testing, setTesting] = useState(false);

  const checkHealth = async () => {
    setLoadingHealth(true);
    try {
      const data = await liveSessionApiService.getAzuraHealth();
      setHealth(data);
      showSuccess("Đã kiểm tra health AzuraCast");
    } catch {
      showError("Health check thất bại", "Không thể kết nối /api/v1/azuracast/health");
    } finally {
      setLoadingHealth(false);
    }
  };

  const testApiKey = async () => {
    if (!apiKey.trim()) {
      showError("Vui lòng nhập API key");
      return;
    }

    setTesting(true);
    try {
      const result = await liveSessionApiService.testAzuraApiKey(apiKey.trim());
      setTestResult(result);
      showSuccess("API key hợp lệ");
    } catch {
      showError("API key không hợp lệ");
    } finally {
      setTesting(false);
    }
  };

  const connectionBadge = health?.isHealthy ? "Connected" : "Disconnected";

  return (
    <div className="ops-page">
      <div className="ops-header">
        <div>
          <h1 className="ops-title">AzuraCast Page</h1>
          <p className="ops-subtitle">Health status, API key test và connection badge</p>
        </div>
      </div>

      <div className="ops-grid" style={{ marginBottom: 14 }}>
        <div className="ops-card">
          <h3 className="ops-card-title">Connection badge</h3>
          <span className={`ops-badge ${health?.isHealthy ? "ops-badge--good" : "ops-badge--danger"}`}>
            <BadgeCheck size={12} /> {connectionBadge}
          </span>
        </div>
        <div className="ops-card">
          <h3 className="ops-card-title">Health status</h3>
          <button className="ops-btn ops-btn--primary" onClick={() => void checkHealth()} disabled={loadingHealth}>
            <HeartPulse size={15} /> {loadingHealth ? "Đang kiểm tra..." : "Check health"}
          </button>
          {health ? (
            <div className="ops-stack" style={{ marginTop: 10 }}>
              <div>Base URL: {health.baseUrl}</div>
              <div>Stations: {health.stationCount}</div>
              <div>Response: {health.responseTimeMs} ms</div>
              <div>Message: {health.message}</div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="ops-card">
        <h3 className="ops-card-title">Test API key</h3>
        <div className="ops-inline-row">
          <input
            className="ops-input"
            style={{ minWidth: 320 }}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Nhập AzuraCast API key"
          />
          <button className="ops-btn ops-btn--ghost" onClick={() => void testApiKey()} disabled={testing}>
            <KeyRound size={15} />
            {testing ? "Đang test..." : "Test API key"}
          </button>
        </div>

        {testResult ? (
          <div className="ops-stack" style={{ marginTop: 12 }}>
            <span className={`ops-badge ${testResult.isValid ? "ops-badge--good" : "ops-badge--danger"}`}>
              {testResult.isValid ? "Valid" : "Invalid"}
            </span>
            <div>Masked key: {testResult.apiKey}</div>
            <div>Stations: {testResult.stationCount}</div>
            <div>{testResult.message}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
