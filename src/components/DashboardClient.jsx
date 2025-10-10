"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { CountryTimezoneModal } from "./CountryTimezoneModal";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { createAvatar } from '@dicebear/core';
import { pixelArt } from '@dicebear/collection';
import { ScrollArea } from "./ui/scroll-area";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import {
  TextureCardHeader,
  TextureCardTitle,
  TextureCardContent,
  TextureSeparator,
} from "./ui/texture-card";

// Custom dark TextureCard component with #07080B color scheme
const DarkTextureCard = ({ children, className = "" }) => (
  <div className={`rounded-[24px] border border-white/60 dark:border-stone-950/60 bg-gradient-to-b from-[#07080B] to-[#0f1015] ${className}`}>
    <div className="rounded-[23px] border dark:border-neutral-900/80 border-black/10 bg-gradient-to-b from-[#07080B] to-[#0f1015]">
      <div className="rounded-[22px] border dark:border-neutral-950 border-white/50 bg-gradient-to-b from-[#07080B] to-[#0f1015]">
        <div className="rounded-[21px] border dark:border-neutral-900/70 border-neutral-950/20 bg-gradient-to-b from-[#07080B] to-[#0f1015]">
          <div className="w-full border border-white/50 dark:border-neutral-700/50 rounded-[20px] text-neutral-500 bg-[#07080B]">
            {children}
          </div>
        </div>
      </div>
    </div>
  </div>
);

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
  const [usersList, setUsersList] = useState([]);
  const [sortField, setSortField] = useState(() => {
    // Load sort preference from localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dashboardSortField') || 'weightedWagered';
    }
    return 'weightedWagered';
  });
  const [sortDirection, setSortDirection] = useState(() => {
    // Load sort direction from localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dashboardSortDirection') || 'desc';
    }
    return 'desc';
  });

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

  // Generate avatar URL using DiceBear with pixel art style and gradient backgrounds
  const getAvatarUrl = (userId) => {
    // Subtle, lighter gradient color pairs for backgrounds (so pixel art stands out)
    const gradientColors = [
      ['ffd4d4', 'ffe3e3'], // Light red/pink gradient
      ['d4f5f5', 'e0f9f9'], // Light teal gradient
      ['d4e8f5', 'e0f0f9'], // Light blue gradient
      ['ffd4e8', 'ffe3f0'], // Light pink gradient
      ['e0f5e8', 'edf9f0'], // Light mint gradient
      ['fff0d4', 'fff5e0'], // Light peach gradient
      ['e8e8f5', 'f0f0f9'], // Light purple gradient
      ['ffe8e0', 'fff0ed'], // Light coral gradient
      ['e0f5e8', 'edf9f0'], // Light green gradient
      ['ffecd4', 'fff3e0'], // Light orange gradient (brand color)
    ];

    // Use userId to deterministically select gradient and rotation
    const hashCode = (str) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return Math.abs(hash);
    };

    const hash = hashCode(userId);
    const selectedGradient = gradientColors[hash % gradientColors.length];
    const rotation = (hash % 360); // Random rotation between 0-360

    const avatar = createAvatar(pixelArt, {
      seed: userId,
      size: 128,
      backgroundRotation: [rotation, rotation], // Use same value for deterministic rotation
    });
    return avatar.toDataUri();
  };

  // Helper function to format dollar amounts with max 2 decimals (round down)
  const formatDollarAmount = (amount) => {
    return Math.floor(amount * 100) / 100;
  };

  // Helper function to get service provider icon
  const getServiceIcon = (service) => {
    if (!service) return null;
    
    // Normalize service name to lowercase for matching
    const serviceLower = service.toLowerCase();
    
    // Map of available service icons
    const serviceIcons = {
      'roobet': '/casinos/roobet.svg',
      'stake': '/casinos/stake.svg',
      'shuffle': '/casinos/shuffle.svg',
      'gamdom': '/casinos/gamdom.svg',
      'rustclash': '/casinos/rustclash.svg',
      'rain': '/casinos/rain.svg'
    };
    
    return serviceIcons[serviceLower] || null;
  };

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

  // Handle sort change
  const handleSort = (field) => {
    let newDirection = 'desc';
    
    // If clicking the same field, toggle direction
    if (field === sortField) {
      newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    }
    
    setSortField(field);
    setSortDirection(newDirection);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboardSortField', field);
      localStorage.setItem('dashboardSortDirection', newDirection);
    }
  };

  // Sort users list based on current sort field and direction
  const getSortedUsersList = (users) => {
    const sorted = [...users].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'weightedWagered':
          aValue = a.weightedWagered;
          bValue = b.weightedWagered;
          break;
        case 'wagered':
          aValue = a.wagered;
          bValue = b.wagered;
          break;
        case 'username':
          aValue = a.username.toLowerCase();
          bValue = b.username.toLowerCase();
          return sortDirection === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        default:
          aValue = a.weightedWagered;
          bValue = b.weightedWagered;
      }
      
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
    
    return sorted;
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

        // Step 5: Process user data - accumulate wagered and weighted per user
        const usersMap = new Map();
        
        // Get the latest date from the results (all entries with this date are "today")
        const latestDate = data.result.length > 0 ? data.result[data.result.length - 1].date : null;
        const todayUsersMap = new Map();
        
        // First, parse all entries from today's date to get today's wagered amounts per user
        // (there can be multiple entries for the same date with different identifiers/services)
        if (latestDate) {
          const todayEntries = data.result.filter(item => item.date === latestDate);
          
          todayEntries.forEach((todayData) => {
            try {
              const todayArray = JSON.parse(todayData.raw);
              if (Array.isArray(todayArray)) {
                todayArray.forEach((userEntry) => {
                  if (userEntry.uid) {
                    const existing = todayUsersMap.get(userEntry.uid) || {
                      todayWagered: 0,
                      todayWeightedWagered: 0
                    };
                    existing.todayWagered += userEntry.wagered || 0;
                    existing.todayWeightedWagered += userEntry.weightedWagered || 0;
                    todayUsersMap.set(userEntry.uid, existing);
                  }
                });
              }
            } catch (e) {
              console.error("Error parsing today's data:", e);
            }
          });
        }
        
        // Now process all data for totals
        data.result.forEach((item) => {
          try {
            const dataArray = JSON.parse(item.raw);
            if (Array.isArray(dataArray)) {
              dataArray.forEach((userEntry) => {
                if (userEntry.uid) {
                  const existing = usersMap.get(userEntry.uid) || {
                    uid: userEntry.uid,
                    username: userEntry.username || userEntry.uid,
                    wagered: 0,
                    weightedWagered: 0,
                    todayWagered: 0,
                    todayWeightedWagered: 0,
                    service: item.identifier || null
                  };
                  
                  existing.wagered += userEntry.wagered || 0;
                  existing.weightedWagered += userEntry.weightedWagered || 0;
                  
                  // Keep the service from the first entry (identifier from document)
                  if (!existing.service && item.identifier) {
                    existing.service = item.identifier;
                  }
                  
                  usersMap.set(userEntry.uid, existing);
                }
              });
            }
          } catch (e) {
            console.error("Error parsing user data:", e);
          }
        });

        // Merge today's data into the users map
        todayUsersMap.forEach((todayStats, uid) => {
          const user = usersMap.get(uid);
          if (user) {
            user.todayWagered = todayStats.todayWagered;
            user.todayWeightedWagered = todayStats.todayWeightedWagered;
          }
        });

        // Convert map to array (sorting will be handled by getSortedUsersList)
        const usersArray = Array.from(usersMap.values());
        setUsersList(usersArray);
        console.log("Processed users:", usersArray);
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

     

      {/* User List Section */}
      <DarkTextureCard>
        <TextureCardHeader className="flex flex-col justify-center gap-1 p-4">
          <TextureCardTitle>User Statistics</TextureCardTitle>
        </TextureCardHeader>
        <TextureSeparator />
        <TextureCardContent className="rounded-none bg-[#07080B]">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="grid grid-cols-[60px_1.5fr_2fr_2fr_1fr] gap-4 p-3 rounded-lg bg-[#0f1015]/50 items-center pl-2 pr-6 border border-white/5">
                  <Skeleton className="h-6 w-10 bg-gray-600/30 mx-auto" />
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full bg-gray-600/30" />
                    <Skeleton className="h-4 w-32 bg-gray-600/30" />
                  </div>
                  <Skeleton className="h-4 w-32 bg-gray-600/30 pl-4" />
                  <Skeleton className="h-4 w-32 bg-gray-600/30 pl-4" />
                  <Skeleton className="h-3 w-20 bg-gray-600/30 ml-auto" />
                </div>
              ))}
            </div>
          ) : usersList.length === 0 ? (
            <p className="text-gray-400 text-sm">No user data available for the selected time period.</p>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="min-w-full">
                {/* Table Header */}
                <div className="grid grid-cols-[60px_1.5fr_2fr_2fr_1fr] gap-4 pb-3 mb-3 border-b border-white/10 sticky top-0 bg-[#07080B] z-10 pl-2 pr-6">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">#</div>
                  <button 
                    onClick={() => handleSort('username')}
                    className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-left hover:text-gray-300 transition-colors flex items-center gap-1 group"
                  >
                    Username
                    {sortField === 'username' ? (
                      sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                    )}
                  </button>
                  <button 
                    onClick={() => handleSort('weightedWagered')}
                    className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-left hover:text-gray-300 transition-colors flex items-center gap-1 pl-4 group"
                  >
                    Weighted
                    {sortField === 'weightedWagered' ? (
                      sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                    )}
                  </button>
                  <button 
                    onClick={() => handleSort('wagered')}
                    className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-left hover:text-gray-300 transition-colors flex items-center gap-1 pl-4 group"
                  >
                    Wagered
                    {sortField === 'wagered' ? (
                      sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                    )}
                  </button>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Last Seen</div>
                </div>

                {/* Table Body */}
                <div className="space-y-2">
                  {getSortedUsersList(usersList).map((user, index) => (
                    <div
                      key={user.uid}
                      className="grid grid-cols-[60px_1.5fr_2fr_2fr_1fr] gap-4 p-3 rounded-lg bg-[#0f1015]/50 hover:bg-[#14151a]/70 transition-colors items-center pl-2 pr-6 border border-white/5"
                    >
                      {/* Rank */}
                      <div className="flex justify-center">
                        <span className="text-gray-400 font-medium text-sm">#{index + 1}</span>
                      </div>

                      {/* Avatar + Username */}
                      <div className="min-w-0 flex items-center gap-3">
                        <img
                          src={getAvatarUrl(user.uid)}
                          alt={user.username}
                          className="h-10 w-10 rounded-full ring-2 p-0.5 ring-white/10 flex-shrink-0"
                        />
                        <h3 className="text-white font-medium truncate flex items-center gap-2">
                          {getServiceIcon(user.service) && (
                            <img
                              src={getServiceIcon(user.service)}
                              alt={user.service}
                              className="h-4 w-4 inline-block flex-shrink-0"
                            />
                          )}
                          <span className="truncate">{user.username}</span>
                        </h3>
                      </div>

                      {/* Weighted Wagered */}
                      <div className="flex items-center gap-2 pl-4">
                        <span className="text-white font-medium whitespace-nowrap">
                          ${formatDollarAmount(user.weightedWagered).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        {user.todayWeightedWagered > 0 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-xs font-semibold text-green-600 bg-green-500/20 px-2 py-0.5 rounded-full border border-green-500/30 whitespace-nowrap flex-shrink-0 cursor-help">
                                +${formatDollarAmount(user.todayWeightedWagered).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="bg-[#1D1C21] border-white/20 text-gray-200 shadow-xl">
                              <p className="text-xs font-medium">Weighted Today</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>

                      {/* Wagered */}
                      <div className="flex items-center gap-2 pl-4">
                        <span className="text-white font-medium whitespace-nowrap">
                          ${formatDollarAmount(user.wagered).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        {user.todayWagered > 0 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-xs font-semibold text-green-600 bg-green-500/20 px-2 py-0.5 rounded-full border border-green-500/30 whitespace-nowrap flex-shrink-0 cursor-help">
                                +${formatDollarAmount(user.todayWagered).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="bg-[#1D1C21] border-white/20 text-gray-200 shadow-xl">
                              <p className="text-xs font-medium">Wagered Today</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>

                      {/* Last Seen - Placeholder */}
                      <div className="text-right">
                        <span className="text-gray-400 text-sm">2 hours ago</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          )}
        </TextureCardContent>
      </DarkTextureCard>

       {/* Date inputs - keeping for manual override */}
      <div className="flex space-x-2 items-center">
  
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
