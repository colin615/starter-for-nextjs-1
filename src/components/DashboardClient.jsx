"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "./ui/tooltip";
import {
  Users,
  DollarSign,
  Target,
  Trophy,
  TrendingUp,
  Filter,
  Calendar,
  ArrowLeft,
  ArrowRight,
  GripVertical,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { CountryTimezoneModal } from "./CountryTimezoneModal";
import { CasinoFilterDropdown } from "./dashboard/CasinoFilterDropdown";
import { useTimePeriod } from "@/hooks/useTimePeriod";
import { useConnectedSites } from "@/hooks/useConnectedSites";
import { BarChart } from '@mui/x-charts/BarChart';
import { LineChart } from '@mui/x-charts/LineChart';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { supabase } from "@/lib/supabase";
import { createAvatar } from '@dicebear/core';
import { adventurerNeutral } from '@dicebear/collection';

// Create dark theme for MUI charts
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#09090b',
      paper: '#18181b',
    },
    text: {
      primary: '#ffffff',
      secondary: '#a1a1aa',
    },
  },
  typography: {
    fontFamily: 'Montserrat, sans-serif',
  },
});

// Helper function to get JWT from Supabase session
const getJWT = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
};

// SortableCard component
function SortableCard({ id, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {children(listeners)}
    </div>
  );
}

// Mini Area Chart component for user wagering preview
function MiniWagerChart({ chartData }) {
  const [isHovered, setIsHovered] = useState(false);

  // Extract data directly from chartData - it already has date and wagered
  const data = chartData && chartData.length > 0
    ? chartData.map(item => item.wagered || 0)
    : new Array(7).fill(0);
  const xAxisData = data.map((_, index) => index);

  // Calculate min/max for scaling
  const minValue = Math.min(...data);
  const maxValue = Math.max(...data);
  const paddingFactor = 0.5; // 30% padding on top and bottom

  let yMin, yMax;

  if (minValue === maxValue) {
    // If all values are the same, center the chart with padding
    const padding = Math.max(minValue * paddingFactor, minValue * 0.1); // At least 10% padding
    yMin = Math.max(0, minValue - padding);
    yMax = minValue + padding;
  } else {
    // Normal case: add padding around the range
    const range = maxValue - minValue;
    const padding = range * paddingFactor;
    yMin = Math.max(0, minValue - padding);
    yMax = maxValue + padding;
  }

  // Get dates for tooltip labels
  const getRelativeDateLabel = (dateString) => {
    if (!dateString) return '';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0);

    const diffTime = today - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return dateString;
  };

  const dateLabels = chartData && chartData.length > 0
    ? chartData.map(item => getRelativeDateLabel(item.date))
    : xAxisData.map((_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      return getRelativeDateLabel(date.toISOString().split('T')[0]);
    });

  // Debug logging
  console.log('MiniWagerChart - chartData:', chartData);
  console.log('MiniWagerChart - data:', data);
  console.log('MiniWagerChart - dateLabels:', dateLabels);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: 350,
        height: 40,
        marginLeft: -70,
        WebkitMaskImage: isHovered ? 'none' : 'linear-gradient(to right, black 0px, black 280px, transparent 320px)',
        maskImage: isHovered ? 'none' : 'linear-gradient(to right, black 0px, black 280px, transparent 320px)',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
      }}
      className="flex   z-0 brightness-75 grayscale opacity-15 hover:opacity-100 hover:brightness-100 hover:grayscale-0 transition items-center h-full left-0 absolute bottom-0 group overflow-hidden"
    >
      <ThemeProvider theme={darkTheme}>

        <LineChart
          className="z-[10]"
          style={{ marginTop: 18 }}
          xAxis={[{
            data: xAxisData,
            valueFormatter: (value) => {
              const index = xAxisData.indexOf(value);
              return dateLabels[index] || '';
            },
            disableLine: true,
            disableTicks: true,
            hideTooltip: false,
          }]}
          yAxis={[{
            min: yMin,
            max: yMax,
          }]}
          series={[
            {
              data: data,
              area: true,
              showMark: false,
              color: '#84F549',
              valueFormatter: (value) => value ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'
            },
          ]}
          width={300}
          height={100}
          padding={{ top: 10, left: 20, right: 20, bottom: 0 }}
          margin={{ left: 0, right: 0, top: 20, bottom: 15 }}
          sx={{
            '& .MuiAreaElement-root': {
              fill: 'url(#wagerGradient)',
            },
            '& .MuiLineElement-root': {
              stroke: '#84F549',
              strokeWidth: 1.5,
            },
            '& .MuiChartsAxis-line': {
              display: 'none',
            },
            '& .MuiChartsAxis-tick': {
              display: 'none',
            },
            '& .MuiChartsAxis-tickLabel': {
              display: 'none',
            },
            '& .MuiChartsTooltip-root': {
              '& .MuiChartsTooltip-table': {
                backgroundColor: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '6px',
              },
              '& .MuiChartsTooltip-cell': {
                color: '#ffffff',
                borderColor: '#27272a',
              },
              '& .MuiChartsTooltip-row': {
                color: '#a1a1aa',
              },
              '& .MuiChartsTooltip-label': {
                color: '#84F549',
                fontSize: '12px',
                fontWeight: '500',
              },
            },
          }}
          slotProps={{
            legend: { hidden: true },
          }}
          bottomAxis={null}
          disableAxisListener
        >
          <defs>
            <linearGradient id="wagerGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#84F549" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#84F549" stopOpacity={0.05} />
            </linearGradient>
          </defs>

        </LineChart>

      </ThemeProvider>
    </div>
  );
}

