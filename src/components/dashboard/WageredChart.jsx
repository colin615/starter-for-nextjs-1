"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatDollarAmount } from "@/lib/utils/dashboardUtils";

const chartConfig = {
  wagered: {
    label: "Wagered",
    color: "#84F549",
  },
};

const CustomTooltipContent = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const date = new Date(data.date);
    const daysAgo = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24));
    const formattedDate = date.toLocaleDateString("en-US", { 
      month: "long", 
      day: "numeric" 
    });
    
    return (
      <div className="border-border/50 bg-background grid min-w-[8rem] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl">
        <div className="font-medium">{label}</div>
        <div className="grid gap-1.5">
          <div className="flex w-full flex-wrap items-center gap-2">
            <div className="shrink-0 rounded-[2px] h-2.5 w-2.5 bg-[var(--color-wagered)]" />
            <div className="flex flex-1 justify-between leading-none items-center">
              <span className="text-muted-foreground">Wagered</span>
              <span className="text-foreground font-mono font-medium tabular-nums">
                ${formatDollarAmount(data.wagered).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {daysAgo === 0 ? "Today" : daysAgo === 1 ? "1 day ago" : `${daysAgo} days ago`}
          </div>
          <div className="text-xs text-muted-foreground">
            {formattedDate}
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const WageredChart = ({ 
  wageredData, 
  isLoading, 
  selectedTimePeriod, 
  onTimePeriodChange 
}) => {
  return (
    <div className="bg-[#1D1C21] border border-white/[0.075] col-span-2 rounded-md p-5 h-[10rem] relative overflow-hidden">
      <div className="absolute inset-0 mb-3 flex items-center justify-center pointer-events-none z-0">
        <img
          src="/logo-text.png"
          alt="Logo"
          className="h-12 w-auto opacity-[0.03] grayscale"
        />
      </div>
      
      <div className="h-full flex flex-col relative z-10">
        <div className="flex justify-between items-center -mt-2 mb-3">
          <h2 className="text-lg font-medium text-white">Wager Statistics</h2>
          <Tabs value={selectedTimePeriod} onValueChange={onTimePeriodChange} className="w-auto">
            <TabsList className="bg-gray-800/50 border border-gray-600/30 h-8">
              <TabsTrigger value="1d" className="text-xs px-2 py-1 h-6 data-[state=active]:bg-[#84F549] data-[state=active]:text-black">1d</TabsTrigger>
              <TabsTrigger value="1w" className="text-xs px-2 py-1 h-6 data-[state=active]:bg-[#84F549] data-[state=active]:text-black">1w</TabsTrigger>
              <TabsTrigger value="2w" className="text-xs px-2 py-1 h-6 data-[state=active]:bg-[#84F549] data-[state=active]:text-black">2w</TabsTrigger>
              <TabsTrigger value="30d" className="text-xs px-2 py-1 h-6 data-[state=active]:bg-[#84F549] data-[state=active]:text-black">30d</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="flex-1">
          {isLoading || !wageredData ? (
            <div className="h-full flex items-end space-x-1">
              {Array.from({ length: 30 }).map((_, i) => (
                <Skeleton 
                  key={i} 
                  className="bg-gray-600/30 flex-1" 
                  style={{ height: `${Math.random() * 60 + 20}%` }}
                />
              ))}
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-full w-full">
              <BarChart data={wageredData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }} accessibilityLayer>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="displayDate" 
                  tickLine={false}
                  axisLine={false}
                  hide={true}
                />
                <YAxis 
                  tickLine={false}
                  axisLine={false}
                  hide={true}
                  tickFormatter={(value) => value >= 1000 ? `$${(value/1000).toFixed(1)}k` : `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                />
                <ChartTooltip content={<CustomTooltipContent />} />
                <Bar 
                  dataKey="wagered" 
                  fill="var(--color-wagered)" 
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
        </div>
      </div>
    </div>
  );
};
