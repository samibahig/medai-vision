import { create } from "zustand";

interface DashboardState {
  language: "fr" | "ar";
  setLanguage: (lang: "fr" | "ar") => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  autoRefresh: boolean;
  setAutoRefresh: (auto: boolean) => void;
  refreshInterval: number;
  setRefreshInterval: (ms: number) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  language: "fr",
  setLanguage: (lang) => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
    if (lang === "ar") {
      document.body.style.fontFamily = "'Noto Sans Arabic', sans-serif";
    } else {
      document.body.style.fontFamily = "var(--font-sans)";
    }
    set({ language: lang });
  },
  isDark: false,
  setIsDark: (dark) => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    set({ isDark: dark });
  },
  autoRefresh: false,
  setAutoRefresh: (auto) => set({ autoRefresh: auto }),
  refreshInterval: 5 * 60 * 1000,
  setRefreshInterval: (ms) => set({ refreshInterval: ms }),
}));
