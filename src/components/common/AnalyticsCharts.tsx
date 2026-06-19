"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const weeklyData = [
  { day: "월", 방문자: 240, 전환: 18 },
  { day: "화", 방문자: 310, 전환: 24 },
  { day: "수", 방문자: 280, 전환: 21 },
  { day: "목", 방문자: 420, 전환: 38 },
  { day: "금", 방문자: 390, 전환: 35 },
  { day: "토", 방문자: 180, 전환: 12 },
  { day: "일", 방문자: 150, 전환: 9 },
];

const monthlyRevenue = [
  { month: "1월", 매출: 4200000 },
  { month: "2월", 매출: 5800000 },
  { month: "3월", 매출: 5100000 },
  { month: "4월", 매출: 7300000 },
  { month: "5월", 매출: 8900000 },
  { month: "6월", 매출: 9600000 },
];

const trafficSources = [
  { name: "검색", value: 45 },
  { name: "직접", value: 25 },
  { name: "소셜", value: 18 },
  { name: "기타", value: 12 },
];

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444"];

export function WeeklyBarChart() {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="day" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Legend wrapperStyle={{ fontSize: "12px" }} />
        <Bar dataKey="방문자" fill="#6366f1" radius={[4, 4, 0, 0]} />
        <Bar dataKey="전환" fill="#10b981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function RevenueLineChart() {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={monthlyRevenue} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
        <YAxis
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          formatter={(v) => [`₩${Number(v).toLocaleString()}`, "매출"]}
        />
        <Line
          type="monotone"
          dataKey="매출"
          stroke="#6366f1"
          strokeWidth={2}
          dot={{ fill: "#6366f1", r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function TrafficPieChart() {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={trafficSources}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={3}
          dataKey="value"
        >
          {trafficSources.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          formatter={(v) => [`${v}%`, "비율"]}
        />
        <Legend wrapperStyle={{ fontSize: "12px" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
