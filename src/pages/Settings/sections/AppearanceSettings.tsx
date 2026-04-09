import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "../../../context/ThemeContext";
import "./AppearanceSettings.css";

export default function AppearanceSettings() {
  const { mode, setMode, availableThemes, activeThemeId, applyTheme, resetToDefault } = useTheme();

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

        <h3 style={{ marginTop: 32 }}>Chủ đề Nâng cao (Premium)</h3>
        <p className="appearance-subtitle">Các chủ đề độc quyền dành cho bạn</p>

        {availableThemes.length === 0 ? (
          <p className="appearance-subtitle" style={{ color: '#ef4444' }}>Chưa có theme nào được tải. Vui lòng kiểm tra kết nối API.</p>
        ) : (
          <div className="theme-options" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
            {availableThemes.map((t) => {
              const isActive = activeThemeId === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => applyTheme(t)}
                  className={`theme-option ${isActive ? "active" : ""}`}
                  style={isActive ? { borderColor: t.primaryColor, boxShadow: `0 0 0 3px ${t.primaryColor}20` } : {}}
                >
                  <div className="theme-option-icon" style={{ background: t.primaryColor, color: t.textColor || '#fff' }}>
                    <Monitor size={20} />
                  </div>
                  <div className="theme-option-content">
                    <span className="theme-option-label">{t.name}</span>
                    <span className="theme-option-desc">Chế độ: {t.mode === 'dark' ? 'Tối' : 'Sáng'}</span>
                  </div>
                  {isActive && <div className="theme-option-check" style={{ background: t.primaryColor }}>✓</div>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
