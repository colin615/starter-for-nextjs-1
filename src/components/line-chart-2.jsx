"use client";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { TrendingUp } from "lucide-react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";

// Use custom or Tailwind standard colors: https://tailwindcss.com/docs/colors
const chartConfig = {
  value: {
    label: "Wagered",
    color: "var(--color-violet-500)",
  },
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <>
        <div className="rounded-lg bg-zinc-900 p-3 text-white shadow-lg">
          <div className="mb-1 text-xs font-medium">Total:</div>
          <div className="text-sm font-semibold">
            ${payload[0].value.toLocaleString()}
          </div>
        </div>
      </>
    );
  }
  return null;
};

export default function LineChart2({ data }) {
  if (!data || data.length === 0) return null;

  // Transform data: for each day, sum the wagered values from the data array
  const chartData = data.map((stat) => {
    const localDate = new Date(stat.date).toLocaleDateString();
    const totalWagered = stat.data.reduce((sum, item) => {
      try {
        const parsed = JSON.parse(item);
        return sum + (parsed.wagered || 0);
      } catch (e) {
        return sum;
      }
    }, 0);
    return { date: localDate, value: totalWagered };
  });

  // Calculate total and percentage based on chart data
  const totalWagered = chartData.reduce((sum, item) => sum + item.value, 0);
  const lastValue = chartData[chartData.length - 1]?.value || 0;
  const previousValue = chartData[chartData.length - 2]?.value || 0;
  const percentageChange =
    previousValue > 0 ? ((lastValue - previousValue) / previousValue) * 100 : 0;

  return (
    <div className="flex min-h-screen items-center justify-center p-6 lg:p-8">
      <Card className="w-full lg:max-w-4xl">
        <CardHeader className="min-h-auto border-0 pt-6 pb-4">
          <CardTitle className="text-lg font-semibold">Wagered Stats</CardTitle>
        </CardHeader>

        <CardContent className="px-0">
          {/* Stats Section */}
          <div className="mb-8 px-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="text-3xl font-bold">
                ${totalWagered.toLocaleString()}
              </div>
              <Badge variant="success" appearance="light">
                <TrendingUp className="size-3" />
                {Math.abs(percentageChange).toFixed(2)}%
              </Badge>
            </div>
          </div>

          {/* Chart */}
          <div className="relative">
            <ChartContainer
              config={chartConfig}
              className="[&_.recharts-curve.recharts-tooltip-cursor]:stroke-initial h-[300px] w-full overflow-visible ps-1.5 pe-2.5"
            >
              <ComposedChart
                data={chartData}
                margin={{
                  top: 25,
                  right: 25,
                  left: 0,
                  bottom: 25,
                }}
                style={{ overflow: "visible" }}
              >
                {/* Gradient */}
                <defs>
                  <linearGradient
                    id="cashflowGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={chartConfig.value.color}
                      stopOpacity={0.15}
                    />
                    <stop
                      offset="100%"
                      stopColor={chartConfig.value.color}
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <filter
                    id="dotShadow"
                    x="-50%"
                    y="-50%"
                    width="200%"
                    height="200%"
                  >
                    <feDropShadow
                      dx="2"
                      dy="2"
                      stdDeviation="3"
                      floodColor="rgba(0,0,0,0.5)"
                    />
                  </filter>
                </defs>

                <CartesianGrid
                  strokeDasharray="4 12"
                  stroke="var(--input)"
                  strokeOpacity={1}
                  horizontal={true}
                  vertical={false}
                />

                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                  tickMargin={12}
                  dy={10}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${value / 1000}K`}
                  domain={[0, "dataMax + 1000"]}
                  tickCount={6}
                  tickMargin={12}
                />

                <ChartTooltip
                  content={<CustomTooltip />}
                  cursor={{
                    stroke: chartConfig.value.color,
                    strokeWidth: 1,
                    strokeDasharray: "none",
                  }}
                />

                {/* Gradient area */}
                <Area
                  type="linear"
                  dataKey="value"
                  stroke="transparent"
                  fill="url(#cashflowGradient)"
                  strokeWidth={0}
                  dot={false}
                />

                {/* Main cashflow line */}
                <Line
                  type="linear"
                  dataKey="value"
                  stroke={chartConfig.value.color}
                  strokeWidth={3}
                  dot={false}
                  activeDot={{
                    r: 6,
                    fill: chartConfig.value.color,
                    stroke: "white",
                    strokeWidth: 2,
                    filter: "url(#dotShadow)",
                  }}
                />
              </ComposedChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
