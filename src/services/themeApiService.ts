import api from "./axios";

export interface ThemeTokens {
  borderRadius?: string;
  boxShadow?: string;
  iconStyle?: string;
  backgroundImage?: string;
  backgroundSize?: string;
  backgroundRepeat?: string;
  [key: string]: string | undefined;
}

export interface ThemeResult {
  id: string;
  name: string;
  mode: "light" | "dark";
  primaryColor: string;
  secondaryColor?: string;
  backgroundColor: string;
  textColor: string;
  mood?: string;
  gradientBackground?: string;
  backgroundImage?: string;
  playerColor?: string;
  fontFamily?: string;
  configJson?: ThemeTokens;
}

export interface PaginatedThemeResult {
  items: ThemeResult[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errorCode: string | null;
}

export const themeApiService = {
  async getActiveThemes(): Promise<ThemeResult[]> {
    try {
      const res = await api.get<any>("/themes/active");
      
      const resData = res.data;
      const success = resData.success ?? resData.Success;
      const data = resData.data ?? resData.Data;

      if (success && data) {
        // Handle pagination structure
        const items = data.items ?? data.Items ?? [];
        
        return items.map((theme: any) => {
          const normalizedTheme = { ...theme };

          // Normalize casing for theme properties if needed
          normalizedTheme.id = theme.id ?? theme.Id;
          normalizedTheme.name = theme.name ?? theme.Name;
          normalizedTheme.mode = theme.mode ?? theme.Mode;
          normalizedTheme.primaryColor = theme.primaryColor ?? theme.PrimaryColor;
          normalizedTheme.backgroundColor = theme.backgroundColor ?? theme.BackgroundColor;
          normalizedTheme.textColor = theme.textColor ?? theme.TextColor;
          normalizedTheme.gradientBackground = theme.gradientBackground ?? theme.GradientBackground;
          normalizedTheme.backgroundImage = theme.backgroundImage ?? theme.BackgroundImage;

          // Some environments may return configJson as a JSON string.
          const configJson = theme.configJson ?? theme.ConfigJson;
          if (typeof configJson === "string") {
            try {
              normalizedTheme.configJson = JSON.parse(configJson) as ThemeTokens;
            } catch {
              normalizedTheme.configJson = undefined;
            }
          } else {
            normalizedTheme.configJson = configJson;
          }

          return normalizedTheme;
        });
      }
      return [];
    } catch (error) {
      console.error("Failed to fetch active themes:", error);
      return [];
    }
  },
};
