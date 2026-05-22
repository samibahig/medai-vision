import { useState } from "react";
import { useGetTemporalTrends, useGetHeatmapData } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStore } from "@/hooks/use-dashboard-store";
import { translations } from "@/lib/translations";
import { CHART_COLORS } from "../constants";
import Plot from "react-plotly.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { CustomTooltip, CustomLegend } from "../chart-utils";
import { CSVLink } from "react-csv";
import { Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";

export function TemporalTrendsTab() {
  const { language, isDark } = useDashboardStore();
  const t = translations[language] as any;

  const [metric, setMetric] = useState<"prr" | "ror" | "ic" | "ebgm">("prr");
  const [drugFilter, setDrugFilter] = useState("");
  const debouncedDrug = useDebounce(drugFilter, 500);
  
  const { data: trends, isLoading: isTrendsLoading, isFetching: isTrendsFetching } = useGetTemporalTrends({ 
    metric,
    drug: debouncedDrug || undefined
  });
  const { data: heatmap, isLoading: isHeatmapLoading, isFetching: isHeatmapFetching } = useGetHeatmapData();

  const trendsLoading = isTrendsLoading || isTrendsFetching;
  const heatmapLoading = isHeatmapLoading || isHeatmapFetching;

  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "#e5e5e5";
  const tickColor = isDark ? "#98999C" : "#71717a";

  const heatmapTrace = heatmap ? {
    z: heatmap.matrix,
    x: heatmap.adrs,
    y: heatmap.drugs,
    type: 'heatmap',
    colorscale: 'RdBu',
    reversescale: true,
    hoverongaps: false
  } : null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">{t.temporalTrends}</CardTitle>
          <div className="flex items-center gap-2">
            {!trendsLoading && trends && trends.length > 0 && (
              <CSVLink data={trends} filename="temporal-trends.csv" className="print:hidden flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }} aria-label="Export chart data as CSV">
                <Download className="w-3.5 h-3.5" />
              </CSVLink>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
             <div className="w-[200px]">
               <Select value={metric} onValueChange={(v: any) => setMetric(v)}>
                 <SelectTrigger>
                   <SelectValue placeholder="Select metric" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="prr">PRR</SelectItem>
                   <SelectItem value="ror">ROR</SelectItem>
                   <SelectItem value="ic">IC</SelectItem>
                   <SelectItem value="ebgm">EBGM</SelectItem>
                 </SelectContent>
               </Select>
             </div>
             <div className="w-[200px]">
               <Input placeholder="Filter by Drug..." value={drugFilter} onChange={e => setDrugFilter(e.target.value)} />
             </div>
          </div>
          {trendsLoading ? (
            <Skeleton className="w-full h-[300px]" />
          ) : (
            <ResponsiveContainer width="100%" height={300} debounce={0}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="quarter" tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} />
                <YAxis tick={{ fontSize: 12, fill: tickColor }} stroke={tickColor} />
                <Tooltip content={<CustomTooltip />} isAnimationActive={false} cursor={{ stroke: tickColor, strokeDasharray: '3 3' }} />
                <Legend content={<CustomLegend />} />
                <Line type="linear" dataKey={metric} name={metric.toUpperCase()} stroke={CHART_COLORS.blue} strokeWidth={2} dot={false} activeDot={{ r: 5, fill: CHART_COLORS.blue, stroke: '#ffffff', strokeWidth: 3 }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Drug-ADR ROR Heatmap</CardTitle>
          {!heatmapLoading && heatmap && (
            <CSVLink data={heatmap.matrix} filename="heatmap.csv" className="print:hidden flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }} aria-label="Export chart data as CSV">
              <Download className="w-3.5 h-3.5" />
            </CSVLink>
          )}
        </CardHeader>
        <CardContent>
          {heatmapLoading ? (
            <Skeleton className="w-full h-[400px]" />
          ) : heatmapTrace ? (
            <Plot
              data={[heatmapTrace] as any}
              layout={{
                autosize: true,
                height: 400,
                margin: { t: 20, r: 20, b: 80, l: 120 },
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent',
                xaxis: { tickfont: { color: tickColor }, tickangle: -45 },
                yaxis: { tickfont: { color: tickColor } }
              }}
              style={{ width: '100%', height: '100%' }}
              config={{ responsive: true, displayModeBar: false }}
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
