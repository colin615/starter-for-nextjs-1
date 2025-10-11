"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { formatDollarAmount } from "@/utils/dashboardUtils";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const date = new Date(data.date);
    const daysAgo = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24));
    const formattedDate = date.toLocaleDateString("en-US", { 
      month: "long", 
      day: "numeric" 
    });
    
    return (
      <div className="bg-white/100 backdrop-blur-sm border border-gray-200/50 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-gray-800">
          ${formatDollarAmount(data.wagered).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className="text-sm text-gray-500">
          {daysAgo === 0 ? "Today" : daysAgo === 1 ? "1 day ago" : `${daysAgo} days ago`}
        </p>
        <p className="text-sm text-gray-500">
          {formattedDate}
        </p>
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
              <TabsTrigger value="1d" className="text-xs px-2 py-1 h-6 data-[state=active]:bg-orange-500 data-[state=active]:text-white">1d</TabsTrigger>
              <TabsTrigger value="1w" className="text-xs px-2 py-1 h-6 data-[state=active]:bg-orange-500 data-[state=active]:text-white">1w</TabsTrigger>
              <TabsTrigger value="2w" className="text-xs px-2 py-1 h-6 data-[state=active]:bg-orange-500 data-[state=active]:text-white">2w</TabsTrigger>
              <TabsTrigger value="30d" className="text-xs px-2 py-1 h-6 data-[state=active]:bg-orange-500 data-[state=active]:text-white">30d</TabsTrigger>
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
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={wageredData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="white" opacity={0.05} />
                <XAxis 
                  dataKey="displayDate" 
                  stroke="#9CA3AF"
                  fontSize={10}
                  tick={{ fill: '#9CA3AF' }}
                  hide={true}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  fontSize={10}
                  tick={{ fill: '#9CA3AF' }}
                  hide={true}
                  tickFormatter={(value) => `$${value >= 1000 ? (value/1000).toFixed(1) + 'k' : value}`}
                />
                <RechartsTooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="wagered" 
                  fill="#E36015" 
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};
