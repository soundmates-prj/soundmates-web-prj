import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import "./ThemeToggle.css";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button className="theme-toggle-btn" onClick={toggleTheme} title="Đổi giao diện">
      {theme === "dark" ? (
        <Sun size={20} strokeWidth={2} />
      ) : (
        <Moon size={20} strokeWidth={2} />
      )}
    </button>
  );
}
