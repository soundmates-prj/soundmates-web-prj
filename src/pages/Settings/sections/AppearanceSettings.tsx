import { useEffect, useState } from "react";
import { Sun, Moon, Lock, Crown } from "lucide-react";
import { useTheme } from "../../../context/ThemeContext";
import { voiceCloneService } from "../../../services/voiceCloneService";
import { useNavigate } from "react-router-dom";
import "./AppearanceSettings.css";

export default function AppearanceSettings() {
  const { mode, setMode, availableThemes, activeThemeId, applyTheme, resetToDefault } = useTheme();
  const navigate = useNavigate();

      // Kiểm tra gói subscription của user
      const [hasPaidPlan, setHasPaidPlan] = useState<boolean | null>(null);
      const [isPremiumPlan, setIsPremiumPlan] = useState<boolean>(false);
    
      useEffect(() => {
        voiceCloneService.getMySubscriptionPlan().then((plan) => {
          if (!plan || !plan.planName) {
            setHasPaidPlan(false);
            return;
          }
          const nameLower = plan.planName.toLowerCase();
          const isFree = nameLower.includes("free") || nameLower.includes("miễn phí");
          setHasPaidPlan(!isFree);
          setIsPremiumPlan(nameLower.includes("premium"));
        }).catch(() => {
          setHasPaidPlan(false);
        });
      }, []);
    
      const baseThemes = [
        { value: "light", label: "Sáng (Mặc định)", icon: Sun, desc: "Sáng và rõ ràng" },
        { value: "dark", label: "Tối (Mặc định)", icon: Moon, desc: "Dễ nhìn ban đêm" },
      ];
    
      return (
        <div className="appearance-settings">
          <div className="settings-section-header">
            <h1>Giao diện</h1>
            <p>Tùy chỉnh giao diện SoundMates trên thiết bị của bạn</p>
          </div>
    
          <div className="appearance-card">
            <h3>Giao diện Cơ bản</h3>
            <p className="appearance-subtitle">Chọn chế độ sáng tối mặc định</p>
    
            <div className="theme-options">
              {baseThemes.map((t) => {
                const Icon = t.icon;
                const isActive = !activeThemeId && mode === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => {
                      resetToDefault();
                      setMode(t.value as "light" | "dark");
                    }}
                    className={`theme-option ${isActive ? "active" : ""}`}
                  >
                    <div className="theme-option-icon">
                      <Icon size={24} />
                    </div>
                    <div className="theme-option-content">
                      <span className="theme-option-label">{t.label}</span>
                      <span className="theme-option-desc">{t.desc}</span>
                    </div>
                    {isActive && <div className="theme-option-check">✓</div>}
                  </button>
                );
              })}
            </div>
    
            {/* ── Premium Themes ── */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 32, marginBottom: 4 }}>
              <h3 style={{ margin: 0 }}>Chủ đề Nâng cao</h3>
              {hasPaidPlan === false && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  background: "linear-gradient(135deg, #f59e0b, #ef4444)",
                  color: "#fff", fontSize: "0.72rem", fontWeight: 700,
                  padding: "2px 10px", borderRadius: 20, letterSpacing: "0.03em"
                }}>
                  <Crown size={12} /> NÂNG CẤP
                </span>
              )}
            </div>
            <p className="appearance-subtitle">
              {hasPaidPlan === false
                ? "Nâng cấp tài khoản để mở khóa các chủ đề độc quyền"
                : "Các chủ đề độc quyền dành cho bạn"}
            </p>
    
            {availableThemes.length === 0 ? (
              <p className="appearance-subtitle" style={{ color: "#ef4444" }}>
                Chưa có theme nào được tải. Vui lòng kiểm tra kết nối API.
              </p>
            ) : (
              <div className="theme-options" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", position: "relative" }}>
                {availableThemes.map((t) => {
                  const isActive = activeThemeId === t.id;
                  const isThemePremium = t.name.toLowerCase().includes("premium");
                  
                  // Locked nếu user gói Free (mọi theme nâng cao) HOẶC theme là Premium mà user không có gói Premium
                  const locked = hasPaidPlan === false || (isThemePremium && !isPremiumPlan);
    
                  return (
                    <div key={t.id} style={{ position: "relative" }}>
                      <button
                        onClick={() => {
                          if (locked) {
                            navigate("/subscription");
                          } else {
                            applyTheme(t);
                          }
                        }}
                        className={`theme-option ${isActive ? "active" : ""} ${locked ? "theme-locked" : ""}`}
                        style={{
                          ...(isActive && !locked ? { borderColor: t.primaryColor, boxShadow: `0 0 0 3px ${t.primaryColor}20` } : {}),
                          ...(locked ? { opacity: 0.6, cursor: "pointer" } : {}),
                          width: "100%",
                        }}
                        title={locked ? "Cần nâng cấp để sử dụng theme này" : t.name}
                      >
                        <div className="theme-option-icon" style={{ background: t.primaryColor, color: t.textColor || "#fff" }}>
                          {locked ? <Lock size={18} /> : <Crown size={20} />}
                        </div>
                        <div className="theme-option-content">
                          <span className="theme-option-label">{t.name}</span>
                          <span className="theme-option-desc">
                            {locked ? (hasPaidPlan === false ? "🔒 Chỉ dành cho gói trả phí" : "🔒 Chỉ dành cho gói Premium") : `Chế độ: ${t.mode === "dark" ? "Tối" : "Sáng"}`}
                          </span>
                        </div>
                        {isActive && !locked && (
                          <div className="theme-option-check" style={{ background: t.primaryColor }}>✓</div>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
    
            {/* Upsell banner cho free users */}
            {hasPaidPlan === false && (
              <div
                onClick={() => navigate("/subscription")}
                style={{
                  marginTop: 20, padding: "16px 20px", borderRadius: 12, cursor: "pointer",
                  background: "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(239,68,68,0.1))",
                  border: "1px solid rgba(245,158,11,0.3)",
                  display: "flex", alignItems: "center", gap: 14,
                  transition: "all 0.2s ease",
                }}
              >
                <Crown size={24} color="#f59e0b" style={{ flexShrink: 0 }} />
                <div>
                  <p style={{ margin: 0, fontWeight: 700, color: "#f59e0b", fontSize: "0.95rem" }}>
                    Nâng cấp tài khoản để mở khóa tất cả chủ đề
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: "0.82rem", opacity: 0.7 }}>
                    Trải nghiệm hàng chục giao diện độc quyền, cá nhân hóa hoàn toàn theo ý bạn.
                  </p>
                </div>
              </div>
            )}
          </div>
    </div>
  );
}
