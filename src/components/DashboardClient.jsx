"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
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
import { ComposedChart, Bar, Area, Cell, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { LineChart } from '@mui/x-charts/LineChart';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { supabase } from "@/lib/supabase";
import { createAvatar } from '@dicebear/core';
import { adventurerNeutral } from '@dicebear/collection';
import { SiKick } from "react-icons/si";
import { motion, cubicBezier } from "framer-motion";
import { formatDollarAmount } from "@/utils/dashboardUtils";

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

const AnimatedNumber = ({ value }) => {
  return (
    <motion.span
      key={value}
      initial={{ y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: cubicBezier(0.2, 1, 0.24, 1) }}
      className="font-semibold"
    >
      {value}
    </motion.span>
  );
};

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

// AvatarOverlay component for rendering avatars in SVG context (Recharts)
function AvatarOverlay({ x, y, users, getAvatarUrl, index }) {
  const avatarSize = 20;
  const avatarSpacing = -8; // Overlap avatars
  
  // Generate unique IDs to avoid conflicts across multiple avatar groups
  const baseId = `avatar-group-${index}`;
  
  // Calculate center offset to horizontally center the avatar group
  // For n avatars: leftmost = (n-1) * spacing - avatarSize/2, rightmost = avatarSize/2
  // Center offset = (leftmost + rightmost) / 2 = (n-1) * spacing / 2
  const centerOffset = users.length > 1 ? (users.length - 1) * avatarSpacing / 2 : 0;
  
  // Pre-generate avatar URLs to ensure they're ready before rendering
  const avatarData = users.map((user, idx) => ({
    user,
    idx,
    avatarUrl: getAvatarUrl(user.userId),
    offsetX: idx * avatarSpacing - centerOffset,
    clipId: `${baseId}-clip-${idx}`,
  }));
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        {avatarData.map(({ clipId }) => (
          <clipPath key={clipId} id={clipId}>
            <circle r={avatarSize / 2} cx={0} cy={0} />
          </clipPath>
        ))}
      </defs>
      {avatarData.map(({ user, idx, avatarUrl, offsetX, clipId }) => (
        <g key={`${user.userId}-${idx}`} transform={`translate(${offsetX}, 0)`}>
          {/* Background circle for separation */}
          <circle
            r={avatarSize / 2 + 1}
            fill="#09090b"
          />
          {/* Avatar image with circular clipPath - more reliable than mask */}
          <g clipPath={`url(#${clipId})`}>
            <image
              href={avatarUrl}
              x={-avatarSize / 2}
              y={-avatarSize / 2}
              width={avatarSize}
              height={avatarSize}
              preserveAspectRatio="xMidYMid slice"
              style={{ imageRendering: 'auto' }}
            />
          </g>
          {/* Border circle on top */}
          <circle
            r={avatarSize / 2}
            fill="none"
            stroke="#09090b"
            strokeWidth={2}
          />
        </g>
      ))}
    </g>
  );
}

// KickIconOverlay component for rendering Kick stream live/offline icons
function KickIconOverlay({ x, y, type, index }) {
  const circleSize = 20; // Same size as avatar circle
  const iconSize = 12; // Smaller icon to create padding inside circle
  
  // Different styles for live vs offline
  const iconStyles = {
    live: {
      color: '#84F549',
      opacity: 1,
      filter: 'drop-shadow(0 0 4px rgba(132, 245, 73, 0.5))'
    },
    offline: {
      color: '#a1a1aa',
      opacity: 0.6,
      filter: 'none'
    }
  };
  
  const style = iconStyles[type] || iconStyles.live;
  
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Background circle for better visibility - same size as avatars */}
      <circle
        r={circleSize / 2 + 1}
        fill="#09090b"
      />
      {/* Kick icon using foreignObject to embed React component - smaller with padding */}
      <foreignObject
        x={-iconSize / 2}
        y={-iconSize / 2}
        width={iconSize}
        height={iconSize}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: style.color,
            opacity: style.opacity,
            filter: style.filter
          }}
        >
          <SiKick size={iconSize} />
        </div>
      </foreignObject>
      {/* Border circle on top - same size as avatars */}
      <circle
        r={circleSize / 2}
        fill="none"
        stroke="#09090b"
        strokeWidth={2}
      />
      {/* Status indicator circle - green for live, gray for offline */}
      {type === 'live' && (
        <circle
          r={3}
          cx={circleSize / 2 - 2}
          cy={-circleSize / 2 + 2}
          fill="#84F549"
          opacity={1}
        />
      )}
      {type === 'offline' && (
        <circle
          r={2}
          cx={circleSize / 2 - 2}
          cy={-circleSize / 2 + 2}
          fill="#a1a1aa"
          opacity={0.8}
        />
      )}
    </g>
  );
}

