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

// Curated Premium Fallback Themes for a guaranteed high-end experience
const FALLBACK_THEMES: ThemeResult[] = [
  {
    id: "premium-midnight",
    name: "Midnight Oasis (Premium)",
    mode: "dark",
    primaryColor: "#6366f1", // Indigo
    backgroundColor: "#070b17",
    textColor: "#f1f5f9",
    secondaryColor: "#1e293b",
    gradientBackground: "linear-gradient(160deg, #070b17 0%, #0d1428 45%, #090d1e 100%)",
    configJson: {
      borderRadius: "16px",
      boxShadow: "0 10px 40px rgba(0,0,0,0.4)"
    }
  },
  {
    id: "premium-sunset",
    name: "Golden Hour (Premium)",
    mode: "dark",
    primaryColor: "#f59e0b", // Amber
    backgroundColor: "#160d08",
    textColor: "#fef3c7",
    secondaryColor: "#2d1b0a",
    gradientBackground: "linear-gradient(135deg, #160d08 0%, #2d1b0a 100%)",
    configJson: {
      backgroundImage: "https://images.unsplash.com/photo-1472120482482-d43ba79ef546?q=80&w=2070&auto=format&fit=crop"
    }
  },
  {
    id: "premium-ocean",
    name: "Deep Ocean (Premium)",
    mode: "dark",
    primaryColor: "#0ea5e9", // Sky
    backgroundColor: "#020617",
    textColor: "#e0f2fe",
    secondaryColor: "#082f49",
    gradientBackground: "linear-gradient(180deg, #020617 0%, #075985 100%)",
  },
  {
    id: "premium-sunset-balcony",
    name: "Sunset Balcony (Premium)",
    mode: "dark",
    primaryColor: "#FF8A65",
    backgroundColor: "#2A233C",
    textColor: "#FFE0B2",
    secondaryColor: "#FFB74D",
    gradientBackground: "linear-gradient(135deg, #2A233C 0%, #4A3B52 60%, #FF8A65 100%)",
    configJson: {
      borderRadius: "12px",
      boxShadow: "0 8px 32px rgba(255, 138, 101, 0.25)",
      backgroundImage: "https://i.postimg.cc/ZR0F56kY/bcf4f37fcab5a44ddf8c2b4cb6279e84.jpg"
    }
  }
];


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
    // Load available themes from backend API + fallback themes
    const loadThemes = async () => {
      try {
        const apiThemes = await themeApiService.getActiveThemes();
        
        // Merge with fallbacks, removing any that might have been added to the DB already (by ID)
        const merged = [...apiThemes];
        FALLBACK_THEMES.forEach(fb => {
          if (!merged.find(t => t.id === fb.id || t.name === fb.name)) {
            merged.push(fb);
          }
        });

        setAvailableThemes(merged);

        // Auto-apply saved theme if it exists in the fetched list
        const savedThemeId = localStorage.getItem('active_theme_id');
        if (savedThemeId) {
          const themeToApply = merged.find(t => t.id === savedThemeId);
          if (themeToApply) {
            applyTheme(themeToApply);
          }
        }
      } catch (error) {
        console.error("ThemeContext: Error loading themes", error);
        setAvailableThemes(FALLBACK_THEMES);
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

    // Reset advanced background tokens to avoid stale values from previous themes.
    root.style.removeProperty('--user-theme-bg-image');
    root.style.removeProperty('--user-theme-bg-size');
    root.style.removeProperty('--user-theme-bg-repeat');

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

    const config = theme.configJson;

    if (config) {
      if (config.borderRadius) {
        root.style.setProperty('--user-theme-radius', config.borderRadius);
      }
      if (config.boxShadow) {
        root.style.setProperty('--user-theme-shadow', config.boxShadow);
      }

      const backgroundImage = config.backgroundImage || theme.backgroundImage;
      if (backgroundImage) {
        root.style.setProperty('--user-theme-bg-image', `url("${backgroundImage}")`);
      }

      const backgroundSize = config.backgroundSize || 'cover';
      root.style.setProperty('--user-theme-bg-size', backgroundSize);

      const backgroundRepeat = config.backgroundRepeat || (backgroundSize === 'cover' ? 'no-repeat' : 'repeat');
      root.style.setProperty('--user-theme-bg-repeat', backgroundRepeat);
    } else if (theme.backgroundImage) {
      root.style.setProperty('--user-theme-bg-image', `url("${theme.backgroundImage}")`);
      root.style.setProperty('--user-theme-bg-size', 'cover');
      root.style.setProperty('--user-theme-bg-repeat', 'no-repeat');
    } else {
      root.style.setProperty('--user-theme-bg-size', 'cover');
      root.style.setProperty('--user-theme-bg-repeat', 'no-repeat');
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
