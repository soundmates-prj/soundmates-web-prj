import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import "./ThemeToggle.css";

export default function ThemeToggle() {
  const { mode, toggleTheme } = useTheme();

  return (
    <button className="theme-toggle-btn" onClick={toggleTheme} title="Đổi giao diện">
      {mode === "dark" ? (
        <Sun size={20} strokeWidth={2} />
      ) : (
        <Moon size={20} strokeWidth={2} />
      )}
    </button>
  );
}