// WentOnlineAvatars component (deprecated - now using SVG avatars directly in bars)
function WentOnlineAvatars({ chartData, chartRef, visibleSeries, isHourly, getAvatarUrl }) {
  const [positions, setPositions] = useState([]);

  useEffect(() => {
    if (!chartRef.current || !isHourly || !chartData || chartData.length === 0) {
      console.log('WentOnlineAvatars: Early return - ref:', !!chartRef.current, 'isHourly:', isHourly, 'chartData:', chartData?.length);
      setPositions([]);
      return;
    }
    
    // Check if we have any wentOnline data at all
    const hasWentOnlineData = chartData.some(item => item.wentOnline && item.wentOnline.length > 0);
    if (!hasWentOnlineData) {
      console.log('WentOnlineAvatars: No wentOnline data in chartData');
      setPositions([]);
      return;
    }

    const calculatePositions = () => {
      const container = chartRef.current;
      if (!container) {
        console.log('WentOnlineAvatars: No container');
        return [];
      }

      const svg = container.querySelector('svg');
      if (!svg) {
        console.log('WentOnlineAvatars: No SVG');
        return [];
      }

      // Find all bars - MUI X Charts uses rect elements
      // Get all rects and filter for bar-like elements
      const allRects = Array.from(svg.querySelectorAll('rect'));
      
      // Filter to only actual bar rectangles
      // Bars should be in the plot area (not axes or grids)
      const plotArea = svg.querySelector('[class*="plot"], [class*="Plot"], g[clip-path]') || svg;
      const bars = allRects.filter(rect => {
        // Check if rect is in plot area (not in axis/grid groups)
        const parentGroup = rect.closest('g');
        const isInAxis = parentGroup?.getAttribute('class')?.includes('Axis') || 
                         parentGroup?.getAttribute('class')?.includes('axis') ||
                         rect.closest('[class*="Axis"]') ||
                         rect.closest('[class*="axis"]');
        if (isInAxis) return false;
        
        const height = parseFloat(rect.getAttribute('height') || '0');
        const width = parseFloat(rect.getAttribute('width') || '0');
        const y = parseFloat(rect.getAttribute('y') || '0');
        const x = parseFloat(rect.getAttribute('x') || '0');
        
        // Bars should have significant height and width, be in the plot area (y > 0), and have x > 0
        return height > 5 && width > 5 && y >= 0 && x >= 0;
      });
      
      console.log('WentOnlineAvatars: Total rects:', allRects.length, 'Filtered bars:', bars.length);
      
      console.log('WentOnlineAvatars: Found bars:', bars.length, 'ChartData length:', chartData.length);
      
      // Log wentOnline data
      const hoursWithUsers = chartData.filter(item => item.wentOnline && item.wentOnline.length > 0);
      console.log('WentOnlineAvatars: Hours with wentOnline:', hoursWithUsers.length, hoursWithUsers);
      
      if (bars.length === 0) {
        console.log('WentOnlineAvatars: No bars found yet, SVG structure:', svg.outerHTML.substring(0, 1000));
        return [];
      }

      // Get container bounding rect for coordinate conversion
      const containerRect = container.getBoundingClientRect();
      
      // Group bars by their actual pixel positions using getBoundingClientRect()
      const barsByIndex = {};
      bars.forEach((bar) => {
        // Get the rect element
        const rect = bar.tagName === 'rect' ? bar : bar.querySelector('rect') || bar;
        if (!rect) return;
        
        // Get actual pixel position relative to container
        const barRect = rect.getBoundingClientRect();
        const barCenterX = barRect.left - containerRect.left + (barRect.width / 2);
        const barTopY = barRect.top - containerRect.top;
        const barBottomY = barRect.bottom - containerRect.top;
        
        // Group bars that are at similar X positions (same hour)
        // Use tolerance based on bar width - bars at same hour should be within one bar width
        const tolerance = barRect.width * 1.5;
        const roundedX = Math.round(barCenterX / tolerance) * tolerance;
        
        if (!barsByIndex[roundedX]) {
          barsByIndex[roundedX] = [];
        }
        barsByIndex[roundedX].push({ 
          rect: rect,
          centerX: barCenterX,
          topY: barTopY,
          bottomY: barBottomY,
          width: barRect.width,
          height: barRect.height
        });
      });
      
      // Sort bars within each group by X position
      Object.keys(barsByIndex).forEach(key => {
        barsByIndex[key].sort((a, b) => a.centerX - b.centerX);
      });
      
      // Sort all groups by X position
      const sortedGroupKeys = Object.keys(barsByIndex).map(Number).sort((a, b) => a - b);
      
      console.log('WentOnlineAvatars: Bars grouped:', sortedGroupKeys.length, 'groups');

      // Get chart dimensions
      const chartHeight = 300;
      const marginTop = 10;
      const marginBottom = isHourly ? 40 : 20;
      const plotHeight = chartHeight - marginTop - marginBottom;
      const marginLeft = 0;
      const marginRight = 10;

      // Get container width for fallback calculation (already have containerRect from above)
      const chartWidth = containerRect.width || parseFloat(svg.getAttribute('width') || '800');
      const plotWidth = chartWidth - marginLeft - marginRight;

      // Find max value for scaling
      let maxValue = 0;
      chartData.forEach(item => {
        if (visibleSeries.wagered && item.wagered > maxValue) maxValue = item.wagered;
        if (visibleSeries.weighted && item.weightedWagered > maxValue) maxValue = item.weightedWagered;
      });

      // Calculate positions for each hour with wentOnline data
      const calculatedPositions = [];
      const hasBars = sortedGroupKeys.length > 0;
      
      chartData.forEach((item, index) => {
        if (!item.wentOnline || item.wentOnline.length === 0) return;

        let barCenterX, yPosition;

        if (hasBars && index < sortedGroupKeys.length) {
          // Use actual bar positions from getBoundingClientRect
          const groupKey = sortedGroupKeys[index];
          const barsForThisHour = barsByIndex[groupKey];
          
          if (!barsForThisHour || barsForThisHour.length === 0) return;

          // Find the tallest bar (highest top = bar that extends furthest up)
          let topmostY = Infinity;
          let minX = Infinity;
          let maxX = -Infinity;
          
          barsForThisHour.forEach(({ centerX, topY, width }) => {
            // Track the highest bar (lowest topY value = closest to top of container)
            if (topY < topmostY) {
              topmostY = topY;
            }
            
            // Track X bounds for centering
            const barLeft = centerX - width / 2;
            const barRight = centerX + width / 2;
            if (barLeft < minX) minX = barLeft;
            if (barRight > maxX) maxX = barRight;
          });
          
          // Calculate center X - midpoint of all bars in this hour
          barCenterX = (minX + maxX) / 2;
          
          // Calculate Y position - 25px above the tallest bar's top
          yPosition = topmostY - 25;
          
          console.log(`WentOnlineAvatars: Index ${index} - X: ${barCenterX}, Y: ${yPosition}, topmostY: ${topmostY}, bars: ${barsForThisHour.length}`);
        } else {
          // Fallback: calculate position based on data index
          const numBars = chartData.length;
          const barSpacing = plotWidth / numBars;
          barCenterX = marginLeft + (index * barSpacing) + (barSpacing / 2);
          
          // Determine tallest bar for this hour
          let tallestValue = 0;
          if (visibleSeries.wagered && item.wagered > tallestValue) tallestValue = item.wagered;
          if (visibleSeries.weighted && item.weightedWagered > tallestValue) tallestValue = item.weightedWagered;
          
          // Convert value to pixel height and calculate Y position
          // Y position = marginTop + plotHeight - barHeight - 25px offset
          maxBarHeight = maxValue > 0 ? (tallestValue / maxValue) * plotHeight : 0;
          const barTopY = marginTop + (plotHeight - maxBarHeight);
          yPosition = barTopY - 25;
        }

        // Get users (max 3)
        const users = item.wentOnline.slice(0, 3);

        calculatedPositions.push({
          x: barCenterX,
          y: yPosition,
          users: users,
          index: index
        });
      });

      console.log('WentOnlineAvatars: Calculated positions:', calculatedPositions.length);
      setPositions(calculatedPositions);
    };

      // Use multiple attempts with increasing delays to ensure SVG is fully rendered
      let attempts = 0;
      const maxAttempts = 5;
      
      const tryCalculate = () => {
        attempts++;
        const positionsFound = calculatePositions();
        
        // Check if we found bars - if not, retry
        const container = chartRef.current;
        const svg = container?.querySelector('svg');
        const bars = svg ? Array.from(svg.querySelectorAll('[class*="MuiBarElement"], rect')).filter(el => {
          if (el.tagName === 'rect') {
            const h = parseFloat(el.getAttribute('height') || '0');
            const w = parseFloat(el.getAttribute('width') || '0');
            return h > 5 && w > 5;
          }
          return true;
        }) : [];
        
        // If we still don't have bars and haven't exceeded max attempts, retry
        if (bars.length === 0 && attempts < maxAttempts) {
          const delay = 100 * attempts; // 100ms, 200ms, 300ms, 400ms
          setTimeout(tryCalculate, delay);
        }
      };
      
      // Start first attempt after a short delay
      const timeoutId = setTimeout(tryCalculate, 150);

      // Also use MutationObserver to watch for SVG changes
      const observer = new MutationObserver(() => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(calculatePositions, 100);
      });
      
      if (chartRef.current) {
        observer.observe(chartRef.current, {
          childList: true,
          subtree: true,
          attributes: false
        });
      }

      // Recalculate on resize (debounced)
      let resizeTimeout;
      const handleResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(calculatePositions, 150);
      };

      window.addEventListener('resize', handleResize);
      return () => {
        clearTimeout(timeoutId);
        observer.disconnect();
        window.removeEventListener('resize', handleResize);
        clearTimeout(resizeTimeout);
      };
  }, [chartData, chartRef, visibleSeries, isHourly]);

  if (!isHourly || positions.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ marginTop: 10, marginBottom: isHourly ? 40 : 20 }}>
      {positions.map((pos, idx) => (
        <Tooltip key={`avatar-${pos.index}-${idx}`}>
          <TooltipTrigger asChild>
            <div
              className="absolute flex items-center pointer-events-auto cursor-help"
              style={{
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                transform: 'translateX(-50%)',
              }}
            >
              {pos.users.map((user, avatarIdx) => (
                <img
                  key={`${user.userId}-${avatarIdx}`}
                  src={getAvatarUrl(user.userId)}
                  alt={user.name}
                  className={`w-5 h-5 rounded border-2 border-background ${avatarIdx > 0 ? '-ml-2' : ''}`}
                  style={{ zIndex: pos.users.length - avatarIdx }}
                />
              ))}
            </div>
          </TooltipTrigger>
          <TooltipContent className="bg-muted border-border text-muted-foreground">
            <p>
              {pos.users.map((user, idx) => (
                <span key={user.userId}>
                  {idx > 0 && idx < pos.users.length && ' '}
                  {idx === pos.users.length - 1 && pos.users.length > 1 && 'and '}
                  <span className="text-[#84F549]">{user.name}</span>
                  {idx < pos.users.length - 1 && pos.users.length > 2 && ','}
                </span>
              ))}
              {' went online'}
            </p>
          </TooltipContent>
        </Tooltip>
      ))}
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
  const [leaderboardsCount, setLeaderboardsCount] = useState(0);
  const [visibleSeries, setVisibleSeries] = useState({
    wagered: true,
    weighted: true,
    users: true
  });
  const [hoveredIndex, setHoveredIndex] = useState(null);

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
      value: '0',
      showChange: false,
    },
    leaderboards: {
      id: 'leaderboards',
      icon: Trophy,
      label: 'Active Leaderboards',
      value: leaderboardsCount.toString(),
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
    if (!timestamp) return "Unknown";
    const now = new Date();
    const then = new Date(timestamp);
    if (Number.isNaN(then.getTime())) return "Unknown";
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
      setIsLoadingUsers(true);
      setIsLoadingSummary(true);

      // Get cached JWT token
      const jwt = await getJWT();

      // Calculate date range for last few hours
      const endDate = new Date();
      const startDate = new Date();
      startDate.setHours(startDate.getHours() - 12);

      const requestBody = {
        userId: user.id,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        jwt: jwt,
        casino_identifier: "roobet"
      };

      // Make POST request
      const response = await fetch("https://kzrswdfrzmrdqsnsrksh.supabase.co/functions/v1/fetch-wagers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${jwt}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log("data:", data);

      if (!data || data.success === false) {
        throw new Error(data?.error || "Failed to load visualize data");
      }

      const aggregates = Array.isArray(data?.aggregates) ? data.aggregates : [];
      const users = Array.isArray(data?.users) ? data.users : [];
      const granularity = data?.granularity || "hour";

      const sortedAggregates = [...aggregates].sort((a, b) => {
        const aDate = new Date(a.hour_bucket || a.day_bucket || a.timestamp || 0).getTime();
        const bDate = new Date(b.hour_bucket || b.day_bucket || b.timestamp || 0).getTime();
        return aDate - bDate;
      });

      const chartData = sortedAggregates.map((bucket) => {
        const timestamp = bucket.hour_bucket || bucket.day_bucket || bucket.timestamp;
        const date = timestamp ? new Date(timestamp) : null;
        const weighted = Math.max(0, bucket?.props?.weightedWagered ?? bucket.weightedWagered ?? 0);
        const wagered = Math.max(0, bucket?.wagered ?? 0);
        const difference = Math.max(wagered - weighted, 0);
        const usersCount = Math.max(0, bucket?.user_count ?? bucket?.users ?? 0);

        const displayDate = date
          ? granularity === "hour"
            ? date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
            : date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : "";

        return {
          timestamp,
          displayDate,
          wagered,
          weighted,
          difference,
          users: usersCount,
        };
      });

      const totalWagered = chartData.reduce((acc, item) => acc + item.wagered, 0);
      const totalWeightedWagered = chartData.reduce((acc, item) => acc + item.weighted, 0);
      const totalUsers = users.length;
      const playingNowThresholdMs = 15 * 60 * 1000;
      const playingNow = users.filter((u) => {
        if (!u?.last_seen) return false;
        const lastSeenDate = new Date(u.last_seen);
        if (Number.isNaN(lastSeenDate.getTime())) return false;
        return Date.now() - lastSeenDate.getTime() <= playingNowThresholdMs;
      }).length;

      setHourlyVisualData({
        granularity,
        chartData,
        summary: {
          totalWagered,
          totalWeightedWagered,
          totalUsers,
          playingNow,
        },
      });

      const baseUsers = users.map((userEntry) => ({
        playerId: userEntry.casino_user_id,
        username: userEntry.casino_user_name || "Unknown",
        wagered: Math.max(0, userEntry.total_wagered ?? 0),
        weightedWagered: Math.max(0, userEntry?.props?.weightedWagered ?? userEntry.total_wagered ?? 0),
        lastSeen: userEntry.last_seen,
        chartData: [],
      }));

      const maxWeighted = baseUsers.reduce((max, current) => Math.max(max, current.weightedWagered || 0), 0);
      const normalizedUsers = baseUsers.map((entry) => ({
        ...entry,
        activityScore: maxWeighted > 0 ? Math.round((entry.weightedWagered / maxWeighted) * 100) : 0,
      }));

      setUsersData(normalizedUsers);
      setIsLoadingUsers(false);

      setSummaryData({
        totalUsers,
        totalWagered,
        totalWeightedWagered,
      });
      setIsLoadingSummary(false);

    } catch (error) {
      console.error("Error fetching visualize data:", error);
      setIsLoadingUsers(false);
      setIsLoadingSummary(false);
    } finally {
      setIsLoadingHourly(false);
    }
  };

 


  // Auto-fetch daily visualize data on mount
  useEffect(() => {
    if (user?.id) {
      handleFetchVisualizeData();
    }
  }, [user?.id]);

  // Fetch leaderboards count on mount
  useEffect(() => {
    const fetchLeaderboardsCount = async () => {
      try {
        const response = await fetch("/api/leaderboards");
        const data = await response.json();
        if (data.success && data.leaderboards) {
          setLeaderboardsCount(data.leaderboards.length);
        }
      } catch (error) {
        console.error("Error fetching leaderboards count:", error);
        setLeaderboardsCount(0);
      }
    };

    if (user?.id) {
      fetchLeaderboardsCount();
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
            disabled={isLoadingHourly}
            onClick={handleFetchVisualizeData}
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


      {/* Wagered Chart */}
      {hourlyVisualData && (
        <Card>
          <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
            <div className="flex flex-wrap w-full">
              {(() => {
                const chartData = hourlyVisualData.chartData || [];
                const summary = hourlyVisualData.summary || {};
                const hasWeightedData = chartData.some(item => item.weighted > 0 && item.weighted !== item.wagered);
                const totalWagered = summary.totalWagered || 0;
                const totalWeighted = summary.totalWeightedWagered || 0;
                const totalUsers = summary.totalUsers || 0;
                const playingNowCount = summary.playingNow || 0;
                const wageredPerUser = totalUsers > 0 ? totalWagered / totalUsers : 0;
                const checkIsHourly = () => {
                  if (hourlyVisualData.granularity === 'hour') return true;
                  if (chartData.length > 10) return true;
                  if (chartData.length >= 2) {
                    const first = new Date(chartData[0].timestamp);
                    const second = new Date(chartData[1].timestamp);
                    const diffHours = Math.abs(second - first) / (1000 * 60 * 60);
                    if (diffHours < 2) return true;
                  }
                  return false;
                };

                const dateLabel = checkIsHourly()
                  ? `Today • ${chartData.length} hours`
                  : `Last 30 days • ${chartData.length} data points`;

                return (
                  <>
                    <div className="flex flex-col border-b px-4 py-3 text-left sm:border-b-0 sm:border-r sm:px-6 sm:py-4 min-w-[200px]">
                      <CardTitle className="text-lg sm:text-xl">Wagered Overview</CardTitle>
                      <CardDescription className="text-xs sm:text-sm mt-1">{dateLabel}</CardDescription>
                    </div>

                    <button
                      data-active={visibleSeries.wagered}
                      className="data-[active=true]:bg-muted/50 relative z-30 flex flex-1 flex-col justify-center gap-0.5 border-t px-4 py-3 text-left sm:border-t-0 sm:border-l sm:px-6 sm:py-4 min-w-0"
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

                    {isLoadingSummary ? (
                      <div className="relative z-30 flex flex-1 flex-col justify-center gap-0.5 border-t px-4 py-3 text-left even:border-l sm:border-t-0 sm:border-l sm:px-6 sm:py-4 min-w-0">
                        <Skeleton className="h-3 w-20 mb-1" />
                        <Skeleton className="h-8 w-24 mb-1" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    ) : hasWeightedData ? (
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
                    ) : null}

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

                    <div className="relative z-30 flex flex-1 flex-col justify-center gap-0.5 border-t px-4 py-3 text-left even:border-l sm:border-t-0 sm:border-l sm:px-6 sm:py-4 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-xs font-normal">
                          Playing Now
                        </span>
                        {playingNowCount > 0 && (
                          <span className="relative flex h-2 w-2 items-center justify-center">
                            <span className="absolute h-2 w-2 rounded-full" style={{ backgroundColor: '#3B82F6' }} />
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
                  </>
                );
              })()}
            </div>
          </CardHeader>
          <CardContent className="px-2 sm:p-6">
            {isLoadingHourly ? (
              <div className="h-[300px] flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : hourlyVisualData.chartData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center space-y-3">
                  <div className="text-6xl">👻</div>
                  <div className="text-lg font-medium">No data yet</div>
                  <div className="text-sm">Chart data will appear here once available</div>
                </div>
              </div>
            ) : (
              (() => {
                const chartData = hourlyVisualData.chartData;
                const hasWeightedData = chartData.some(item => item.weighted > 0 && item.weighted !== item.wagered);
                const hasUserSeries = chartData.some(item => item.users > 0);

                return (
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
                      margin={{ top: 5, right: 12, left: 12, bottom: 0 }}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      <defs>
                        <linearGradient id="usersGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis
                        dataKey="displayDate"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        minTickGap={hourlyVisualData.granularity === 'day' ? 24 : 32}
                        angle={hourlyVisualData.granularity === 'hour' ? -45 : 0}
                        textAnchor={hourlyVisualData.granularity === 'hour' ? 'end' : 'middle'}
                        height={hourlyVisualData.granularity === 'hour' ? 60 : 30}
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

                          const dataPoint = payload[0].payload;
                          const wagered = dataPoint.wagered || 0;
                          const weighted = dataPoint.weighted || 0;
                          const users = dataPoint.users || 0;

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
                                {visibleSeries.users && hasUserSeries && (
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
                      {visibleSeries.weighted && hasWeightedData && (
                        <Bar
                          yAxisId="left"
                          dataKey="weighted"
                          stackId="a"
                          fill="#5DB82F"
                          radius={visibleSeries.wagered ? [0, 0, 4, 4] : [4, 4, 4, 4]}
                          opacity={visibleSeries.weighted ? 1 : 0}
                        >
                          {chartData.map((entry, index) => (
                            <Cell
                              key={`weighted-${index}`}
                              fill="#5DB82F"
                              opacity={
                                visibleSeries.weighted
                                  ? hoveredIndex === null || hoveredIndex === index
                                    ? 1
                                    : 0.2
                                  : 0
                              }
                              style={{ transition: 'opacity 0.2s ease-in-out' }}
                            />
                          ))}
                        </Bar>
                      )}
                      {visibleSeries.wagered && (
                        <Bar
                          yAxisId="left"
                          dataKey="difference"
                          stackId="a"
                          fill="#A8F573"
                          radius={visibleSeries.weighted && hasWeightedData ? [4, 4, 0, 0] : [4, 4, 4, 4]}
                        >
                          {chartData.map((entry, index) => (
                            <Cell
                              key={`difference-${index}`}
                              fill="#A8F573"
                              opacity={hoveredIndex === null || hoveredIndex === index ? 1 : 0.2}
                              style={{ transition: 'opacity 0.2s ease-in-out' }}
                            />
                          ))}
                        </Bar>
                      )}
                      {visibleSeries.users && hasUserSeries && (
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
                          style={{ transition: 'opacity 0.2s ease-in-out' }}
                        />
                      )}
                    </ComposedChart>
                  </ChartContainer>
                );
              })()
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
