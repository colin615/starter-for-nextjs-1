"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartNoAxesCombined } from "lucide-react";
import { CartesianGrid, Line, LineChart } from "recharts";

// Use custom or Tailwind standard colors: https://tailwindcss.com/docs/colors
const chartConfig = {
  revenue: {
    label: "Total Wagered",
    color: "var(--color-violet-500)",
  },
};

// Period configuration
const PERIODS = {
  "1D": { key: "1D", label: "1D" },
  "3D": { key: "3D", label: "3D" },
  "1W": { key: "1W", label: "1W" },
  "2W": { key: "2W", label: "2W" },
  "1M": { key: "1M", label: "1M" },
};

export default function LineChart3({
  data,
  selectedPeriod,
  onPeriodChange,
  loading,
}) {
  if (loading || !data || data.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 lg:p-8">
        <Card className="w-full max-w-md rounded-2xl p-6 shadow-sm">
          <CardHeader className="mb-6 p-0 pb-6">
            <CardTitle className="text-lg font-semibold">
              Total Wagered
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-0">
            <div className="mb-6 space-y-6">
              <div className="flex items-center gap-4">
                <Skeleton className="size-12 rounded-full" />
                <div>
                  <Skeleton className="mb-1 h-4 w-24" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter data based on selected period
  const getFilteredData = () => {
    const now = new Date();
    let daysBack;
    switch (selectedPeriod) {
      case "1D":
        daysBack = 1;
        break;
      case "3D":
        daysBack = 3;
        break;
      case "1W":
        daysBack = 7;
        break;
      case "2W":
        daysBack = 14;
        break;
      case "1M":
        daysBack = 30;
        break;
      default:
        daysBack = 30;
    }
    const cutoff = new Date(now);
    cutoff.setDate(now.getDate() - daysBack);
    return data.filter((stat) => new Date(stat.date) >= cutoff);
  };

  const filteredData = getFilteredData();

  // Transform filtered data to cumulative wagered
  const chartData = filteredData
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((stat, index, arr) => {
      const totalUpToNow = arr.slice(0, index + 1).reduce((sum, s) => {
        const dayWagered = s.data.reduce((daySum, item) => {
          try {
            const parsed = JSON.parse(item);
            return daySum + (parsed.wagered || 0);
          } catch (e) {
            return daySum;
          }
        }, 0);
        return sum + dayWagered;
      }, 0);
      return {
        period: new Date(stat.date).toLocaleDateString(),
        revenue: totalUpToNow,
      };
    });

  // Calculate total wagered
  const totalRevenue =
    chartData.length > 0 ? chartData[chartData.length - 1].revenue : 0;

  // Format total wagered display
  const formatRevenue = (amount) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return `$${amount.toFixed(0)}`;
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6 lg:p-8">
      <Card className="w-full max-w-md rounded-2xl p-6 shadow-sm">
        <CardHeader className="mb-6 p-0 pb-6">
          <CardTitle className="text-lg font-semibold">Total Wagered</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 p-0">
          {/* Nav */}
          <div className="mb-6 space-y-6">
            {/* Stats Section */}
            <div className="flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-full border border-violet-200 bg-violet-100 dark:border-violet-800 dark:bg-violet-950">
                <ChartNoAxesCombined className="h-6 w-6 text-violet-600" />
              </div>
              <div>
                <div className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
                  Total Wagered
                </div>
                <div className="text-2xl font-bold">
                  {formatRevenue(totalRevenue)}
                </div>
              </div>
            </div>

            {/* Toggle Group */}
            <ToggleGroup
              type="single"
              value={selectedPeriod}
              variant="outline"
              onValueChange={(value) => value && onPeriodChange(value)}
              className="w-full"
            >
              {Object.values(PERIODS).map((period) => (
                <ToggleGroupItem
                  key={period.key}
                  value={period.key}
                  variant="outline"
                  className="flex-1 data-[state=on]:border-gray-900 data-[state=on]:bg-gray-900 data-[state=on]:text-white"
                >
                  {period.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {/* Chart */}
          <div className="relative h-40 w-full overflow-hidden">
            <ChartContainer
              config={chartConfig}
              className="[&_.recharts-curve.recharts-tooltip-cursor]:stroke-initial h-full w-full"
            >
              <LineChart
                accessibilityLayer
                data={chartData}
                margin={{
                  top: 10,
                  left: 10,
                  right: 10,
                  bottom: 10,
                }}
              >
                <CartesianGrid
                  strokeDasharray="4 8"
                  stroke="var(--input)"
                  strokeOpacity={1}
                  horizontal={false}
                  vertical={true}
                />

                <ChartTooltip
                  cursor={{
                    stroke: chartConfig.revenue.color,
                    strokeWidth: 1,
                    strokeDasharray: "2 4",
                  }}
                  content={
                    <ChartTooltipContent
                      indicator="line"
                      nameKey="revenue"
                      hideLabel
                    />
                  }
                />
                <Line
                  dataKey="revenue"
                  type="natural"
                  stroke="var(--color-revenue)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: "var(--color-revenue)",
                    stroke: "var(--color-revenue)",
                    strokeWidth: 0,
                  }}
                />
              </LineChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
