"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { CountryTimezoneModal } from "./CountryTimezoneModal";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { TestNotificationButton } from "./TestNotificationButton";

export function DashboardClient({ user }) {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0]; // yyyy-mm-dd
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statsData, setStatsData] = useState(null);
  const [activeUsers, setActiveUsers] = useState(null);
  const [activeUsersChartData, setActiveUsersChartData] = useState(null);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState("30d");

  // Check if user has timezone preference on component mount
  useEffect(() => {
    const checkUserTimezone = async () => {
      try {
        const response = await fetch("/api/user/timezone");
        const data = await response.json();
        
        // If no timezone preference is found, show the modal
        if (response.ok && !data.timezone) {
          setIsCountryModalOpen(true);
        }
      } catch (error) {
        console.error("Failed to check user timezone:", error);
        // On error, show modal to ensure user can set timezone
        setIsCountryModalOpen(true);
      }
    };

    checkUserTimezone();
  }, []);

  const wageredData = statsData;

  // Fun microcopy generator for user counts with correlated emojis
  const getUserCountMicrocopy = (count) => {
    const microcopy = [
      // Small numbers (1-9)
      { min: 1, max: 9, items: [
        { text: "That's a small team!", emoji: "👥" },
        { text: "Cozy group size!", emoji: "🏠" },
        { text: "Just getting started!", emoji: "🌱" },
        { text: "Small but mighty!", emoji: "💪" },
        { text: "Building momentum!", emoji: "🚀" }
      ]},
      // Teens (10-19)
      { min: 10, max: 19, items: [
        { text: "That's more than a soccer team!", emoji: "⚽" },
        { text: "Bigger than a jury!", emoji: "⚖️" },
        { text: "More people than fit in a small elevator!", emoji: "🛗" },
        { text: "That's a solid group!", emoji: "👨‍👩‍👧‍👦" },
        { text: "Growing strong!", emoji: "📈" }
      ]},
      // Twenties (20-29)
      { min: 20, max: 29, items: [
        { text: "That's more than a classroom!", emoji: "🎓" },
        { text: "Bigger than a wedding party!", emoji: "💒" },
        { text: "More than a full bus!", emoji: "🚌" },
        { text: "That's a small town meeting!", emoji: "🏛️" },
        { text: "Growing community!", emoji: "🌱" }
      ]},
      // Thirties (30-39)
      { min: 30, max: 39, items: [
        { text: "That's more than a baseball team!", emoji: "⚾" },
        { text: "Bigger than a jury pool!", emoji: "👥" },
        { text: "More people than a small restaurant!", emoji: "🍽️" },
        { text: "That's a full classroom!", emoji: "🏫" },
        { text: "Strong community!", emoji: "💪" }
      ]},
      // Forties (40-49)
      { min: 40, max: 49, items: [
        { text: "That's more than a wedding party!", emoji: "💒" },
        { text: "Bigger than a small bus!", emoji: "🚌" },
        { text: "More people than a family reunion!", emoji: "👨‍👩‍👧‍👦" },
        { text: "That's a solid gathering!", emoji: "🎉" },
        { text: "Impressive turnout!", emoji: "🎯" }
      ]},
      // Fifties (50-59)
      { min: 50, max: 59, items: [
        { text: "That's more than a school bus!", emoji: "🚌" },
        { text: "Bigger than a small conference!", emoji: "🏢" },
        { text: "More people than a wedding!", emoji: "💒" },
        { text: "That's a full train car!", emoji: "🚃" },
        { text: "Amazing community!", emoji: "🎉" }
      ]},
      // Sixties (60-69)
      { min: 60, max: 69, items: [
        { text: "That's more than a full bus!", emoji: "🚌" },
        { text: "Bigger than a small theater!", emoji: "🎭" },
        { text: "More people than a restaurant!", emoji: "🍽️" },
        { text: "That's a good crowd!", emoji: "👥" },
        { text: "Fantastic growth!", emoji: "🎊" }
      ]},
      // Seventies (70-79)
      { min: 70, max: 79, items: [
        { text: "That's more than a train carriage!", emoji: "🚃" },
        { text: "Bigger than a small wedding!", emoji: "💒" },
        { text: "More people than a full elevator!", emoji: "🛗" },
        { text: "That's a packed room!", emoji: "🏠" },
        { text: "Incredible community!", emoji: "🎯" }
      ]},
      // Eighties (80-89)
      { min: 80, max: 89, items: [
        { text: "That's more than a full train car!", emoji: "🚃" },
        { text: "Bigger than a small theater!", emoji: "🎭" },
        { text: "More people than a wedding hall!", emoji: "🏛️" },
        { text: "That's a packed venue!", emoji: "🏟️" },
        { text: "Outstanding turnout!", emoji: "🎉" }
      ]},
      // Nineties (90-99)
      { min: 90, max: 99, items: [
        { text: "That's almost 100 people!", emoji: "💯" },
        { text: "Bigger than a large wedding!", emoji: "💒" },
        { text: "More people than a small concert!", emoji: "🎵" },
        { text: "That's a packed house!", emoji: "🏠" },
        { text: "Amazing community!", emoji: "🎊" }
      ]},
      // Hundreds (100-999)
      { min: 100, max: 999, items: [
        { text: "That's more than a small concert!", emoji: "🎵" },
        { text: "Bigger than a wedding hall!", emoji: "🏛️" },
        { text: "More people than a theater!", emoji: "🎭" },
        { text: "That's a full auditorium!", emoji: "🏛️" },
        { text: "Incredible community!", emoji: "🎯" },
        { text: "That's more than a small festival!", emoji: "🎪" },
        { text: "Bigger than a conference!", emoji: "🏢" },
        { text: "More people than a stadium section!", emoji: "🏟️" }
      ]},
      // Thousands (1000+)
      { min: 1000, max: 9999, items: [
        { text: "That's more than a small festival!", emoji: "🎪" },
        { text: "Bigger than a concert venue!", emoji: "🎵" },
        { text: "More people than a stadium section!", emoji: "🏟️" },
        { text: "That's a full arena!", emoji: "🏟️" },
        { text: "Massive community!", emoji: "🌍" },
        { text: "That's more than a small town!", emoji: "🏘️" },
        { text: "Bigger than a university!", emoji: "🏫" },
        { text: "More people than a city block!", emoji: "🏙️" }
      ]},
      // Ten thousands (10000+)
      { min: 10000, max: 99999, items: [
        { text: "That's more than a small town!", emoji: "🏘️" },
        { text: "Bigger than a university!", emoji: "🏫" },
        { text: "More people than a city district!", emoji: "🏙️" },
        { text: "That's a full stadium!", emoji: "🏟️" },
        { text: "Massive community!", emoji: "🌍" },
        { text: "That's more than a small city!", emoji: "🏙️" },
        { text: "Bigger than a major venue!", emoji: "🎪" },
        { text: "More people than a large festival!", emoji: "🎪" }
      ]},
      // Hundred thousands (100000+)
      { min: 100000, max: 999999, items: [
        { text: "That's more than a small city!", emoji: "🏙️" },
        { text: "Bigger than a major stadium!", emoji: "🏟️" },
        { text: "More people than a large festival!", emoji: "🎪" },
        { text: "That's a massive gathering!", emoji: "👥" },
        { text: "Incredible community!", emoji: "🎯" },
        { text: "That's more than a medium city!", emoji: "🏙️" },
        { text: "Bigger than a major event!", emoji: "🎪" },
        { text: "More people than a whole district!", emoji: "🏙️" }
      ]},
      // Millions (1000000+)
      { min: 1000000, max: Infinity, items: [
        { text: "That's more than a major city!", emoji: "🌍" },
        { text: "Bigger than a whole state!", emoji: "🗺️" },
        { text: "More people than a country!", emoji: "🌎" },
        { text: "That's a global community!", emoji: "🌍" },
        { text: "Unbelievable scale!", emoji: "🚀" },
        { text: "That's more than a continent!", emoji: "🌍" },
        { text: "Bigger than a planet!", emoji: "🪐" },
        { text: "More people than the universe!", emoji: "🌌" }
      ]}
    ];

    const range = microcopy.find(r => count >= r.min && count <= r.max);
    if (range) {
      const randomIndex = Math.floor(Math.random() * range.items.length);
      return range.items[randomIndex];
    }
    
    return { text: "That's quite a community!", emoji: "👥" };
  };

  // Custom tooltip component
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
          <p className="font-semibold text-gray-800">${data.wagered.toLocaleString()}</p>
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

  // Helper function to set date range based on time period
  const setDateRangeFromPeriod = (period) => {
    const end = new Date();
    const start = new Date();
    
    switch (period) {
      case "1d":
        start.setDate(end.getDate() - 1); // Fix: should be 1 day ago, not same day
        break;
      case "1w":
        start.setDate(end.getDate() - 7);
        break;
      case "2w":
        start.setDate(end.getDate() - 14);
        break;
      case "30d":
        start.setDate(end.getDate() - 30);
        break;
      default:
        start.setDate(end.getDate() - 30);
    }
    
    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
  };

  const fetchStats = async () => {
    setIsLoading(true);
    
    try {
      // Step 1: Take local user date input
      const start = new Date(startDate + "T00:00:00");
      const end = new Date(endDate + "T23:59:59");

      // Step 2: Convert to UTC ISO (Appwrite requires this)
      const startISO = start.toISOString(); // e.g. "2025-09-17T00:00:00.000Z"
      const endISO = end.toISOString();

      console.log("Fetching stats:", { startISO, endISO });

      // Step 3: Fetch from API
      const stats = await fetch(`/api/stats?start=${startISO}&end=${endISO}`);
      const data = await stats.json();
      console.log("Stats response:", data);

      // Set unique users count from API response
      if (data && typeof data.uniqueUsers === 'number') {
        setActiveUsers(data.uniqueUsers);
      }

      // Set chart data for active users
      if (data && data.chartData && Array.isArray(data.chartData)) {
        setActiveUsersChartData(data.chartData);
      }

      // Step 4: Process the data for the chart
      if (data && data.result && Array.isArray(data.result)) {
        const processedData = data.result.map(item => {
          // Parse the data array to extract wagered values
          let wagered = 0;
          try {
            const dataArray = JSON.parse(item.raw);
            if (Array.isArray(dataArray)) {
              const wageredObj = dataArray.find(obj => obj.wagered !== undefined);
              if (wageredObj) {
                wagered = wageredObj.wagered || 0;
              }
            }
          } catch (e) {
            console.error("Error parsing data for item:", item.date, e);
          }

          return {
            date: item.date,
            wagered: wagered,
            displayDate: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
          };
        });
        setStatsData(processedData);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimezoneSave = (timezone) => {
    setSelectedTimezone(timezone);
    console.log("Timezone saved:", timezone);
  };

  // Handle tab change
  const handleTimePeriodChange = (value) => {
    setSelectedTimePeriod(value);
    setDateRangeFromPeriod(value);
  };

  // Fetch stats when component mounts with default 30 days
  useEffect(() => {
    fetchStats();
  }, [startDate, endDate]);

  return (
    <div className="p-6 space-y-4">
      {/* Test Notification Button - Remove in production */}
      <div className="flex justify-end">
        <TestNotificationButton />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-tr border border-orange-400/50 rounded-md from-[#e8691f]/80 to-[#ff853e]/80 p-5 h-[10rem] relative overflow-hidden">
          {/* Mini chart background */}
         
          
          {/* Content */}
          <div className="relative z-10">
            {isLoading || activeUsers === null ? (
              <>
                <Skeleton className="h-6 w-24 bg-white/20 mb-2" />
                <Skeleton className="h-12 w-20 bg-white/20" />
              </>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <h1 className="text-xl -mt-1 font-[500]">Active Users</h1>
                    <p className="text-4xl font-[700] mt-1 drop-shadow-md text-white">
                      {activeUsers}
                    </p>
                  </div>
                </TooltipTrigger>
                <TooltipContent 
                  className="bg-white/95 text-gray-800 border border-gray-200/50 shadow-lg max-w-xs [&>svg]:fill-orange-500"
                  side="bottom"
                >
                  {(() => {
                    const microcopy = getUserCountMicrocopy(activeUsers);
                    return (
                      <div className="text-center">
                        <p className="font-semibold flex items-center justify-center gap-1">
                          {activeUsers} Users {microcopy.emoji}
                        </p>
                        <p className="text-sm mt-1">{microcopy.text}</p>
                      </div>
                    );
                  })()}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
        <div className="bg-[#1D1C21] border border-white/[0.075] col-span-2 rounded-md p-5 h-[10rem] relative overflow-hidden">
          {/* Background logo */}
          <div className="absolute inset-0 mb-3 flex items-center justify-center pointer-events-none z-0">
            <img
              src="/logo-text.png"
              alt="Logo"
              className="h-12 w-auto opacity-[0.03] grayscale"
            />
          </div>
          
          <div className="h-full flex flex-col relative z-10">
            <div className="flex justify-between items-center -mt-2 mb-3">
              <h2 className="text-lg font-medium  text-white">Wager Statistics</h2>
              <Tabs value={selectedTimePeriod} onValueChange={handleTimePeriodChange} className="w-auto">
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
      </div>

      {/* Date inputs - keeping for manual override */}
      <div className="flex space-x-2 items-center">
        <div>
          <label className="block text-sm font-medium text-white">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border rounded px-2 py-1 bg-gray-800 text-white border-gray-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-white">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border rounded px-2 py-1 bg-gray-800 text-white border-gray-600"
          />
        </div>
        <div className="flex items-end">
          <Button onClick={fetchStats} disabled={isLoading} className="bg-orange-500 hover:bg-orange-600">
            {isLoading ? "Loading..." : "Refresh"}
          </Button>
        </div>
      </div>


      {/* Timezone Modal */}
      <CountryTimezoneModal
        isOpen={isCountryModalOpen}
        onClose={() => setIsCountryModalOpen(false)}
        onSave={handleTimezoneSave}
      />
    </div>
  );
}
