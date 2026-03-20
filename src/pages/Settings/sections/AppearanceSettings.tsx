import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "../../../context/ThemeContext";
import "./AppearanceSettings.css";

export default function AppearanceSettings() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { value: "light", label: "Sáng", icon: Sun, desc: "Sáng và rõ ràng" },
    { value: "dark", label: "Tối", icon: Moon, desc: "Dễ nhìn ban đêm" },
    { value: "system", label: "Hệ thống", icon: Monitor, desc: "Tự động chuyển" },
  ];

  return (
    <div className="appearance-settings">
      <div className="settings-section-header">
        <h1>Giao diện</h1>
        <p>Tùy chỉnh giao diện SoundMates trên thiết bị của bạn</p>
      </div>

      <div className="appearance-card">
        <h3>Chủ đề</h3>
        <p className="appearance-subtitle">Chọn chủ đề bạn thích</p>

        <div className="theme-options">
          {themes.map((t) => {
            const Icon = t.icon;
            const isActive = theme === t.value;
            return (
              <button
                key={t.value}
                onClick={() => setTheme(t.value as "light" | "dark")}
                className={`theme-option ${isActive ? "active" : ""}`}
                disabled={t.value === "system"}
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
      </div>
    </div>
  );
}
