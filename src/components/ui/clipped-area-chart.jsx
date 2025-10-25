"use client";

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { useSpring, useMotionValueEvent } from "motion/react";
import { Skeleton } from "@/components/ui/skeleton";

const chartConfig = {
  wagered: {
    label: "Wagered",
    color: "#FCA070",
  }
};

export function ClippedAreaChart({ data, isLoading = false, title = "Hourly Wagered", description = "Last 12 hours" }) {
  const chartRef = useRef(null);
  const [axis, setAxis] = useState(0);

  // motion values
  const springX = useSpring(0, {
    damping: 30,
    stiffness: 100,
  });
  const springY = useSpring(0, {
    damping: 30,
    stiffness: 100,
  });

  useMotionValueEvent(springX, "change", (latest) => {
    setAxis(latest);
  });

  // Set initial value when data loads
  useEffect(() => {
    if (data && data.length > 0 && data[data.length - 1].wagered !== undefined) {
      springY.jump(data[data.length - 1].wagered);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Data</CardTitle>
          <CardDescription>No hourly data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            No data to display
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate percentage change
  const firstValue = data[0]?.wagered || 0;
  const lastValue = data[data.length - 1]?.wagered || 0;
  const percentChange = firstValue !== 0 
    ? (((lastValue - firstValue) / firstValue) * 100).toFixed(1)
    : 0;
  const isPositive = percentChange >= 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          ${springY.get().toFixed(2)}
          <Badge variant="secondary" className="ml-2">
            {isPositive ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span>{isPositive ? '+' : ''}{percentChange}%</span>
          </Badge>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer ref={chartRef} className="h-[200px] w-full" config={chartConfig}>
          <AreaChart
            className="overflow-visible"
            accessibilityLayer
            data={data}
            onMouseMove={(state) => {
              const x = state.activeCoordinate?.x;
              const dataValue = state.activePayload?.[0]?.value;
              if (x && dataValue !== undefined) {
                springX.set(x);
                springY.set(dataValue);
              }
            }}
            onMouseLeave={() => {
              springX.set(chartRef.current?.getBoundingClientRect().width || 0);
              if (data && data.length > 0 && data[data.length - 1]?.wagered !== undefined) {
                springY.jump(data[data.length - 1].wagered);
              }
            }}
            margin={{
              right: 0,
              left: 0,
            }}>
            <CartesianGrid
              vertical={false}
              strokeDasharray="3 3"
              horizontalCoordinatesGenerator={(props) => {
                const { height } = props;
                return [0, height - 30];
              }} />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 12 }}
            />
            <Area
              dataKey="wagered"
              type="monotone"
              fill="url(#gradient-cliped-area-wagered)"
              fillOpacity={0.4}
              stroke="var(--color-wagered)"
              clipPath={`inset(0 ${
                Number(chartRef.current?.getBoundingClientRect().width) - axis
              } 0 0)`} />
            <line
              x1={axis}
              y1={0}
              x2={axis}
              y2={"85%"}
              stroke="var(--color-wagered)"
              strokeDasharray="3 3"
              strokeLinecap="round"
              strokeOpacity={0.2} />
            <rect x={axis - 50} y={0} width={50} height={18} fill="var(--color-wagered)" />
            <text
              x={axis - 25}
              fontWeight={600}
              y={13}
              textAnchor="middle"
              fill="var(--primary-foreground)">
              ${springY.get().toFixed(0)}
            </text>
            {/* this is a ghost line behind graph */}
            <Area
              dataKey="wagered"
              type="monotone"
              fill="none"
              stroke="var(--color-wagered)"
              strokeOpacity={0.1} />
            <defs>
              <linearGradient id="gradient-cliped-area-wagered" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-wagered)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="var(--color-wagered)" stopOpacity={0} />
                <mask id="mask-cliped-area-chart">
                  <rect x={0} y={0} width={"50%"} height={"100%"} fill="white" />
                </mask>
              </linearGradient>
            </defs>
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