export function DashboardClient({ user }) {
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCasinos, setSelectedCasinos] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [hourlyVisualData, setHourlyVisualData] = useState(null);
  const [isLoadingHourly, setIsLoadingHourly] = useState(false);
  const [usersData, setUsersData] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [visibleSeries, setVisibleSeries] = useState({
    wagered: true,
    weightedWagered: true
  });

  // Sorting state with localStorage
  const [sortField, setSortField] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dashboardUserSortField') || 'wagered';
    }
    return 'wagered';
  });
  const [sortDirection, setSortDirection] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dashboardUserSortDirection') || 'desc';
    }
    return 'desc';
  });

  // Card order state - load from localStorage on mount
  const [cardOrder, setCardOrder] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboardCardOrder');
      return saved ? JSON.parse(saved) : ['users', 'wagered', 'challenges', 'leaderboards'];
    }
    return ['users', 'wagered', 'challenges', 'leaderboards'];
  });

  // Setup DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setCardOrder((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);

        // Save to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('dashboardCardOrder', JSON.stringify(newOrder));
        }

        return newOrder;
      });
    }
  };

  // Toggle series visibility
  const toggleSeries = (seriesKey) => {
    setVisibleSeries(prev => ({
      ...prev,
      [seriesKey]: !prev[seriesKey]
    }));
  };

  // Card configurations
  const cardConfigs = {
    users: {
      id: 'users',
      icon: Users,
      label: 'Total Users',
      value: (summaryData?.totalUsers || 0).toLocaleString(),
      showChange: true,
      change: '0%',
    },
    wagered: {
      id: 'wagered',
      icon: DollarSign,
      label: 'Total Wagered',
      value: `$${(summaryData?.totalWagered || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      showChange: true,
      change: '0%',
    },
    challenges: {
      id: 'challenges',
      icon: Target,
      label: 'Active Challenges',
      value: '23',
      showChange: false,
    },
    leaderboards: {
      id: 'leaderboards',
      icon: Trophy,
      label: 'Active Leaderboards',
      value: '8',
      showChange: false,
    },
  };

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12 && hour >= 4) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  // Get user's first name
  const getFirstName = (fullName) => {
    if (!fullName) return "";
    return fullName.split(" ")[0];
  };

  // Generate avatar URL based on user ID with maximum randomness
  const getAvatarUrl = (userId) => {
    // Create a hash from userId for consistent random values
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
    
    // Bold color set for backgrounds (solid colors, no gradients)
    const backgroundColors = [
      'FF6B6B', // Bright red
      '4ECDC4', // Turquoise
      '45B7D1', // Sky blue
      'FFA07A', // Light salmon
      '98D8C8', // Mint green
      'F7DC6F', // Bright yellow
      'BB8FCE', // Light purple
      '85C1E2', // Light blue
      'F8C471', // Peach
      '82E0AA', // Light green
      'F1948A', // Salmon pink
      'AED6F1', // Powder blue
      'D2B4DE', // Lavender
      'F9E79F', // Pale yellow
      '76D7C4', // Aqua
      'E8DAEF', // Light lilac
      'FAD7A0', // Apricot
      'D5DBDB', // Light gray
      'F5B7B1', // Rose
      'AED6F1', // Powder blue
      'A3E4D7', // Light cyan
      'F9E79F', // Cream
      'D5DBDB', // Silver
      'F1C40F', // Golden yellow
      'E74C3C', // Bright red
      '3498DB', // Bright blue
      '2ECC71', // Emerald green
      '9B59B6', // Purple
      'F39C12', // Orange
      '1ABC9C', // Turquoise
    ];

    // Select random bold background color
    const bgColor = backgroundColors[hash % backgroundColors.length];

    const avatar = createAvatar(adventurerNeutral, {
      seed: userId,
      size: 32,
      scale: 90 + (hash % 21), // 90-110
      radius: 0,
      backgroundColor: [bgColor],
      clip: false,
      randomizeIds: true,
      glassesProbability: 20, // 20% chance of glasses
    });
    return avatar.toDataUri();
  };

  // Format timestamp to human-readable format
  const formatLastSeen = (timestamp) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now - then;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    }
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  };

  // Get activity dot gradient based on score
  const getActivityDotStyle = (activity) => {
    if (activity < 20) {
      // Gray (white with low opacity)
      return 'bg-gradient-to-r from-gray-400/50 to-gray-500/50';
    } else if (activity < 70) {
      // Yellow-ish
      return 'bg-gradient-to-r from-yellow-400/60 to-amber-500/60';
    } else {
      // Green
      return 'bg-gradient-to-r from-green-400 to-emerald-500';
    }
  };

  // Use custom hooks
  const {
    selectedTimePeriod,
    handleTimePeriodChange
  } = useTimePeriod();

  const {
    linkedServices
  } = useConnectedSites();

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

  // Keyboard shortcut for filter (R key)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'r' || event.key === 'R') {
        // Don't trigger if user is typing in an input
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.contentEditable === 'true') {
          return;
        }
        event.preventDefault();
        setIsFilterOpen(prev => !prev);
      }

      // Close filter on Escape key
      if (event.key === 'Escape') {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleTimezoneSave = (timezone) => {
    setSelectedTimezone(timezone);
  };

  const onTimePeriodChange = (value) => {
    handleTimePeriodChange(value);
  };

  const handleCasinoFilter = (casinos) => {
    setSelectedCasinos(casinos);
  };

  const handleClearFilters = () => {
    setSelectedCasinos([]);
  };

  // Fetch visualize data for hourly chart (last 12 hours)
  const handleFetchVisualizeData = async () => {
    if (!user?.id) return;

    try {
      setIsLoadingHourly(true);

      // Get cached JWT token
      const jwt = await getJWT();

      // Calculate date range for last 12 hours
      const endDate = new Date();
      const startDate = new Date();
      startDate.setHours(startDate.getHours() - 12);

      // Prepare request body with mode: "visualize" and granularity: "hour"
      const requestBody = {
        userId: user.id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        jwt: jwt,
        mode: "visualize",
        granularity: "hour"
      };

      // Make POST request
      const response = await fetch("https://lxdpznxcdkhiqlwhbhwf.supabase.co/functions/v1/aggregate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${jwt}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log("Hourly visualize data:", data);
      console.log("chartData length:", data.chartData?.length);

      if (data.success && data.chartData && data.chartData.length > 0) {
        // Map chartData to timeSeries for consistency
        const visualData = {
          ...data,
          timeSeries: data.chartData
        };
        console.log("Setting hourlyVisualData:", visualData);
        setHourlyVisualData(visualData);
      } else {
        console.log("No chartData or empty array - data:", data);
        console.log("Setting hourlyVisualData to null");
        setHourlyVisualData(null);
      }
    } catch (error) {
      console.error("Error fetching visualize data:", error);
    } finally {
      setIsLoadingHourly(false);
    }
  };

  // Debug users - fetch API with mode: "users"
  const handleDebugUsers = async () => {
    if (!user?.id) return;

    try {
      setIsLoadingHourly(true);

      // Get cached JWT token
      const jwt = await getJWT();

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7); // Last 7 days
      endDate.setDate(endDate.getDate() + 1);

      // Prepare request body with mode: "users"
      const requestBody = {
        userId: user.id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        jwt: jwt,
        mode: "users"
      };

      // Make POST request
      const response = await fetch("https://lxdpznxcdkhiqlwhbhwf.supabase.co/functions/v1/aggregate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${jwt}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error("Error fetching users data:", error);
    } finally {
      setIsLoadingHourly(false);
    }
  };

  // Fetch summary data automatically
  const fetchSummaryData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoadingSummary(true);

      // Get cached JWT token
      const jwt = await getJWT();

      // Calculate date range for the current period
      const endDate = new Date();
      const startDate = new Date();

      // Adjust start date based on selected time period
      if (selectedTimePeriod === '1d') {
        startDate.setDate(startDate.getDate() - 1);
      } else if (selectedTimePeriod === '1w') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (selectedTimePeriod === '2w') {
        startDate.setDate(startDate.getDate() - 14);
      } else if (selectedTimePeriod === '30d') {
        startDate.setDate(startDate.getDate() - 30);
      }

      // Prepare request body
      const requestBody = {
        mode: "summary",
        userId: user.id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        granularity: "daily",
        jwt: jwt
      };

      // Make POST request
      const response = await fetch("https://lxdpznxcdkhiqlwhbhwf.supabase.co/functions/v1/aggregate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${jwt}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log("Summary data fetched:", data);

      if (data.success && data.summary) {
        setSummaryData(data.summary);
      }
    } catch (error) {
      console.error("Error fetching summary data:", error);
    } finally {
      setIsLoadingSummary(false);
    }
  }, [user?.id, selectedTimePeriod]);

  // Fetch users data automatically
  const fetchUsersData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoadingUsers(true);

      // Get cached JWT token
      const jwt = await getJWT();

      // Calculate date range for the current period
      const endDate = new Date();
      const startDate = new Date();

      // Adjust start date based on selected time period
      if (selectedTimePeriod === '1d') {
        startDate.setDate(startDate.getDate() - 1);
      } else if (selectedTimePeriod === '1w') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (selectedTimePeriod === '2w') {
        startDate.setDate(startDate.getDate() - 14);
      } else if (selectedTimePeriod === '30d') {
        startDate.setDate(startDate.getDate() - 30);
      }

      // Prepare request body with mode: "users"
      const requestBody = {
        userId: user.id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        jwt: jwt,
        mode: "users",
        granularity: "daily"
      };

      // Make POST request
      const response = await fetch("https://lxdpznxcdkhiqlwhbhwf.supabase.co/functions/v1/aggregate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${jwt}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log("Users data fetched:", data);

      if (data.success && data.users) {
        setUsersData(data.users);
      }
    } catch (error) {
      console.error("Error fetching users data:", error);
    } finally {
      setIsLoadingUsers(false);
    }
  }, [user?.id, selectedTimePeriod]);

  // Auto-fetch summary data on mount and when time period changes
  useEffect(() => {
    fetchSummaryData();
  }, [fetchSummaryData]);

  // Auto-fetch users data on mount and when time period changes
  useEffect(() => {
    fetchUsersData();
  }, [fetchUsersData]);

  // Auto-fetch daily visualize data on mount
  useEffect(() => {
    if (user?.id) {
      handleFetchVisualizeData();
    }
  }, [user?.id]);

  const hasActiveFilters = selectedCasinos.length > 0;

  // Sort handler
  const handleSort = (field) => {
    let newDirection = 'desc';

    if (field === sortField) {
      newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    }

    setSortField(field);
    setSortDirection(newDirection);

    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboardUserSortField', field);
      localStorage.setItem('dashboardUserSortDirection', newDirection);
    }
  };

  // Get sorted users list
  const getSortedUsersList = (users) => {
    const sorted = [...users].sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case 'username':
          aValue = a.username.toLowerCase();
          bValue = b.username.toLowerCase();
          return sortDirection === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        case 'activityScore':
          aValue = a.activityScore || 0;
          bValue = b.activityScore || 0;
          break;
        case 'wagered':
          aValue = a.wagered || 0;
          bValue = b.wagered || 0;
          break;
        case 'weightedWagered':
          aValue = a.weightedWagered || 0;
          bValue = b.weightedWagered || 0;
          break;
        case 'lastSeen':
          aValue = new Date(a.lastSeen).getTime();
          bValue = new Date(b.lastSeen).getTime();
          break;
        default:
          aValue = a.wagered || 0;
          bValue = b.wagered || 0;
      }

      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return sorted;
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light">
            {getGreeting()}{user?.name ? `, ${getFirstName(user.name)}` : ""}
          </h1>
          <p className="text-muted-foreground mt-1.5">{`Here's your wager performance overview.`}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              data-shortcut="filter"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`h-9 transition-all duration-200 hover:scale-[1.02] ${hasActiveFilters
                  ? "border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 shadow-sm"
                  : "hover:border-border/60"
                } ${isFilterOpen ? "bg-muted/30" : ""}`}
            >
              <Filter className={`h-4 w-4 mr-2 transition-transform duration-200 ${isFilterOpen ? "rotate-180" : ""}`} />
              Filter
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2 text-xs bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 transition-colors">
                  {selectedCasinos.length}
                </Badge>
              )}
              {!hasActiveFilters && (
                <Badge variant="secondary" className="ml-2 text-xs bg-muted/50 text-muted-foreground">
                  R
                </Badge>
              )}
            </Button>

            <CasinoFilterDropdown
              isOpen={isFilterOpen}
              onClose={() => setIsFilterOpen(false)}
              linkedServices={linkedServices}
              selectedCasinos={selectedCasinos}
              onCasinoSelect={handleCasinoFilter}
              onClearFilters={handleClearFilters}
            />
          </div>
          <Button variant="outline" size="sm" className="h-9">
            <Calendar className="h-4 w-4" />
          </Button>
          <Select value={selectedTimePeriod} onValueChange={onTimePeriodChange}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24 hours</SelectItem>
              <SelectItem value="1w">Last 7 days</SelectItem>
              <SelectItem value="2w">Last 14 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" className="h-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-9">
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={handleDebugUsers}
            disabled={isLoadingHourly}
          >
            <Download className="h-4 w-4 mr-2" />
            {isLoadingHourly ? "Loading..." : "Debug Users"}
          </Button>
        </div>
      </div>


      {/* Quick Stats - Draggable */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToWindowEdges]}
      >
        <SortableContext items={cardOrder} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {cardOrder.map((cardId) => {
              const config = cardConfigs[cardId];
              const Icon = config.icon;

              return (
                <SortableCard key={cardId} id={cardId}>
                  {(listeners) => (
                    <Card>
                      <CardContent className="p-4 relative">
                        <div className="space-y-3 z-10 relative">
                          {/* Header with icon, label, and drag handle */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-muted-foreground/50" />
                              <span className="text-sm text-muted-foreground">{config.label}</span>
                            </div>
                            <div
                              {...listeners}
                              className="cursor-grab active:cursor-grabbing hover:bg-muted/40 rounded p-1 transition-colors"
                            >
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>

                          {/* Main value and change indicator */}
                          <div className="flex items-center justify-between">
                            {isLoadingSummary && (cardId === 'users' || cardId === 'wagered') ? (
                              <Skeleton className="h-8 w-16" />
                            ) : (
                              <span className="text-2xl font-[600]">{config.value}</span>
                            )}
                            {config.showChange && (
                              <div className="flex items-center gap-1 bg-green-500/10 text-green-600 px-2 py-1 rounded-md">
                                <TrendingUp className="h-3 w-3" />
                                <span className="text-xs font-medium">{config.change}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </SortableCard>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>


      {/* Daily/Hourly Wagered Chart */}
      {hourlyVisualData && (
        <Card>
          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <div>
                {(() => {
                  // Determine if we have hourly data (same logic as in chart)
                  const checkIsHourly = () => {
                    if (hourlyVisualData.granularity === 'hour') return true;
                    if (hourlyVisualData.timeSeries && hourlyVisualData.timeSeries.length > 10) return true;
                    if (hourlyVisualData.timeSeries && hourlyVisualData.timeSeries.length >= 2) {
                      const first = new Date(hourlyVisualData.timeSeries[0].timestamp);
                      const second = new Date(hourlyVisualData.timeSeries[1].timestamp);
                      const diffHours = Math.abs(second - first) / (1000 * 60 * 60);
                      if (diffHours < 2) return true;
                    }
                    return false;
                  };
                  const isHourly = checkIsHourly();
                  
                  return isHourly ? (
                    <>
                      <CardTitle>Hourly Wagered</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1.5">
                        Today • Total Weighted: ${hourlyVisualData.summary?.totalWeightedWagered?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'} • {hourlyVisualData.chartData?.length || hourlyVisualData.timeSeries?.length || 0} hours
                      </p>
                    </>
                  ) : (
                    <>
                      <CardTitle>Daily Wagered</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1.5">
                        Last 30 days • Total Weighted: ${hourlyVisualData.summary?.totalWeightedWagered?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'} • {hourlyVisualData.chartData?.length || hourlyVisualData.timeSeries?.length || 0} data points
                      </p>
                    </>
                  );
                })()}
              </div>

              {/* Custom Legend with Checkboxes - Top Right */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={visibleSeries.wagered}
                    onChange={() => toggleSeries('wagered')}
                    className="w-4 h-4 rounded border-gray-600 accent-[#84F549] focus:ring-[#84F549] focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-white transition-colors">
                    <span className="w-3 h-3 rounded bg-[#84F549]"></span>
                    Wagered
                  </span>
                </label>

                {hourlyVisualData.timeSeries?.some(item => item.weightedWagered && item.weightedWagered !== item.wagered) && (
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={visibleSeries.weightedWagered}
                      onChange={() => toggleSeries('weightedWagered')}
                      className="w-4 h-4 rounded border-gray-600 accent-[#84F549] focus:ring-[#84F549] focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-white transition-colors">
                      <span className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(132, 245, 73, 0.25)' }}></span>
                      Weighted Wagered
                    </span>
                  </label>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingHourly ? (
              <div className="h-[200px] flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <ThemeProvider theme={darkTheme}>
                {(() => {
                  // Determine if we have hourly data by checking granularity and timestamp differences
                  const checkIsHourly = () => {
                    // First check if granularity is explicitly set
                    if (hourlyVisualData.granularity === 'hour') return true;
                    
                    // Check if we have enough data points to be hourly
                    if (hourlyVisualData.timeSeries && hourlyVisualData.timeSeries.length > 10) return true;
                    
                    // Check time difference between first two timestamps (should be ~1 hour for hourly data)
                    if (hourlyVisualData.timeSeries && hourlyVisualData.timeSeries.length >= 2) {
                      const first = new Date(hourlyVisualData.timeSeries[0].timestamp);
                      const second = new Date(hourlyVisualData.timeSeries[1].timestamp);
                      const diffHours = Math.abs(second - first) / (1000 * 60 * 60);
                      // If time difference is less than 2 hours between consecutive points, it's hourly
                      if (diffHours < 2) return true;
                    }
                    
                    return false;
                  };
                  
                  const isHourly = checkIsHourly();
                  
                  const chartDataset = hourlyVisualData.timeSeries?.map(item => {
                    const timestamp = new Date(item.timestamp);
                    
                    let dateLabel;
                    if (isHourly) {
                      // Format as hour for hourly data (e.g., "8 AM", "9 PM")
                      dateLabel = timestamp.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                    } else {
                      // Format as date for daily/weekly data
                      dateLabel = timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    }
                    
                    return {
                      date: dateLabel,
                      wagered: item.wagered || 0,
                      weightedWagered: item.weightedWagered || 0,
                    };
                  }) || [];

                  console.log("Chart dataset:", chartDataset);
                  console.log("hourlyVisualData:", hourlyVisualData);
                  console.log("timeSeries:", hourlyVisualData.timeSeries);
                  console.log("isHourly:", isHourly);

                  return (
                    <BarChart
                      dataset={chartDataset}
                      xAxis={[{
                        scaleType: 'band',
                        dataKey: 'date',
                        tickLabelStyle: {
                          angle: isHourly ? -45 : 0,
                          textAnchor: isHourly ? 'end' : 'middle',
                          fontSize: 12,
                          fill: 'white',
                        },
                        tickNumber: undefined, // Show all data points
                      }]}
                      series={[
                        ...(visibleSeries.wagered ? [{
                          dataKey: 'wagered',
                          label: 'Wagered',
                          color: '#84F549',
                          valueFormatter: (value) => value ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'
                        }] : []),
                        ...(visibleSeries.weightedWagered && hourlyVisualData.timeSeries?.some(item => item.weightedWagered !== undefined && item.weightedWagered !== item.wagered) ? [{
                          dataKey: 'weightedWagered',
                          label: 'Weighted Wagered',
                          color: 'rgba(132, 245, 73, 0.25)',
                          valueFormatter: (value) => value ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'
                        }] : [])
                      ]}
                      height={200}
                      yAxis={[{
                        tickLabelStyle: {
                          fontSize: 12,
                          fill: 'white',
                        }
                      }]}
                      margin={{ left: 0, right: 10, top: 10, bottom: isHourly ? 40 : 20 }}
                      slotProps={{
                        legend: {
                          hidden: true
                        }
                      }}
                      sx={{
                        '& .MuiChartsAxis-line': {
                          stroke: '#FFFFFF78',
                        },
                        '& .MuiChartsAxis-tick': {
                          stroke: '#FFFFFF78',
                        },
                      }}
                    />
                  );
                })()}
              </ThemeProvider>
            )}
          </CardContent>
        </Card>
      )}

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Users</CardTitle>
          <p className="text-sm text-muted-foreground mt-1.5">
            Users who have wagered in the selected time period • {usersData.length} users
          </p>
        </CardHeader>
        <CardContent>
          {isLoadingUsers ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : usersData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No users found in the selected time period
            </div>
          ) : (
            <div className="h-[600px] overflow-auto border border-border rounded-md">
              <table className="w-full">
                <thead className="sticky top-0 bg-[#101114] backdrop-blur-sm border-b border-border z-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground w-[30%]">
                      <button
                        onClick={() => handleSort('username')}
                        className="flex items-center gap-1 hover:text-foreground transition-colors group"
                      >
                        Username
                        {sortField === 'username' ? (
                          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                        )}
                      </button>
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground w-[10%]">
                      <button
                        onClick={() => handleSort('activityScore')}
                        className="flex items-center gap-1 mx-auto hover:text-foreground transition-colors group"
                      >
                        Activity
                        {sortField === 'activityScore' ? (
                          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                        )}
                      </button>
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                      <button
                        onClick={() => handleSort('wagered')}
                        className="flex items-center gap-1 ml-auto hover:text-foreground transition-colors group"
                      >
                        Wagered
                        {sortField === 'wagered' ? (
                          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                        )}
                      </button>
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                      <button
                        onClick={() => handleSort('weightedWagered')}
                        className="flex items-center gap-1 ml-auto hover:text-foreground transition-colors group"
                      >
                        Weighted
                        {sortField === 'weightedWagered' ? (
                          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                        )}
                      </button>
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                      <button
                        onClick={() => handleSort('lastSeen')}
                        className="flex items-center gap-1 ml-auto hover:text-foreground transition-colors group"
                      >
                        Last Seen
                        {sortField === 'lastSeen' ? (
                          sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                        )}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedUsersList(usersData).map((user, index) => (
                    <tr
                      key={user.playerId}
                      className={`border-b border-border/50 hover:bg-muted/20 overflow-hidden h-[67px] relative transition-colors ${index % 2 === 1 ? 'bg-muted/20' : ''
                        }`}
                    >
                      <td className="py-3 px-4 text-sm font-medium relative ">
                        <div className="flex pointer-events-none relative z-10 items-center gap-3">
                          <img
                            src={getAvatarUrl(user.playerId)}
                            alt={user.username}
                            className="size-6 rounded flex-shrink-0"
                          />
                          <span>{user.username}</span>
                        </div>
                        <MiniWagerChart chartData={user.chartData} />

                      </td>
                      <td className="py-3 px-4 text-sm text-center relative z-10">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex relative items-center justify-center gap-1.5 rounded-full backdrop-blur-3xl bg-white/5 py-[px] cursor-help">
                              <div className={`absolute left-0 top-0 w-full h-full border border-white/5 opacity-10 z-[0] ${getActivityDotStyle(user.activityScore || 0)} rounded-full`}></div>
                              <div className={`w-2 h-2 relative z-10 rounded-full ${getActivityDotStyle(user.activityScore || 0)}`}></div>
                              <span className="text-white text-[13px] relative z-10 font-medium">{user.activityScore || 0}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[200px] bg-muted border-border text-muted-foreground">
                            <p>Activity score based on the number of days the user has been active recently</p>
                          </TooltipContent>
                        </Tooltip>
                      </td>
                      <td className="py-3 px-4 text-sm text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="w-3 h-3 rounded bg-[#84F549]"></span>
                          ${user.wagered.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(132, 245, 73, 0.25)' }}></span>
                          ${user.weightedWagered.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-muted-foreground">{formatLastSeen(user.lastSeen)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <CountryTimezoneModal
        isOpen={isCountryModalOpen}
        onClose={() => setIsCountryModalOpen(false)}
        onSave={handleTimezoneSave}
      />
    </div>
  );
}
