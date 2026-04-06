import api from "./axios";

export interface ThemeTokens {
  borderRadius?: string;
  boxShadow?: string;
  iconStyle?: string;
  backgroundImage?: string;
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
      const res = await api.get<ApiResponse<PaginatedThemeResult>>("/themes/active");
      if (res.data.success && res.data.data) {
        return res.data.data.items || [];
      }
      return [];
    } catch (error) {
      console.error("Failed to fetch active themes:", error);
      return [];
    }
  },
};
