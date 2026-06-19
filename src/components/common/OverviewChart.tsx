"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { month: "1월", 방문자: 420, 가입자: 38 },
  { month: "2월", 방문자: 680, 가입자: 52 },
  { month: "3월", 방문자: 540, 가입자: 41 },
  { month: "4월", 방문자: 890, 가입자: 74 },
  { month: "5월", 방문자: 1020, 가입자: 91 },
  { month: "6월", 방문자: 1234, 가입자: 108 },
];

export function OverviewChart() {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorVisitor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorUser" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12 }}
          className="fill-muted-foreground"
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 12 }}
          className="fill-muted-foreground"
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Area
          type="monotone"
          dataKey="방문자"
          stroke="#6366f1"
          strokeWidth={2}
          fill="url(#colorVisitor)"
        />
        <Area
          type="monotone"
          dataKey="가입자"
          stroke="#10b981"
          strokeWidth={2}
          fill="url(#colorUser)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
