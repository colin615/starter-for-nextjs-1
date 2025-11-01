"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, Pencil } from "lucide-react";
import Countdown from "react-countdown";
import { motion, AnimatePresence, cubicBezier } from "framer-motion";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, Users, Target } from "lucide-react";
import { ComposedChart, Bar, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { getDiceBearAvatarUrl } from "@/utils/avatarUtils";
import { formatDollarAmount } from "@/utils/dashboardUtils";

const casinoStyles = {
  roobet: {
    title: "Roobet",
    accentColor: "#4C3715",
    iconClass: "scale-125",
  },
  shuffle: {
    title: "Shuffle",
    accentColor: "#7A32FB",
    iconClass: " !fill-white",
  },
  rainbet: {
    title: "Rainbet",
    accentColor: "#191F3B",
    iconClass: " !fill-white",
  },
  gamdom: {
    title: "Gamdom",
    accentColor: "#0F3824",
    iconClass: " !fill-white",
  },
  rain: {
    title: "Rain",
    accentColor: "#191F3B",
    iconClass: " !fill-white",
  },
  rustclash: {
    title: "Rustclash",
    accentColor: "#111926",
    iconClass: " !fill-white",
  },
  stake: {
    title: "Stake",
    accentColor: "#111926",
    iconClass: " !fill-white",
  },
};

const AnimatedDigit = ({ value }) => {
  return (
    <div className="relative w-3 h-4 overflow-hidden">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={value}
          initial={{ y: "100%" }}
          animate={{ y: "0%" }}
          exit={{ y: "-100%" }}
          transition={{ duration: 0.3, ease: cubicBezier(0.2, 1, 0.24, 1) }}
          className="absolute inset-0 flex items-center justify-center text-[12.5px] font-bold tabular-nums bg-gradient-to-b text-transparent bg-clip-text from-[#eaeaea] to-[#dcdcdc]"
        >
          {value}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const TimeUnit = ({ value, label }) => {
  const digits = value.toString().padStart(2, "0").split("");

  return (
    <div className="flex flex-col items-center">
      <div className="flex gap-0 ">
        <AnimatedDigit value={parseInt(digits[0])} />
        <AnimatedDigit value={parseInt(digits[1])} />
      </div>
      {label && (
        <span className="mt-0.5 text-[10px] uppercase opacity-40 font-[400]">
          {label}
        </span>
      )}
    </div>
  );
};

const CompactCountdown = ({ date }) => {
  if (!date) return null;

  const endDate = new Date(date);
  const now = new Date();

  if (endDate <= now) {
    return (
      <span className="text-[14px] text-muted-foreground opacity-60">
        Ended
      </span>
    );
  }

  const renderer = ({ days, hours, minutes, seconds, completed }) => {
    if (completed) {
      return (
        <span className="text-[14px] text-muted-foreground opacity-60">
          Ended
        </span>
      );
    }

    return (
      <div className="flex items-center gap-3.5">
        {days > 0 && <TimeUnit value={days} label="DAYS" />}
        <TimeUnit value={hours} label="HRS" />
        <TimeUnit value={minutes} label="MIN" />
        {days === 0 && <TimeUnit value={seconds} label="SEC" />}
      </div>
    );
  };

  return <Countdown date={endDate} renderer={renderer} />;
};

const getLeaderboardStatus = (leaderboard) => {
  const now = new Date();
  const startDate = leaderboard.startDate || leaderboard.start_date;
  const endDate = leaderboard.endDate || leaderboard.end_date;
  const isPaused = leaderboard.paused || leaderboard.is_paused || false;

  if (isPaused) {
    return { 
      status: "paused", 
      label: "Paused", 
      color: "#8B8B8B"
    };
  }

  if (endDate) {
    const end = new Date(endDate);
    if (end < now) {
      return { 
        status: "ended", 
        label: "Ended", 
        color: "#EF4444"
      };
    }
  }

  if (startDate) {
    const start = new Date(startDate);
    if (start > now) {
      return { 
        status: "scheduled", 
        label: "Scheduled", 
        color: "#3B82F6"
      };
    }
  }

  return { 
    status: "active", 
    label: "Active", 
    color: "#10B981"
  };
};

const StatusChip = ({ status, label, color }) => {
  const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <span
      className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-sm"
      style={{
        color: color,
        backgroundColor: hexToRgba(color, 0.15),
      }}
    >
      {label}
    </span>
  );
};

const LeaderboardSkeleton = () => {
  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-md" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      
      <div className="rounded-sm border border-white/5 bg-[#16181D] p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
        
        <div className="space-y-3 mt-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default function LeaderboardDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [leaderboard, setLeaderboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const hasFetched = useRef(false);
  const [visibleSeries, setVisibleSeries] = useState({
    wagered: true,
    users: true,
  });
  const [chartData, setChartData] = useState([]);
  const [isLoadingChart, setIsLoadingChart] = useState(false);

  useEffect(() => {
    if (!loading && user && params?.id && !hasFetched.current) {
      hasFetched.current = true;
      fetchLeaderboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, params?.id]);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/leaderboards/${params.id}`);
      const data = await response.json();
      if (data.success) {
        setLeaderboard(data.leaderboard);
        // Fetch chart data after leaderboard loads
        fetchChartData(data.leaderboard);
      } else {
        setError(data.error || "Failed to load leaderboard");
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      setError("An error occurred while loading the leaderboard");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChartData = async (leaderboardData) => {
    if (!leaderboardData?.start_date || !leaderboardData?.end_date) {
      return;
    }

    setIsLoadingChart(true);
    try {
      const response = await fetch(`/api/leaderboards/${params.id}/stats`);
      const data = await response.json();
      if (data.success && data.chartData) {
        // Transform data to include difference between wagered and weighted
        const transformedData = data.chartData.map((item) => {
          const wagered = item.wagered || 0;
          const weighted = item.weightedWagered || 0;
          const difference = wagered - weighted;
          
          return {
            ...item,
            weighted,
            difference: Math.max(0, difference), // Ensure non-negative
            wagered, // Keep original for tooltip
          };
        });
        setChartData(transformedData);
      }
    } catch (error) {
      console.error("Error fetching chart data:", error);
    } finally {
      setIsLoadingChart(false);
    }
  };

  if (isLoading) {
    return <LeaderboardSkeleton />;
  }

  if (error || !leaderboard) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/leaderboards")}
          className="w-fit"
        >
          <ArrowLeft className="size-4 mr-2" />
          Back to Leaderboards
        </Button>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-lg font-medium text-red-500 mb-2">
              {error || "Leaderboard not found"}
            </p>
            <p className="text-sm text-muted-foreground">
              The leaderboard you're looking for doesn't exist or you don't have permission to view it.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const casinoId = leaderboard.casino_id || leaderboard.casinoId;
  const casinoStyle = casinoStyles[casinoId] || {
    title: casinoId,
    accentColor: "#111926",
    iconClass: " !fill-white",
  };
  const iconClass = casinoStyle.iconClass || "";
  const statusInfo = getLeaderboardStatus(leaderboard);
  const endDate = leaderboard.endDate || leaderboard.end_date;
  const startDate = leaderboard.startDate || leaderboard.start_date;
  const users = leaderboard.users || [];
  const prizeAmounts = leaderboard.prize_amounts || [];

  // Calculate stats for chart
  const totalWagered = leaderboard.wagered || 0;
  const totalUsers = leaderboard.user_count || users.length;
  const wageredPerUser = totalUsers > 0 ? totalWagered / totalUsers : 0;
  const playingNow = totalUsers; // Using total users as playing now

  const toggleSeries = (series) => {
    setVisibleSeries((prev) => ({
      ...prev,
      [series]: !prev[series],
    }));
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/leaderboards")}
            className="w-fit"
          >
            <ArrowLeft className="size-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <div
              className="flex border border-white/5 size-10 items-center justify-center rounded-sm p-2 flex-shrink-0"
              style={{
                background: casinoStyle.accentColor,
              }}
            >
              <img
                className={`${iconClass} size-5`}
                src={`/casinos/${casinoId}.svg`}
                alt={casinoStyle.title}
              />
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-white">
                {leaderboard.title}
              </h1>
              <span className="text-sm text-muted-foreground">
                {casinoStyle.title} • Wager Race
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusChip
            status={statusInfo.status}
            label={statusInfo.label}
            color={statusInfo.color}
          />
          <Button
            variant="outline"
            size="icon"
            className="size-8 border-white/5"
            onClick={() => router.push(`/share/${leaderboard.id}`)}
            title="Share leaderboard"
          >
            <Eye className="size-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="size-8"
            onClick={() => router.push(`/dashboard/leaderboards/edit/${leaderboard.id}`)}
            title="Edit leaderboard"
          >
            <Pencil className="size-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Weighted Card */}
        <Card>
          <CardContent className="p-4 relative">
            <div className="space-y-3 z-10 relative">
              {/* Header with icon and label */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground/50" />
                  <span className="text-sm text-muted-foreground">Weighted</span>
                </div>
              </div>

              {/* Main value */}
              <div className="flex items-center justify-between">
                {isLoading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <span className="text-2xl font-[600]">
                    ${formatDollarAmount(leaderboard.props?.weighted || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Wagered Card */}
        <Card>
          <CardContent className="p-4 relative">
            <div className="space-y-3 z-10 relative">
              {/* Header with icon and label */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground/50" />
                  <span className="text-sm text-muted-foreground">Wagered</span>
                </div>
              </div>

              {/* Main value */}
              <div className="flex items-center justify-between">
                {isLoading ? (
                  <Skeleton className="h-8 w-32" />
                ) : (
                  <span className="text-2xl font-[600]">
                    ${formatDollarAmount(leaderboard.wagered || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Participants Card */}
        <Card>
          <CardContent className="p-4 relative">
            <div className="space-y-3 z-10 relative">
              {/* Header with icon and label */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground/50" />
                  <span className="text-sm text-muted-foreground">Participants</span>
                </div>
              </div>

              {/* Main value */}
              <div className="flex items-center justify-between">
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <span className="text-2xl font-[600]">
                    {leaderboard.user_count || (leaderboard.users?.length || 0)}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Section */}
      <Card>
        <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
          <div className="flex flex-wrap w-full">
            {/* Wagered Stat Box */}
            <button
              data-active={visibleSeries.wagered}
              className="data-[active=true]:bg-muted/50 relative z-30 flex flex-1 flex-col justify-center gap-0.5 border-t px-4 py-3 text-left even:border-l sm:border-t-0 sm:border-l sm:px-6 sm:py-4 min-w-0"
              onClick={() => toggleSeries('wagered')}
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={visibleSeries.wagered}
                  onChange={() => toggleSeries('wagered')}
                  onClick={(e) => e.stopPropagation()}
                  className="w-3.5 h-3.5 rounded border-gray-600 accent-[#84F549] focus:ring-[#84F549] focus:ring-offset-0 cursor-pointer flex-shrink-0"
                />
                <span className="text-muted-foreground text-xs font-normal">
                  Wagered
                </span>
              </div>
              <span className="text-base leading-tight font-semibold sm:text-2xl">
                ${formatDollarAmount(totalWagered).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-muted-foreground font-normal">
                +0.00%
              </span>
            </button>

            {/* Users Stat Box */}
            <button
              data-active={visibleSeries.users}
              className="data-[active=true]:bg-muted/50 relative z-30 flex flex-1 flex-col justify-center gap-0.5 border-t px-4 py-3 text-left even:border-l sm:border-t-0 sm:border-l sm:px-6 sm:py-4 min-w-0"
              onClick={() => toggleSeries('users')}
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={visibleSeries.users}
                  onChange={() => toggleSeries('users')}
                  onClick={(e) => e.stopPropagation()}
                  className="w-3.5 h-3.5 rounded border-gray-600 accent-[#3B82F6] focus:ring-[#3B82F6] focus:ring-offset-0 cursor-pointer flex-shrink-0"
                />
                <span className="text-muted-foreground text-xs font-normal">
                  Users
                </span>
              </div>
              <span className="text-base leading-tight font-semibold sm:text-2xl">
                {totalUsers.toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground font-normal">
                +0.00%
              </span>
            </button>

            {/* Wagered/User Stat Box */}
            <div className="relative z-30 flex flex-1 flex-col justify-center gap-0.5 border-t px-4 py-3 text-left even:border-l sm:border-t-0 sm:border-l sm:px-6 sm:py-4 min-w-0">
              <span className="text-muted-foreground text-xs font-normal">
                Wagered/User
              </span>
              <span className="text-base leading-tight font-semibold sm:text-2xl">
                ${formatDollarAmount(wageredPerUser).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-muted-foreground font-normal">
                +0.00%
              </span>
            </div>

            {/* Playing Now Stat Box */}
            <div className="relative z-30 flex flex-1 flex-col justify-center gap-0.5 border-t px-4 py-3 text-left even:border-l sm:border-t-0 sm:border-l sm:px-6 sm:py-4 min-w-0">
              <span className="text-muted-foreground text-xs font-normal">
                Playing Now
              </span>
              <span className="text-base leading-tight font-semibold sm:text-2xl">
                {playingNow.toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground font-normal">
                +0.00%
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:p-6">
          {isLoadingChart ? (
            <div className="h-[300px] flex items-center justify-center">
              <Skeleton className="h-full w-full" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              <div className="text-center space-y-3">
                <div className="text-6xl">👻</div>
                <div className="text-lg font-medium">No data yet</div>
                <div className="text-sm">Chart data will appear here once available</div>
              </div>
            </div>
          ) : (
            <ChartContainer
              config={{
                weighted: {
                  label: "Weighted",
                  color: "#5DB82F",
                },
                difference: {
                  label: "Difference",
                  color: "#A8F573",
                },
                users: {
                  label: "Users",
                  color: "#3B82F6",
                },
              }}
              className="h-[300px] w-full"
            >
              <ComposedChart
                data={chartData}
                margin={{ top: 5, right: 12, left: 12, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="usersGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="#3B82F6"
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor="#3B82F6"
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="displayDate"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                />
                <YAxis
                  yAxisId="left"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={60}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={60}
                  domain={['dataMin - 5', 'dataMax + 5']}
                />
                <ChartTooltip
                  cursor={false}
                  content={({ active, payload, label }) => {
                    if (!active || !payload || payload.length === 0) {
                      return null;
                    }
                    
                    const data = payload[0].payload;
                    const wagered = data.wagered || 0;
                    const weighted = data.weighted || 0;
                    const users = data.users || 0;
                    
                    return (
                      <div className="border-border/50 bg-background grid min-w-[8rem] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl">
                        <div className="font-medium">{label}</div>
                        <div className="grid gap-1.5">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-muted-foreground">Wagered</span>
                            <span className="text-foreground font-mono font-medium tabular-nums">
                              ${formatDollarAmount(wagered).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-muted-foreground">Weighted</span>
                            <span className="text-foreground font-mono font-medium tabular-nums">
                              ${formatDollarAmount(weighted).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          {visibleSeries.users && (
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-muted-foreground">Users</span>
                              <span className="text-foreground font-mono font-medium tabular-nums">
                                {users.toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="weighted"
                  stackId="a"
                  fill="#5DB82F"
                  radius={[0, 0, 4, 4]}
                  opacity={visibleSeries.wagered ? 1 : 0}
                />
                <Bar
                  yAxisId="left"
                  dataKey="difference"
                  stackId="a"
                  fill="#A8F573"
                  radius={[4, 4, 0, 0]}
                  opacity={visibleSeries.wagered ? 1 : 0}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="users"
                  fill="url(#usersGradient)"
                  fillOpacity={visibleSeries.users ? 0.4 : 0}
                  stroke="#3B82F6"
                  strokeWidth={2}
                  opacity={visibleSeries.users ? 1 : 0}
                />
              </ComposedChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Prize Pool */}
      {prizeAmounts.length > 0 && (
        <div className="rounded-sm border border-white/5 bg-[#16181D] p-4">
          <div className="text-sm text-muted-foreground mb-3">Prize Pool</div>
          <div className="flex items-center gap-2 flex-wrap">
            {prizeAmounts.map((prize, index) => (
              <div
                key={index}
                className="px-3 py-1.5 rounded-md bg-white/5 border border-white/10"
              >
                <span className="text-xs text-muted-foreground">
                  #{index + 1}
                </span>
                <span className="ml-2 text-sm font-medium text-white">
                  ${prize.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="rounded-sm border border-white/10 bg-[#141519] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#16181D] border-b border-white/10">
                <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-r border-white/5">
                  Rank
                </th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-r border-white/5">
                  Player
                </th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-r border-white/5">
                  Wagered
                </th>
                {leaderboard.props?.weighted && (
                  <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-r border-white/5">
                    Weighted
                  </th>
                )}
                <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Prize
                </th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={leaderboard.props?.weighted ? 5 : 4} className="py-6 px-3 text-center text-muted-foreground text-sm">
                    No participants yet
                  </td>
                </tr>
              ) : (
                users.map((user, index) => {
                  const avatarUrl = getDiceBearAvatarUrl(user.userId || user.user_id || `user-${index}`);
                  const prize = user.prize || (prizeAmounts[user.rank - 1] || null);
                  const isEven = index % 2 === 0;
                  
                  return (
                    <tr
                      key={user.userId || user.user_id || index}
                      className={`border-b border-white/5 transition-colors ${
                        isEven ? 'bg-[#141519]' : 'bg-[#16181D]'
                      } hover:bg-[#1a1c20]`}
                    >
                      <td className="py-2 px-3 border-r border-white/5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-white tabular-nums min-w-[24px]">
                            {user.rank || index + 1}
                          </span>
                          {user.rank <= 3 && (
                            <span className="text-base">
                              {user.rank === 1 ? "🥇" : user.rank === 2 ? "🥈" : "🥉"}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-3 border-r border-white/5">
                        <div className="flex items-center gap-2">
                          <Avatar className="size-7 border border-white/10 flex-shrink-0">
                            <AvatarImage src={avatarUrl} alt={user.username} />
                            <AvatarFallback className="bg-muted text-xs">
                              {user.username?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium text-white truncate">
                            {user.username || "Unknown"}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-3 border-r border-white/5 text-right">
                        <span className="text-sm font-medium text-white tabular-nums">
                          ${formatDollarAmount(user.wagered || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                      {leaderboard.props?.weighted && (
                        <td className="py-2 px-3 border-r border-white/5 text-right">
                          <span className="text-sm font-medium text-white tabular-nums">
                            ${formatDollarAmount(user.props?.weighted || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </td>
                      )}
                      <td className="py-2 px-3 text-right">
                        {prize ? (
                          <span className="text-sm font-semibold text-green-400 tabular-nums">
                            ${prize.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

