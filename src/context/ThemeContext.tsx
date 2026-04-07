import React, { createContext, useContext, useEffect, useState } from 'react';
import { themeApiService } from '../services/themeApiService';
import type { ThemeResult } from '../services/themeApiService';

export type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
  activeThemeId: string | null;
  setActiveThemeId: (id: string | null) => void;
  availableThemes: ThemeResult[];
  applyTheme: (theme: ThemeResult) => void;
  resetToDefault: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const savedMode = localStorage.getItem('theme_mode');
    return (savedMode as ThemeMode) || 'light';
  });

  const [activeThemeId, setActiveThemeIdState] = useState<string | null>(() => {
    return localStorage.getItem('active_theme_id');
  });

  const [availableThemes, setAvailableThemes] = useState<ThemeResult[]>([]);

  useEffect(() => {
    // Load available themes from backend API
    const loadThemes = async () => {
      const themes = await themeApiService.getActiveThemes();
      setAvailableThemes(themes);

      // Auto-apply saved theme if it exists in the fetched list
      const savedThemeId = localStorage.getItem('active_theme_id');
      if (savedThemeId) {
        const themeToApply = themes.find(t => t.id === savedThemeId);
        if (themeToApply) {
          applyTheme(themeToApply);
        }
      }
    };
    loadThemes();
  }, []);

  useEffect(() => {
    localStorage.setItem('theme_mode', mode);
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  const applyTheme = (theme: ThemeResult) => {
    // Only apply full theme on specific routes if needed, 
    // but we inject it to the body or a specific wrapper so it doesn't break global styles.
    // For now, we inject to :root but prefix with --user-theme- 
    // so individual pages (Profile, Live) can opt-in to use them.

    const root = document.documentElement;

    // Core project variables - using custom namespace to not break global UI
    root.style.setProperty('--user-theme-primary', theme.primaryColor || '#55C5F1');

    if (theme.backgroundColor) {
      root.style.setProperty('--user-theme-bg', theme.backgroundColor);
    }

    if (theme.textColor) {
      root.style.setProperty('--user-theme-text', theme.textColor);
    }

    if (theme.secondaryColor) {
      root.style.setProperty('--user-theme-secondary', theme.secondaryColor);
    }

    // Emotion & Config
    if (theme.gradientBackground) {
      root.style.setProperty('--user-theme-gradient', theme.gradientBackground);
    }

    if (theme.fontFamily) root.style.setProperty('--user-theme-font', theme.fontFamily);

    if (theme.configJson) {
      if (theme.configJson.borderRadius) {
        root.style.setProperty('--user-theme-radius', theme.configJson.borderRadius);
      }
      if (theme.configJson.boxShadow) {
        root.style.setProperty('--user-theme-shadow', theme.configJson.boxShadow);
      }
      if (theme.configJson.backgroundImage) {
        root.style.setProperty('--user-theme-bg-image', `url("${theme.configJson.backgroundImage}")`);
      }
      if (theme.configJson.backgroundSize) {
        root.style.setProperty('--user-theme-bg-size', theme.configJson.backgroundSize);
      }

      // If the theme wants cover, it probably shouldn't repeat
      if (theme.configJson.backgroundSize === 'cover') {
        root.style.setProperty('--user-theme-bg-repeat', 'no-repeat');
      } else {
        root.style.setProperty('--user-theme-bg-repeat', 'repeat');
      }
    }

    setModeState(theme.mode); // Sync mode
    setActiveThemeIdState(theme.id);
    localStorage.setItem('active_theme_id', theme.id);
  };

  const resetToDefault = () => {
    const root = document.documentElement;

    // Remove custom CSS variables
    root.style.removeProperty('--user-theme-primary');
    root.style.removeProperty('--user-theme-bg');
    root.style.removeProperty('--user-theme-text');
    root.style.removeProperty('--user-theme-secondary');
    root.style.removeProperty('--user-theme-gradient');
    root.style.removeProperty('--user-theme-font');
    root.style.removeProperty('--user-theme-radius');
    root.style.removeProperty('--user-theme-shadow');
    root.style.removeProperty('--user-theme-bg-image');
    root.style.removeProperty('--user-theme-bg-size');
    root.style.removeProperty('--user-theme-bg-repeat');

    // We also clear the global ones we used before to restore UI
    root.style.removeProperty('--sm-primary');
    root.style.removeProperty('--sm-bg');
    root.style.removeProperty('--bg-primary');
    root.style.removeProperty('--bg-secondary');
    root.style.removeProperty('--bg-surface');
    root.style.removeProperty('--sm-text');
    root.style.removeProperty('--text-primary');
    root.style.removeProperty('--text-main');
    root.style.removeProperty('--sm-primary-light');
    root.style.removeProperty('--app-bg-gradient');
    root.style.removeProperty('--subscription-bg');
    root.style.removeProperty('--font-family-base');
    root.style.removeProperty('--sm-radius');
    root.style.removeProperty('--radius-lg');
    root.style.removeProperty('--border-radius-base');
    root.style.removeProperty('--sm-card-shadow');

    setActiveThemeIdState(null);
    localStorage.removeItem('active_theme_id');
  };

  const toggleTheme = () => {
    if (activeThemeId) {
      resetToDefault();
    }
    setModeState((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
  };

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, setMode, activeThemeId, setActiveThemeId: setActiveThemeIdState, availableThemes, applyTheme, resetToDefault }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
