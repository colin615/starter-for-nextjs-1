"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, Pencil, ArrowUpDown, ChevronDown, RefreshCw } from "lucide-react";
import Countdown from "react-countdown";
import { motion, AnimatePresence, cubicBezier } from "framer-motion";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, Users, Target } from "lucide-react";
import { ComposedChart, Bar, Area, XAxis, YAxis, CartesianGrid, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { getDiceBearAvatarUrl } from "@/utils/avatarUtils";
import { formatDollarAmount } from "@/utils/dashboardUtils";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import LogoText from "@/components/svgs/logo-text";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const AnimatedNumber = ({ value }) => {
  return (
    <motion.span
      key={value}
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: cubicBezier(0.2, 1, 0.24, 1) }}
    >
      {value}
    </motion.span>
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

// Format prize amount professionally
const formatPrize = (amount) => {
  if (!amount || amount === 0) return null;
  
  // Format with Intl.NumberFormat for professional currency display
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const LeaderboardDataTable = ({ users, prizeAmounts, showWeighted }) => {
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = useMemo(() => {
    const cols = [
      {
        accessorKey: "rank",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2 lg:px-3"
            >
              Rank
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const rank = row.getValue("rank");
          return (
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white tabular-nums min-w-[28px]">
                {rank}
              </span>
              {rank <= 3 && (
                <span className="text-base">
                  {rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "username",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2 lg:px-3"
            >
              Player
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const user = row.original;
          const index = row.index;
          const avatarUrl = getDiceBearAvatarUrl(
            user.userId || user.user_id || `user-${index}`
          );
          return (
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
          );
        },
      },
      {
        accessorKey: "wagered",
        header: ({ column }) => {
          return (
            <div className="text-right">
              <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className="h-8 px-2 lg:px-3"
              >
                Wagered
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </div>
          );
        },
        cell: ({ row }) => {
          const amount = parseFloat(row.getValue("wagered") || 0);
          const formatted = formatPrize(amount);
          return (
            <div className="text-right">
              <span className="text-sm font-medium text-white tabular-nums">
                {formatted || "$0.00"}
              </span>
            </div>
          );
        },
      },
    ];

    if (showWeighted) {
      cols.push({
        accessorKey: "weighted",
        header: ({ column }) => {
          return (
            <div className="text-right">
              <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className="h-8 px-2 lg:px-3"
              >
                Weighted
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </div>
          );
        },
        cell: ({ row }) => {
          const user = row.original;
          const amount = parseFloat(
            user.props?.weighted || user.weighted || 0
          );
          const formatted = formatPrize(amount);
          return (
            <div className="text-right">
              <span className="text-sm font-medium text-white tabular-nums">
                {formatted || "$0.00"}
              </span>
            </div>
          );
        },
      });
    }

    cols.push({
      accessorKey: "prize",
      header: ({ column }) => {
        return (
          <div className="text-right">
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2 lg:px-3"
            >
              Prize
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );
      },
      cell: ({ row }) => {
        const user = row.original;
        const prize = user.prize || (prizeAmounts?.[user.rank - 1] || null);
        const formatted = formatPrize(prize);
        
        return (
          <div className="text-right">
            {formatted ? (
              <span className="text-sm font-semibold text-green-400 tabular-nums">
                {formatted}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </div>
        );
      },
    });

    return cols;
  }, [prizeAmounts, showWeighted]);

  const tableData = useMemo(() => {
    return users.map((user, index) => ({
      ...user,
      rank: user.rank || index + 1,
      wagered: user.wagered || 0,
      weighted: user.props?.weighted || user.weighted || 0,
      prize: user.prize || (prizeAmounts?.[user.rank - 1] || null),
    }));
  }, [users, prizeAmounts]);

  const table = useReactTable({
    data: tableData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnId, filterValue) => {
      const user = row.original;
      const searchValue = filterValue.toLowerCase();
      return (
        user.username?.toLowerCase().includes(searchValue) ||
        user.userId?.toLowerCase().includes(searchValue) ||
        user.user_id?.toLowerCase().includes(searchValue) ||
        false
      );
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
    initialState: {
      sorting: [{ id: "rank", desc: false }],
      pagination: {
        pageSize: 25,
      },
    },
  });

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search players..."
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="rounded-sm border border-white/10 bg-[#141519] overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow 
                key={headerGroup.id}
                className="bg-[#16181D] border-b border-white/10 hover:bg-[#16181D]"
              >
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead 
                      key={header.id}
                      className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index) => {
                const isEven = index % 2 === 0;
                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={`border-b border-white/5 transition-colors ${
                      isEven ? "bg-[#141519]" : "bg-[#16181D]"
                    } hover:bg-[#1a1c20]`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-3 px-4">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getAllColumns().length}
                  className="h-24 text-center"
                >
                  <div className="flex flex-col items-center justify-center py-8">
                    <span className="text-muted-foreground text-sm">
                      No participants yet
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-muted-foreground flex-1 text-sm">
          Showing {table.getRowModel().rows.length} of {table.getFilteredRowModel().rows.length} participant(s)
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
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
  const [visibleSeries, setVisibleSeries] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('leaderboard-visible-series');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to load visible series from localStorage:", e);
        }
      }
    }
    return {
      wagered: true,
      weighted: false,
      users: true,
    };
  });
  const [chartData, setChartData] = useState([]);
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [playingNowCount, setPlayingNowCount] = useState(0);
  const [isLoadingPlayingNow, setIsLoadingPlayingNow] = useState(false);
  const [timePeriod, setTimePeriod] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('leaderboard-time-period');
      return saved || "leaderboard_start";
    }
    return "leaderboard_start";
  });
  const [granularity, setGranularity] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('leaderboard-granularity');
      return saved || "hour";
    }
    return "hour";
  });

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

  const calculateDateRange = (period, leaderboardStartDate) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let startDate, endDate;

    switch (period) {
      case "today":
        startDate = today;
        endDate = now;
        break;
      case "yesterday":
        startDate = yesterday;
        endDate = new Date(yesterday);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "24hours":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case "last_7_days":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case "last_30_days":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case "week_to_date":
        const dayOfWeek = today.getDay();
        startDate = new Date(today);
        startDate.setDate(today.getDate() - dayOfWeek);
        endDate = now;
        break;
      case "month_to_date":
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = now;
        break;
      case "leaderboard_start":
      default:
        startDate = leaderboardStartDate ? new Date(leaderboardStartDate) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
    }

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
  };

  const fetchChartData = async (leaderboardData) => {
    if (!leaderboardData?.start_date || !leaderboardData?.end_date) {
      return;
    }

    setIsLoadingChart(true);
    try {
      const leaderboardStartDate = leaderboardData.start_date || leaderboardData.startDate;
      const { startDate, endDate } = calculateDateRange(timePeriod, leaderboardStartDate);
      
      const queryParams = new URLSearchParams({
        startDate,
        endDate,
        granularity,
      });

      const response = await fetch(`/api/leaderboards/${params.id}/stats?${queryParams.toString()}`);
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

  const fetchPlayingNow = async () => {
    setIsLoadingPlayingNow(true);
    try {
      // Get the last hour's data
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 62 * 60 * 1000);
      const startDate = oneHourAgo.toISOString();
      const endDate = now.toISOString();

      const queryParams = new URLSearchParams({
        startDate,
        endDate,
        granularity: 'hour',
      });

      const response = await fetch(`/api/leaderboards/${params.id}/stats?${queryParams.toString()}`);
      const data = await response.json();
      
      if (data.success && data.chartData && data.chartData.length > 0) {
        // Sum up all unique players in the last hour
        const totalPlayers = data.chartData.reduce((sum, item) => {
          return sum + (item.users || 0);
        }, 0);
        setPlayingNowCount(totalPlayers);
      } else {
        setPlayingNowCount(0);
      }
    } catch (error) {
      console.error("Error fetching playing now:", error);
      setPlayingNowCount(0);
    } finally {
      setIsLoadingPlayingNow(false);
    }
  };

  // Calculate if leaderboard start is less than a week ago (must be before conditional returns)
  const isLeaderboardStartLessThanWeek = useMemo(() => {
    if (!leaderboard) return false;
    const startDate = leaderboard.startDate || leaderboard.start_date;
    if (!startDate) return false;
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = Math.abs(now - start);
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays < 7;
  }, [leaderboard]);

  useEffect(() => {
    if (leaderboard) {
      fetchChartData(leaderboard);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timePeriod, granularity]);

  // Fetch playing now count on mount only
  useEffect(() => {
    if (leaderboard) {
      fetchPlayingNow();
    }
  }, [leaderboard]);

  // Save time period to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('leaderboard-time-period', timePeriod);
    }
  }, [timePeriod]);

  // Save granularity to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('leaderboard-granularity', granularity);
    }
  }, [granularity]);

  // Save visible series to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('leaderboard-visible-series', JSON.stringify(visibleSeries));
    }
  }, [visibleSeries]);

  // Set initial granularity for leaderboard_start based on date
  useEffect(() => {
    if (leaderboard && timePeriod === "leaderboard_start") {
      const start = leaderboard.start_date || leaderboard.startDate;
      if (start) {
        const startDate = new Date(start);
        const now = new Date();
        const diffTime = Math.abs(now - startDate);
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        if (diffDays >= 7) {
          setGranularity("day");
        } else {
          setGranularity("hour");
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaderboard, timePeriod]);

  // Check if leaderboard has weighted data
  const hasWeightedData = useMemo(() => {
    // First check if chartData has weighted values
    if (chartData && chartData.length > 0) {
      return chartData.some(item => (item.weighted || 0) > 0);
    }
    // If no chart data yet but leaderboard has weighted prop, return true
    if (!isLoadingChart && leaderboard?.props?.weighted) {
      return true;
    }
    return false;
  }, [chartData, leaderboard, isLoadingChart]);

  // Check if we're still determining weighted data (show skeleton)
  const isDeterminingWeighted = useMemo(() => {
    return isLoadingChart && !hasWeightedData && !leaderboard?.props?.weighted;
  }, [isLoadingChart, hasWeightedData, leaderboard]);
  
  // Calculate total weighted from chart data
  const totalWeighted = useMemo(() => {
    if (!chartData || chartData.length === 0) return 0;
    return chartData.reduce((sum, item) => sum + (item.weighted || 0), 0);
  }, [chartData]);

  // Transform chart data based on visible series for proper stacking
  const transformedChartData = useMemo(() => {
    if (!chartData || chartData.length === 0) return [];
    
    const showWagered = visibleSeries.wagered;
    const showWeighted = visibleSeries.weighted;
    
    // If both wagered and weighted are shown, we stack them
    // If only one is shown, show it at full height
    if (showWagered && showWeighted) {
      // Both selected: stack them (weighted + difference)
      return chartData.map((item) => {
        const weighted = item.weighted || 0;
        const difference = (item.wagered || 0) - weighted;
        
        return {
          ...item,
          weighted,
          difference: Math.max(0, difference),
        };
      });
    } else if (showWagered && !showWeighted) {
      // Only wagered: show it full height
      return chartData.map((item) => ({
        ...item,
        weighted: 0,
        difference: item.wagered || 0,
      }));
    } else if (!showWagered && showWeighted) {
      // Only weighted: show it full height
      return chartData.map((item) => ({
        ...item,
        weighted: item.weighted || 0,
        difference: 0,
      }));
    } else {
      // Neither selected
      return chartData.map((item) => ({
        ...item,
        weighted: 0,
        difference: 0,
      }));
    }
  }, [chartData, visibleSeries.wagered, visibleSeries.weighted]);

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
              The leaderboard you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
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

      {/* Chart Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Time Period Selector */}
            <Select
              value={timePeriod}
              onValueChange={(value) => {
                setTimePeriod(value);
                // Auto-set granularity based on time period
                if (value === "today" || value === "yesterday" || value === "24hours") {
                  setGranularity("hour");
                } else if (value === "last_30_days") {
                  setGranularity("day");
                } else if (value === "leaderboard_start") {
                  // If leaderboard start is more than a week, set to daily
                  if (!isLeaderboardStartLessThanWeek) {
                    setGranularity("day");
                  } else {
                    setGranularity("hour");
                  }
                }
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="24hours">24 hours</SelectItem>
                <SelectItem value="last_7_days">Last 7 days</SelectItem>
                <SelectItem value="last_30_days">Last 30 days</SelectItem>
                <SelectItem value="week_to_date">Week to date</SelectItem>
                <SelectItem value="month_to_date">Month to date</SelectItem>
                <SelectItem value="leaderboard_start">Leaderboard Start</SelectItem>
              </SelectContent>
            </Select>

            {/* Granularity Selector */}
            <Select
              value={granularity}
              onValueChange={setGranularity}
              disabled={
                timePeriod === "today" ||
                timePeriod === "yesterday" ||
                timePeriod === "24hours" ||
                timePeriod === "last_30_days" ||
                (timePeriod === "leaderboard_start" && !isLeaderboardStartLessThanWeek)
              }
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem 
                  value="hour" 
                  disabled={
                    timePeriod === "last_30_days" ||
                    (timePeriod === "leaderboard_start" && !isLeaderboardStartLessThanWeek)
                  }
                >
                  Hourly
                </SelectItem>
                <SelectItem value="day">Daily</SelectItem>
              </SelectContent>
            </Select>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (leaderboard) {
                  fetchChartData(leaderboard);
                }
              }}
              className="h-9"
              title="Refresh chart data"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      
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

            {/* Weighted Stat Box - Show skeleton while determining, then show/hide based on data */}
            {isDeterminingWeighted ? (
              <div className="relative z-30 flex flex-1 flex-col justify-center gap-0.5 border-t px-4 py-3 text-left even:border-l sm:border-t-0 sm:border-l sm:px-6 sm:py-4 min-w-0">
                <Skeleton className="h-3 w-20 mb-1" />
                <Skeleton className="h-8 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            ) : hasWeightedData && (
              <button
                data-active={visibleSeries.weighted}
                className="data-[active=true]:bg-muted/50 relative z-30 flex flex-1 flex-col justify-center gap-0.5 border-t px-4 py-3 text-left even:border-l sm:border-t-0 sm:border-l sm:px-6 sm:py-4 min-w-0"
                onClick={() => toggleSeries('weighted')}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={visibleSeries.weighted}
                    onChange={() => toggleSeries('weighted')}
                    onClick={(e) => e.stopPropagation()}
                    className="w-3.5 h-3.5 rounded border-gray-600 accent-[#5DB82F] focus:ring-[#5DB82F] focus:ring-offset-0 cursor-pointer flex-shrink-0"
                  />
                  <span className="text-muted-foreground text-xs font-normal">
                    Weighted
                  </span>
                </div>
                <span className="text-base leading-tight font-semibold sm:text-2xl">
                  ${formatDollarAmount(totalWeighted).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-muted-foreground font-normal">
                  +0.00%
                </span>
              </button>
            )}

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
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs font-normal">
                  Playing Now
                </span>
                {playingNowCount > 0 && (
                  <span 
                    className="relative flex h-2 w-2 items-center justify-center"
                  >
                    <span 
                      className="absolute h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: '#3B82F6',
                      }}
                    />
                    <span 
                      className="absolute h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: '#3B82F6',
                        opacity: 0.6,
                        animation: 'pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                      }}
                    />
                  </span>
                )}
              </div>
              <span className="text-base leading-tight font-semibold sm:text-2xl flex items-center">
                <AnimatedNumber value={playingNowCount.toLocaleString()} />
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
                data={transformedChartData}
                margin={{ top: 5, right: 12, left: 12, bottom: 0 }}
                onMouseLeave={() => setHoveredIndex(null)}
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
                  minTickGap={granularity === "day" ? 24 : 32}
                  angle={granularity === "hour" ? -45 : 0}
                  textAnchor={granularity === "hour" ? "end" : "middle"}
                  height={granularity === "hour" ? 60 : 30}
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
                  domain={[0, 'dataMax + 5']}
                />
                <ChartTooltip
                  cursor={false}
                  content={({ active, payload, label }) => {
                    if (!active || !payload || payload.length === 0) {
                      setHoveredIndex(null);
                      return null;
                    }
                    
                    const data = payload[0].payload;
                    const wagered = data.wagered || 0;
                    const weighted = data.weighted || 0;
                    const users = data.users || 0;
                    
                    // Set hovered index based on payload index
                    const dataIndex = chartData.findIndex(item => item.displayDate === label);
                    if (dataIndex !== -1) {
                      setHoveredIndex(dataIndex);
                    }
                    
                    return (
                      <div className="border-border/50 bg-background grid min-w-[8rem] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl">
                        <div className="font-medium">{label}</div>
                        <div className="grid gap-1.5">
                          {visibleSeries.wagered && (
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: '#A8F573' }} />
                                <span className="text-muted-foreground">Wagered</span>
                              </div>
                              <span className="text-foreground font-mono font-medium tabular-nums">
                                ${formatDollarAmount(wagered).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          )}
                          {visibleSeries.weighted && hasWeightedData && (
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: '#5DB82F' }} />
                                <span className="text-muted-foreground">Weighted</span>
                              </div>
                              <span className="text-foreground font-mono font-medium tabular-nums">
                                ${formatDollarAmount(weighted).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          )}
                          {visibleSeries.users && (
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: '#3B82F6' }} />
                                <span className="text-muted-foreground">Users</span>
                              </div>
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
                  radius={visibleSeries.weighted && visibleSeries.wagered ? [0, 0, 4, 4] : [4, 4, 4, 4]}
                  opacity={(visibleSeries.wagered || visibleSeries.weighted) ? 1 : 0}
                >
                  {transformedChartData.map((entry, index) => (
                    <Cell
                      key={`cell-weighted-${index}`}
                      fill="#5DB82F"
                      opacity={
                        (visibleSeries.wagered || visibleSeries.weighted)
                          ? hoveredIndex === null || hoveredIndex === index
                            ? 1
                            : 0.2
                          : 0
                      }
                      style={{
                        transition: "opacity 0.2s ease-in-out",
                      }}
                    />
                  ))}
                </Bar>
                <Bar
                  yAxisId="left"
                  dataKey="difference"
                  stackId="a"
                  fill="#A8F573"
                  radius={visibleSeries.weighted && visibleSeries.wagered ? [4, 4, 0, 0] : [4, 4, 4, 4]}
                  opacity={(visibleSeries.wagered || visibleSeries.weighted) ? 1 : 0}
                >
                  {transformedChartData.map((entry, index) => (
                    <Cell
                      key={`cell-difference-${index}`}
                      fill="#A8F573"
                      opacity={
                        (visibleSeries.wagered || visibleSeries.weighted)
                          ? hoveredIndex === null || hoveredIndex === index
                            ? 1
                            : 0.2
                          : 0
                      }
                      style={{
                        transition: "opacity 0.2s ease-in-out",
                      }}
                    />
                  ))}
                </Bar>
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="users"
                  fill="url(#usersGradient)"
                  fillOpacity={
                    visibleSeries.users
                      ? hoveredIndex === null
                        ? 0.4
                        : 0.1
                      : 0
                  }
                  stroke="#3B82F6"
                  strokeWidth={2}
                  opacity={
                    visibleSeries.users
                      ? hoveredIndex === null
                        ? 1
                        : 0.3
                      : 0
                  }
                  isAnimationActive={false}
                  style={{
                    transition: "opacity 0.2s ease-in-out",
                  }}
                />
              </ComposedChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Leaderboard Table */}
      <LeaderboardDataTable 
        users={users} 
        prizeAmounts={prizeAmounts} 
        showWeighted={!!leaderboard.props?.weighted} 
      />
    </div>
  );
}

