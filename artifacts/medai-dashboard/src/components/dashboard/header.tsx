import { useState, useRef, useEffect } from "react";
import { Printer, Sun, Moon, RefreshCw, ChevronDown, Check } from "lucide-react";
import { useDashboardStore } from "@/hooks/use-dashboard-store";
import { translations } from "@/lib/translations";
import { DATA_SOURCES } from "./constants";

interface HeaderProps {
  lastRefreshedAt?: number;
  onRefresh: () => void;
  isSpinning: boolean;
  loading: boolean;
}

const INTERVAL_OPTIONS = [
  { label: "5 min", ms: 5 * 60 * 1000 },
  { label: "15 min", ms: 15 * 60 * 1000 },
  { label: "1 hour", ms: 60 * 60 * 1000 },
];

export function DashboardHeader({ lastRefreshedAt, onRefresh, isSpinning, loading }: HeaderProps) {
  const { language, setLanguage, isDark, setIsDark, autoRefresh, setAutoRefresh, refreshInterval, setRefreshInterval } = useDashboardStore();
  const t = translations[language];
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const lastRefreshedStr = lastRefreshedAt
    ? (() => {
        const d = new Date(lastRefreshedAt);
        const time = d.toLocaleTimeString(language === "fr" ? "fr-FR" : "ar-SA", { hour: "numeric", minute: "2-digit" });
        return time;
      })()
    : null;

  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
      <div className="pt-2">
        <h1 className="font-bold text-[32px]">{t.title}</h1>
        <p className="text-muted-foreground mt-1.5 text-[14px]">{t.subtitle}</p>
        
        {DATA_SOURCES.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="text-[12px] text-muted-foreground shrink-0">{t.dataSources}</span>
            {DATA_SOURCES.map((source) => (
              <span
                key={source}
                className="text-[12px] font-bold rounded px-2 py-0.5 truncate print:!bg-[rgb(229,231,235)] print:!text-[rgb(75,85,99)]"
                title={source}
                style={{
                  maxWidth: "20ch",
                  backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgb(229, 231, 235)",
                  color: isDark ? "#c8c9cc" : "rgb(75, 85, 99)",
                }}
              >
                {source}
              </span>
            ))}
          </div>
        )}

        {lastRefreshedStr && (
          <p className="text-[12px] text-muted-foreground mt-3">{t.lastRefresh} {lastRefreshedStr}</p>
        )}
      </div>

      <div className="flex items-center gap-3 pt-2 print:hidden">
        {/* Language Toggle */}
        <button
          onClick={() => setLanguage(language === "fr" ? "ar" : "fr")}
          className="flex items-center justify-center px-2 h-[26px] rounded-[6px] transition-colors text-[12px] font-bold"
          style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }}
        >
          {language.toUpperCase()}
        </button>

        {/* Split Refresh */}
        <div
          ref={dropdownRef}
          className="relative flex items-center rounded-[6px] overflow-visible h-[26px] text-[12px]"
          style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }}
        >
          <button onClick={onRefresh} disabled={loading} className="flex items-center gap-1 px-2 h-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${isSpinning ? "animate-spin" : ""}`} />
            {t.refresh}
          </button>
          <div className="w-px h-4 shrink-0" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)" }} />
          <button onClick={() => setDropdownOpen((o) => !o)} className="flex items-center justify-center px-1.5 h-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {dropdownOpen && (
            <div className="absolute top-full mt-1 right-0 w-[180px] rounded-md border bg-popover shadow-md z-50 py-1" style={{ color: "var(--color-foreground)" }}>
              <div className="px-2 py-1.5 text-xs font-medium border-b">Auto-refresh</div>
              <div className="py-1">
                <button
                  className="w-full flex items-center justify-between px-2 py-1.5 text-sm hover:bg-muted"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                >
                  <span className={autoRefresh ? "font-medium" : ""}>Enable</span>
                  {autoRefresh && <Check className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="border-t py-1">
                {INTERVAL_OPTIONS.map((opt) => (
                  <button
                    key={opt.ms}
                    className="w-full flex items-center justify-between px-2 py-1.5 text-sm hover:bg-muted"
                    onClick={() => setRefreshInterval(opt.ms)}
                  >
                    <span>{opt.label}</span>
                    {refreshInterval === opt.ms && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* PDF Export */}
        <button
          onClick={() => window.print()}
          className="flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors disabled:opacity-50"
          style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }}
          aria-label="Export as PDF"
        >
          <Printer className="w-3.5 h-3.5" />
        </button>

        {/* Dark Mode */}
        <button
          onClick={() => setIsDark(!isDark)}
          className="flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors"
          style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }}
        >
          {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}
