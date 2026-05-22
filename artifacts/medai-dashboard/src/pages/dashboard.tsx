import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardHeader } from "@/components/dashboard/header";
import { OverviewTab } from "@/components/dashboard/tabs/overview";
import { SignalDetectionTab } from "@/components/dashboard/tabs/signal-detection";
import { TemporalTrendsTab } from "@/components/dashboard/tabs/temporal-trends";
import { MlExplainabilityTab } from "@/components/dashboard/tabs/ml-explainability";
import { useDashboardStore } from "@/hooks/use-dashboard-store";
import { translations } from "@/lib/translations";
import { useGetSummaryKpis } from "@workspace/api-client-react";

export default function Dashboard() {
  const { language, autoRefresh, refreshInterval } = useDashboardStore();
  const t = translations[language];
  const queryClient = useQueryClient();
  
  const { isLoading, isFetching, dataUpdatedAt } = useGetSummaryKpis();
  const loading = isLoading || isFetching;

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      queryClient.invalidateQueries();
    }, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, queryClient]);

  const handleRefresh = () => {
    queryClient.invalidateQueries();
  };

  return (
    <div className="min-h-screen bg-background px-5 py-4 pt-[32px] pb-[32px] pl-[24px] pr-[24px]">
      <div className="max-w-[1400px] mx-auto">
        <DashboardHeader
          lastRefreshedAt={dataUpdatedAt}
          onRefresh={handleRefresh}
          isSpinning={isFetching}
          loading={loading}
        />
        
        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="mb-4 flex flex-wrap h-auto bg-muted">
            <TabsTrigger value="overview" className="flex-grow sm:flex-grow-0">{t.overview}</TabsTrigger>
            <TabsTrigger value="signals" className="flex-grow sm:flex-grow-0">{t.signalDetection}</TabsTrigger>
            <TabsTrigger value="trends" className="flex-grow sm:flex-grow-0">{t.temporalTrends}</TabsTrigger>
            <TabsTrigger value="ml" className="flex-grow sm:flex-grow-0">{t.mlExplainability}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <OverviewTab />
          </TabsContent>
          <TabsContent value="signals">
            <SignalDetectionTab />
          </TabsContent>
          <TabsContent value="trends">
            <TemporalTrendsTab />
          </TabsContent>
          <TabsContent value="ml">
            <MlExplainabilityTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
