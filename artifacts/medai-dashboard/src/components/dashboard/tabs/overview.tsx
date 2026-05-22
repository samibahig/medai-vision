import { useMemo } from "react";
import { useGetSummaryKpis, useGetSignals } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStore } from "@/hooks/use-dashboard-store";
import { translations } from "@/lib/translations";
import { CHART_COLORS, CHART_COLOR_LIST } from "../constants";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { CustomTooltip, CustomLegend } from "../chart-utils";

export function OverviewTab() {
  const { language, isDark } = useDashboardStore();
  const t = translations[language] as any;
  const { data: kpis, isLoading, isFetching } = useGetSummaryKpis();
  const { data: signals, isLoading: isSignalsLoading } = useGetSignals({});
  const loading = isLoading || isFetching;

  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "#e5e5e5";
  const tickColor = isDark ? "#98999C" : "#71717a";

  const kpiItems = [
    { title: t.totalSignals, value: kpis?.totalSignals, format: (v: number) => v.toLocaleString() },
    { title: t.highPriority, value: kpis?.highPrioritySignals, format: (v: number) => v.toLocaleString() },
    { title: t.drugsMonitored, value: kpis?.drugsMonitored, format: (v: number) => v.toLocaleString() },
    { title: t.adverseEvents, value: kpis?.adverseEventsTracked, format: (v: number) => v.toLocaleString() },
    { title: t.modelAuc, value: kpis?.modelAuc, format: (v: number) => v.toFixed(3) },
    { title: t.reportsAnalyzed, value: kpis?.reportsAnalyzed, format: (v: number) => v.toLocaleString() },
    { title: t.newSignals, value: kpis?.newSignalsThisMonth, format: (v: number) => v.toLocaleString() },
    { title: t.detectionRate, value: kpis?.signalDetectionRate, format: (v: number) => `${(v * 100).toFixed(1)}%` },
  ];

  const priorityData = useMemo(() => {
    if (!signals) return [];
    const counts: Record<string, number> = {};
    signals.forEach((s: any) => {
      counts[s.priority] = (counts[s.priority] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [signals]);

  const topDrugsData = useMemo(() => {
    if (!signals) return [];
    const counts: Record<string, number> = {};
    signals.forEach((s: any) => {
      counts[s.drug] = (counts[s.drug] || 0) + 1;
    });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([drug, count]) => ({ drug, count }));
  }, [signals]);

  const priorityColors: Record<string, string> = {
    high: CHART_COLORS.red,
    medium: CHART_COLORS.orange,
    low: CHART_COLORS.green,
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiItems.map((item, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              {loading ? (
                <>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-32" />
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">{item.title}</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: CHART_COLORS.blue }}>
                    {item.value !== undefined ? item.format(item.value) : "--"}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {language === "ar" ? "توزيع الأولوية" : "Répartition par Priorité"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isSignalsLoading ? (
              <Skeleton className="w-full h-[280px]" />
            ) : (
              <ResponsiveContainer width="100%" height={280} debounce={0}>
                <PieChart>
                  <Pie
                    data={priorityData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    isAnimationActive={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={true}
                  >
                    {priorityData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={priorityColors[entry.name] ?? CHART_COLOR_LIST[index % CHART_COLOR_LIST.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} isAnimationActive={false} />
                  <Legend content={<CustomLegend />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {language === "ar" ? "أعلى 10 أدوية بالإشارات" : "Top 10 Médicaments par Signaux"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isSignalsLoading ? (
              <Skeleton className="w-full h-[280px]" />
            ) : (
              <ResponsiveContainer width="100%" height={280} debounce={0}>
                <BarChart data={topDrugsData} layout="vertical" margin={{ left: 20, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} vertical={true} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: tickColor }}
                    stroke={tickColor}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="drug"
                    tick={{ fontSize: 11, fill: tickColor }}
                    stroke={tickColor}
                    width={90}
                  />
                  <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={false} />
                  <Bar
                    dataKey="count"
                    name={language === "ar" ? "الإشارات" : "Signaux"}
                    fill={CHART_COLORS.purple}
                    fillOpacity={0.85}
                    activeBar={{ fillOpacity: 1 }}
                    isAnimationActive={false}
                    radius={[0, 3, 3, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
