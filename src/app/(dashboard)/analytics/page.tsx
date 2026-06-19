import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { WeeklyBarChart, RevenueLineChart, TrafficPieChart } from "@/components/common/AnalyticsCharts";
import { TrendingUp, MousePointer, ShoppingCart, Eye } from "lucide-react";

const stats = [
  { title: "총 방문자", value: "12,340", icon: Eye, change: "+8.2%", changeType: "positive" as const },
  { title: "전환율", value: "3.4%", icon: MousePointer, change: "+0.6%", changeType: "positive" as const },
  { title: "월 매출", value: "₩9.6M", icon: ShoppingCart, change: "+18%", changeType: "positive" as const },
  { title: "성장률", value: "23%", icon: TrendingUp, change: "+5%", changeType: "positive" as const },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="분석"
        description="서비스 성과와 사용자 행동을 분석하세요."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>주간 방문자 & 전환</CardTitle>
            <CardDescription>이번 주 일별 방문자 수와 전환 수</CardDescription>
          </CardHeader>
          <CardContent>
            <WeeklyBarChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>트래픽 소스</CardTitle>
            <CardDescription>유입 채널별 방문자 비율</CardDescription>
          </CardHeader>
          <CardContent>
            <TrafficPieChart />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>월간 매출 추이</CardTitle>
          <CardDescription>최근 6개월 월별 매출 현황</CardDescription>
        </CardHeader>
        <CardContent>
          <RevenueLineChart />
        </CardContent>
      </Card>
    </div>
  );
}
