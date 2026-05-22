import { useGetFeatureImportance, useGetRocCurve, useGetConfusionMatrix, useGetModelMetrics } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStore } from "@/hooks/use-dashboard-store";
import { translations } from "@/lib/translations";
import { CHART_COLORS } from "../constants";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, Legend } from "recharts";
import { CustomTooltip, CustomLegend } from "../chart-utils";
import { CSVLink } from "react-csv";
import { Download } from "lucide-react";

export function MlExplainabilityTab() {
  const { language, isDark } = useDashboardStore();
  const t = translations[language] as any;

  const { data: featureImp, isLoading: isFeatLoading } = useGetFeatureImportance();
  const { data: rocData, isLoading: isRocLoading } = useGetRocCurve();
  const { data: confMatrix, isLoading: isConfLoading } = useGetConfusionMatrix();
  const { data: modelMetrics, isLoading: isMetricsLoading } = useGetModelMetrics();

  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "#e5e5e5";
  const tickColor = isDark ? "#98999C" : "#71717a";

  const rocChartData = rocData ? rocData.fpr.map((fpr, i) => ({ fpr, tpr: rocData.tpr[i] })) : [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">{t.featureImportance}</CardTitle>
            {!isFeatLoading && featureImp && featureImp.length > 0 && (
              <CSVLink data={featureImp} filename="feature-importance.csv" className="print:hidden flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }} aria-label="Export chart data as CSV">
                <Download className="w-3.5 h-3.5" />
              </CSVLink>
            )}
          </CardHeader>
          <CardContent>
            {isFeatLoading ? (
              <Skeleton className="w-full h-[300px]" />
            ) : (
              <ResponsiveContainer width="100%" height={300} debounce={0}>
                <BarChart data={featureImp} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={true} vertical={false} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} />
                  <YAxis type="category" dataKey={language === 'ar' ? 'featureAr' : 'featureFr'} tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} width={100} />
                  <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={false} />
                  <Bar dataKey="importance" fill={CHART_COLORS.blue} fillOpacity={0.8} activeBar={{ fillOpacity: 1 }} isAnimationActive={false} radius={[0, 2, 2, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">{t.rocCurve} (AUC: {rocData?.auc?.toFixed(3)})</CardTitle>
            {!isRocLoading && rocChartData.length > 0 && (
              <CSVLink data={rocChartData} filename="roc-curve.csv" className="print:hidden flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }} aria-label="Export chart data as CSV">
                <Download className="w-3.5 h-3.5" />
              </CSVLink>
            )}
          </CardHeader>
          <CardContent>
            {isRocLoading ? (
              <Skeleton className="w-full h-[300px]" />
            ) : (
              <ResponsiveContainer width="100%" height={300} debounce={0}>
                <LineChart data={rocChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="fpr" type="number" domain={[0, 1]} tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} />
                  <YAxis type="number" domain={[0, 1]} tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} />
                  <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={{ stroke: tickColor, strokeDasharray: '3 3' }} />
                  <Line type="step" dataKey="tpr" name="TPR vs FPR" stroke={CHART_COLORS.purple} strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.confusionMatrix}</CardTitle>
          </CardHeader>
          <CardContent>
            {isConfLoading ? (
              <Skeleton className="w-full h-[300px]" />
            ) : confMatrix && (
              <div className="flex flex-col items-center justify-center p-4">
                <div className="grid grid-cols-2 gap-2 text-center text-sm font-medium">
                  <div className="bg-green-100 text-green-900 p-6 rounded-md dark:bg-green-900 dark:text-green-100 border border-green-200 dark:border-green-800">
                    <div className="text-xs opacity-70 mb-1">{t.trueNegative}</div>
                    <div className="text-2xl">{confMatrix.tn}</div>
                  </div>
                  <div className="bg-red-100 text-red-900 p-6 rounded-md dark:bg-red-900 dark:text-red-100 border border-red-200 dark:border-red-800">
                    <div className="text-xs opacity-70 mb-1">{t.falsePositive}</div>
                    <div className="text-2xl">{confMatrix.fp}</div>
                  </div>
                  <div className="bg-red-100 text-red-900 p-6 rounded-md dark:bg-red-900 dark:text-red-100 border border-red-200 dark:border-red-800">
                    <div className="text-xs opacity-70 mb-1">{t.falseNegative}</div>
                    <div className="text-2xl">{confMatrix.fn}</div>
                  </div>
                  <div className="bg-green-100 text-green-900 p-6 rounded-md dark:bg-green-900 dark:text-green-100 border border-green-200 dark:border-green-800">
                    <div className="text-xs opacity-70 mb-1">{t.truePositive}</div>
                    <div className="text-2xl">{confMatrix.tp}</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t.modelMetrics}</CardTitle>
          </CardHeader>
          <CardContent>
            {isMetricsLoading ? (
              <div className="space-y-4">
                 <Skeleton className="h-10 w-full" />
                 <Skeleton className="h-10 w-full" />
              </div>
            ) : modelMetrics && (
               <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 rounded border bg-card flex flex-col justify-center">
                   <div className="text-sm text-muted-foreground">{t.accuracy}</div>
                   <div className="text-2xl font-bold" style={{ color: CHART_COLORS.blue }}>{(modelMetrics.accuracy * 100).toFixed(1)}%</div>
                 </div>
                 <div className="p-4 rounded border bg-card flex flex-col justify-center">
                   <div className="text-sm text-muted-foreground">{t.f1}</div>
                   <div className="text-2xl font-bold" style={{ color: CHART_COLORS.blue }}>{(modelMetrics.f1 * 100).toFixed(1)}%</div>
                 </div>
                 <div className="p-4 rounded border bg-card flex flex-col justify-center">
                   <div className="text-sm text-muted-foreground">{t.precision}</div>
                   <div className="text-2xl font-bold" style={{ color: CHART_COLORS.blue }}>{(modelMetrics.precision * 100).toFixed(1)}%</div>
                 </div>
                 <div className="p-4 rounded border bg-card flex flex-col justify-center">
                   <div className="text-sm text-muted-foreground">{t.recall}</div>
                   <div className="text-2xl font-bold" style={{ color: CHART_COLORS.blue }}>{(modelMetrics.recall * 100).toFixed(1)}%</div>
                 </div>
               </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
