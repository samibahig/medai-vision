import { useState, useMemo } from "react";
import { useGetSignals, useGetVolcanoData } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useDashboardStore } from "@/hooks/use-dashboard-store";
import { translations } from "@/lib/translations";
import { CHART_COLORS } from "../constants";
import Plot from "react-plotly.js";
import { CSVLink } from "react-csv";
import { Download, ArrowUpDown } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function SignalDetectionTab() {
  const { language, isDark } = useDashboardStore();
  const t = translations[language] as any;

  const [drugFilter, setDrugFilter] = useState("");
  const [minPrrFilter, setMinPrrFilter] = useState("");
  const debouncedDrug = useDebounce(drugFilter, 500);
  const debouncedPrr = useDebounce(minPrrFilter, 500);

  const { data: signals, isLoading: isSignalsLoading, isFetching: isSignalsFetching } = useGetSignals({
    drug: debouncedDrug || undefined,
    minPrr: debouncedPrr ? parseFloat(debouncedPrr) : undefined
  });
  
  const { data: volcano, isLoading: isVolcanoLoading, isFetching: isVolcanoFetching } = useGetVolcanoData();

  const signalsLoading = isSignalsLoading || isSignalsFetching;
  const volcanoLoading = isVolcanoLoading || isVolcanoFetching;

  const volcanoPoints = volcano || [];
  
  const volcanoTrace = {
    x: volcanoPoints.map(p => p.logRor),
    y: volcanoPoints.map(p => p.negLogP),
    text: volcanoPoints.map(p => `Drug: ${p.drug}<br>ADR: ${p.adr}<br>ROR: ${p.ror.toFixed(2)}<br>p-val: ${p.pValue.toExponential(2)}<br>Cases: ${p.nCases}`),
    mode: 'markers',
    type: 'scatter',
    hoverinfo: 'text',
    marker: {
      size: 8,
      color: volcanoPoints.map(p => p.priority === 'high' ? CHART_COLORS.orange : p.significant ? CHART_COLORS.red : CHART_COLORS.blue),
      opacity: 0.7
    }
  };

  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "#e5e5e5";
  const tickColor = isDark ? "#98999C" : "#71717a";

  const columns = useMemo<ColumnDef<any>[]>(() => [
    { accessorKey: "drug", header: t.drug },
    { accessorKey: "adr", header: t.adr },
    { accessorKey: "prr", header: "PRR", cell: ({ row }) => row.original.prr.toFixed(2) },
    { accessorKey: "ror", header: "ROR", cell: ({ row }) => row.original.ror.toFixed(2) },
    { accessorKey: "ic", header: "IC", cell: ({ row }) => row.original.ic.toFixed(2) },
    { accessorKey: "ebgm", header: "EBGM", cell: ({ row }) => row.original.ebgm.toFixed(2) },
    { accessorKey: "nCases", header: t.nCases },
    { accessorKey: "pValue", header: t.pValue, cell: ({ row }) => row.original.pValue.toExponential(2) },
    {
      accessorKey: "priority",
      header: t.priority,
      cell: ({ row }) => {
        const p = row.original.priority;
        const color = p === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      p === 'medium' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        return <Badge className={color}>{p}</Badge>;
      }
    },
    {
      accessorKey: "status",
      header: t.status,
      cell: ({ row }) => {
        const s = row.original.status;
        const translation = t[s] || s;
        return <Badge variant="outline">{translation}</Badge>;
      }
    }
  ], [t]);

  const [sorting, setSorting] = useState<SortingState>([]);
  const table = useReactTable({
    data: signals || [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Volcano Plot</CardTitle>
          {!volcanoLoading && volcanoPoints.length > 0 && (
            <CSVLink data={volcanoPoints} filename="volcano-plot.csv" className="print:hidden flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }} aria-label="Export chart data as CSV">
              <Download className="w-3.5 h-3.5" />
            </CSVLink>
          )}
        </CardHeader>
        <CardContent>
          {volcanoLoading ? (
            <Skeleton className="w-full h-[400px]" />
          ) : (
            <Plot
              data={[volcanoTrace] as any}
              layout={{
                autosize: true,
                height: 400,
                margin: { t: 20, r: 20, b: 40, l: 40 },
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent',
                xaxis: { title: 'log2(ROR)', gridcolor: gridColor, tickfont: { color: tickColor }, titlefont: { color: tickColor } },
                yaxis: { title: '-log10(p-value)', gridcolor: gridColor, tickfont: { color: tickColor }, titlefont: { color: tickColor } },
                shapes: [
                  { type: 'line', x0: 0.693, x1: 0.693, y0: 0, y1: 10, line: { color: tickColor, width: 1, dash: 'dash' } },
                  { type: 'line', x0: -5, x1: 5, y0: 1.301, y1: 1.301, line: { color: tickColor, width: 1, dash: 'dash' } }
                ],
                showlegend: false
              }}
              style={{ width: '100%', height: '100%' }}
              config={{ responsive: true, displayModeBar: false }}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">{t.signalDetection}</CardTitle>
          {!signalsLoading && signals && signals.length > 0 && (
            <CSVLink data={signals} filename="signals.csv" className="print:hidden flex items-center justify-center w-[26px] h-[26px] rounded-[6px] transition-colors hover:opacity-80" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F0F1F2", color: isDark ? "#c8c9cc" : "#4b5563" }} aria-label="Export table data as CSV">
              <Download className="w-3.5 h-3.5" />
            </CSVLink>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="w-[200px]">
               <Input placeholder="Filter by Drug..." value={drugFilter} onChange={e => setDrugFilter(e.target.value)} />
            </div>
            <div className="w-[200px]">
               <Input placeholder="Min PRR..." type="number" value={minPrrFilter} onChange={e => setMinPrrFilter(e.target.value)} />
            </div>
          </div>
          
          {signalsLoading ? (
             <div className="space-y-2">
               <Skeleton className="h-10 w-full" />
               {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
             </div>
          ) : (
             <div className="space-y-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <TableHead key={header.id} onClick={header.column.getToggleSortingHandler()} className="cursor-pointer select-none">
                              <div className="flex items-center gap-2">
                                {flexRender(header.column.columnDef.header, header.getContext())}
                                <ArrowUpDown className="h-3 w-3" />
                              </div>
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {table.getRowModel().rows.length > 0 ? (
                        table.getRowModel().rows.map((row) => (
                          <TableRow key={row.id}>
                            {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id}>
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={columns.length} className="h-24 text-center">
                            No results found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
                    {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)}{" "}
                    of {table.getFilteredRowModel().rows.length} results
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</Button>
                    <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button>
                  </div>
                </div>
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
