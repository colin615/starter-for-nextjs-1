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
  Users, 
  DollarSign, 
  Target, 
  Trophy, 
  TrendingUp, 
  Filter, 
  Calendar,
  ArrowLeft,
  ArrowRight,
  MoreHorizontal,
  Download
} from "lucide-react";
import { CountryTimezoneModal } from "./CountryTimezoneModal";
import { CasinoFilterDropdown } from "./dashboard/CasinoFilterDropdown";
import { useTimePeriod } from "@/hooks/useTimePeriod";
import { useConnectedSites } from "@/hooks/useConnectedSites";
import { BarChart } from '@mui/x-charts/BarChart';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { account } from "@/lib/appwrite";

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


export function DashboardClient({ user }) {
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedCasinos, setSelectedCasinos] = useState([]);
  const [summaryData, setSummaryData] = useState(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [hourlyVisualData, setHourlyVisualData] = useState(null);
  const [isLoadingHourly, setIsLoadingHourly] = useState(false);
  const [visibleSeries, setVisibleSeries] = useState({
    wagered: true,
    weightedWagered: true
  });

  // Toggle series visibility
  const toggleSeries = (seriesKey) => {
    setVisibleSeries(prev => ({
      ...prev,
      [seriesKey]: !prev[seriesKey]
    }));
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
    if (!user?.$id) return;
    
    try {
      setIsLoadingHourly(true);
      
      // Generate JWT token
      const jwtResponse = await account.createJWT();
      const jwt = jwtResponse.jwt;
      
      // Calculate date range for last 12 hours
      const endDate = new Date();
      const startDate = new Date();
      startDate.setHours(startDate.getHours() - 12);
      
      // Prepare request body with mode: "visualize" and granularity: "hour"
      const requestBody = {
        userId: user.$id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        jwt: jwt,
        mode: "visualize",
        granularity: "hourly"
      };
      
      // Make POST request
      const response = await fetch("https://68fc76da002a66712f3a.fra.appwrite.run/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      
      const data = await response.json();
      console.log("Hourly visualize data:", data);
      
      if (data.success && data.timeSeries) {
        setHourlyVisualData(data);
      }
    } catch (error) {
      console.error("Error fetching visualize data:", error);
    } finally {
      setIsLoadingHourly(false);
    }
  };

  // Fetch summary data automatically
  const fetchSummaryData = useCallback(async () => {
    if (!user?.$id) return;
    
    try {
      setIsLoadingSummary(true);
      
      // Generate JWT token
      const jwtResponse = await account.createJWT();
      const jwt = jwtResponse.jwt;
      
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
        userId: user.$id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        jwt: jwt
      };
      
      // Make POST request
      const response = await fetch("https://68fc76da002a66712f3a.fra.appwrite.run/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
  }, [user?.$id, selectedTimePeriod]);

  // Auto-fetch summary data on mount and when time period changes
  useEffect(() => {
    fetchSummaryData();
  }, [fetchSummaryData]);

  // Auto-fetch hourly visualize data on mount
  useEffect(() => {
    if (user?.$id) {
      handleFetchVisualizeData();
    }
  }, [user?.$id]);

  const hasActiveFilters = selectedCasinos.length > 0;

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
        <div className="flex items-start gap-2">
          <div className="relative">
            <Button 
              variant="outline" 
              size="sm" 
              data-shortcut="filter"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`transition-all duration-200 hover:scale-[1.02] ${
                hasActiveFilters 
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
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4" />
          </Button>
          <Select value={selectedTimePeriod} onValueChange={onTimePeriodChange}>
            <SelectTrigger className="w-[140px]">
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
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleFetchVisualizeData}
            disabled={isLoadingHourly}
          >
            <Download className="h-4 w-4 mr-2" />
            {isLoadingHourly ? "Loading..." : "Refresh Hourly"}
          </Button>
        </div>
      </div>

     
      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 relative">

            <div className="space-y-3 z-10 relative">
              {/* Header with icon, label, and menu */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground/50" />
                  <span className="text-sm text-muted-foreground">Total Users</span>
                </div>
                <MoreHorizontal className="h-4 w-4 text-muted-foreground cursor-pointer" />
              </div>
              
              {/* Main value and change indicator */}
              <div className="flex items-center justify-between">
                {isLoadingSummary ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <span className="text-2xl font-[600]">{(summaryData?.uniquePlayers || 0).toLocaleString()}</span>
                )}
                <div className="flex items-center gap-1 bg-green-500/10 text-green-600 px-2 py-1 rounded-md">
                  <TrendingUp className="h-3 w-3" />
                  <span className="text-xs font-medium">0%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 relative">

            <div className="space-y-3 z-10 relative">
              {/* Header with icon, label, and menu */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground/50" />
                  <span className="text-sm text-muted-foreground">Total Wagered</span>
                </div>
                <MoreHorizontal className="h-4 w-4 text-muted-foreground cursor-pointer" />
              </div>
              
              {/* Main value and change indicator */}
              <div className="flex items-center justify-between">
                {isLoadingSummary ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <span className="text-2xl font-[600]">${(summaryData?.totalWeightedWagered || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                )}
                <div className="flex items-center gap-1 bg-green-500/10 text-green-600 px-2 py-1 rounded-md">
                  <TrendingUp className="h-3 w-3" />
                  <span className="text-xs font-medium">0%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 relative">

            <div className="space-y-3 z-10 relative">
              {/* Header with icon, label, and menu */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground/50" />
                  <span className="text-sm text-muted-foreground">Active Challenges</span>
                </div>
                <MoreHorizontal className="h-4 w-4 text-muted-foreground cursor-pointer" />
              </div>
              
              {/* Main value and change indicator */}
              <div className="flex items-center justify-between">
                <span className="text-2xl font-[600]">23</span>
               
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 relative">

            <div className="space-y-3 z-10 relative">
              {/* Header with icon, label, and menu */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-muted-foreground/50" />
                  <span className="text-sm text-muted-foreground">Active Leaderboards</span>
                </div>
                <MoreHorizontal className="h-4 w-4 text-muted-foreground cursor-pointer" />
              </div>
              
              {/* Main value and change indicator */}
              <div className="flex items-center justify-between">
                <span className="text-2xl font-[600]">8</span>
              
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      
      {/* Hourly Wagered Chart */}
      {hourlyVisualData && (
        <Card>
          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Hourly Wagered</CardTitle>
                <p className="text-sm text-muted-foreground mt-1.5">
                  Last 12 hours • Total Weighted: ${hourlyVisualData.summary?.totalWeightedWagered?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'} • {hourlyVisualData.timeSeries?.length || 0} data points
                </p>
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
                    <span className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(132, 245, 73, 0.25)' }}></span>
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
                      <span className="w-3 h-3 rounded bg-[#84F549]"></span>
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
                <BarChart
                  dataset={hourlyVisualData.timeSeries?.map(item => {
                    const timestamp = new Date(item.timestamp);
                    return {
                      hour: timestamp.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
                      wagered: item.wagered || 0,
                      weightedWagered: item.weightedWagered || 0,
                    };
                  }) || []}
                  xAxis={[{ 
                    scaleType: 'band', 
                    dataKey: 'hour',
                    tickLabelStyle: {
                      angle: 0,
                      textAnchor: 'middle',
                      fontSize: 12,
                      fill: 'white',
                    }
                  }]}
                  series={[
                    ...(visibleSeries.wagered ? [{ 
                      dataKey: 'wagered', 
                      label: 'Wagered',
                      color: 'rgba(132, 245, 73, 0.25)',
                      valueFormatter: (value) => value ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'
                    }] : []),
                    ...(visibleSeries.weightedWagered && hourlyVisualData.timeSeries?.some(item => item.weightedWagered && item.weightedWagered !== item.wagered) ? [{
                      dataKey: 'weightedWagered', 
                      label: 'Weighted Wagered',
                      color: '#84F549',
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
                  margin={{ left: 0, right: 10, top: 10, bottom: 0 }}
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
              </ThemeProvider>
            )}
          </CardContent>
        </Card>
      )}

      <CountryTimezoneModal
        isOpen={isCountryModalOpen}
        onClose={() => setIsCountryModalOpen(false)}
        onSave={handleTimezoneSave}
      />
    </div>
  );
}
